"""
NirmAI iROADS Scraper
Scrapes road project data from iROADS Kerala (pwdrmms.kerala.gov.in)
Uses Playwright for JavaScript-rendered pages.

Usage:
    python nirmai_iroads.py --district Ernakulam
"""

import os
import json
import time
import logging
import asyncio
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

IROADS_URL = "https://pwdrmms.kerala.gov.in"


async def scrape_iroads(district: str = "ERNAKULAM") -> list[dict]:
    """
    Scrape PWD road project data from iROADS using Playwright.
    iROADS is JavaScript-heavy — needs a real browser.
    """
    projects = []

    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            log.info("Opening iROADS portal...")
            await page.goto(IROADS_URL, timeout=30000)
            await page.wait_for_load_state("networkidle", timeout=15000)

            # Navigate to road project list
            try:
                await page.click("text=Road Projects", timeout=5000)
                await page.wait_for_load_state("networkidle", timeout=10000)
            except Exception:
                log.warning("Could not find Road Projects link — trying direct URL")
                await page.goto(f"{IROADS_URL}/road-projects", timeout=15000)

            # Apply district filter if available
            try:
                await page.select_option("select[name='district']", district)
                await page.click("button[type='submit']")
                await page.wait_for_load_state("networkidle", timeout=10000)
            except Exception:
                log.warning("District filter not applied")

            # Extract table rows
            rows = await page.query_selector_all("table tbody tr")
            log.info(f"Found {len(rows)} rows in iROADS table")

            for row in rows:
                cells = await row.query_selector_all("td")
                if len(cells) < 4:
                    continue

                texts = [await cell.inner_text() for cell in cells]
                project = {
                    "name": texts[1].strip() if len(texts) > 1 else "Unknown",
                    "type": "Road",
                    "status": "ongoing" if "progress" in texts[3].lower() else "completed",
                    "ward": district.title(),
                    "district": district.title(),
                    "contractor": texts[4].strip() if len(texts) > 4 else "Unknown",
                    "budget": texts[5].strip() if len(texts) > 5 else None,
                    "source": "iROADS Kerala",
                    "source_url": IROADS_URL,
                    "stages": json.dumps([
                        {"l": "iROADS record", "d": True, "dt": datetime.now().strftime("%b %Y")}
                    ]),
                }
                projects.append(project)

            await browser.close()

    except ImportError:
        log.error("Playwright not installed. Run: pip install playwright && playwright install chromium")
    except Exception as e:
        log.error(f"iROADS scrape failed: {e}")

    log.info(f"iROADS: found {len(projects)} projects")
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
    parser = argparse.ArgumentParser(description="Scrape iROADS Kerala road projects")
    parser.add_argument("--district", default="ERNAKULAM")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    projects = asyncio.run(scrape_iroads(district=args.district))

    if args.dry_run:
        print(json.dumps(projects, indent=2))
    else:
        upsert_to_supabase(projects)
