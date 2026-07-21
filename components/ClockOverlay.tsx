'use client';

import { useLiveTime } from '@/hooks/useLiveTime';

interface ClockOverlayProps {
  selectedTimezone: string;
}

export default function ClockOverlay({ selectedTimezone }: ClockOverlayProps) {
  const currentTime = useLiveTime();

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span
        className="font-vt323 text-lg font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:text-xl md:text-2xl"
        style={{
          // Match the clock display face's isometric angle.
          // Determined visually against public/assets/clock.png.
          transform: 'translate(-6%, 12%) rotate(18deg) skewX(5deg) skewY(-2deg)',
          transformOrigin: 'center center',
        }}
      >
        {currentTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: selectedTimezone,
        })}
      </span>
    </div>
  );
}
