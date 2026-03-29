export type ProjectStatus = 'ongoing' | 'completed' | 'defect' | 'planned';

export type ProjectType =
  | 'Road'
  | 'Drain'
  | 'Street Light'
  | 'Building'
  | 'Bridge'
  | 'Water Supply'
  | 'Other';

export interface Stage {
  l: string;  // label
  d: boolean; // done
  dt: string; // date text
}

export interface Project {
  id: number;
  name: string;
  type: ProjectType | string;
  status: ProjectStatus;
  ward: string;
  district?: string;
  contractor: string;
  budget?: string;
  start_date?: string;
  end_date?: string;
  dlp_end?: string;
  dlp_status?: string;
  lat?: number | null;
  lng?: number | null;
  notes?: string;
  source?: string;
  source_url?: string;
  stages: Stage[] | string;
  scraped_at?: string;
  created_at?: string;
  verified?: boolean;
}

export type WarrantyStatus = 'breach' | 'active' | 'expired' | 'unknown';

export interface DefectReport {
  project_id: number;
  description: string;
  photo_url?: string;
  reporter_phone_hash?: string;
  created_at?: string;
}
