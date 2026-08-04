'use client';

/**
 * Small thematic icons used by the Venus Fly Trap mini-game's phase indicator.
 * Match the smooth-shape + dark-outline aesthetic used elsewhere in the game
 * (Cloud Climber, Bookshelf, etc.) so they sit visually consistent with the
 * pixel-art room rather than rendering as platform emoji.
 */

interface IconProps {
  className?: string;
}

export function DropletIcon({ className = '' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
    >
      {/* Drop body */}
      <path
        d="M 12 2 C 12 2 5 11 5 16 A 7 7 0 0 0 19 16 C 19 11 12 2 12 2 Z"
        fill="#38bdf8"
        stroke="#0c4a6e"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Inner highlight */}
      <ellipse cx="9" cy="14.5" rx="1.8" ry="3" fill="#bae6fd" />
      {/* Tiny secondary glint */}
      <circle cx="10.5" cy="11.5" r="0.8" fill="white" opacity="0.8" />
    </svg>
  );
}

export function FlyIcon({ className = '' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
    >
      {/* Wings (subtle flutter via opacity isn't needed at icon scale) */}
      <ellipse cx="7" cy="9" rx="5" ry="3" fill="#f1f5f9" stroke="#475569" strokeWidth="1" opacity="0.85" />
      <ellipse cx="17" cy="9" rx="5" ry="3" fill="#f1f5f9" stroke="#475569" strokeWidth="1" opacity="0.85" />
      {/* Body */}
      <ellipse cx="12" cy="14" rx="5" ry="3.6" fill="#374151" stroke="#1f2937" strokeWidth="1" />
      {/* Abdomen stripe */}
      <line x1="9.5" y1="15.2" x2="14.5" y2="15.2" stroke="#9ca3af" strokeWidth="0.6" opacity="0.6" />
      {/* Big red eyes */}
      <circle cx="10.2" cy="13" r="1.7" fill="#dc2626" />
      <circle cx="13.8" cy="13" r="1.7" fill="#dc2626" />
      <circle cx="10.6" cy="12.5" r="0.5" fill="white" />
      <circle cx="14.2" cy="12.5" r="0.5" fill="white" />
      {/* Antennae */}
      <line x1="10.5" y1="11.5" x2="9" y2="9.5" stroke="#9ca3af" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="13.5" y1="11.5" x2="15" y2="9.5" stroke="#9ca3af" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

export function SproutIcon({ className = '' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
    >
      {/* Soil mound */}
      <path
        d="M 3 19 L 3 21 L 21 21 L 21 19 C 21 18 18 16 12 16 C 6 16 3 18 3 19 Z"
        fill="#7c4a1f"
        stroke="#3d2b1f"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Soil specks */}
      <circle cx="7" cy="19.5" r="0.6" fill="#3d2b1f" />
      <circle cx="16" cy="20" r="0.6" fill="#3d2b1f" />
      {/* Stem */}
      <path d="M 12 17 L 12 9" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
      {/* Left leaf */}
      <path
        d="M 12 13 C 6 11 4 6 8 4 C 11 4 12 9 12 13 Z"
        fill="#22c55e"
        stroke="#15803d"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Left leaf vein */}
      <path d="M 9 6 L 11 11" stroke="#166534" strokeWidth="0.5" opacity="0.6" />
      {/* Right leaf */}
      <path
        d="M 12 11 C 18 9 20 4 16 2 C 13 2 12 7 12 11 Z"
        fill="#16a34a"
        stroke="#15803d"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M 15 4 L 13 9" stroke="#166534" strokeWidth="0.5" opacity="0.6" />
    </svg>
  );
}
