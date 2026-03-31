"""
NirmAI PMGSY Scraper
Scrapes rural road project data from PMGSY using Firecrawl.

Usage:
    python nirmai_pmgsy.py --district Ernakulam --dry-run
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

KERALA_DISTRICTS = {
    "Ernakulam":          "503",
    "Thiruvananthapuram": "487",
    "Thrissur":           "507",
    "Kozhikode":          "514",
    "Kannur":             "515",
    "Kollam":             "488",
    "Kottayam":           "500",
    "Malappuram":         "513",
    "Palakkad":           "510",
    "Pathanamthitta":     "489",
    "Alappuzha":          "493",
    "Idukki":             "499",
    "Wayanad":            "516",
    "Kasaragod":          "519",
}

PMGSY_URL = "https://omms.nic.in/StateReportRoadList.aspx?Stateid=KL&DistrictId={district_id}&BatchId=0"


def parse_budget(raw: str) -> str | None:
    raw = raw.strip().replace(",", "")
    try:
        val = float(raw)
        if val >= 100:
            return f"₹{val/100:.1f} Cr"
        return f"₹{val:.1f} L"
    except ValueError:
        return raw or None


def fetch_pmgsy_roads(district: str = "Ernakulam") -> list[dict]:
    api_key = os.environ.get("FIRECRAWL_API_KEY", "")
    if not api_key:
        log.error("FIRECRAWL_API_KEY not set")
        return []

    district_id = KERALA_DISTRICTS.get(district, "503")
    url = PMGSY_URL.format(district_id=district_id)

    app = FirecrawlApp(api_key=api_key)
    log.info(f"Firecrawl scraping PMGSY for {district} ({url})")

    try:
        result = app.scrape_url(url, params={"formats": ["markdown"]})
        markdown = result.get("markdown", "")
    except Exception as e:
        log.error(f"Firecrawl failed for PMGSY {district}: {e}")
        return []

    if not markdown:
        log.warning(f"PMGSY {district}: empty response")
        return []

    # Parse markdown table — PMGSY renders an HTML table
    # Columns roughly: Road Name | Length | Contractor | Cost | Status
    roads = []
    lines = [l.strip() for l in markdown.splitlines() if l.strip().startswith("|")]
    data_rows = [l for l in lines if not re.match(r"^\|[-| ]+\|$", l)][1:]  # skip header + separator

    for row in data_rows:
        cols = [c.strip() for c in row.strip("|").split("|")]
        if len(cols) < 3:
            continue
        name = cols[0]
        if not name or name.lower() in ("road name", "name", "s.no", "sl.no", ""):
            continue

        contractor = next(
            (c for c in cols[2:] if c and not re.match(r"^[\d,. ]+$", c)), "Unknown"
        )
        budget_raw = next((c for c in cols[2:] if re.match(r"^[\d,. ]+$", c)), None)

        roads.append({
            "name": name[:200],
            "type": "Road",
            "status": "completed" if any(w in row.lower() for w in ("complet", "finish")) else "ongoing",
            "ward": district,
            "district": district,
            "contractor": contractor or "Unknown",
            "budget": parse_budget(budget_raw) if budget_raw else None,
            "source": "PMGSY",
            "source_url": url,
            "stages": json.dumps([
                {"l": "PMGSY record", "d": True, "dt": datetime.now().strftime("%b %Y")}
            ]),
        })

    log.info(f"PMGSY {district}: parsed {len(roads)} roads")
    return roads


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--district", default="Ernakulam")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    projects = fetch_pmgsy_roads(district=args.district)
    if args.dry_run:
        print(json.dumps(projects[:5], indent=2, ensure_ascii=False))
    else:
        from supabase import create_client
        sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])
        for p in projects:
            sb.table("projects").upsert(p, on_conflict="name,source").execute()
        log.info(f"Saved {len(projects)} projects")
