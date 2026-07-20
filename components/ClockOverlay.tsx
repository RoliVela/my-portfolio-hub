'use client';

import { useLiveTime } from '@/hooks/useLiveTime';

interface ClockOverlayProps {
  selectedTimezone: string;
}

export default function ClockOverlay({ selectedTimezone }: ClockOverlayProps) {
  const currentTime = useLiveTime();

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="font-vt323 text-2xl font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] md:text-3xl">
        {currentTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: selectedTimezone,
        })}
      </span>
    </div>
  );
}
