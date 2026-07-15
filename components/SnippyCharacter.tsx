'use client';

import { RoomObject } from '@/lib/roomData';

interface SnippyCharacterProps {
  data: RoomObject;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function SnippyCharacter({ data, onClick }: SnippyCharacterProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute z-20 cursor-pointer transition-transform duration-200 hover:scale-105 focus:outline-none"
      style={{
        left: `${data.position.x}%`,
        top: `${data.position.y}%`,
        width: `${data.position.width}%`,
        height: `${data.position.height}%`,
      }}
      aria-label={data.assetName}
      title={data.assetName}
    >
      {data.imageSrc ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.imageSrc}
            alt=""
            className="h-full w-full object-contain drop-shadow-lg pixel-art"
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
    </button>
  );
}
