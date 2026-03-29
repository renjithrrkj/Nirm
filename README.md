# NirmAI — Infrastructure Accountability for India

> Who built this broken drain? Are they still under warranty?

NirmAI maps government construction projects to the contractors who built them.
When infrastructure fails, the record already exists.

**Live demo:** [your-vercel-url.vercel.app]

---

## The problem

Small government contracts — roads, drains, street lights — fail constantly.
Nobody tracks who built what, with whose money, under what specification.
Existing portals (iROADS, PMGSY, KSMART) cover different slices but don't connect.
Citizens have no way to know if a failing drain is still under contractor warranty.

A drain breaks 8 months after completion. Nobody knows who built it, what spec was used,
or whether the contractor is still under warranty. No existing portal connects these dots
for small panchayat-level contracts.

---

## What NirmAI does

- **Maps every logged project** with contractor name, budget and ward
- **Auto-calculates warranty** period — flags contractors liable for defects
- **Citizens can report defects** linked directly to the contractor record
- **Scrapes Kerala government portals** daily (iROADS, PMGSY, eTenders, KIIFB)
- **Open source** — any city can deploy their own instance

---

## How it's different

| Tool | Coverage | Defect reporting | Citizen access |
|------|----------|-----------------|----------------|
| iROADS | PWD roads only | ✗ | Read-only |
| K-SMART | Certificates only | ✗ | Read-only |
| PMGSY | Rural roads only | ✗ | Read-only |
| **NirmAI** | **All project types** | **✓** | **Full participation** |

---

## Tech stack

```
Frontend:   Next.js 14 (App Router) + TypeScript
Styling:    Tailwind CSS
Map:        Leaflet.js with OpenStreetMap
Database:   Supabase (PostgreSQL)
Scrapers:   Python (requests, Playwright)
Cron:       GitHub Actions (daily at 1:30 AM IST)
Hosting:    Vercel
```

---

## Local setup

```bash
git clone https://github.com/yourusername/nirmai
cd nirmai
npm install
cp .env.example .env.local  # add your Supabase keys
npm run dev
```

App runs at `http://localhost:3000` in local mode with 6 seed projects from Ernakulam.

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run this SQL in the SQL editor:

```sql
CREATE TABLE IF NOT EXISTS projects (
  id          bigserial PRIMARY KEY,
  name        text NOT NULL,
  type        text,
  status      text DEFAULT 'ongoing',
  ward        text,
  district    text,
  contractor  text,
  budget      text,
  start_date  text,
  end_date    text,
  dlp_end     text,
  dlp_status  text,
  lat         float,
  lng         float,
  notes       text,
  source      text,
  source_url  text,
  stages      text DEFAULT '[]',
  verified    boolean DEFAULT false,
  scraped_at  timestamptz DEFAULT now(),
  created_at  timestamptz DEFAULT now(),
  UNIQUE(name, source)
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read"   ON projects FOR SELECT USING (true);
CREATE POLICY "public insert" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "public update" ON projects FOR UPDATE USING (true);
```

3. Copy your project URL and anon key to `.env.local`

---

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/nirmai)

Set these environment variables in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ADMIN_PASSWORD` (for `/admin` page)

---

## Scrapers

The `/scraper` directory contains Python scripts that pull data from:

- `nirmai_pmgsy.py` — PMGSY rural road projects
- `nirmai_etenders.py` — eTenders Kerala tender notices
- `nirmai_iroads.py` — iROADS PWD road projects (Playwright)
- `run_all.py` — master runner

```bash
cd scraper
pip install -r requirements.txt
playwright install chromium
python run_all.py --dry-run  # preview without saving
python run_all.py            # scrape and save to Supabase
```

GitHub Actions runs `run_all.py` daily at 1:30 AM IST.
Add `SUPABASE_URL` and `SUPABASE_KEY` as GitHub repository secrets.

---

## Contributing

Civic tech contributions welcome.

Especially looking for:
- Civil engineer advisors who understand DLP (defect liability period) rules
- Malayalam translators for better UI localization
- Panchayat contacts willing to pilot in their ward
- Data entry volunteers for Ernakulam projects

---

## Roadmap

- [ ] Photo upload for defect reports
- [ ] Phone OTP verification for submissions
- [ ] RTI request generator for missing contractor data
- [ ] SMS alerts when warranty is about to expire
- [ ] Integration with K-SMART and KIIFB portals
- [ ] Multi-district expansion beyond Ernakulam

---

## Contact

Built by Renjith · Kanayannur, Kerala, India
ICFOSS partnership in progress · OpenForge listing pending

The street light project in Ward 6 Kanayannur in this dataset is personal —
residents waited 3+ years for it to be sanctioned.

---

## License

MIT — free for any city, panchayat or government to use and modify.
