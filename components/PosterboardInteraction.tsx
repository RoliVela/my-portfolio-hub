'use client';

import { useMemo, useRef, useState } from 'react';
import { getAssetPath } from '@/lib/assets';

interface PinnedImage {
  id: string;
  dataUrl: string;
  rotation: number;
  pinColor: string;
}

interface PosterboardInteractionProps {
  onComplete?: () => void;
}

interface PermanentPhoto {
  id: string;
  src: string;
  caption: string;
  pinColor: string;
  rotation: number;
}

const STORAGE_KEY = 'posterboard_images';

const PIN_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-400', 'bg-purple-500', 'bg-pink-500'];

const PERMANENT_PHOTOS: PermanentPhoto[] = [
  {
    id: 'permanent-sister-with-kermit',
    src: '/assets/corkboard/Sister with Kermit.jpg',
    caption: 'Sister with Kermit',
    pinColor: 'bg-blue-500',
    rotation: -2,
  },
  {
    id: 'permanent-website-brainstorm',
    src: '/assets/corkboard/Website Brainstorm.jpg',
    caption: 'Website Brainstorm',
    pinColor: 'bg-yellow-400',
    rotation: 1.5,
  },
  {
    id: 'permanent-curious-kermit',
    src: '/assets/corkboard/Curious Kermit.jpg',
    caption: 'Curious Kermit',
    pinColor: 'bg-red-500',
    rotation: -1,
  },
  {
    id: 'permanent-internship-2026',
    src: '/assets/corkboard/Internship 2026.jpg',
    caption: 'Internship 2026',
    pinColor: 'bg-green-500',
    rotation: 2,
  },
  {
    id: 'permanent-first-snow-at-nu',
    src: '/assets/corkboard/First snow at NU.jpg',
    caption: 'First snow at NU',
    pinColor: 'bg-purple-500',
    rotation: -1.5,
  },
  {
    id: 'permanent-music-festival',
    src: '/assets/corkboard/Music festival with friends.jpg',
    caption: 'Music festival with friends',
    pinColor: 'bg-pink-500',
    rotation: 1,
  },
];

function loadImages(): PinnedImage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === 'string' && typeof item.dataUrl === 'string');
  } catch {
    return [];
  }
}

function saveImages(images: PinnedImage[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
}

export default function PosterboardInteraction({ onComplete }: PosterboardInteractionProps) {
  const [images, setImages] = useState<PinnedImage[]>(() => loadImages());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const permanentPhotos = useMemo<PermanentPhoto[]>(() => PERMANENT_PHOTOS, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl !== 'string') return;
      const newImage: PinnedImage = {
        id: crypto.randomUUID(),
        dataUrl,
        rotation: (Math.random() - 0.5) * 12,
        pinColor: PIN_COLORS[Math.floor(Math.random() * PIN_COLORS.length)] ?? 'bg-red-500',
      };
      const next = [...images, newImage];
      setImages(next);
      saveImages(next);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemove = (id: string) => {
    const next = images.filter((img) => img.id !== id);
    setImages(next);
    saveImages(next);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex h-full w-full flex-col items-center gap-4">
      <div className="relative flex h-[60vh] min-h-[400px] w-full flex-wrap content-start items-start justify-center gap-6 overflow-y-auto rounded-md border-8 border-amber-900 bg-amber-700 p-6 shadow-inner">
        {permanentPhotos.map((img) => (
          <div
            key={img.id}
            className="group relative flex flex-col items-center bg-white p-2 pb-4 shadow-md transition-transform hover:z-10 hover:scale-105"
            style={{ transform: `rotate(${img.rotation}deg)` }}
          >
            {/* Pixel-art push pin */}
            <div
              className={`absolute -top-3 left-1/2 z-10 h-4 w-4 -translate-x-1/2 border-2 border-black ${img.pinColor} shadow-sm`}
              aria-hidden="true"
            />
            <div className="absolute -top-1 left-1/2 z-0 h-6 w-0.5 -translate-x-1/2 bg-neutral-800" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getAssetPath(img.src)}
              alt={img.caption}
              className="h-28 w-28 bg-amber-50 object-cover sm:h-32 sm:w-32"
            />
            <p className="mt-2 max-w-[8rem] truncate text-center font-vt323 text-sm text-amber-900">
              {img.caption}
            </p>
          </div>
        ))}
        {images.map((img) => (
          <div
            key={img.id}
            className="group relative flex flex-col items-center bg-white p-2 pb-4 shadow-md transition-transform hover:z-10 hover:scale-105"
            style={{ transform: `rotate(${img.rotation}deg)` }}
          >
            {/* Pixel-art push pin */}
            <div
              className={`absolute -top-3 left-1/2 z-10 h-4 w-4 -translate-x-1/2 border-2 border-black ${img.pinColor} shadow-sm`}
              aria-hidden="true"
            />
            <div className="absolute -top-1 left-1/2 z-0 h-6 w-0.5 -translate-x-1/2 bg-neutral-800" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.dataUrl}
              alt="Pinned polaroid"
              className="h-28 w-28 bg-amber-50 object-cover sm:h-32 sm:w-32"
            />
            <button
              type="button"
              onClick={() => handleRemove(img.id)}
              aria-label="Remove photo"
              className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 font-vt323 text-sm text-white opacity-0 shadow transition-opacity group-hover:opacity-100 hover:bg-red-500"
            >
              ✕
            </button>
          </div>
        ))}
        {images.length === 0 && permanentPhotos.length === 0 && (
          <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-2">
            <p className="font-vt323 text-2xl text-amber-900/60">The board is empty.</p>
            <p className="font-vt323 text-lg text-amber-900/50">Pin a photo to get started.</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={handleUploadClick}
          className="rounded border-2 border-white bg-white px-6 py-2 font-vt323 text-xl text-black transition hover:border-gray-200 hover:bg-gray-200"
        >
          Pin New Photo
        </button>
        <button
          type="button"
          onClick={onComplete}
          className="rounded border-2 border-white/50 bg-black px-6 py-2 font-vt323 text-xl text-white transition hover:border-white hover:bg-white/10"
        >
          Walk Away
        </button>
      </div>
    </div>
  );
}
