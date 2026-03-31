"""
Debug script — shows raw Firecrawl output for each portal.
Run: python debug_portals.py
"""
import os
from dotenv import load_dotenv
from firecrawl import FirecrawlApp

load_dotenv()
app = FirecrawlApp(api_key=os.environ["FIRECRAWL_API_KEY"])

URLS = {
    "PMGSY":     "https://omms.nic.in/StateReportRoadList.aspx?Stateid=KL&DistrictId=503&BatchId=0",
    "eTenders":  "https://etenders.kerala.gov.in/nicgep/app",
    "iROADS":    "https://pwdrmms.kerala.gov.in",
}

for name, url in URLS.items():
    print(f"\n{'='*60}")
    print(f"  {name}: {url}")
    print('='*60)
    try:
        result = app.scrape_url(url, params={"formats": ["markdown"]})
        md = result.get("markdown", "")
        print(f"Length: {len(md)} chars")
        print("--- First 800 chars ---")
        print(md[:800])
        print("--- Last 400 chars ---")
        print(md[-400:] if len(md) > 400 else "")
    except Exception as e:
        print(f"ERROR: {e}")
