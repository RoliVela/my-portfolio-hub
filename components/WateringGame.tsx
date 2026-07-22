'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface WateringGameProps {
  onComplete?: () => void;
  onSuccess?: () => void;
  plantName?: string;
}

const ARC_START = -90;
const ARC_END = 90;
const SUCCESS_SIZE = 30; // degrees
const HITS_TO_WIN = 3;

function randomZone(): { start: number; end: number } {
  const start = Math.floor(Math.random() * (ARC_END - ARC_START - SUCCESS_SIZE)) + ARC_START;
  return { start, end: start + SUCCESS_SIZE };
}

const HINT_STORAGE_KEY = 'watering-game-hint-seen';

export default function WateringGame({ onComplete, onSuccess, plantName = 'plant' }: WateringGameProps) {
  const [streak, setStreak] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showHint, setShowHint] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem(HINT_STORAGE_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  const [angle, setAngle] = useState(ARC_START);
  const [successZone, setSuccessZone] = useState(randomZone);

  const angleRef = useRef(angle);
  const successZoneRef = useRef(successZone);
  const isCompleteRef = useRef(isComplete);
  const streakRef = useRef(streak);
  const directionRef = useRef(1);
  const rafRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    angleRef.current = angle;
  }, [angle]);

  useEffect(() => {
    successZoneRef.current = successZone;
  }, [successZone]);

  useEffect(() => {
    isCompleteRef.current = isComplete;
  }, [isComplete]);

  useEffect(() => {
    streakRef.current = streak;
  }, [streak]);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    try {
      localStorage.setItem(HINT_STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  const resetSuccessZone = useCallback(() => {
    setSuccessZone(randomZone());
  }, []);

  const handleHit = useCallback(() => {
    if (isCompleteRef.current) return;

    const currentAngle = angleRef.current;
    const zone = successZoneRef.current;
    const isHit = currentAngle >= zone.start && currentAngle <= zone.end;

    if (isHit) {
      const nextStreak = streakRef.current + 1;
      setStreak(nextStreak);
      streakRef.current = nextStreak;

      if (nextStreak >= HITS_TO_WIN) {
        setIsComplete(true);
        isCompleteRef.current = true;
        setMessage('Watered! 🌿');
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        const completeTimer = window.setTimeout(() => {
          onSuccess?.();
          onComplete?.();
        }, 1200);
        timersRef.current.push(completeTimer);
      } else {
        setMessage(`Nice! ${HITS_TO_WIN - nextStreak} more.`);
        const niceTimer = window.setTimeout(() => setMessage(null), 800);
        timersRef.current.push(niceTimer);
        resetSuccessZone();
      }
    } else {
      setStreak(0);
      streakRef.current = 0;
      setMessage('Miss! Try again.');
      const missTimer = window.setTimeout(() => setMessage(null), 800);
      timersRef.current.push(missTimer);
      resetSuccessZone();
    }
  }, [onComplete, onSuccess, resetSuccessZone]);

  useEffect(() => {
    const speed = 2.5; // degrees per frame
    const loop = () => {
      setAngle((prev) => {
        let next = prev + speed * directionRef.current;
        if (next >= ARC_END || next <= ARC_START) {
          directionRef.current *= -1;
          next = Math.max(ARC_START, Math.min(ARC_END, next));
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleHit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleHit]);

  const successStart = successZone.start;
  const successEnd = successZone.end;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-lg border-4 border-green-950 bg-emerald-900 p-6 shadow-[0_0_0_4px_#000]">
      <h2 className="font-vt323 text-3xl text-white">Water the {plantName}</h2>
      <p className="text-center font-vt323 text-lg text-emerald-100">
        Press Space when the indicator is in the green zone. Get {HITS_TO_WIN} in a row!
      </p>

      {showHint && (
        <div className="w-full rounded-lg border-4 border-yellow-400 bg-yellow-100 p-4 text-left text-black shadow-md">
          <div className="mb-2 flex items-start gap-2">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-vt323 text-xl font-bold text-green-900">How to water</p>
              <p className="font-vt323 text-lg leading-snug text-green-800">
                Watch the yellow needle sweep back and forth. Press Space (or tap the button)
                when the needle is inside the bright green wedge. Land three hits in a row to
                finish watering!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissHint}
            className="w-full rounded border-2 border-green-900 bg-green-700 px-4 py-1 font-vt323 text-lg text-white transition hover:bg-green-600"
          >
            Got it
          </button>
        </div>
      )}

      <div className="relative h-48 w-64">
        {/* Pixel-art arc track */}
        <div className="absolute inset-x-0 top-0 h-full rounded-t-none border-4 border-b-0 border-emerald-950 bg-emerald-950/50" style={{ borderRadius: '128px 128px 0 0' }} />
        {/* Success zone wedge - blocky SVG */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 256 192" preserveAspectRatio="xMidYMax meet">
          <SuccessZoneWedge start={successStart} end={successEnd} />
        </svg>
        {/* Chunky pixel needle */}
        <div className="absolute bottom-0 left-1/2 h-full w-0">
          <div
            className="absolute bottom-0 left-0 h-[90%] w-2 origin-bottom bg-yellow-300 shadow-[0_0_0_2px_#000]"
            style={{ transform: `rotate(${angle}deg)` }}
          />
        </div>
        {/* Pixel pivot */}
        <div className="absolute bottom-0 left-1/2 h-5 w-5 -translate-x-1/2 translate-y-1/2 border-2 border-black bg-yellow-400" />
      </div>

      <div className="flex gap-2">
        {Array.from({ length: HITS_TO_WIN }).map((_, i) => (
          <div
            key={i}
            className={`h-5 w-5 border-2 border-white shadow-[0_0_0_2px_#000] ${
              i < streak ? 'bg-sky-400' : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      <div className="h-10 w-full text-center">
        {message && <p className="font-vt323 text-2xl text-yellow-300">{message}</p>}
      </div>

      <button
        type="button"
        onClick={handleHit}
        className="rounded border-2 border-white bg-green-700 px-6 py-2 font-vt323 text-2xl text-white shadow-[0_0_0_2px_#000] transition hover:bg-green-600 active:scale-95"
      >
        Space / Tap
      </button>
    </div>
  );
}

function SuccessZoneWedge({ start, end }: { start: number; end: number }) {
  const cx = 128;
  const cy = 192;
  const r = 170;

  const startRad = (start * Math.PI) / 180;
  const endRad = (end * Math.PI) / 180;

  const startX = cx + r * Math.sin(startRad);
  const startY = cy - r * Math.cos(startRad);
  const endX = cx + r * Math.sin(endRad);
  const endY = cy - r * Math.cos(endRad);

  const path = `M ${cx} ${cy} L ${startX} ${startY} A ${r} ${r} 0 0 0 ${endX} ${endY} Z`;

  return (
    <path
      d={path}
      fill="rgba(74, 222, 128, 0.8)"
      stroke="rgba(20, 83, 45, 1)"
      strokeWidth={3}
    />
  );
}
