"""
NirmAI iROADS Scraper
Scrapes PWD road project data from iROADS Kerala using Firecrawl.

Usage:
    python nirmai_iroads.py --district Ernakulam --dry-run
"""

import os
import json
import re
import logging
import argparse
from datetime import datetime
from dotenv import load_dotenv
from firecrawl import FirecrawlApp

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

IROADS_BASE = "https://pwdrmms.kerala.gov.in"


def fetch_iroads(district: str = "Ernakulam") -> list[dict]:
    api_key = os.environ.get("FIRECRAWL_API_KEY", "")
    if not api_key:
        log.error("FIRECRAWL_API_KEY not set")
        return []

    url = f"{IROADS_BASE}/road-works?district={district.upper()}"
    app = FirecrawlApp(api_key=api_key)
    log.info(f"Firecrawl scraping iROADS for {district}")

    try:
        result = app.scrape_url(url, params={"formats": ["markdown"]})
        markdown = result.get("markdown", "") if isinstance(result, dict) else (getattr(result, "markdown", "") or "")
    except Exception as e:
        log.error(f"Firecrawl failed for iROADS {district}: {e}")
        return []

    if not markdown:
        try:
            result = app.scrape_url(IROADS_BASE, params={"formats": ["markdown"]})
            markdown = result.get("markdown", "") if isinstance(result, dict) else (getattr(result, "markdown", "") or "")
        except Exception as e:
            log.error(f"Firecrawl fallback failed for iROADS: {e}")
            return []

    if not markdown:
        log.warning(f"iROADS {district}: empty response")
        return []

    projects = []
    lines = [l.strip() for l in markdown.splitlines() if l.strip().startswith("|")]
    data_rows = [l for l in lines if not re.match(r"^\|[-| ]+\|$", l)][1:]

    for row in data_rows:
        cols = [c.strip() for c in row.strip("|").split("|")]
        if len(cols) < 3:
            continue

        name = max((c for c in cols if c and not re.match(r"^[\d,./\- ]+$", c)), key=len, default=None)
        if not name or len(name) < 5:
            continue

        text_cols = sorted(
            [c for c in cols if c and c != name and not re.match(r"^[\d,./\- ]+$", c)],
            key=len, reverse=True,
        )
        contractor = text_cols[0] if text_cols else "PWD Kerala"
        budget_raw = next((c for c in cols if re.match(r"^[\d,. ]+$", c) and len(c) > 3), None)

        row_lower = " ".join(cols).lower()
        if "complet" in row_lower:
            status = "completed"
        elif "defect" in row_lower or "complaint" in row_lower:
            status = "defect"
        else:
            status = "ongoing"

        projects.append({
            "name": name[:200],
            "type": "Road",
            "status": status,
            "ward": district,
            "district": district,
            "contractor": contractor[:150],
            "budget": budget_raw,
            "source": "iROADS Kerala",
            "source_url": IROADS_BASE,
            "stages": json.dumps([
                {"l": "iROADS record", "d": True, "dt": datetime.now().strftime("%b %Y")}
            ]),
        })

    log.info(f"iROADS {district}: parsed {len(projects)} projects")
    return projects


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--district", default="Ernakulam")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    projects = fetch_iroads(district=args.district)
    if args.dry_run:
        print(json.dumps(projects[:5], indent=2, ensure_ascii=False))
    else:
        from supabase import create_client
        sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])
        for p in projects:
            sb.table("projects").upsert(p, on_conflict="name,source").execute()
        log.info(f"Saved {len(projects)} projects")
