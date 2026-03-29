'use client';

import { Project } from '@/lib/types';
import { TYPE_EMOJI, STATUS_LABELS, formatDate } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  selected: boolean;
  onClick: () => void;
  lang: 'en' | 'ml';
}

const STATUS_BORDER: Record<string, string> = {
  ongoing: 'border-l-[#ffb800]',
  completed: 'border-l-[#00e5a0]',
  defect: 'border-l-[#ff4d4d]',
  planned: 'border-l-[#0099ff]',
};

const STATUS_BADGE: Record<string, string> = {
  ongoing: 'bg-[rgba(255,184,0,0.15)] text-[#ffb800]',
  completed: 'bg-[rgba(0,229,160,0.12)] text-[#00e5a0]',
  defect: 'bg-[rgba(255,77,77,0.15)] text-[#ff4d4d]',
  planned: 'bg-[rgba(0,153,255,0.12)] text-[#0099ff]',
};

const ML_STATUS: Record<string, string> = {
  ongoing: 'നടന്നുകൊണ്ടിരിക്കുന്നു',
  completed: 'പൂർത്തിയായി',
  defect: 'തകരാർ',
  planned: 'ആസൂത്രിത',
};

export default function ProjectCard({ project, selected, onClick, lang }: ProjectCardProps) {
  const statusLabel = lang === 'ml'
    ? (ML_STATUS[project.status] || STATUS_LABELS[project.status])
    : STATUS_LABELS[project.status];

  return (
    <div
      onClick={onClick}
      className={`
        relative border border-l-4 rounded-[11px] p-3 px-[14px] mb-[6px] cursor-pointer
        transition-all duration-150 bg-[#1e2535] overflow-hidden
        ${STATUS_BORDER[project.status] || 'border-l-gray-500'}
        ${selected
          ? 'border-[#00e5a0] bg-[rgba(0,229,160,0.04)]'
          : 'border-[rgba(255,255,255,0.07)] hover:bg-[#252e42] hover:border-[rgba(255,255,255,0.13)]'
        }
      `}
    >
      {/* Top row */}
      <div className="flex justify-between items-start gap-2">
        <div className="font-['Syne'] text-[13px] font-semibold leading-[1.35] text-[#e8eaf0]">
          {TYPE_EMOJI[project.type] || '📍'} {project.name}
        </div>
        <span className={`text-[10px] font-['DM_Mono'] px-2 py-[2px] rounded-[20px] flex-shrink-0 mt-[1px] ${STATUS_BADGE[project.status]}`}>
          {statusLabel}
        </span>
      </div>

      {/* Meta */}
      <div className="mt-[7px] flex flex-col gap-[3px]">
        <div className="text-[11px] text-[#7a8299]">
          🏗 <b className="text-[#e8eaf0] font-medium">{project.contractor}</b>
        </div>
        <div className="text-[11px] text-[#7a8299]">📍 {project.ward}</div>
        <div className="text-[11px] text-[#7a8299]">
          📅 {project.start_date || '—'} → {project.end_date || '—'}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 flex justify-between items-center">
        <span className="font-['DM_Mono'] text-[11px] text-[#00e5a0]">
          {project.budget || '—'}
        </span>
        <span className="text-[10px] text-[#4a5568] bg-[#252e42] px-2 py-[2px] rounded-[20px]">
          {project.type}
        </span>
      </div>
    </div>
  );
}
