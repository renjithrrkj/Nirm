"""
NirmAI eTenders Kerala Scraper
Scrapes tender notices from etenders.kerala.gov.in using Firecrawl.

Usage:
    python nirmai_etenders.py --pages 3 --dry-run
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

ETENDERS_BASE = "https://etenders.kerala.gov.in"

TYPE_MAP = {
    "road": "Road",
    "drain": "Drain",
    "drainage": "Drain",
    "street light": "Street Light",
    "streetlight": "Street Light",
    "building": "Building",
    "bridge": "Bridge",
    "water": "Water Supply",
    "pipeline": "Water Supply",
    "culvert": "Drain",
}


def classify_type(title: str) -> str:
    t = title.lower()
    for kw, ptype in TYPE_MAP.items():
        if kw in t:
            return ptype
    return "Other"


def fetch_etenders(page: int = 1) -> list[dict]:
    api_key = os.environ.get("FIRECRAWL_API_KEY", "")
    if not api_key:
        log.error("FIRECRAWL_API_KEY not set")
        return []

    # eTenders search — filter by LSG department, Kerala
    url = f"{ETENDERS_BASE}/nicgep/app?page={page}&service=TENDER_SEARCH&department=Local+Self+Government&state=Kerala"
    app = FirecrawlApp(api_key=api_key)
    log.info(f"Firecrawl scraping eTenders page {page}")

    try:
        result = app.scrape_url(url, params={"formats": ["markdown"]})
        markdown = result.get("markdown", "") if isinstance(result, dict) else (getattr(result, "markdown", "") or "")
    except Exception as e:
        log.error(f"Firecrawl failed for eTenders page {page}: {e}")
        return []

    if not markdown:
        log.warning(f"eTenders page {page}: empty response")
        return []

    projects = []
    lines = [l.strip() for l in markdown.splitlines() if l.strip().startswith("|")]
    data_rows = [l for l in lines if not re.match(r"^\|[-| ]+\|$", l)][1:]

    for row in data_rows:
        cols = [c.strip() for c in row.strip("|").split("|")]
        if len(cols) < 3:
            continue

        # Find the longest non-numeric column as the title
        title = max((c for c in cols if c and not re.match(r"^[\d,./\- ]+$", c)), key=len, default=None)
        if not title or len(title) < 5:
            continue

        # Look for an org/department name (second longest text column)
        text_cols = sorted(
            [c for c in cols if c and c != title and not re.match(r"^[\d,./\- ]+$", c)],
            key=len, reverse=True
        )
        org = text_cols[0] if text_cols else "LSG Department"

        # Look for a value/budget (numeric col)
        budget_raw = next((c for c in cols if re.match(r"^[\d,. ]+$", c) and len(c) > 2), None)

        # Look for a date
        date_raw = next((c for c in cols if re.search(r"\d{2}[/-]\d{2}[/-]\d{2,4}", c)), None)

        projects.append({
            "name": title[:200],
            "type": classify_type(title),
            "status": "planned",
            "ward": org[:100],
            "district": "Kerala",
            "contractor": "Tender stage — not yet awarded",
            "budget": budget_raw,
            "end_date": date_raw,
            "source": "eTenders Kerala",
            "source_url": ETENDERS_BASE,
            "stages": json.dumps([
                {"l": "Tender floated", "d": True, "dt": datetime.now().strftime("%b %Y")},
                {"l": "Award", "d": False, "dt": "Pending"},
                {"l": "Construction", "d": False, "dt": "Pending"},
            ]),
        })

    log.info(f"eTenders page {page}: parsed {len(projects)} tenders")
    return projects


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--pages", type=int, default=3)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    all_projects = []
    for page in range(1, args.pages + 1):
        batch = fetch_etenders(page=page)
        all_projects.extend(batch)
        if not batch:
            break

    if args.dry_run:
        print(json.dumps(all_projects[:5], indent=2, ensure_ascii=False))
    else:
        from supabase import create_client
        sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])
        for p in all_projects:
            sb.table("projects").upsert(p, on_conflict="name,source").execute()
        log.info(f"Saved {len(all_projects)} tenders")
