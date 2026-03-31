"""
NirmAI Master Scraper Runner
Runs all scrapers and upserts results to Supabase.

Usage:
    python run_all.py
    python run_all.py --dry-run
    python run_all.py --scrapers pmgsy etenders
"""

import os
import sys
import json
import time
import asyncio
import logging
import argparse
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

RUN_AT = datetime.now(timezone.utc)
LOG_FILE = f"scrape_{RUN_AT.strftime('%Y%m%d_%H%M%S')}.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_FILE),
    ],
)
log = logging.getLogger("run_all")


def record_scrape_run(scrapers: list[str], results: dict, dry_run: bool) -> None:
    supabase_url = os.environ.get("SUPABASE_URL", "")
    supabase_key = os.environ.get("SUPABASE_KEY", "")
    if not supabase_url or not supabase_key:
        return
    try:
        from supabase import create_client
        sb = create_client(supabase_url, supabase_key)
        sb.table("scrape_runs").insert({
            "run_at": RUN_AT.isoformat(),
            "scrapers": scrapers,
            "results": results,
            "dry_run": dry_run,
        }).execute()
    except Exception as e:
        log.warning(f"Could not record scrape run: {e}")


def upsert_to_supabase(projects: list[dict], source_name: str) -> int:
    supabase_url = os.environ.get("SUPABASE_URL", "")
    supabase_key = os.environ.get("SUPABASE_KEY", "")

    if not supabase_url or not supabase_key:
        log.warning("SUPABASE_URL or SUPABASE_KEY not set — dry run only")
        return 0

    from supabase import create_client
    sb = create_client(supabase_url, supabase_key)

    saved = 0
    for p in projects:
        try:
            sb.table("projects").upsert(p, on_conflict="name,source").execute()
            saved += 1
            time.sleep(0.05)  # gentle rate limit
        except Exception as e:
            log.error(f"[{source_name}] Upsert failed for '{p.get('name', '?')}': {e}")

    log.info(f"[{source_name}] Saved {saved}/{len(projects)} projects")
    return saved


async def run_scrapers(scrapers: list[str], dry_run: bool = False) -> dict:
    results = {}
    all_projects = []

    if "pmgsy" in scrapers:
        log.info("=== Running PMGSY scraper ===")
        pmgsy_projects: list[dict] = []
        try:
            from nirmai_pmgsy import fetch_pmgsy_roads, KERALA_DISTRICTS
            for district, district_id in list(KERALA_DISTRICTS.items())[:3]:
                batch = fetch_pmgsy_roads(district_id=district_id)
                for p in batch:
                    p["district"] = district  # override with correct district name
                pmgsy_projects.extend(batch)
                time.sleep(2)
            all_projects.extend(pmgsy_projects)
            results["pmgsy"] = len(pmgsy_projects)
            log.info(f"PMGSY: scraped {results['pmgsy']} projects")
        except Exception as e:
            log.error(f"PMGSY scraper failed: {e}", exc_info=True)
            results["pmgsy"] = 0
            results["pmgsy_error"] = str(e)

    if "etenders" in scrapers:
        log.info("=== Running eTenders scraper ===")
        try:
            from nirmai_etenders import fetch_etenders
            etender_projects: list[dict] = []
            for page in range(1, 4):
                batch = fetch_etenders(page=page)
                etender_projects.extend(batch)
                if not batch:
                    break
                time.sleep(2)
            all_projects.extend(etender_projects)
            results["etenders"] = len(etender_projects)
            log.info(f"eTenders: scraped {results['etenders']} tenders")
        except Exception as e:
            log.error(f"eTenders scraper failed: {e}", exc_info=True)
            results["etenders"] = 0
            results["etenders_error"] = str(e)

    if "iroads" in scrapers:
        log.info("=== Running iROADS scraper ===")
        try:
            from nirmai_iroads import scrape_iroads
            districts = ["ERNAKULAM", "THRISSUR", "KOZHIKODE"]
            iroads_projects: list[dict] = []
            for district in districts:
                batch = await scrape_iroads(district=district)
                iroads_projects.extend(batch)
                time.sleep(3)
            all_projects.extend(iroads_projects)
            results["iroads"] = len(iroads_projects)
            log.info(f"iROADS: scraped {results['iroads']} projects")
        except Exception as e:
            log.error(f"iROADS scraper failed: {e}", exc_info=True)
            results["iroads"] = 0
            results["iroads_error"] = str(e)

    results["total_collected"] = len(all_projects)
    log.info(f"=== Total projects collected: {len(all_projects)} ===")

    if dry_run:
        print(json.dumps(all_projects[:5], indent=2, ensure_ascii=False))
        log.info("Dry run — not saving to database")
        results["total_saved"] = 0
    else:
        total_saved = upsert_to_supabase(all_projects, "run_all")
        results["total_saved"] = total_saved

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="NirmAI master scraper runner")
    parser.add_argument(
        "--scrapers",
        nargs="+",
        default=["pmgsy", "etenders", "iroads"],
        choices=["pmgsy", "etenders", "iroads"],
        help="Which scrapers to run",
    )
    parser.add_argument("--dry-run", action="store_true", help="Print without saving")
    args = parser.parse_args()

    log.info(f"Starting NirmAI scraper run at {RUN_AT.isoformat()}")
    log.info(f"Scrapers: {args.scrapers}, dry_run={args.dry_run}")

    results = asyncio.run(run_scrapers(scrapers=args.scrapers, dry_run=args.dry_run))

    log.info("=== Scraper run complete ===")
    for k, v in results.items():
        log.info(f"  {k}: {v}")

    # Record run in Supabase for admin visibility
    if not args.dry_run:
        record_scrape_run(scrapers=args.scrapers, results=results, dry_run=args.dry_run)

    # Write structured summary for CI (GitHub Actions job summary)
    summary_file = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_file:
        errors = {k: v for k, v in results.items() if k.endswith("_error")}
        with open(summary_file, "a") as f:
            f.write("## NirmAI Scraper Results\n\n")
            f.write(f"| Scraper | Projects |\n|---------|----------|\n")
            for s in args.scrapers:
                count = results.get(s, 0)
                err = results.get(f"{s}_error", "")
                icon = "❌" if err else ("✅" if count > 0 else "⚠️")
                f.write(f"| {icon} {s} | {count} {'— ' + err if err else ''} |\n")
            f.write(f"\n**Total collected:** {results.get('total_collected', 0)}  \n")
            f.write(f"**Saved to DB:** {results.get('total_saved', 0)}  \n")
            if args.dry_run:
                f.write("\n> ℹ️ Dry run — no data written to database.\n")

    # Write summary JSON as artifact
    with open("scrape_summary.json", "w") as f:
        json.dump({"run_at": RUN_AT.isoformat(), **results}, f, indent=2)

    # Exit non-zero if every scraper returned 0 (likely all failed)
    if not args.dry_run and results.get("total_collected", 0) == 0:
        log.error("All scrapers returned 0 projects — possible network or structural failure")
        sys.exit(1)
