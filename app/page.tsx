'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Project } from '@/lib/types';
import { supabase, isSupabaseLive } from '@/lib/supabase';
import { normalizeProject, SEED_PROJECTS_WITH_IDS } from '@/lib/utils';
import ProjectList from '@/components/ProjectList';
import DetailPanel from '@/components/DetailPanel';
import Header from '@/components/Header';

// Leaflet requires window — dynamic import with no SSR
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lang, setLang] = useState<'en' | 'ml'>('en');
  const [showMap, setShowMap] = useState(false);
  const router = useRouter();

  const selectedProject = projects.find((p) => p.id === selectedId) || null;

  // Load language preference
  useEffect(() => {
    const saved = localStorage.getItem('nirmai-lang');
    if (saved === 'ml') setLang('ml');
  }, []);

  function toggleLang() {
    const next = lang === 'en' ? 'ml' : 'en';
    setLang(next);
    localStorage.setItem('nirmai-lang', next);
  }

  // Load projects
  useEffect(() => {
    async function load() {
      if (!isSupabaseLive) {
        setProjects(SEED_PROJECTS_WITH_IDS);
        setIsLive(false);
        return;
      }

      try {
        const { data, error } = await supabase!
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setProjects((data || []).map(normalizeProject));
        setIsLive(true);
      } catch (e) {
        console.error('Failed to load from Supabase:', e);
        setProjects(SEED_PROJECTS_WITH_IDS);
        setIsLive(false);
      }
    }

    load();
  }, []);

  const handleSelect = useCallback((project: Project) => {
    setSelectedId(project.id);
    // Update URL for shareability
    router.push(`/project/${project.id}`, { scroll: false });
  }, [router]);

  function handleProjectUpdate(updated: Project) {
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  }

  return (
    <div className="bg-[#0e1117] text-[#e8eaf0] h-screen flex flex-col overflow-hidden font-['DM_Sans']">
      <Header
        projects={projects}
        isLive={isLive}
        lang={lang}
        onToggleLang={toggleLang}
      />

      {/* Map/List toggle on mobile */}
      <div className="flex md:hidden border-b border-[rgba(255,255,255,0.07)] bg-[#161b27]">
        <button
          onClick={() => setShowMap(false)}
          className={`flex-1 py-2 text-[12px] font-['DM_Mono'] transition-colors ${
            !showMap ? 'text-[#00e5a0] border-b-2 border-[#00e5a0]' : 'text-[#7a8299]'
          }`}
        >
          {lang === 'ml' ? 'പട്ടിക' : 'List'}
        </button>
        <button
          onClick={() => setShowMap(true)}
          className={`flex-1 py-2 text-[12px] font-['DM_Mono'] transition-colors ${
            showMap ? 'text-[#00e5a0] border-b-2 border-[#00e5a0]' : 'text-[#7a8299]'
          }`}
        >
          {lang === 'ml' ? 'ഭൂപടം' : 'Map'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* List — hidden on mobile when map is shown */}
        <div className={`${showMap ? 'hidden md:flex' : 'flex'} md:flex`}>
          <ProjectList
            projects={projects}
            selectedId={selectedId}
            onSelect={handleSelect}
            lang={lang}
          />
        </div>

        {/* Map — center panel */}
        <div className={`${showMap ? 'flex' : 'hidden md:flex'} flex-1 flex-col overflow-hidden`}>
          <Map
            projects={projects}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </div>

        {/* Detail panel — hidden on mobile, shown as overlay on md+ */}
        <div className="hidden lg:flex w-[420px] flex-shrink-0 border-l border-[rgba(255,255,255,0.07)] overflow-hidden">
          <DetailPanel
            project={selectedProject}
            isLive={isLive}
            lang={lang}
            onProjectUpdate={handleProjectUpdate}
          />
        </div>
      </div>

      {/* Mobile detail panel — bottom sheet */}
      {selectedProject && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#161b27] border-t border-[rgba(255,255,255,0.13)] z-50 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between p-3 border-b border-[rgba(255,255,255,0.07)]">
            <div className="font-['Syne'] text-[13px] font-bold text-[#e8eaf0] truncate pr-4">
              {selectedProject.name}
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="text-[#7a8299] text-lg leading-none flex-shrink-0"
            >
              ✕
            </button>
          </div>
          <DetailPanel
            project={selectedProject}
            isLive={isLive}
            lang={lang}
            onProjectUpdate={handleProjectUpdate}
          />
        </div>
      )}
    </div>
  );
}
