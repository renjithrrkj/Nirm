"""
NirmAI eTenders Kerala Scraper
Scrapes tender notices from etenders.kerala.gov.in

Usage:
    python nirmai_etenders.py --department "Local Self Government"
"""

import os
import json
import time
import logging
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

ETENDERS_BASE = "https://etenders.kerala.gov.in"

TYPE_MAP = {
    "road": "Road",
    "drain": "Drain",
    "drainage": "Drain",
    "street light": "Street Light",
    "building": "Building",
    "bridge": "Bridge",
    "water": "Water Supply",
    "pipeline": "Water Supply",
}


def classify_type(title: str) -> str:
    """Guess project type from tender title."""
    title_lower = title.lower()
    for keyword, ptype in TYPE_MAP.items():
        if keyword in title_lower:
            return ptype
    return "Other"


def fetch_etenders(department: str = "Local Self Government", page: int = 1) -> list[dict]:
    """Fetch tender notices from eTenders Kerala."""
    projects = []

    try:
        # eTenders has a search page with tender listings
        url = f"{ETENDERS_BASE}/nicgep/app"
        params = {
            "page": page,
            "service": "TENDER_SEARCH",
            "department": department,
            "state": "Kerala",
        }
        headers = {
            "User-Agent": "NirmAI-Scraper/1.0 (civic data; contact: nirmai@example.com)"
        }

        resp = requests.get(url, params=params, headers=headers, timeout=30)
        resp.raise_for_status()

        from bs4 import BeautifulSoup
        soup = BeautifulSoup(resp.text, "lxml")

        tender_rows = soup.select("table.list_table tr")[1:]
        for row in tender_rows:
            cells = row.find_all("td")
            if len(cells) < 6:
                continue

            title = cells[1].get_text(strip=True)
            org = cells[2].get_text(strip=True)
            value = cells[4].get_text(strip=True)
            closing_date = cells[5].get_text(strip=True)
            detail_link = cells[1].find("a")
            detail_url = f"{ETENDERS_BASE}{detail_link['href']}" if detail_link else None

            project = {
                "name": title[:200],
                "type": classify_type(title),
                "status": "planned",
                "ward": org,
                "district": "Kerala",
                "contractor": "Tender stage — not yet awarded",
                "budget": value or None,
                "end_date": closing_date or None,
                "source": "eTenders Kerala",
                "source_url": detail_url or ETENDERS_BASE,
                "stages": json.dumps([
                    {"l": "Tender floated", "d": True, "dt": "Scraped " + datetime.now().strftime("%b %Y")},
                    {"l": "Award", "d": False, "dt": "Pending"},
                    {"l": "Construction", "d": False, "dt": "Pending"},
                ]),
            }
            projects.append(project)

    except Exception as e:
        log.error(f"eTenders scrape failed: {e}")

    log.info(f"eTenders: found {len(projects)} tenders")
    return projects


def upsert_to_supabase(projects: list[dict]) -> int:
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
            time.sleep(0.1)
        except Exception as e:
            log.error(f"Upsert failed for {p.get('name', '?')}: {e}")

    log.info(f"Upserted {saved}/{len(projects)} projects")
    return saved


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Scrape eTenders Kerala")
    parser.add_argument("--department", default="Local Self Government")
    parser.add_argument("--pages", type=int, default=3)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    all_projects = []
    for page in range(1, args.pages + 1):
        projects = fetch_etenders(department=args.department, page=page)
        all_projects.extend(projects)
        if not projects:
            break
        time.sleep(2)

    if args.dry_run:
        print(json.dumps(all_projects, indent=2))
    else:
        upsert_to_supabase(all_projects)
