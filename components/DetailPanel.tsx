'use client';

import { useState } from 'react';
import { Project } from '@/lib/types';
import { TYPE_EMOJI, STATUS_LABELS, STATUS_COLORS, parseStages, formatDate } from '@/lib/utils';
import Timeline from './Timeline';
import WarrantyBadge from './WarrantyBadge';
import ReportDefect from './ReportDefect';

interface DetailPanelProps {
  project: Project | null;
  isLive: boolean;
  lang: 'en' | 'ml';
  onProjectUpdate: (p: Project) => void;
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  ongoing: 'bg-[rgba(255,184,0,0.15)] text-[#ffb800]',
  completed: 'bg-[rgba(0,229,160,0.12)] text-[#00e5a0]',
  defect: 'bg-[rgba(255,77,77,0.15)] text-[#ff4d4d]',
  planned: 'bg-[rgba(0,153,255,0.12)] text-[#0099ff]',
};

export default function DetailPanel({ project, isLive, lang, onProjectUpdate }: DetailPanelProps) {
  const [showDefect, setShowDefect] = useState(false);

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[#7a8299] gap-3 p-10 bg-[#0e1117]">
        <div className="text-[40px] opacity-30">🏗</div>
        <div className="text-[13px] leading-[1.7] text-center max-w-[280px]">
          {lang === 'ml'
            ? 'കരാറുകാരൻ, ബജറ്റ്, പ്രോഗ്രസ്സ് ടൈംലൈൻ, ഉറവിടം കാണാൻ ഒരു പദ്ധതി തിരഞ്ഞെടുക്കുക.'
            : 'Select a project to see the contractor, budget, progress timeline and source.\n\nEvery project is linked to who built it.'}
        </div>
        {!isLive && (
          <div className="mt-4 bg-[rgba(255,184,0,0.06)] border border-[rgba(255,184,0,0.2)] rounded-[10px] p-[14px] text-[12px] leading-[1.7] text-[#7a8299] max-w-sm">
            <strong className="text-[#ffb800] font-semibold">Running in local mode.</strong> Connect Supabase to make data persistent and shared across users.
            <br /><br />
            Add your Supabase URL and anon key to <code className="bg-[#1e2535] px-[6px] py-[1px] rounded text-[11px] font-['DM_Mono'] text-[#e8eaf0]">.env.local</code> to go live.
          </div>
        )}
      </div>
    );
  }

  const stages = parseStages(project.stages);
  const mapsUrl = project.lat && project.lng ? `https://www.google.com/maps?q=${project.lat},${project.lng}` : null;
  const osmUrl = project.lat && project.lng ? `https://www.openstreetmap.org/?mlat=${project.lat}&mlon=${project.lng}&zoom=16` : null;
  const statusColor = STATUS_COLORS[project.status] || '#888';
  const statusLabel = STATUS_LABELS[project.status] || project.status;

  function handleShare() {
    if (!project) return;
    const url = `${window.location.origin}/project/${project.id}`;
    navigator.clipboard.writeText(url).then(() => {
      // Could trigger a toast here
    });
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0e1117]">
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[rgba(255,255,255,0.13)]">

        {/* Header */}
        <div className="mb-5">
          <div className="font-['Syne'] text-[20px] font-bold leading-[1.3] mb-2 text-[#e8eaf0]">
            {TYPE_EMOJI[project.type] || '📍'} {project.name}
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <span className={`text-[10px] font-['DM_Mono'] px-2 py-[2px] rounded-[20px] ${STATUS_BADGE_CLASSES[project.status]}`}>
              {statusLabel}
            </span>
            <span className="text-[11px] text-[#7a8299]">{project.type} · {project.ward}</span>
          </div>
        </div>

        {/* Contractor & Budget */}
        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-[1px] text-[#7a8299] font-['DM_Mono'] mb-2">
            {lang === 'ml' ? 'കരാറുകാരൻ & ബജറ്റ്' : 'Contractor & Budget'}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2 bg-[#161b27] border border-[rgba(255,255,255,0.07)] rounded-lg p-[10px] px-3">
              <div className="text-[10px] text-[#7a8299] mb-[3px]">{lang === 'ml' ? 'കരാറുകാരൻ / സ്ഥാപനം' : 'Contractor / Firm'}</div>
              <div className="text-[13px] text-[#e8eaf0] font-medium">{project.contractor}</div>
            </div>
            <div className="bg-[#161b27] border border-[rgba(255,255,255,0.07)] rounded-lg p-[10px] px-3">
              <div className="text-[10px] text-[#7a8299] mb-[3px]">{lang === 'ml' ? 'അംഗീകൃത ബജറ്റ്' : 'Sanctioned budget'}</div>
              <div className="text-[13px] text-[#00e5a0] font-['DM_Mono'] font-medium">{project.budget || 'Not disclosed'}</div>
            </div>
            <div className="bg-[#161b27] border border-[rgba(255,255,255,0.07)] rounded-lg p-[10px] px-3">
              <div className="text-[10px] text-[#7a8299] mb-[3px]">{lang === 'ml' ? 'തരം' : 'Type'}</div>
              <div className="text-[13px] text-[#e8eaf0] font-medium">{project.type}</div>
            </div>
            <div className="bg-[#161b27] border border-[rgba(255,255,255,0.07)] rounded-lg p-[10px] px-3">
              <div className="text-[10px] text-[#7a8299] mb-[3px]">{lang === 'ml' ? 'ആരംഭ തീയതി' : 'Start date'}</div>
              <div className="text-[13px] text-[#e8eaf0] font-medium">{formatDate(project.start_date)}</div>
            </div>
            <div className="bg-[#161b27] border border-[rgba(255,255,255,0.07)] rounded-lg p-[10px] px-3">
              <div className="text-[10px] text-[#7a8299] mb-[3px]">{lang === 'ml' ? 'പൂർത്തീകരണ തീയതി' : 'Expected completion'}</div>
              <div className="text-[13px] text-[#e8eaf0] font-medium">{formatDate(project.end_date)}</div>
            </div>
            <WarrantyBadge endDate={project.end_date} status={project.status} lang={lang} />
          </div>
        </div>

        <hr className="border-none border-t border-[rgba(255,255,255,0.07)] my-1" />

        {/* Timeline */}
        <div className="mb-5 mt-5">
          <div className="text-[10px] uppercase tracking-[1px] text-[#7a8299] font-['DM_Mono'] mb-2">
            {lang === 'ml' ? 'പ്രോഗ്രസ്സ് ടൈംലൈൻ' : 'Progress Timeline'}
          </div>
          <Timeline stages={stages} />
        </div>

        <hr className="border-none border-t border-[rgba(255,255,255,0.07)] my-1" />

        {/* Notes */}
        <div className="mb-5 mt-5">
          <div className="text-[10px] uppercase tracking-[1px] text-[#7a8299] font-['DM_Mono'] mb-2">
            {lang === 'ml' ? 'കുറിപ്പുകൾ' : 'Notes'}
          </div>
          <div className="bg-[#161b27] border border-[rgba(255,255,255,0.07)] rounded-lg p-[10px] px-3">
            <div className="text-[12px] text-[#e8eaf0] leading-[1.6]">{project.notes || '—'}</div>
          </div>
        </div>

        {/* Source */}
        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-[1px] text-[#7a8299] font-['DM_Mono'] mb-2">
            {lang === 'ml' ? 'വിവരസ്രോതസ്സ്' : 'Source of Information'}
          </div>
          <div className="bg-[#161b27] border border-[rgba(255,255,255,0.07)] rounded-lg p-[10px] px-3">
            <div className="text-[12px] text-[#7a8299] leading-[1.6]">
              {project.source || '—'}
              {project.source_url && (
                <a href={project.source_url} target="_blank" rel="noopener noreferrer"
                   className="text-[#0099ff] ml-2 hover:underline">
                  ↗ View source
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        {project.lat && project.lng && (
          <div className="mb-5">
            <div className="text-[10px] uppercase tracking-[1px] text-[#7a8299] font-['DM_Mono'] mb-2">
              {lang === 'ml' ? 'സ്ഥലം' : 'Location'}
            </div>
            <div className="bg-[#161b27] border border-[rgba(255,255,255,0.07)] rounded-lg p-[10px] px-3 mb-2">
              <div className="text-[10px] text-[#7a8299] mb-[3px]">Coordinates</div>
              <div className="text-[13px] text-[#00e5a0] font-['DM_Mono'] font-medium">{project.lat}, {project.lng}</div>
            </div>
            <div className="flex gap-2">
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                   className="flex-1 flex items-center justify-center gap-[7px] bg-[#161b27] border border-[rgba(255,255,255,0.13)] text-[#e8eaf0] rounded-lg py-[10px] text-[12px] font-medium cursor-pointer no-underline hover:bg-[#1e2535] hover:border-[#0099ff] hover:text-[#0099ff] transition-all">
                  📍 Google Maps
                </a>
              )}
              {osmUrl && (
                <a href={osmUrl} target="_blank" rel="noopener noreferrer"
                   className="flex-1 flex items-center justify-center gap-[7px] bg-[#161b27] border border-[rgba(255,255,255,0.13)] text-[#e8eaf0] rounded-lg py-[10px] text-[12px] font-medium cursor-pointer no-underline hover:bg-[#1e2535] hover:border-[#0099ff] hover:text-[#0099ff] transition-all">
                  🗺 OpenStreetMap
                </a>
              )}
            </div>
          </div>
        )}

        <hr className="border-none border-t border-[rgba(255,255,255,0.07)] my-1" />

        {/* Actions */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setShowDefect(true)}
            className="flex-1 flex items-center justify-center gap-[7px] bg-[rgba(255,77,77,0.08)] border border-[rgba(255,77,77,0.25)] text-[#ff4d4d] rounded-lg py-[10px] text-[12px] font-medium cursor-pointer hover:bg-[rgba(255,77,77,0.16)] transition-all"
          >
            🚨 {lang === 'ml' ? 'തകരാർ റിപ്പോർട്ട് ചെയ്യുക' : 'Report Defect'}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-[7px] bg-[#161b27] border border-[rgba(255,255,255,0.13)] text-[#7a8299] rounded-lg py-[10px] px-4 text-[12px] font-medium cursor-pointer hover:bg-[#1e2535] hover:text-[#e8eaf0] transition-all"
          >
            🔗 {lang === 'ml' ? 'ഷെയർ' : 'Share'}
          </button>
        </div>
      </div>

      {showDefect && (
        <ReportDefect
          project={project}
          onClose={() => setShowDefect(false)}
          onSuccess={(updated) => {
            onProjectUpdate(updated);
            setShowDefect(false);
          }}
          lang={lang}
        />
      )}
    </div>
  );
}
