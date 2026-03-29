'use client';

import Link from 'next/link';
import { Project } from '@/lib/types';

interface HeaderProps {
  projects: Project[];
  isLive: boolean;
  lang: 'en' | 'ml';
  onToggleLang: () => void;
}

export default function Header({ projects, isLive, lang, onToggleLang }: HeaderProps) {
  const total = projects.length;
  const defects = projects.filter((p) => p.status === 'defect').length;
  const ongoing = projects.filter((p) => p.status === 'ongoing').length;
  const completed = projects.filter((p) => p.status === 'completed').length;

  return (
    <header className="flex items-center gap-4 px-5 h-[54px] border-b border-[rgba(255,255,255,0.07)] flex-shrink-0 bg-[#161b27]">
      {/* Logo */}
      <div className="font-['Syne'] text-[20px] font-extrabold tracking-[-0.5px] text-[#e8eaf0]">
        Nirm<span className="text-[#00e5a0]">AI</span>
      </div>

      {/* Tagline */}
      <div className="text-[11px] text-[#7a8299] font-['DM_Mono'] border-l border-[rgba(255,255,255,0.13)] pl-[14px] hidden sm:block">
        Infrastructure · Accountability · Kerala
      </div>

      {/* DB status pill */}
      <span className={`text-[10px] font-['DM_Mono'] px-[10px] py-[3px] rounded-[20px] border ml-2 ${
        isLive
          ? 'border-[#00e5a0] text-[#00e5a0] bg-[rgba(0,229,160,0.07)]'
          : 'border-[#ffb800] text-[#ffb800] bg-[rgba(255,184,0,0.07)]'
      }`}>
        ● {isLive ? 'live' : 'local mode'}
      </span>

      {/* Stats */}
      <div className="flex gap-6 ml-auto">
        <div className="text-right hidden sm:block">
          <div className="font-['DM_Mono'] text-[17px] font-medium text-[#00e5a0]">{total}</div>
          <div className="text-[10px] text-[#7a8299] uppercase tracking-[0.5px]">
            {lang === 'ml' ? 'പദ്ധതികൾ' : 'Projects'}
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="font-['DM_Mono'] text-[17px] font-medium text-[#ff4d4d]">{defects}</div>
          <div className="text-[10px] text-[#7a8299] uppercase tracking-[0.5px]">
            {lang === 'ml' ? 'തകരാറുകൾ' : 'Defects'}
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="font-['DM_Mono'] text-[17px] font-medium text-[#ffb800]">{ongoing}</div>
          <div className="text-[10px] text-[#7a8299] uppercase tracking-[0.5px]">
            {lang === 'ml' ? 'നടക്കുന്നത്' : 'Ongoing'}
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="font-['DM_Mono'] text-[17px] font-medium text-[#00e5a0]">{completed}</div>
          <div className="text-[10px] text-[#7a8299] uppercase tracking-[0.5px]">
            {lang === 'ml' ? 'പൂർത്തി' : 'Completed'}
          </div>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Malayalam toggle */}
        <button
          onClick={onToggleLang}
          className="text-[11px] font-['DM_Mono'] px-[10px] py-[4px] rounded-[20px] border border-[rgba(255,255,255,0.13)] text-[#7a8299] cursor-pointer hover:border-[rgba(255,255,255,0.25)] hover:text-[#e8eaf0] transition-all"
        >
          {lang === 'ml' ? 'EN' : 'മല'}
        </button>

        {/* GitHub */}
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-['DM_Mono'] px-[10px] py-[4px] rounded-[20px] border border-[rgba(255,255,255,0.13)] text-[#7a8299] no-underline cursor-pointer hover:border-[rgba(255,255,255,0.25)] hover:text-[#e8eaf0] transition-all hidden sm:block"
        >
          GitHub
        </a>

        {/* Add project */}
        <Link
          href="/add"
          className="bg-[#00e5a0] text-black font-['Syne'] font-bold text-[12px] px-4 py-[6px] rounded-lg no-underline hover:opacity-85 transition-opacity"
        >
          {lang === 'ml' ? 'പദ്ധതി ചേർക്കുക' : '+ Add Project'}
        </Link>
      </div>
    </header>
  );
}
