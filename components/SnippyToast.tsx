'use client';
import { useEffect } from 'react';

interface SnippyToastProps {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
}

export default function SnippyToast({ message, onDismiss, durationMs = 3500 }: SnippyToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [onDismiss, durationMs]);

  return (
    <div className="fixed bottom-4 left-4 z-[60] max-w-xs rounded-lg border-4 border-white bg-black p-4 shadow-[0_0_0_4px_#000]">
      <div className="mb-1 inline-block rounded bg-white px-2 py-0.5 font-vt323 text-sm text-black">Snippy</div>
      <p className="font-vt323 text-lg text-white">{message}</p>
    </div>
  );
}
