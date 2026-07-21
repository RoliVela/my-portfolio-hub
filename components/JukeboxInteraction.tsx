'use client';

import { useEffect, useRef, useState } from 'react';
import { getAssetPath } from '@/lib/assets';

export interface JukeboxTrack {
  title: string;
  src: string;
  isUserUpload?: boolean;
}

interface JukeboxInteractionProps {
  currentTrack: JukeboxTrack | null;
  isPlaying: boolean;
  onTrackSelect: (track: JukeboxTrack | null) => void;
  onTogglePlay: () => void;
}

interface JukeboxTrackSource {
  title: string;
  src: string;
}

const DEFAULT_TRACK: JukeboxTrackSource = {
  title: 'Default Audio',
  src: '/assets/bg-music.mp3',
};

const ROLIS_FAVORITES: JukeboxTrackSource[] = [
  {
    title: '[LOFI REMIX] PLAYBOI CARTI & LIL UZI VERT - SHOOTA',
    src: '/assets/jukebox/-lofi-remix-playboi-carti-&-lil-uzi-vert-shoota.mp3',
  },
  {
    title: 'Chief Keef - Love Sosa (lofi remix)',
    src: '/assets/jukebox/chief-keef-love-sosa-(lofi-remix).mp3',
  },
  {
    title: 'Gracie Abrams - 21 [Lofi remix]',
    src: '/assets/jukebox/gracie-abrams-21-lofi-remix.mp3',
  },
  {
    title: 'Taylor Swift - Love Story (Lofi Remix) ft. Lyn Lapid',
    src: '/assets/jukebox/taylor-swift-love-story-(lofi-remix)-ft.-lyn-lapid.mp3',
  },
];

export default function JukeboxInteraction({
  currentTrack,
  isPlaying,
  onTrackSelect,
  onTogglePlay,
}: JukeboxInteractionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userTrack, setUserTrack] = useState<JukeboxTrack | null>(null);

  useEffect(() => {
    return () => {
      if (userTrack?.isUserUpload) {
        URL.revokeObjectURL(userTrack.src);
      }
    };
  }, [userTrack]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newTrack: JukeboxTrack = {
      title: file.name.replace(/\.[^/.]+$/, ''),
      src: url,
      isUserUpload: true,
    };
    setUserTrack(newTrack);
    onTrackSelect(newTrack);
    e.target.value = '';
  };

  const handleSelect = (track: JukeboxTrackSource) => {
    onTrackSelect({ title: track.title, src: getAssetPath(track.src) });
  };

  const isCurrent = (track: JukeboxTrackSource) =>
    currentTrack?.title === track.title && currentTrack?.src === getAssetPath(track.src);

  const isDefaultCurrent = currentTrack?.title === DEFAULT_TRACK.title;
  const isUserCurrent = Boolean(userTrack && currentTrack?.title === userTrack.title);

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6 rounded-lg border-4 border-pink-300 bg-purple-950 p-6 shadow-[0_0_0_4px_#000]">
      <div className="text-center">
        <h2 className="font-vt323 text-3xl text-pink-200">Roli&apos;s Jukebox</h2>
        <p className="font-vt323 text-lg text-pink-100/80">
          {currentTrack ? `Now Playing: ${currentTrack.title}` : 'Select a track to start the music.'}
        </p>
      </div>

      <div className="flex w-full flex-col gap-4">
        {/* Default Audio */}
        <section className="w-full rounded-md bg-purple-900/60 p-4">
          <h3 className="mb-2 font-vt323 text-xl text-pink-200">Default Audio</h3>
          <button
            type="button"
            onClick={() => handleSelect(DEFAULT_TRACK)}
            className={`w-full rounded border-2 px-4 py-2 text-left font-vt323 text-lg transition ${
              isDefaultCurrent
                ? 'border-pink-300 bg-pink-300 text-purple-950'
                : 'border-pink-300/40 bg-purple-900 text-pink-100 hover:border-pink-300 hover:bg-purple-800'
            }`}
          >
            {DEFAULT_TRACK.title}
          </button>
        </section>

        {/* Roli's Favorites */}
        <section className="w-full rounded-md bg-purple-900/60 p-4">
          <h3 className="mb-2 font-vt323 text-xl text-pink-200">Roli&apos;s Favorites</h3>
          <div className="flex flex-col gap-2">
            {ROLIS_FAVORITES.map((track) => (
              <button
                key={track.src}
                type="button"
                onClick={() => handleSelect(track)}
                className={`w-full rounded border-2 px-4 py-2 text-left font-vt323 text-lg transition ${
                  isCurrent(track)
                    ? 'border-pink-300 bg-pink-300 text-purple-950'
                    : 'border-pink-300/40 bg-purple-900 text-pink-100 hover:border-pink-300 hover:bg-purple-800'
                }`}
              >
                {track.title}
              </button>
            ))}
          </div>
        </section>

        {/* Add your own */}
        <section className="w-full rounded-md bg-purple-900/60 p-4">
          <h3 className="mb-2 font-vt323 text-xl text-pink-200">Add Your Own</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded border-2 border-dashed border-pink-300/60 bg-purple-900 px-4 py-2 font-vt323 text-lg text-pink-100 transition hover:border-pink-300 hover:bg-purple-800"
          >
            {userTrack ? `Selected: ${userTrack.title}` : 'Upload an audio file'}
          </button>
          {userTrack && (
            <button
              type="button"
              onClick={() => handleSelect({ title: userTrack.title, src: userTrack.src })}
              className={`mt-2 w-full rounded border-2 px-4 py-2 text-left font-vt323 text-lg transition ${
                isUserCurrent
                  ? 'border-pink-300 bg-pink-300 text-purple-950'
                  : 'border-pink-300/40 bg-purple-900 text-pink-100 hover:border-pink-300 hover:bg-purple-800'
              }`}
            >
              {userTrack.title}
            </button>
          )}
        </section>
      </div>

      <button
        type="button"
        onClick={onTogglePlay}
        className="rounded border-2 border-pink-300 bg-pink-300 px-8 py-2 font-vt323 text-2xl text-purple-950 transition hover:bg-pink-200"
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}
