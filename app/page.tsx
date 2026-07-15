'use client';

import { useMemo, useState } from 'react';
import { roomObjects, RoomObject, DialogueEntry } from '@/lib/roomData';
import DialogueBox from '@/components/DialogueBox';
import SnippyCharacter from '@/components/SnippyCharacter';

type ObjectState = Record<string, Record<string, unknown>>;

function getInitialState(): ObjectState {
  return roomObjects.reduce((acc, obj) => {
    acc[obj.id] = { ...obj.initialState };
    return acc;
  }, {} as ObjectState);
}

export default function Home() {
  const snippy = useMemo(() => roomObjects.find((obj) => obj.id === 'OBJ_01') ?? null, []);
  const snippyCheckIn = useMemo(() => roomObjects.find((obj) => obj.id === 'OBJ_02') ?? null, []);

  const [objectState, setObjectState] = useState<ObjectState>(getInitialState);
  const [activeObject, setActiveObject] = useState<RoomObject | null>(snippy);
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);

  const handleObjectClick = (obj: RoomObject, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveObject(obj);

    setObjectState((prev) => {
      const next = { ...prev, [obj.id]: { ...prev[obj.id] } };
      next[obj.id].isInteracted = true;

      if (obj.toggleKey) {
        const current = next[obj.id][obj.toggleKey];
        next[obj.id][obj.toggleKey] = typeof current === 'boolean' ? !current : true;
      }

      return next;
    });
  };

  const handleSnippyClick = (e: React.MouseEvent) => {
    if (!snippyCheckIn) return;
    handleObjectClick(snippyCheckIn, e);
  };

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setClickCoords({ x, y });
  };

  const getDialogue = (obj: RoomObject): DialogueEntry[] => {
    const state = objectState[obj.id] ?? {};

    // Snippy check-in: thank-you variant when every other object has been interacted
    if (obj.id === 'OBJ_02') {
      const allOthersInteracted = roomObjects
        .filter((o) => o.id !== 'OBJ_01' && o.id !== 'OBJ_02')
        .every((o) => objectState[o.id]?.isInteracted === true);

      if (allOthersInteracted) {
        return [obj.dialogue.free[obj.dialogue.free.length - 1] ?? obj.dialogue.free[0]];
      }
      return [obj.dialogue.free[0]];
    }

    // Venus Fly Trap: post-feeding line after first interaction
    if (obj.id === 'OBJ_05' && state.isFed) {
      return [obj.dialogue.free[1] ?? obj.dialogue.free[0]];
    }

    // Window blinds: closed-view line after first toggle
    if (obj.id === 'OBJ_12' && state.isOpen === false) {
      return [obj.dialogue.free[1] ?? obj.dialogue.free[0]];
    }

    return obj.dialogue.free;
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Debug Coordinates Overlay */}
      {clickCoords && (
        <div className="absolute top-4 left-4 z-50 rounded-lg bg-black/70 p-2 text-sm text-white">
          X: {clickCoords.x.toFixed(2)}%, Y: {clickCoords.y.toFixed(2)}%
        </div>
      )}

      {/* Room Background */}
      <div
        className="absolute inset-0 z-0 h-full w-full"
        onClick={handleBackgroundClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/room_background_pixel_art_202607101242.png"
          alt="Cozy Lo-Fi Pixel Art Room Background"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Decorative desk item (White monster) */}
      <div
        className="pointer-events-none absolute z-10 aspect-[3/4] w-[6%]"
        style={{ left: '58%', top: '60%' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/white-monster.png"
          alt=""
          className="h-full w-full object-contain pixel-art drop-shadow-lg"
        />
      </div>

      {/* Interactive Objects Layer */}
      <div className="absolute inset-0 z-10">
        {roomObjects.map((obj) => {
          if (obj.id === 'OBJ_01') return null; // rendered separately as Snippy sprite

          const state = objectState[obj.id] ?? {};
          const isToggled = obj.toggleKey ? Boolean(state[obj.toggleKey]) : false;

          return (
            <button
              key={obj.id}
              type="button"
              onClick={(e) => handleObjectClick(obj, e)}
              className={`absolute cursor-pointer rounded-lg transition-all duration-200 hover:opacity-100 focus:outline-none ${
                obj.imageSrc
                  ? 'bg-transparent opacity-90 hover:opacity-100'
                  : `border-2 border-dashed ${
                      isToggled
                        ? 'border-yellow-300 bg-yellow-300/20 opacity-80'
                        : 'border-white/30 bg-white/10 opacity-40 hover:bg-white/20'
                    }`
              }`}
              style={{
                left: `${obj.position.x}%`,
                top: `${obj.position.y}%`,
                width: `${obj.position.width}%`,
                height: `${obj.position.height}%`,
              }}
              title={obj.assetName}
              aria-label={obj.assetName}
            >
              {obj.imageSrc ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={obj.imageSrc}
                    alt=""
                    className="h-full w-full object-contain pixel-art drop-shadow-lg"
                  />
                </>
              ) : (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-center text-[10px] leading-tight text-white/90 drop-shadow md:text-xs">
                  {obj.assetName}
                  <br />({obj.id})
                </span>
              )}
            </button>
          );
        })}

        {/* Snippy character sprite */}
        {snippy && <SnippyCharacter data={snippy} onClick={handleSnippyClick} />}
      </div>

      {/* Dialogue Box */}
      {activeObject && (
        <DialogueBox
          entries={getDialogue(activeObject)}
          onClose={() => setActiveObject(null)}
        />
      )}
    </main>
  );
}
