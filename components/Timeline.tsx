'use client';

import { Stage } from '@/lib/types';

interface TimelineProps {
  stages: Stage[];
}

export default function Timeline({ stages }: TimelineProps) {
  if (!stages || stages.length === 0) {
    return (
      <div className="text-[#7a8299] text-[12px]">No stages logged yet.</div>
    );
  }

  const lastDoneIndex = stages.reduce((acc, s, i) => (s.d ? i : acc), -1);
  const allDone = stages.every((s) => s.d);

  return (
    <div className="flex flex-col">
      {stages.map((s, i) => {
        const isLast = i === stages.length - 1;

        let dotClass = '';
        if (s.d) {
          if (i === lastDoneIndex && !allDone) {
            // Active (in progress)
            dotClass = 'w-[10px] h-[10px] rounded-full mt-[2px] bg-[#ffb800] shadow-[0_0_0_3px_rgba(255,184,0,0.25)]';
          } else {
            dotClass = 'w-[10px] h-[10px] rounded-full mt-[2px] bg-[#00e5a0]';
          }
        } else {
          dotClass = 'w-[10px] h-[10px] rounded-full mt-[2px] bg-transparent border-[1.5px] border-[#4a5568]';
        }

        return (
          <div key={i} className="flex gap-[10px]">
            {/* Dot + line */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={dotClass} />
              {!isLast && (
                <div className="w-[1px] bg-[rgba(255,255,255,0.07)] flex-1 my-[3px] min-h-[14px]" />
              )}
            </div>
            {/* Text */}
            <div className="text-[12px] text-[#7a8299] pb-4 leading-[1.6]">
              <b className="text-[#e8eaf0] font-medium block mb-[1px]">{s.l}</b>
              {s.dt}
            </div>
          </div>
        );
      })}
    </div>
  );
}
