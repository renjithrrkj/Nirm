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
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(f"scrape_{datetime.now().strftime('%Y%m%d')}.log"),
    ],
)
log = logging.getLogger("run_all")


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
        try:
            from nirmai_pmgsy import fetch_pmgsy_roads, KERALA_DISTRICTS
            for district, district_id in list(KERALA_DISTRICTS.items())[:3]:
                projects = fetch_pmgsy_roads(district_id=district_id)
                for p in projects:
                    p["district"] = district
                all_projects.extend(projects)
                time.sleep(2)
            results["pmgsy"] = len([p for p in all_projects if p.get("source") == "PMGSY"])
            log.info(f"PMGSY: scraped {results['pmgsy']} projects")
        except Exception as e:
            log.error(f"PMGSY scraper failed: {e}")
            results["pmgsy"] = 0

    if "etenders" in scrapers:
        log.info("=== Running eTenders scraper ===")
        try:
            from nirmai_etenders import fetch_etenders
            etender_projects = []
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
            log.error(f"eTenders scraper failed: {e}")
            results["etenders"] = 0

    if "iroads" in scrapers:
        log.info("=== Running iROADS scraper ===")
        try:
            from nirmai_iroads import scrape_iroads
            districts = ["ERNAKULAM", "THRISSUR", "KOZHIKODE"]
            iroads_projects = []
            for district in districts:
                projects = await scrape_iroads(district=district)
                iroads_projects.extend(projects)
                time.sleep(3)
            all_projects.extend(iroads_projects)
            results["iroads"] = len(iroads_projects)
            log.info(f"iROADS: scraped {results['iroads']} projects")
        except Exception as e:
            log.error(f"iROADS scraper failed: {e}")
            results["iroads"] = 0

    log.info(f"=== Total projects collected: {len(all_projects)} ===")

    if dry_run:
        print(json.dumps(all_projects[:5], indent=2, ensure_ascii=False))
        log.info("Dry run — not saving to database")
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

    log.info(f"Starting NirmAI scraper run at {datetime.now().isoformat()}")
    log.info(f"Scrapers: {args.scrapers}")

    results = asyncio.run(run_scrapers(scrapers=args.scrapers, dry_run=args.dry_run))

    log.info("=== Scraper run complete ===")
    for k, v in results.items():
        log.info(f"  {k}: {v}")
