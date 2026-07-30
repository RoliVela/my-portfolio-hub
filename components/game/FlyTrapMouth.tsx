'use client';

export interface FlyTrapMouthProps {
  /** 0-100 water fill percentage for the belly. */
  waterPercent: number;
  /** When true, show a wavy pulsing surface on top of the water. */
  showWaterSurface?: boolean;
  /** Number of caught items to render inside the belly. */
  caughtItems?: number;
  /** Number of nutrient specks to render inside the belly. */
  nutrientSpecks?: number;
  /** Tailwind class for the water fill color. */
  waterColorClass?: string;
  /** Tailwind class for the jaw/belly shell color. */
  jawColorClass?: string;
  /** Tailwind class for the tooth color. */
  toothColorClass?: string;
  /** Icon or element rendered for each caught item. */
  itemIcon?: React.ReactNode;
  /** Additional class names for the root wrapper. */
  className?: string;
}

export default function FlyTrapMouth({
  waterPercent,
  showWaterSurface = false,
  caughtItems = 0,
  nutrientSpecks = 0,
  waterColorClass = 'bg-sky-400/70',
  jawColorClass = 'bg-rose-700',
  toothColorClass = 'bg-pink-100',
  itemIcon = '🐛',
  className = '',
}: FlyTrapMouthProps) {
  return (
    <div className={`relative h-44 w-60 ${className}`}>
      {/* Back of the trap belly */}
      <div className="absolute inset-x-6 top-16 bottom-6 rounded-b-full bg-rose-900/40" />
      {/* Water fill */}
      <div
        className={`absolute inset-x-8 bottom-7 rounded-b-full transition-all ${waterColorClass}`}
        style={{ height: `${clamp(waterPercent, 0, 100)}%` }}
      />
      {/* Belly contents: caught items + nutrient specks */}
      <div className="pointer-events-none absolute inset-x-8 bottom-7 top-16 overflow-hidden rounded-b-full">
        {Array.from({ length: caughtItems }).map((_, i) => (
          <div
            key={`item-${i}`}
            className="absolute text-lime-300"
            style={{
              left: `${10 + ((i * 17) % 80)}%`,
              bottom: `${5 + ((i * 11) % 50)}%`,
              transform: 'scale(0.6)',
            }}
          >
            {itemIcon}
          </div>
        ))}
        {Array.from({ length: nutrientSpecks }).map((_, i) => (
          <div
            key={`speck-${i}`}
            className="absolute h-1.5 w-1.5 rounded-full bg-amber-300"
            style={{
              left: `${15 + ((i * 13) % 70)}%`,
              bottom: `${10 + ((i * 9) % 55)}%`,
            }}
          />
        ))}
      </div>
      {/* Wavy water surface */}
      {showWaterSurface && waterPercent > 5 && (
        <div
          className="absolute left-8 right-8 rounded-full bg-sky-300/80"
          style={{ bottom: `calc(1.75rem + ${waterPercent}% - 8px)`, height: '10px' }}
        >
          <div className="h-full w-full animate-pulse rounded-full" />
        </div>
      )}
      {/* Upper jaw */}
      <div
        className={`absolute -top-4 left-1/2 h-20 w-44 -translate-x-1/2 rounded-t-full border-4 border-pink-300 ${jawColorClass}`}
      >
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-3 w-3 -rotate-45 transform ${toothColorClass}`}
              style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
            />
          ))}
        </div>
      </div>
      {/* Lower jaw */}
      <div
        className={`absolute -bottom-4 left-1/2 h-24 w-44 -translate-x-1/2 rounded-b-full border-4 border-pink-300 ${jawColorClass}`}
      >
        <div className="absolute top-2 left-0 right-0 flex justify-center gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-3 w-3 rotate-[135deg] transform ${toothColorClass}`}
              style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
