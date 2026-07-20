'use client';

import { useState } from 'react';

interface SuggestionBoxInteractionProps {
  onComplete?: () => void;
}

export default function SuggestionBoxInteraction({ onComplete }: SuggestionBoxInteractionProps) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Static-only confirmation: no server round trip. A future real backend
    // (e.g. Formspree/EmailJS) can be wired in here without changing the UI.
    setStatus('success');
    setTimeout(() => {
      onComplete?.();
    }, 2500);
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="font-vt323 text-2xl text-green-400 drop-shadow-md">
          Thanks! Your suggestion has been noted.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-lg flex-col items-center gap-4"
    >
      <p className="font-vt323 text-xl text-white/80">Drop a message in the box.</p>

      <div className="relative w-full">
        <span className="pointer-events-none absolute left-3 top-3 select-none font-vt323 text-xl text-black/60">
          To Roli:
        </span>
        <textarea
          id="suggestion-message"
          name="suggestion-message"
          className="h-40 w-full resize-none rounded bg-white p-3 pt-10 font-vt323 text-xl text-black focus:outline-none focus:ring-4 focus:ring-white/50 disabled:opacity-70"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          maxLength={1000}
        />
        <span className="absolute bottom-2 right-2 font-vt323 text-sm text-black/50">
          {message.length}/1000
        </span>
      </div>

      <button
        type="submit"
        disabled={!message.trim()}
        className="rounded border-2 border-white bg-white px-6 py-2 font-vt323 text-2xl text-black transition hover:border-gray-200 hover:bg-gray-200 disabled:bg-gray-400 disabled:opacity-50"
      >
        Submit
      </button>
    </form>
  );
}
