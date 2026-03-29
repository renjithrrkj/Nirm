-- NirmAI Supabase Schema
-- Run this in your Supabase SQL editor before connecting the app.

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

-- Storage bucket for defect photos
-- Run in Storage section of Supabase dashboard:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('defect-photos', 'defect-photos', true);
