'use client';

import { useLiveTime } from '@/hooks/useLiveTime';

const US_TIMEZONES = [
  { label: 'Eastern', value: 'America/New_York' },
  { label: 'Central', value: 'America/Chicago' },
  { label: 'Mountain', value: 'America/Denver' },
  { label: 'Pacific', value: 'America/Los_Angeles' },
  { label: 'Alaska', value: 'America/Anchorage' },
  { label: 'Hawaii', value: 'Pacific/Honolulu' },
];

interface ClockInteractionProps {
  selectedTimezone: string;
  onTimezoneChange: (timezone: string) => void;
}

export default function ClockInteraction({ selectedTimezone, onTimezoneChange }: ClockInteractionProps) {
  const currentTime = useLiveTime();

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="font-vt323 text-xl text-white/80">Select a timezone:</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {US_TIMEZONES.map((tz) => (
          <button
            key={tz.value}
            type="button"
            onClick={() => onTimezoneChange(tz.value)}
            className={`rounded border-2 px-3 py-2 font-vt323 text-lg transition ${
              selectedTimezone === tz.value
                ? 'border-white bg-white text-black'
                : 'border-white/50 bg-black text-white hover:border-white hover:bg-white/10'
            }`}
          >
            {tz.label}
          </button>
        ))}
      </div>
      <p className="font-vt323 text-lg text-white/60">
        Current: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: selectedTimezone })}
      </p>
    </div>
  );
}
