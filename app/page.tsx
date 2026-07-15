'use client';

import { useMemo, useRef, useState } from 'react';
import { roomObjects as initialRoomObjects, RoomObject, DialogueEntry } from '@/lib/roomData';
import { getAssetPath } from '@/lib/assets';
import DialogueBox from '@/components/DialogueBox';
import SnippyCharacter from '@/components/SnippyCharacter';

type ObjectState = Record<string, Record<string, unknown>>;

function getInitialState(): ObjectState {
  return initialRoomObjects.reduce((acc, obj) => {
    acc[obj.id] = { ...obj.initialState };
    return acc;
  }, {} as ObjectState);
}

export default function Home() {
  const [roomObjects, setRoomObjects] = useState<RoomObject[]>(initialRoomObjects);
  const [repositionMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has('reposition');
  });
  const [objectState, setObjectState] = useState<ObjectState>(getInitialState);
  const [activeObject, setActiveObject] = useState<RoomObject | null>(
    () => initialRoomObjects.find((obj) => obj.id === 'OBJ_01') ?? null
  );
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const snippy = useMemo(() => roomObjects.find((obj) => obj.id === 'OBJ_01') ?? null, [roomObjects]);
  const snippyCheckIn = useMemo(() => roomObjects.find((obj) => obj.id === 'OBJ_02') ?? null, [roomObjects]);

  const handleObjectClick = (obj: RoomObject, e: React.MouseEvent) => {
    if (repositionMode) return;
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
    if (repositionMode) return;
    if (!snippyCheckIn) return;
    handleObjectClick(snippyCheckIn, e);
  };

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setClickCoords({ x, y });
  };

  const updatePosition = (id: string, key: keyof RoomObject['position'], value: number) => {
    setRoomObjects((prev) =>
      prev.map((obj) =>
        obj.id === id
          ? { ...obj, position: { ...obj.position, [key]: value } }
          : obj
      )
    );
  };

  const copyRoomData = () => {
    const lines = roomObjects.map(
      (obj) => `    // ${obj.id} - ${obj.assetName}\n    position: { x: ${obj.position.x}, y: ${obj.position.y}, width: ${obj.position.width}, height: ${obj.position.height} },`
    );
    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
    // eslint-disable-next-line no-console
    console.log('REPOSITION_DATA_START\n' + text + '\nREPOSITION_DATA_END');
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const getDialogue = (obj: RoomObject): DialogueEntry[] => {
    const state = objectState[obj.id] ?? {};

    if (obj.id === 'OBJ_02') {
      const allOthersInteracted = roomObjects
        .filter((o) => o.id !== 'OBJ_01' && o.id !== 'OBJ_02')
        .every((o) => objectState[o.id]?.isInteracted === true);

      if (allOthersInteracted) {
        return [obj.dialogue.free[obj.dialogue.free.length - 1] ?? obj.dialogue.free[0]];
      }
      return [obj.dialogue.free[0]];
    }

    if (obj.id === 'OBJ_05' && state.isFed) {
      return [obj.dialogue.free[1] ?? obj.dialogue.free[0]];
    }

    if (obj.id === 'OBJ_12' && state.isOpen === false) {
      return [obj.dialogue.free[1] ?? obj.dialogue.free[0]];
    }

    return obj.dialogue.free;
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      {clickCoords && (
        <div className="absolute top-4 left-4 z-50 rounded-lg bg-black/70 p-2 text-sm text-white">
          X: {clickCoords.x.toFixed(2)}%, Y: {clickCoords.y.toFixed(2)}%
        </div>
      )}

      <div
        className="absolute inset-0 z-0 h-full w-full"
        onClick={handleBackgroundClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getAssetPath('/assets/room_background_pixel_art_202607101242.png')}
          alt="Cozy Lo-Fi Pixel Art Room Background"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Decorative desk item (White monster) */}
      <div
        className="pointer-events-none absolute z-10 aspect-[3/4] w-[5%]"
        style={{ left: '60%', top: '56%' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getAssetPath('/assets/white-monster.png')}
          alt=""
          className="h-full w-full object-contain pixel-art drop-shadow-lg"
        />
      </div>

      {/* Interactive Objects Layer */}
      <div className="absolute inset-0 z-10">
        {roomObjects.map((obj) => {
          if (obj.id === 'OBJ_01') return null;

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
                    src={getAssetPath(obj.imageSrc)}
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

        {snippy && <SnippyCharacter data={snippy} onClick={handleSnippyClick} />}
      </div>

      {activeObject && !repositionMode && (
        <DialogueBox
          entries={getDialogue(activeObject)}
          onClose={() => setActiveObject(null)}
        />
      )}

      {repositionMode && (
        <div className="fixed top-0 right-0 z-50 h-full w-80 overflow-y-auto bg-black/90 p-4 text-white">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Reposition Mode</h2>
            <button
              type="button"
              onClick={copyRoomData}
              aria-label="Copy position data to clipboard"
              className="rounded bg-blue-600 px-3 py-1 text-sm hover:bg-blue-500"
            >
              {copied ? 'Copied!' : 'Copy Data'}
            </button>
          </div>
          <p className="mb-4 text-xs text-gray-400">
            Edit x/y/width/height below. Click background to see coordinates.
          </p>
          {roomObjects.map((obj) => (
            <div key={obj.id} className="mb-3 rounded bg-white/10 p-2">
              <p className="mb-1 text-xs font-semibold">{obj.assetName}</p>
              <div className="grid grid-cols-2 gap-2">
                {(['x', 'y', 'width', 'height'] as const).map((key) => (
                  <label key={key} className="text-xs">
                    {key}
                    <input
                      type="number"
                      step="0.1"
                      value={obj.position[key]}
                      onChange={(e) =>
                        updatePosition(obj.id, key, parseFloat(e.target.value) || 0)
                      }
                      className="mt-1 w-full rounded bg-white/20 px-1 py-0.5 text-xs text-white"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
