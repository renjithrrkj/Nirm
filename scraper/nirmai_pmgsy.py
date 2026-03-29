"""
NirmAI PMGSY Scraper
Scrapes rural road project data from the PMGSY (Pradhan Mantri Gram Sadak Yojana) portal.
PMGSY API: omms.nic.in / pmgsy.nic.in

Usage:
    python nirmai_pmgsy.py --state KL --district Ernakulam
"""

import os
import json
import time
import logging
import requests
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

PMGSY_BASE = "https://omms.nic.in"

KERALA_DISTRICTS = {
    "Ernakulam": "503",
    "Thiruvananthapuram": "487",
    "Thrissur": "507",
    "Kozhikode": "514",
    "Kannur": "515",
    "Kollam": "488",
    "Kottayam": "500",
    "Malappuram": "513",
    "Palakkad": "510",
    "Pathanamthitta": "489",
    "Alappuzha": "493",
    "Idukki": "499",
    "Wayanad": "516",
    "Kasaragod": "519",
}


def fetch_pmgsy_roads(state_code: str = "KL", district_id: str = "503") -> list[dict]:
    """Fetch road projects from PMGSY for a given district."""
    roads = []
    try:
        # PMGSY has a public API endpoint for project data
        url = f"{PMGSY_BASE}/StateReportRoadList.aspx"
        params = {
            "Stateid": state_code,
            "DistrictId": district_id,
            "BatchId": "0",
        }
        headers = {"User-Agent": "NirmAI-Scraper/1.0 (civic data collection)"}
        resp = requests.get(url, params=params, headers=headers, timeout=30)
        resp.raise_for_status()

        # Parse HTML response (PMGSY returns HTML tables)
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(resp.text, "lxml")
        table = soup.find("table", {"id": "GridView_Roads"})
        if not table:
            log.warning("No road table found in PMGSY response")
            return roads

        headers_row = table.find("tr")
        rows = table.find_all("tr")[1:]

        for row in rows:
            cells = [td.get_text(strip=True) for td in row.find_all(["td", "th"])]
            if len(cells) >= 5:
                road = {
                    "name": cells[1] if len(cells) > 1 else "Unknown Road",
                    "type": "Road",
                    "status": "completed" if "complet" in cells[3].lower() else "ongoing",
                    "ward": cells[0] if cells[0] else "Unknown",
                    "district": "Ernakulam",
                    "contractor": cells[4] if len(cells) > 4 else "Unknown",
                    "budget": cells[5] if len(cells) > 5 else None,
                    "source": "PMGSY",
                    "source_url": url,
                    "stages": json.dumps([
                        {"l": "PMGSY project record", "d": True, "dt": "Scraped " + datetime.now().strftime("%b %Y")}
                    ]),
                }
                roads.append(road)

    except Exception as e:
        log.error(f"PMGSY scrape failed: {e}")

    log.info(f"PMGSY: found {len(roads)} roads")
    return roads


def upsert_to_supabase(projects: list[dict]) -> int:
    """Upsert projects to Supabase, deduplicating by name+source."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        log.warning("SUPABASE_URL or SUPABASE_KEY not set — skipping upsert")
        return 0

    from supabase import create_client
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    saved = 0
    for p in projects:
        try:
            sb.table("projects").upsert(p, on_conflict="name,source").execute()
            saved += 1
            time.sleep(0.1)  # rate limit
        except Exception as e:
            log.error(f"Upsert failed for {p.get('name', '?')}: {e}")

    log.info(f"Upserted {saved}/{len(projects)} projects to Supabase")
    return saved


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Scrape PMGSY road projects")
    parser.add_argument("--district", default="Ernakulam", help="District name")
    parser.add_argument("--dry-run", action="store_true", help="Print without saving")
    args = parser.parse_args()

    district_id = KERALA_DISTRICTS.get(args.district, "503")
    projects = fetch_pmgsy_roads(district_id=district_id)

    if args.dry_run:
        print(json.dumps(projects, indent=2))
    else:
        upsert_to_supabase(projects)
