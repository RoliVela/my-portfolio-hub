'use client';

import { useEffect, useState } from 'react';
import type { DialogueEntry } from '@/lib/roomData';

interface DialogueBoxProps {
  pages: DialogueEntry[];
  onClose: () => void;
}

const TYPE_SPEED_MS = 18;

export default function DialogueBox({ pages, onClose }: DialogueBoxProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [visibleChars, setVisibleChars] = useState(0);

  const currentPage = pages[pageIndex];
  const fullText = currentPage?.text ?? '';
  const isTyping = visibleChars < fullText.length;
  const isLastPage = pageIndex === pages.length - 1;

  useEffect(() => {
    setVisibleChars(0);
  }, [pageIndex, pages]);

  useEffect(() => {
    if (!isTyping) return;
    const timer = setTimeout(() => setVisibleChars((c) => c + 1), TYPE_SPEED_MS);
    return () => clearTimeout(timer);
  }, [visibleChars, isTyping]);

  const handleAdvance = () => {
    if (isTyping) {
      setVisibleChars(fullText.length);
      return;
    }
    if (isLastPage) {
      onClose();
      return;
    }
    setPageIndex((i) => i + 1);
  };

  if (!currentPage) return null;

  return (
    <div
      className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-[32rem] z-30 cursor-pointer select-none"
      onClick={handleAdvance}
    >
      <div className="flex items-stretch gap-3 rounded-lg border-2 border-[#e8c2ff] bg-[#1a1030]/95 shadow-[0_0_16px_rgba(232,194,255,0.35)] p-3">
        <div className="flex h-14 w-14 flex-none items-center justify-center rounded-md border-2 border-[#e8c2ff] bg-[#2a1a4a]">
          <SnippyIcon />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-pixel text-lg leading-none text-[#ffb3ec] tracking-wide">SNIPPY</p>
          <p className="font-pixel text-xl leading-snug text-[#f5eaff] mt-1 min-h-[3.2rem]">
            {fullText.slice(0, visibleChars)}
          </p>
          {!isTyping && (
            <p className="font-pixel text-sm text-[#e8c2ff] text-right animate-pulse">
              {isLastPage ? '[ close ]' : '[ continue ▾ ]'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SnippyIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden="true">
      <circle cx="14" cy="16" r="6" fill="#f5eaff" stroke="#e8c2ff" strokeWidth="1.5" />
      <circle cx="26" cy="16" r="6" fill="#f5eaff" stroke="#e8c2ff" strokeWidth="1.5" />
      <circle cx="14" cy="16" r="2.2" fill="#2a1a4a" />
      <circle cx="26" cy="16" r="2.2" fill="#2a1a4a" />
      <path d="M20 20 L10 32" stroke="#e8c2ff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 20 L30 32" stroke="#e8c2ff" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="9" cy="33" r="3" fill="none" stroke="#e8c2ff" strokeWidth="2" />
      <circle cx="31" cy="33" r="3" fill="none" stroke="#e8c2ff" strokeWidth="2" />
    </svg>
  );
}
