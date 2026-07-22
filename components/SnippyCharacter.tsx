'use client';

import { RoomObject } from '@/lib/roomData';
import { getAssetPath } from '@/lib/assets';

interface SnippyCharacterProps {
  data: RoomObject;
  style: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onImageLoad?: (naturalWidth: number, naturalHeight: number) => void;
  repositionMode?: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onResizePointerDown?: (e: React.PointerEvent<HTMLSpanElement>) => void;
  isMuted?: boolean;
}

export default function SnippyCharacter({
  data,
  style,
  onClick,
  onImageLoad,
  repositionMode,
  onPointerDown,
  onResizePointerDown,
  isMuted,
}: SnippyCharacterProps) {
  // Cached images never re-fire `onLoad`, so a ref callback (checked on every
  // render) covers repeat loads; onLoad still covers a true first load.
  const captureMeta = (img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth && img.naturalHeight) {
      onImageLoad?.(img.naturalWidth, img.naturalHeight);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      className={`absolute z-20 transition-transform duration-200 focus:outline-none ${
        repositionMode
          ? 'cursor-move border border-dashed border-white/50 bg-white/10 hover:bg-white/20'
          : 'cursor-pointer rounded-lg hover:scale-105 hover:drop-shadow-[0_0_8px_rgba(253,224,71,0.6)]'
      }`}
      style={style}
      aria-label={data.assetName}
      title={data.assetName}
    >
      {data.imageSrc ? (
        <>
          {isMuted && (
            <div className="pointer-events-none absolute -top-2 -right-2 z-10 rounded-full bg-black/80 p-1 text-white shadow-[0_0_0_2px_#fff]" aria-label="Audio muted">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M14 3.23v17.54c0 .8-.88 1.28-1.55.84L6.5 16.5H3.75A1.75 1.75 0 0 1 2 14.75v-5.5C2 8.25 2.78 7.5 3.75 7.5H6.5l5.95-4.61c.67-.44 1.55.04 1.55.84Z" />
                <path d="M18.78 5.22a.75.75 0 0 0-1.06 1.06L19.94 8.5l-2.22 2.22a.75.75 0 1 0 1.06 1.06l2.22-2.22 2.22 2.22a.75.75 0 1 0 1.06-1.06L21.06 7.44l2.22-2.22a.75.75 0 0 0-1.06-1.06L20 6.38l-2.22-2.22Z" />
              </svg>
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getAssetPath(data.imageSrc)}
            alt=""
            className="h-full w-full object-contain drop-shadow-lg pixel-art"
            ref={captureMeta}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight) onImageLoad?.(img.naturalWidth, img.naturalHeight);
            }}
          />
        </>
      ) : (
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full drop-shadow-lg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Scissors body */}
          <path
            d="M30 70 L70 30"
            stroke="#C0C0C0"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M30 30 L70 70"
            stroke="#C0C0C0"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Finger holes */}
          <circle cx="22" cy="22" r="10" stroke="#A0A0A0" strokeWidth="4" fill="none" />
          <circle cx="78" cy="78" r="10" stroke="#A0A0A0" strokeWidth="4" fill="none" />
          {/* Big round eyes */}
          <circle cx="55" cy="45" r="12" fill="white" stroke="#333" strokeWidth="2" />
          <circle cx="45" cy="55" r="12" fill="white" stroke="#333" strokeWidth="2" />
          <circle cx="55" cy="45" r="4" fill="#111" />
          <circle cx="45" cy="55" r="4" fill="#111" />
        </svg>
      )}

      {repositionMode && (
        <span
          role="button"
          aria-label={`Resize ${data.assetName}`}
          tabIndex={0}
          onPointerDown={onResizePointerDown}
          className="absolute -bottom-1 -right-1 z-20 h-3 w-3 cursor-nwse-resize rounded-sm bg-yellow-400 hover:bg-yellow-300"
          style={{ transform: 'translate(50%, 50%)' }}
        />
      )}
    </button>
  );
}
