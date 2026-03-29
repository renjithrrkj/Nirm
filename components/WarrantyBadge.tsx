'use client';

import { getWarrantyStatus, daysRemainingInWarranty, monthsSince } from '@/lib/utils';

interface WarrantyBadgeProps {
  endDate: string | undefined;
  status: string;
  lang: 'en' | 'ml';
}

export default function WarrantyBadge({ endDate, status, lang }: WarrantyBadgeProps) {
  if (!endDate) return null;

  const warrantyStatus = getWarrantyStatus(endDate, status);

  if (warrantyStatus === 'unknown') return null;

  if (warrantyStatus === 'breach') {
    const remaining = daysRemainingInWarranty(endDate);
    return (
      <div className="col-span-2 bg-[rgba(255,77,77,0.08)] border border-[rgba(255,77,77,0.3)] rounded-lg p-[10px] px-3">
        <div className="text-[10px] text-[#7a8299] mb-1 uppercase tracking-[1px] font-['DM_Mono']">
          {lang === 'ml' ? 'വാറന്റി നില' : 'Warranty status'}
        </div>
        <div className="text-[13px] text-[#ff4d4d] font-medium">
          ⚠ {lang === 'ml'
            ? `വാറന്റി ലംഘനം — ${remaining} ദിവസം ശേഷിക്കുന്നു`
            : `Warranty breach — defect reported within 12 months. ${remaining} days remaining.`}
        </div>
      </div>
    );
  }

  if (warrantyStatus === 'active') {
    const remaining = daysRemainingInWarranty(endDate);
    return (
      <div className="col-span-2 bg-[rgba(255,184,0,0.06)] border border-[rgba(255,184,0,0.3)] rounded-lg p-[10px] px-3">
        <div className="text-[10px] text-[#7a8299] mb-1 uppercase tracking-[1px] font-['DM_Mono']">
          {lang === 'ml' ? 'വാറന്റി നില' : 'Warranty status'}
        </div>
        <div className="text-[13px] text-[#ffb800] font-medium">
          ⚠ {lang === 'ml'
            ? `വാറന്റിക്ക് ഉള്ളിൽ — ${remaining} ദിവസം ശേഷിക്കുന്നു. കരാറുകാരൻ ഉത്തരവാദി.`
            : `Within warranty — ${remaining} days remaining. Contractor liable for defects.`}
        </div>
      </div>
    );
  }

  if (warrantyStatus === 'expired') {
    const months = monthsSince(endDate);
    return (
      <div className="col-span-2 bg-[#161b27] border border-[rgba(255,255,255,0.07)] rounded-lg p-[10px] px-3">
        <div className="text-[10px] text-[#7a8299] mb-1 uppercase tracking-[1px] font-['DM_Mono']">
          {lang === 'ml' ? 'വാറന്റി നില' : 'Warranty status'}
        </div>
        <div className="text-[12px] text-[#7a8299]">
          {lang === 'ml'
            ? `വാറന്റി കഴിഞ്ഞു (${months} മാസം മുമ്പ്)`
            : `Warranty expired (${months} months post-completion)`}
        </div>
      </div>
    );
  }

  return null;
}
