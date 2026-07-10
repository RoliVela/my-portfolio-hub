// app/page.tsx - Version: 2026-07-10 14:10:00 UTC
'use client';

import { roomObjects, type DialogueEntry } from '@/lib/roomData';
import { useEffect, useState } from 'react';
import DialogueBox from '@/components/DialogueBox';
import SnippyCharacter from '@/components/SnippyCharacter';

const SNIPPY_IDS = new Set(['OBJ_01', 'OBJ_02_SNIPPY_SCISSORS']);
const snippyIntro = roomObjects.find((obj) => obj.id === 'OBJ_01')!;
const snippyCheckIn = roomObjects.find((obj) => obj.id === 'OBJ_02_SNIPPY_SCISSORS')!;
const otherObjects = roomObjects.filter((obj) => !SNIPPY_IDS.has(obj.id));

export default function Home() {
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);
  const [interactedIds, setInteractedIds] = useState<Set<string>>(new Set());
  const [dialoguePages, setDialoguePages] = useState<DialogueEntry[] | null>(null);

  useEffect(() => {
    setDialoguePages(snippyIntro.dialogue.free);
  }, []);

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setClickCoords({ x, y });
  };

  const handleObjectClick = (objectId: string) => {
    setInteractedIds((prev) => new Set(prev).add(objectId));
  };

  const handleSnippyClick = () => {
    const allOthersInteracted = otherObjects.every((obj) => interactedIds.has(obj.id));
    const pages = allOthersInteracted
      ? snippyCheckIn.dialogue.freeComplete ?? snippyCheckIn.dialogue.free
      : snippyCheckIn.dialogue.free;
    setDialoguePages(pages);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Debug Coordinates Overlay */}
      {clickCoords && (
        <div className="absolute top-4 left-4 p-2 bg-black bg-opacity-70 text-white rounded-lg z-50 text-sm">
          X: {clickCoords.x.toFixed(2)}%, Y: {clickCoords.y.toFixed(2)}%
        </div>
      )}

      {/* Room Background */}
      <div className="absolute inset-0 z-0 w-screen h-screen" onClick={handleBackgroundClick}>
        <img
          src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/assets/room_background_pixel_art_202607101242.png`}
          alt="Cozy Lo-Fi Pixel Art Room Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Interactive Objects Layer (placeholders awaiting real assets) */}
      <div className="relative z-10 w-full h-full max-w-screen-xl max-h-screen-lg">
        {otherObjects.map((obj) => (
          <div
            key={obj.id}
            className="absolute cursor-pointer rounded-lg bg-blue-500 bg-opacity-30 hover:bg-opacity-50 transition-all duration-200"
            style={{
              left: `${obj.position.x}%`,
              top: `${obj.position.y}%`,
              width: `${obj.position.width}%`,
              height: `${obj.position.height}%`,
            }}
            onClick={() => handleObjectClick(obj.id)}
            title={obj.assetName}
          >
            <span className="absolute inset-0 flex items-center justify-center text-white text-xs opacity-70">
              {obj.assetName} ({obj.id})
            </span>
          </div>
        ))}
      </div>

      <SnippyCharacter position={snippyIntro.position} onClick={handleSnippyClick} />

      {dialoguePages && (
        <DialogueBox pages={dialoguePages} onClose={() => setDialoguePages(null)} />
      )}
    </main>
  );
}
