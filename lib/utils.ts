import { Project, Stage, WarrantyStatus } from './types';

export const TYPE_EMOJI: Record<string, string> = {
  Road: '🛣',
  Drain: '🌊',
  'Street Light': '💡',
  Building: '🏛',
  Bridge: '🌉',
  'Water Supply': '💧',
  Other: '📍',
};

export const STATUS_COLORS: Record<string, string> = {
  ongoing: '#ffb800',
  completed: '#00e5a0',
  defect: '#ff4d4d',
  planned: '#0099ff',
};

export const STATUS_LABELS: Record<string, string> = {
  ongoing: 'Ongoing',
  completed: 'Completed',
  defect: 'Defect',
  planned: 'Planned',
};

export function parseStages(stages: Stage[] | string | undefined): Stage[] {
  if (!stages) return [];
  if (typeof stages === 'string') {
    try {
      return JSON.parse(stages);
    } catch {
      return [];
    }
  }
  return stages;
}

export function daysBetween(date1: Date, date2: Date): number {
  return Math.round((date2.getTime() - date1.getTime()) / 86400000);
}

export function getWarrantyStatus(endDate: string | undefined, status: string): WarrantyStatus {
  if (!endDate) return 'unknown';
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return 'unknown';
  const days = daysBetween(end, new Date());
  if (status === 'defect' && days < 365) return 'breach';
  if (days < 365 && days > 0) return 'active';
  if (days >= 365) return 'expired';
  return 'unknown';
}

export function daysRemainingInWarranty(endDate: string): number {
  const end = new Date(endDate);
  const days = daysBetween(end, new Date());
  return Math.max(0, 365 - days);
}

export function monthsSince(endDate: string): number {
  const end = new Date(endDate);
  const days = daysBetween(end, new Date());
  return Math.round(days / 30);
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function normalizeProject(p: Project): Project {
  return {
    ...p,
    stages: parseStages(p.stages as Stage[] | string),
  };
}

export const SEED_PROJECTS: Omit<Project, 'id'>[] = [
  {
    name: 'NH 544 service road patch — Kalamassery junction',
    type: 'Road',
    status: 'defect',
    ward: 'Ward 12, Kalamassery',
    district: 'Ernakulam',
    contractor: 'Sreekumar Constructions Pvt Ltd',
    budget: '₹8,40,000',
    start_date: '2024-03-10',
    end_date: '2024-04-30',
    lat: 10.0544,
    lng: 76.32,
    notes: 'Road developed cracks within 4 months. Repair notice issued Nov 2024, no response.',
    source: 'Resident complaint + site inspection',
    stages: [
      { l: 'Tender awarded', d: true, dt: 'Mar 2024' },
      { l: 'Work started', d: true, dt: 'Mar 2024' },
      { l: 'Marked complete', d: true, dt: 'Apr 2024' },
      { l: 'Defect reported', d: true, dt: 'Nov 2024' },
      { l: 'Repair done', d: false, dt: 'Pending' },
    ],
  },
  {
    name: 'Drainage canal — Eloor bypass stretch',
    type: 'Drain',
    status: 'ongoing',
    ward: 'Ward 3, Eloor',
    district: 'Ernakulam',
    contractor: 'Baiju & Associates Civil Works',
    budget: '₹12,00,000',
    start_date: '2025-01-15',
    end_date: '2025-05-30',
    lat: 10.072,
    lng: 76.304,
    notes: 'Ernakulam District drainage scheme 2024-25. Pipe laying in progress.',
    source: 'District panchayat tender notice Jan 2025',
    stages: [
      { l: 'Tender awarded', d: true, dt: 'Jan 2025' },
      { l: 'Excavation', d: true, dt: 'Feb 2025' },
      { l: 'Pipe laying', d: false, dt: 'In progress' },
      { l: 'Completion', d: false, dt: 'May 2025' },
    ],
  },
  {
    name: 'Street light installation — Market Rd to Kochi Rd',
    type: 'Street Light',
    status: 'planned',
    ward: 'Ward 6, Kanayannur',
    district: 'Ernakulam',
    contractor: 'Not yet awarded',
    budget: '₹2,20,000',
    start_date: '2025-04-01',
    end_date: '2025-06-30',
    lat: 10.0147,
    lng: 76.3213,
    notes: 'Residents requesting 3+ years. Sanctioned March 2025 in ward plan.',
    source: 'Ward councillor + panchayat annual plan 2025-26',
    stages: [
      { l: 'Residents petition', d: true, dt: '2022-2025' },
      { l: 'Sanctioned in ward plan', d: true, dt: 'Mar 2025' },
      { l: 'Tender floated', d: false, dt: 'Pending' },
      { l: 'Installation', d: false, dt: 'May 2025' },
    ],
  },
  {
    name: 'Panchayat community hall renovation — Aluva North',
    type: 'Building',
    status: 'completed',
    ward: 'Ward 9, Aluva North',
    district: 'Ernakulam',
    contractor: 'Krishnan Nair & Sons Builders',
    budget: '₹18,50,000',
    start_date: '2024-06-01',
    end_date: '2024-11-30',
    lat: 10.1004,
    lng: 76.3556,
    notes: 'Completed on time. No defects as of March 2025.',
    source: 'Panchayat completion certificate Dec 2024',
    stages: [
      { l: 'Tender awarded', d: true, dt: 'Jun 2024' },
      { l: 'Foundation', d: true, dt: 'Jul 2024' },
      { l: 'Structure', d: true, dt: 'Sep 2024' },
      { l: 'Handover', d: true, dt: 'Dec 2024' },
    ],
  },
  {
    name: 'Periyar bridge approach road — Kalady',
    type: 'Road',
    status: 'ongoing',
    ward: 'Ward 2, Kalady',
    district: 'Ernakulam',
    contractor: 'Thriveni Earthmovers Ltd',
    budget: '₹34,00,000',
    start_date: '2025-02-01',
    end_date: '2025-07-31',
    lat: 10.1624,
    lng: 76.4348,
    notes: 'KIIFB funded. Sub-base layer in progress.',
    source: 'KIIFB portal + Mathrubhumi Feb 2025',
    stages: [
      { l: 'Survey', d: true, dt: 'Jan 2025' },
      { l: 'Earthwork', d: true, dt: 'Feb 2025' },
      { l: 'Sub-base', d: false, dt: 'In progress' },
      { l: 'Bitumen', d: false, dt: 'May 2025' },
    ],
  },
  {
    name: 'Water supply pipeline — Thrikkakara ward',
    type: 'Water Supply',
    status: 'defect',
    ward: 'Ward 5, Thrikkakara',
    district: 'Ernakulam',
    contractor: 'Rajan Infrastructure Pvt Ltd',
    budget: '₹6,80,000',
    start_date: '2023-09-01',
    end_date: '2023-12-31',
    lat: 10.034,
    lng: 76.349,
    notes: 'Leaking at 3 joints since Jan 2024. No response to repair notice in 15 months.',
    source: 'RTI Jan 2025 + KWA complaint KWA/EKM/2025/1847',
    stages: [
      { l: 'Completed', d: true, dt: 'Dec 2023' },
      { l: 'Leaks found', d: true, dt: 'Jan 2024' },
      { l: 'Repair notice', d: true, dt: 'Feb 2024' },
      { l: 'Repair done', d: false, dt: 'Pending 15mo' },
    ],
  },
];

export const SEED_PROJECTS_WITH_IDS: Project[] = SEED_PROJECTS.map((p, i) => ({
  ...p,
  id: i + 1,
}));
