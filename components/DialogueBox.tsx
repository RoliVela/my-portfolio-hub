'use client';

import { useEffect, useRef, useState } from 'react';
import { DialogueEntry } from '@/lib/roomData';
import { getAssetPath } from '@/lib/assets';
import { registerDialogueAudio, playDialogue } from '@/lib/audioManager';

interface DialogueBoxProps {
  entries: DialogueEntry[];
  onClose?: () => void;
}

const TYPEWRITER_SPEED_MS = 30;

function TypewriterText({ text, onFinish }: { text: string; onFinish?: () => void }) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(getAssetPath('/assets/snippy-talk.mp3'));
    audio.loop = true;
    audio.volume = 0.18;
    audioRef.current = audio;
    registerDialogueAudio(audio);

    playDialogue();

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
      registerDialogueAudio(null);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedLength((prev) => {
        if (prev >= text.length) {
          clearInterval(interval);
          setIsFinished(true);
          onFinish?.();
          audioRef.current?.pause();
          if (audioRef.current) audioRef.current.currentTime = 0;
          return prev;
        }
        return prev + 1;
      });
    }, TYPEWRITER_SPEED_MS);

    return () => clearInterval(interval);
  }, [text, onFinish]);

  const displayedText = text.slice(0, displayedLength);

  return (
    <>
      <p className="font-vt323 text-2xl leading-relaxed text-white md:text-3xl">
        {displayedText}
        {!isFinished && <span className="ml-1 animate-pulse">▮</span>}
      </p>
      {isFinished && (
        <div className="mt-2 text-right text-sm text-white/70 font-vt323">
          Click to continue
        </div>
      )}
    </>
  );
}

export default function DialogueBox({ entries, onClose }: DialogueBoxProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const currentEntry = entries[pageIndex];
  const fullText = currentEntry?.text ?? '';

  const handleClick = () => {
    if (pageIndex < entries.length - 1) {
      setPageIndex((prev) => prev + 1);
    } else {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-center p-4"
      onClick={handleClick}
      role="button"
      aria-label="Dialogue box"
    >
      <div className="relative w-full max-w-4xl cursor-pointer select-none rounded-lg border-4 border-white bg-black p-6 shadow-[0_0_0_4px_#000]">
        {/* Speaker name tag */}
        <div className="absolute -top-5 left-4 rounded bg-white px-3 py-1 text-lg text-black font-vt323">
          {currentEntry?.speaker}
        </div>

        {/* Dialogue text - key remounts TypewriterText on page change */}
        <TypewriterText key={pageIndex} text={fullText} />
      </div>
    </div>
  );
}
