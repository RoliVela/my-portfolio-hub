'use client';

import { useEffect, useRef, useState } from 'react';
import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = 'service_djzyl8c';
const EMAILJS_TEMPLATE_ID = 'template_nko4bgc';
const EMAILJS_PUBLIC_KEY = 'z0Vx2xEyRH8wEg62N';

interface SuggestionBoxInteractionProps {
  onComplete?: () => void;
}

export default function SuggestionBoxInteraction({ onComplete }: SuggestionBoxInteractionProps) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || status === 'sending') return;

    setStatus('sending');
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        { message },
        { publicKey: EMAILJS_PUBLIC_KEY }
      );
      setStatus('success');
      successTimerRef.current = setTimeout(() => onComplete?.(), 2500);
    } catch (err) {
      console.error('EmailJS send failed:', err);
      setStatus('error');
    }
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
          disabled={status === 'sending'}
        />
        <span className="absolute bottom-2 right-2 font-vt323 text-sm text-black/50">
          {message.length}/1000
        </span>
      </div>

      {status === 'error' && (
        <p className="text-center font-vt323 text-lg text-red-300">
          Couldn&apos;t send that — check your connection and try again.
        </p>
      )}

      <button
        type="submit"
        disabled={!message.trim() || status === 'sending'}
        className="rounded border-2 border-white bg-white px-6 py-2 font-vt323 text-2xl text-black transition hover:border-gray-200 hover:bg-gray-200 disabled:bg-gray-400 disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending...' : 'Submit'}
      </button>

      {status === 'error' && (
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="rounded border-2 border-white bg-black px-6 py-2 font-vt323 text-2xl text-white transition hover:bg-white hover:text-black"
        >
          Try Again
        </button>
      )}
    </form>
  );
}
