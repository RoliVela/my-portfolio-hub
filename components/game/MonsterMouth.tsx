'use client';

export type JawShapePreset = 'fly-trap' | 'dragon' | 'blob';

export interface MonsterMouthProps {
  /** Shape preset for standard configurations. */
  preset?: JawShapePreset;
  /** Override the upper jaw className. */
  upperJawClass?: string;
  /** Override the lower jaw className. */
  lowerJawClass?: string;
  /** Override the belly className. */
  bellyClass?: string;
  /** Number of upper teeth. */
  upperTeethCount?: number;
  /** Number of lower teeth. */
  lowerTeethCount?: number;
  /** Tailwind class for the tooth color. */
  toothColorClass?: string;
  /** Tailwind class for the jaw background/border (e.g. 'bg-rose-700 border-pink-300'). */
  jawColorClass?: string;
  /** Tailwind class for the belly background (e.g. 'bg-rose-900/40'). */
  bellyBgColorClass?: string;
  /** Tailwind class for the water fill color. */
  waterColorClass?: string;
  /** Additional class names for the root wrapper. */
  className?: string;
  /** 0-100 water fill percentage for the belly. */
  waterPercent?: number;
  /** When true, show a wavy pulsing surface on top of the water. */
  showWaterSurface?: boolean;
  /** Number of caught items to render inside the belly. */
  caughtItems?: number;
  /** Number of nutrient specks to render inside the belly. */
  nutrientSpecks?: number;
  /** Icon or element rendered for each caught item. */
  itemIcon?: React.ReactNode;
}

interface PresetStyles {
  upper: string;
  lower: string;
  belly: string;
  upperTeeth: number;
  lowerTeeth: number;
}

const PRESET_STYLES: Record<JawShapePreset, PresetStyles> = {
  'fly-trap': {
    upper: '-top-4 left-1/2 h-20 w-44 -translate-x-1/2 rounded-t-full border-4',
    lower: '-bottom-4 left-1/2 h-24 w-44 -translate-x-1/2 rounded-b-full border-4',
    belly: 'inset-x-6 top-16 bottom-6 rounded-b-full',
    upperTeeth: 5,
    lowerTeeth: 5,
  },
  dragon: {
    upper: '-top-4 left-1/2 h-20 w-48 -translate-x-1/2 rounded-t-xl border-4',
    lower: '-bottom-2 left-1/2 h-24 w-44 -translate-x-1/2 rounded-b-xl border-4',
    belly: 'inset-x-4 top-16 bottom-6 rounded-b-xl',
    upperTeeth: 7,
    lowerTeeth: 6,
  },
  blob: {
    upper: '-top-4 left-1/2 h-24 w-48 -translate-x-1/2 rounded-[50%_50%_20%_20%] border-4',
    lower: '-bottom-4 left-1/2 h-28 w-44 -translate-x-1/2 rounded-[20%_20%_60%_60%] border-4',
    belly: 'inset-x-6 top-16 bottom-6 rounded-[20%_20%_50%_50%]',
    upperTeeth: 4,
    lowerTeeth: 3,
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function MonsterMouth({
  preset = 'fly-trap',
  upperJawClass,
  lowerJawClass,
  bellyClass,
  upperTeethCount,
  lowerTeethCount,
  toothColorClass = 'bg-pink-100',
  jawColorClass = 'bg-rose-700 border-pink-300',
  bellyBgColorClass = 'bg-rose-900/40',
  waterColorClass = 'bg-sky-400/70',
  className = '',
  waterPercent = 0,
  showWaterSurface = false,
  caughtItems = 0,
  nutrientSpecks = 0,
  itemIcon = '🐛',
}: MonsterMouthProps) {
  const styles = PRESET_STYLES[preset];
  const finalUpperJaw = upperJawClass ?? styles.upper;
  const finalLowerJaw = lowerJawClass ?? styles.lower;
  const finalBelly = bellyClass ?? styles.belly;
  const finalUpperTeeth = upperTeethCount ?? styles.upperTeeth;
  const finalLowerTeeth = lowerTeethCount ?? styles.lowerTeeth;
  const safeWaterPercent = clamp(waterPercent, 0, 100);

  return (
    <div className={`relative h-44 w-60 ${className}`}>
      {/* Back of the belly */}
      <div className={`absolute ${finalBelly} ${bellyBgColorClass}`} />

      {/* Water fill */}
      <div
        className={`absolute inset-x-8 bottom-7 rounded-b-full transition-all ${waterColorClass}`}
        style={{ height: `${safeWaterPercent}%` }}
      />

      {/* Belly contents: caught items + nutrient specks */}
      <div className={`pointer-events-none absolute ${finalBelly} overflow-hidden`}>
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
      {showWaterSurface && safeWaterPercent > 5 && (
        <div
          className="absolute left-8 right-8 rounded-full bg-sky-300/80"
          style={{ bottom: `calc(1.75rem + ${safeWaterPercent}% - 8px)`, height: '10px' }}
        >
          <div className="h-full w-full animate-pulse rounded-full" />
        </div>
      )}

      {/* Upper jaw */}
      <div className={`absolute ${finalUpperJaw} ${jawColorClass}`}>
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-3">
          {Array.from({ length: finalUpperTeeth }).map((_, i) => (
            <div
              key={i}
              className={`h-3 w-3 -rotate-45 transform ${toothColorClass}`}
              style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
            />
          ))}
        </div>
      </div>

      {/* Lower jaw */}
      <div className={`absolute ${finalLowerJaw} ${jawColorClass}`}>
        <div className="absolute top-2 left-0 right-0 flex justify-center gap-3">
          {Array.from({ length: finalLowerTeeth }).map((_, i) => (
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
