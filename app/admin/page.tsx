'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Project } from '@/lib/types';
import { supabase, isSupabaseLive } from '@/lib/supabase';
import { normalizeProject, SEED_PROJECTS_WITH_IDS, STATUS_LABELS, TYPE_EMOJI } from '@/lib/utils';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'nirmai-admin';

interface ScrapeRun {
  id: number;
  run_at: string;
  scrapers: string[];
  results: Record<string, number | string>;
  dry_run: boolean;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [bulkPreview, setBulkPreview] = useState<Partial<Project>[]>([]);
  const [scrapeRuns, setScrapeRuns] = useState<ScrapeRun[]>([]);

  useEffect(() => {
    if (authed) {
      loadProjects();
      loadScrapeRuns();
    }
  }, [authed]);

  async function loadScrapeRuns() {
    if (!isSupabaseLive) return;
    const { data } = await supabase!
      .from('scrape_runs')
      .select('*')
      .order('run_at', { ascending: false })
      .limit(5);
    setScrapeRuns(data || []);
  }

  async function loadProjects() {
    setLoading(true);
    if (!isSupabaseLive) {
      setProjects(SEED_PROJECTS_WITH_IDS);
      setLoading(false);
      return;
    }
    const { data } = await supabase!.from('projects').select('*').order('created_at', { ascending: false });
    setProjects((data || []).map(normalizeProject));
    setLoading(false);
  }

  async function toggleVerified(p: Project) {
    const updated = { ...p, verified: !p.verified };
    setProjects((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
    if (isSupabaseLive) {
      await supabase!.from('projects').update({ verified: !p.verified }).eq('id', p.id);
    }
  }

  async function deleteProject(id: number) {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (isSupabaseLive) {
      await supabase!.from('projects').delete().eq('id', id);
    }
    setMessage('Project deleted.');
  }

  function parseBulk() {
    try {
      const parsed = JSON.parse(bulkInput);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      setBulkPreview(arr);
    } catch {
      // Try CSV
      const lines = bulkInput.trim().split('\n');
      const headers = lines[0].split(',').map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(',');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = vals[i]?.trim() || ''; });
        return obj;
      });
      setBulkPreview(rows);
    }
  }

  async function importBulk() {
    if (!bulkPreview.length) return;
    setMessage(`Importing ${bulkPreview.length} projects…`);

    if (isSupabaseLive) {
      const { error } = await supabase!.from('projects').insert(
        bulkPreview.map((p) => ({
          ...p,
          stages: typeof p.stages === 'string' ? p.stages : JSON.stringify(p.stages || []),
        }))
      );
      if (error) {
        setMessage('Import failed: ' + error.message);
        return;
      }
    }

    setMessage(`✓ Imported ${bulkPreview.length} projects`);
    setBulkPreview([]);
    setBulkInput('');
    loadProjects();
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0e1117] text-[#e8eaf0] flex items-center justify-center">
        <div className="bg-[#161b27] border border-[rgba(255,255,255,0.13)] rounded-[14px] p-8 w-[360px]">
          <div className="font-['Syne'] text-[24px] font-extrabold mb-1">
            Nirm<span className="text-[#00e5a0]">AI</span>
          </div>
          <div className="text-[#7a8299] text-[13px] mb-6">Admin access</div>
          <div className="flex flex-col gap-3">
            <input
              type="password"
              className="bg-[#1e2535] border border-[rgba(255,255,255,0.13)] rounded-lg px-3 py-[9px] text-[#e8eaf0] text-[13px] outline-none focus:border-[#00e5a0] w-full placeholder:text-[#7a8299]"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            {authError && <div className="text-[12px] text-[#ff4d4d]">{authError}</div>}
            <button
              onClick={handleLogin}
              className="bg-[#00e5a0] text-black rounded-lg py-[10px] font-['Syne'] font-bold text-[13px] cursor-pointer hover:opacity-85"
            >
              Login
            </button>
            <Link href="/" className="text-center text-[12px] text-[#7a8299] hover:text-[#e8eaf0] no-underline">
              ← Back to app
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
    } else {
      setAuthError('Incorrect password');
    }
  }

  return (
    <div className="min-h-screen bg-[#0e1117] text-[#e8eaf0]">
      {/* Header */}
      <header className="flex items-center gap-4 px-5 h-[54px] border-b border-[rgba(255,255,255,0.07)] bg-[#161b27]">
        <Link href="/" className="font-['Syne'] text-[20px] font-extrabold tracking-[-0.5px] text-[#e8eaf0] no-underline">
          Nirm<span className="text-[#00e5a0]">AI</span>
        </Link>
        <span className="text-[#7a8299] text-[13px]">/ Admin</span>
        <span className="ml-auto text-[10px] font-['DM_Mono'] text-[#7a8299]">
          {projects.length} projects
        </span>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        {message && (
          <div className="mb-4 bg-[rgba(0,229,160,0.08)] border border-[rgba(0,229,160,0.25)] rounded-lg px-4 py-3 text-[12px] text-[#00e5a0] font-['DM_Mono']">
            {message}
          </div>
        )}

        {/* Scrape run history */}
        {isSupabaseLive && (
          <div className="bg-[#161b27] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-5 mb-6">
            <h2 className="font-['Syne'] text-[16px] font-bold mb-3">Scraper Status</h2>
            {scrapeRuns.length === 0 ? (
              <div className="text-[12px] text-[#7a8299] font-['DM_Mono']">
                No scrape runs recorded yet. Trigger the GitHub Actions workflow to populate.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {scrapeRuns.map((run) => {
                  const errors = Object.keys(run.results || {}).filter((k) => k.endsWith('_error'));
                  const hasErrors = errors.length > 0;
                  return (
                    <div
                      key={run.id}
                      className={`rounded-lg border px-4 py-3 ${
                        hasErrors
                          ? 'bg-[rgba(255,77,77,0.06)] border-[rgba(255,77,77,0.2)]'
                          : 'bg-[#1e2535] border-[rgba(255,255,255,0.07)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px]">{hasErrors ? '❌' : '✅'}</span>
                          <span className="text-[12px] font-['DM_Mono'] text-[#e8eaf0]">
                            {new Date(run.run_at).toLocaleString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                          {run.dry_run && (
                            <span className="text-[10px] font-['DM_Mono'] bg-[rgba(0,153,255,0.12)] text-[#0099ff] px-2 py-[1px] rounded-full">
                              dry run
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 text-[11px] font-['DM_Mono'] text-[#7a8299]">
                          {(run.scrapers || []).map((s) => (
                            <span key={s}>
                              {s}: <span className="text-[#e8eaf0]">{run.results?.[s] ?? '—'}</span>
                            </span>
                          ))}
                          <span>
                            saved: <span className="text-[#00e5a0]">{run.results?.total_saved ?? '—'}</span>
                          </span>
                        </div>
                      </div>
                      {hasErrors && (
                        <div className="mt-2 text-[11px] font-['DM_Mono'] text-[#ff4d4d]">
                          {errors.map((k) => (
                            <div key={k}>{k.replace('_error', '')}: {String(run.results[k])}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Bulk import */}
        <div className="bg-[#161b27] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-5 mb-6">
          <h2 className="font-['Syne'] text-[16px] font-bold mb-3">Bulk Import</h2>
          <textarea
            className="w-full bg-[#1e2535] border border-[rgba(255,255,255,0.13)] rounded-lg px-3 py-2 text-[#e8eaf0] text-[12px] font-['DM_Mono'] outline-none focus:border-[#00e5a0] resize-y min-h-[100px]"
            placeholder='Paste JSON array or CSV with headers. E.g. [{"name":"...","contractor":"...","ward":"..."}]'
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={parseBulk}
              className="bg-[#1e2535] border border-[rgba(255,255,255,0.13)] text-[#7a8299] rounded-lg px-4 py-[8px] text-[12px] cursor-pointer hover:text-[#e8eaf0]"
            >
              Preview ({bulkPreview.length})
            </button>
            {bulkPreview.length > 0 && (
              <button
                onClick={importBulk}
                className="bg-[#00e5a0] text-black rounded-lg px-4 py-[8px] font-['Syne'] font-bold text-[12px] cursor-pointer hover:opacity-85"
              >
                Import {bulkPreview.length} projects
              </button>
            )}
          </div>
        </div>

        {/* Projects table */}
        {loading ? (
          <div className="text-center text-[#7a8299] py-12 font-['DM_Mono'] text-[12px]">Loading…</div>
        ) : (
          <div className="bg-[#161b27] border border-[rgba(255,255,255,0.07)] rounded-[14px] overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.07)]">
                  <th className="text-left text-[10px] font-['DM_Mono'] uppercase tracking-[0.5px] text-[#7a8299] px-4 py-3">Project</th>
                  <th className="text-left text-[10px] font-['DM_Mono'] uppercase tracking-[0.5px] text-[#7a8299] px-4 py-3 hidden md:table-cell">Contractor</th>
                  <th className="text-left text-[10px] font-['DM_Mono'] uppercase tracking-[0.5px] text-[#7a8299] px-4 py-3 hidden sm:table-cell">Status</th>
                  <th className="text-right text-[10px] font-['DM_Mono'] uppercase tracking-[0.5px] text-[#7a8299] px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[#1e2535] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-medium text-[#e8eaf0]">
                        {TYPE_EMOJI[p.type] || '📍'} {p.name}
                      </div>
                      <div className="text-[11px] text-[#7a8299] mt-[2px]">{p.ward}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="text-[12px] text-[#e8eaf0]">{p.contractor}</div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-[10px] font-['DM_Mono'] px-2 py-[2px] rounded-[20px] ${
                        p.status === 'defect' ? 'bg-[rgba(255,77,77,0.15)] text-[#ff4d4d]' :
                        p.status === 'completed' ? 'bg-[rgba(0,229,160,0.12)] text-[#00e5a0]' :
                        p.status === 'ongoing' ? 'bg-[rgba(255,184,0,0.15)] text-[#ffb800]' :
                        'bg-[rgba(0,153,255,0.12)] text-[#0099ff]'
                      }`}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => toggleVerified(p)}
                          className={`text-[11px] font-['DM_Mono'] px-3 py-[5px] rounded-lg border cursor-pointer transition-all ${
                            p.verified
                              ? 'border-[#00e5a0] text-[#00e5a0] bg-[rgba(0,229,160,0.08)]'
                              : 'border-[rgba(255,255,255,0.13)] text-[#7a8299]'
                          }`}
                          title={p.verified ? 'Mark unverified' : 'Mark verified'}
                        >
                          {p.verified ? '✓ Verified' : 'Verify'}
                        </button>
                        <button
                          onClick={() => deleteProject(p.id)}
                          className="text-[11px] font-['DM_Mono'] px-3 py-[5px] rounded-lg border border-[rgba(255,77,77,0.25)] text-[#ff4d4d] cursor-pointer hover:bg-[rgba(255,77,77,0.08)] transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
