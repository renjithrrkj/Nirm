'use client';

import { useState, useMemo } from 'react';
import { Project } from '@/lib/types';
import ProjectCard from './ProjectCard';
import Link from 'next/link';

interface ProjectListProps {
  projects: Project[];
  selectedId: number | null;
  onSelect: (project: Project) => void;
  lang: 'en' | 'ml';
}

type FilterType = 'all' | 'ongoing' | 'completed' | 'defect' | 'planned';

const FILTER_LABELS: Record<FilterType, { en: string; ml: string; active: string }> = {
  all: { en: 'All', ml: 'എല്ലാം', active: 'border-[#00e5a0] text-[#00e5a0] bg-[rgba(0,229,160,0.08)]' },
  ongoing: { en: 'Ongoing', ml: 'നടക്കുന്നത്', active: 'border-[#ffb800] text-[#ffb800] bg-[rgba(255,184,0,0.08)]' },
  completed: { en: 'Completed', ml: 'പൂർത്തി', active: 'border-[#00e5a0] text-[#00e5a0] bg-[rgba(0,229,160,0.08)]' },
  defect: { en: 'Defects', ml: 'തകരാർ', active: 'border-[#ff4d4d] text-[#ff4d4d] bg-[rgba(255,77,77,0.08)]' },
  planned: { en: 'Planned', ml: 'ആസൂത്രിത', active: 'border-[#0099ff] text-[#0099ff] bg-[rgba(0,153,255,0.08)]' },
};

export default function ProjectList({ projects, selectedId, onSelect, lang }: ProjectListProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchFilter = filter === 'all' || p.status === filter;
      const q = query.toLowerCase();
      const matchQuery =
        !q ||
        [p.name, p.contractor, p.ward, p.type].some(
          (s) => s && s.toLowerCase().includes(q)
        );
      return matchFilter && matchQuery;
    });
  }, [projects, filter, query]);

  const searchPlaceholder =
    lang === 'ml'
      ? 'പദ്ധതി, കരാറുകാരൻ, വാർഡ്...'
      : 'Search project, contractor, ward…';

  const addLabel = lang === 'ml' ? 'പദ്ധതി ചേർക്കുക' : '+ Log New Project';

  return (
    <div className="w-[380px] flex-shrink-0 flex flex-col border-r border-[rgba(255,255,255,0.07)] bg-[#161b27] overflow-hidden">
      {/* Search + filters */}
      <div className="p-[14px] border-b border-[rgba(255,255,255,0.07)]">
        <input
          type="text"
          className="w-full bg-[#1e2535] border border-[rgba(255,255,255,0.13)] rounded-lg px-[13px] py-[9px] text-[#e8eaf0] font-['DM_Sans'] text-[13px] outline-none focus:border-[#00e5a0] placeholder:text-[#7a8299]"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex gap-[5px] flex-wrap mt-[10px]">
          {(Object.keys(FILTER_LABELS) as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[11px] font-['DM_Mono'] px-[11px] py-1 rounded-[20px] border transition-all duration-150 cursor-pointer
                ${filter === f
                  ? FILTER_LABELS[f].active
                  : 'border-[rgba(255,255,255,0.13)] text-[#7a8299] bg-transparent hover:border-[rgba(255,255,255,0.25)]'
                }`}
            >
              {lang === 'ml' ? FILTER_LABELS[f].ml : FILTER_LABELS[f].en}
            </button>
          ))}
        </div>
      </div>

      {/* Add project button */}
      <Link
        href="/add"
        className="mx-[14px] mt-[10px] mb-1 bg-[#00e5a0] text-black border-none rounded-lg py-[10px] font-['Syne'] font-bold text-[13px] cursor-pointer text-center transition-opacity duration-150 hover:opacity-85"
      >
        {addLabel}
      </Link>

      {/* List */}
      <div className="overflow-y-auto flex-1 p-2 scrollbar-thin scrollbar-thumb-[rgba(255,255,255,0.13)]">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-[#7a8299] text-[13px] leading-[1.8]">
            {lang === 'ml'
              ? 'പദ്ധതികൾ ഒന്നും കണ്ടെത്തിയില്ല.'
              : 'No projects match.'}<br />
            <small className="text-[11px]">
              {lang === 'ml' ? 'ഫിൽട്ടർ മാറ്റുക അല്ലെങ്കിൽ ഒരെണ്ണം ചേർക്കുക.' : 'Change filter or add one.'}
            </small>
          </div>
        ) : (
          filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              selected={selectedId === p.id}
              onClick={() => onSelect(p)}
              lang={lang}
            />
          ))
        )}
      </div>
    </div>
  );
}
