'use client';

import { useState } from 'react';
import { Project } from '@/lib/types';
import { supabase, isSupabaseLive } from '@/lib/supabase';
import { parseStages } from '@/lib/utils';

interface ReportDefectProps {
  project: Project;
  onClose: () => void;
  onSuccess: (updated: Project) => void;
  lang: 'en' | 'ml';
}

export default function ReportDefect({ project, onClose, onSuccess, lang }: ReportDefectProps) {
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!description.trim()) return;
    setSaving(true);

    const newStage = {
      l: 'Defect reported by citizen via NirmAI',
      d: true,
      dt: new Date().toLocaleDateString('en-IN'),
    };

    const currentStages = parseStages(project.stages);
    const updatedStages = [...currentStages, newStage];

    const updatedProject: Project = {
      ...project,
      status: 'defect',
      stages: updatedStages,
    };

    if (isSupabaseLive) {
      try {
        await supabase!
          .from('projects')
          .update({
            status: 'defect',
            stages: JSON.stringify(updatedStages),
            notes: project.notes
              ? project.notes + '\n\nDefect report: ' + description
              : 'Defect report: ' + description,
          })
          .eq('id', project.id);
      } catch (e) {
        console.error('Defect update failed:', e);
      }
    }

    setSaving(false);
    setDone(true);
    onSuccess(updatedProject);
  }

  const title = lang === 'ml' ? 'തകരാർ റിപ്പോർട്ട് ചെയ്യുക' : 'Report Defect';
  const submitLabel = lang === 'ml' ? 'ഫയൽ ചെയ്യുക' : 'File Defect Report';
  const cancelLabel = lang === 'ml' ? 'റദ്ദാക്കുക' : 'Cancel';

  return (
    <div
      className="fixed inset-0 bg-black/75 z-[1000] flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#161b27] border border-[rgba(255,255,255,0.13)] rounded-[14px] p-6 w-[480px] max-w-[96vw] max-h-[90vh] overflow-y-auto">
        {done ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-4">✅</div>
            <div className="font-['Syne'] text-lg font-bold text-[#00e5a0] mb-2">
              {lang === 'ml' ? 'തകരാർ ഫയൽ ചെയ്തു' : 'Defect Logged'}
            </div>
            <p className="text-[#7a8299] text-[13px] leading-[1.7]">
              {lang === 'ml'
                ? `കരാറുകാരൻ ${project.contractor} പൊതു രേഖയിൽ ഉൾപ്പെടുത്തിയിരിക്കുന്നു.`
                : `Defect logged. Contractor ${project.contractor} has been notified via public record.`}
            </p>
            <button
              onClick={onClose}
              className="mt-4 bg-[#00e5a0] text-black font-['Syne'] font-bold rounded-lg px-6 py-[10px] text-[13px] cursor-pointer"
            >
              {lang === 'ml' ? 'അടയ്ക്കുക' : 'Close'}
            </button>
          </div>
        ) : (
          <>
            <h2 className="font-['Syne'] text-[18px] font-bold mb-1 text-[#e8eaf0]">{title}</h2>
            <p className="text-[#7a8299] text-[12px] mb-4">
              {project.name} · {project.contractor}
            </p>

            <div className="flex flex-col gap-1 mb-4">
              <label className="text-[10px] text-[#7a8299] uppercase tracking-[0.5px] font-['DM_Mono']">
                {lang === 'ml' ? 'തകരാർ വിവരണം' : 'Defect Description'}
              </label>
              <textarea
                className="bg-[#1e2535] border border-[rgba(255,255,255,0.13)] rounded-lg px-3 py-[9px] text-[#e8eaf0] font-['DM_Sans'] text-[13px] outline-none focus:border-[#ff4d4d] resize-vertical min-h-[100px] w-full"
                placeholder={
                  lang === 'ml'
                    ? 'നിങ്ങൾ കണ്ട തകരാർ വിവരിക്കുക...'
                    : 'Describe what you observed — cracks, leaks, broken components...'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={onClose}
                className="bg-[#1e2535] border border-[rgba(255,255,255,0.13)] text-[#7a8299] rounded-lg px-[18px] py-[11px] text-[13px] cursor-pointer"
              >
                {cancelLabel}
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !description.trim()}
                className="flex-1 bg-[rgba(255,77,77,0.12)] border border-[rgba(255,77,77,0.35)] text-[#ff4d4d] rounded-lg py-[11px] font-['Syne'] font-bold text-[13px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgba(255,77,77,0.2)]"
              >
                {saving ? (lang === 'ml' ? 'സേവ് ചെയ്യുന്നു...' : 'Saving…') : submitLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
