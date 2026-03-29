'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, isSupabaseLive } from '@/lib/supabase';
import { SEED_PROJECTS_WITH_IDS } from '@/lib/utils';

type Step = 1 | 2 | 3;

const TYPE_OPTIONS = ['Road', 'Drain', 'Street Light', 'Building', 'Bridge', 'Water Supply', 'Other'];
const STATUS_OPTIONS = [
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'planned', label: 'Planned' },
  { value: 'completed', label: 'Completed' },
  { value: 'defect', label: 'Defect Reported' },
];

export default function AddProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [type, setType] = useState('Road');
  const [status, setStatus] = useState('ongoing');
  const [ward, setWard] = useState('');
  const [contractor, setContractor] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('');

  function validateStep1() {
    if (!name.trim()) { setError('Project name is required'); return false; }
    if (!ward.trim()) { setError('Ward / area is required'); return false; }
    setError('');
    return true;
  }

  function validateStep2() {
    if (!contractor.trim()) { setError('Contractor name is required'); return false; }
    setError('');
    return true;
  }

  async function handleSubmit() {
    setSaving(true);
    setError('');

    const newProject = {
      name: name.trim(),
      type,
      status,
      ward: ward.trim(),
      contractor: contractor.trim(),
      budget: budget ? (budget.startsWith('₹') ? budget : '₹' + budget) : 'Not disclosed',
      start_date: startDate || null,
      end_date: endDate || null,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      notes: notes.trim() || 'Logged by citizen via NirmAI.',
      source: source.trim() || `Citizen report — NirmAI · ${new Date().toLocaleDateString('en-IN')}`,
      stages: JSON.stringify([
        { l: 'Logged on NirmAI by citizen', d: true, dt: new Date().toLocaleDateString('en-IN') },
      ]),
    };

    try {
      if (isSupabaseLive) {
        const { data, error: sbError } = await supabase
          .from('projects')
          .insert(newProject)
          .select()
          .single();

        if (sbError) throw sbError;
        router.push(`/project/${data.id}`);
      } else {
        // Local mode — assign a temp id
        const tempId = Date.now();
        router.push(`/?added=${tempId}`);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to save project. Please try again.');
      setSaving(false);
    }
  }

  const inputClass = 'bg-[#1e2535] border border-[rgba(255,255,255,0.13)] rounded-lg px-3 py-[9px] text-[#e8eaf0] font-["DM_Sans"] text-[13px] outline-none focus:border-[#00e5a0] w-full placeholder:text-[#7a8299]';
  const labelClass = 'text-[10px] text-[#7a8299] uppercase tracking-[0.5px] font-["DM_Mono"] mb-1 block';

  return (
    <div className="min-h-screen bg-[#0e1117] text-[#e8eaf0] flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-5 h-[54px] border-b border-[rgba(255,255,255,0.07)] bg-[#161b27]">
        <Link href="/" className="font-['Syne'] text-[20px] font-extrabold tracking-[-0.5px] text-[#e8eaf0] no-underline">
          Nirm<span className="text-[#00e5a0]">AI</span>
        </Link>
        <span className="text-[#7a8299] text-[13px]">/ Log a Project</span>
      </header>

      <div className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-[520px]">
          {/* Progress indicator */}
          <div className="flex gap-2 mb-6">
            {([1, 2, 3] as Step[]).map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-['DM_Mono'] font-medium flex-shrink-0 transition-all ${
                  step === s
                    ? 'bg-[#00e5a0] text-black'
                    : step > s
                    ? 'bg-[rgba(0,229,160,0.2)] text-[#00e5a0]'
                    : 'bg-[#1e2535] text-[#7a8299]'
                }`}>
                  {step > s ? '✓' : s}
                </div>
                <div className="text-[11px] text-[#7a8299] hidden sm:block">
                  {s === 1 ? 'Basic Info' : s === 2 ? 'Contractor' : 'Location & Source'}
                </div>
                {s < 3 && <div className="flex-1 h-[1px] bg-[rgba(255,255,255,0.07)]" />}
              </div>
            ))}
          </div>

          <div className="bg-[#161b27] border border-[rgba(255,255,255,0.13)] rounded-[14px] p-6">
            <h1 className="font-['Syne'] text-[18px] font-bold mb-5 text-[#e8eaf0]">
              {step === 1 ? 'Basic Information' : step === 2 ? 'Contractor Details' : 'Location & Source'}
            </h1>

            {/* Step 1 */}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelClass}>Project Name *</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Drain repair — Market road Ward 4"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Type</label>
                    <select
                      className={inputClass}
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      {TYPE_OPTIONS.map((t) => (
                        <option key={t} value={t} className="bg-[#1e2535]">{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <select
                      className={inputClass}
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value} className="bg-[#1e2535]">{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Ward / Area *</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Ward 7, Aluva"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelClass}>Contractor Name *</label>
                  <input
                    className={inputClass}
                    placeholder="Firm name or individual contractor"
                    value={contractor}
                    onChange={(e) => setContractor(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Budget (₹)</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. 4,50,000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Start Date</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Expected End</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelClass}>Location Coordinates</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.00001"
                      className={inputClass}
                      placeholder="Latitude e.g. 10.0544"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                    />
                    <input
                      type="number"
                      step="0.00001"
                      className={inputClass}
                      placeholder="Longitude e.g. 76.3200"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                    />
                  </div>
                  <div className="text-[10px] text-[#7a8299] mt-1 font-['DM_Mono']">
                    💡 Google Maps → long-press location → coordinates appear at top
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Notes</label>
                  <textarea
                    className={`${inputClass} resize-y min-h-[80px]`}
                    placeholder="What you observed, tender details, RTI findings..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Source of Information</label>
                  <input
                    className={inputClass}
                    placeholder="Tender notice, RTI, newspaper report, site inspection..."
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-3 text-[12px] text-[#ff4d4d] bg-[rgba(255,77,77,0.08)] border border-[rgba(255,77,77,0.25)] rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-2 mt-5">
              {step > 1 ? (
                <button
                  onClick={() => { setStep((s) => (s - 1) as Step); setError(''); }}
                  className="bg-[#1e2535] border border-[rgba(255,255,255,0.13)] text-[#7a8299] rounded-lg px-[18px] py-[11px] text-[13px] cursor-pointer hover:text-[#e8eaf0] transition-colors"
                >
                  ← Back
                </button>
              ) : (
                <Link
                  href="/"
                  className="bg-[#1e2535] border border-[rgba(255,255,255,0.13)] text-[#7a8299] rounded-lg px-[18px] py-[11px] text-[13px] cursor-pointer hover:text-[#e8eaf0] transition-colors no-underline"
                >
                  Cancel
                </Link>
              )}
              {step < 3 ? (
                <button
                  onClick={() => {
                    if (step === 1 && !validateStep1()) return;
                    if (step === 2 && !validateStep2()) return;
                    setStep((s) => (s + 1) as Step);
                  }}
                  className="flex-1 bg-[#00e5a0] text-black border-none rounded-lg py-[11px] font-['Syne'] font-bold text-[13px] cursor-pointer hover:opacity-85 transition-opacity"
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 bg-[#00e5a0] text-black border-none rounded-lg py-[11px] font-['Syne'] font-bold text-[13px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-85 transition-opacity"
                >
                  {saving ? 'Saving…' : 'Add Project'}
                </button>
              )}
            </div>
          </div>

          {/* Info box */}
          <div className="mt-4 text-[11px] text-[#7a8299] font-['DM_Mono'] text-center leading-[1.7]">
            All submissions are public. By submitting you confirm this is accurate information.
          </div>
        </div>
      </div>
    </div>
  );
}
