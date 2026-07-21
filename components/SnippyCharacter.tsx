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
}

export default function SnippyCharacter({
  data,
  style,
  onClick,
  onImageLoad,
  repositionMode,
  onPointerDown,
  onResizePointerDown,
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
