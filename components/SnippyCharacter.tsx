'use client';

interface SnippyCharacterProps {
  position: { x: number; y: number; width: number; height: number };
  onClick: () => void;
}

// Placeholder sprite (per user's own room-flow sketch: scissors with big
// round eyes). Swap for a real pixel-art asset in public/assets once ready.
export default function SnippyCharacter({ position, onClick }: SnippyCharacterProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Snippy"
      className="group absolute z-20 flex items-center justify-center rounded-full transition-transform duration-150 hover:scale-110"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${position.width}%`,
        height: `${position.height}%`,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full drop-shadow-[0_0_6px_rgba(255,255,255,0.25)] transition-all duration-150 group-hover:drop-shadow-[0_0_10px_rgba(255,224,102,0.85)]"
        aria-hidden="true"
      >
        <circle cx="35" cy="38" r="16" fill="#f5eaff" stroke="#e8c2ff" strokeWidth="3" />
        <circle cx="65" cy="38" r="16" fill="#f5eaff" stroke="#e8c2ff" strokeWidth="3" />
        <circle cx="35" cy="38" r="5.5" fill="#2a1a4a" />
        <circle cx="65" cy="38" r="5.5" fill="#2a1a4a" />
        <path d="M50 50 L22 88" stroke="#e8c2ff" strokeWidth="6" strokeLinecap="round" />
        <path d="M50 50 L78 88" stroke="#e8c2ff" strokeWidth="6" strokeLinecap="round" />
        <circle cx="18" cy="90" r="8" fill="none" stroke="#e8c2ff" strokeWidth="5" />
        <circle cx="82" cy="90" r="8" fill="none" stroke="#e8c2ff" strokeWidth="5" />
      </svg>
    </button>
  );
}
