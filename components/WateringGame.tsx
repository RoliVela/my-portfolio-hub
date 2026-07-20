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

  return <path d={path} fill="rgba(74, 222, 128, 0.5)" stroke="rgba(20, 83, 45, 0.8)" strokeWidth={2} />;
}

export default function WateringGame({ onComplete, onSuccess, plantName = 'plant' }: WateringGameProps) {
  const [streak, setStreak] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Needle angle in degrees, sweeping across an arc
  const [angle, setAngle] = useState(ARC_START);
  const [successZone, setSuccessZone] = useState(randomZone);

  // Refs mirror mutable state for the keyboard/tap handler to avoid re-attaching listeners.
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
        if (rafRef.current) cancelAnimationFrame(rafRef.current);        const completeTimer = window.setTimeout(() => {
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
    const speed = 1.5; // degrees per frame
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

  const needleTransform = `rotate(${angle}deg)`;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-lg border-4 border-green-900 bg-green-800 p-6 shadow-[0_0_0_4px_#000]">
      <h2 className="font-vt323 text-3xl text-white">Water the {plantName}</h2>
      <p className="text-center font-vt323 text-lg text-green-100">
        Press Space when the indicator is in the green zone. Get {HITS_TO_WIN} in a row!
      </p>

      <div className="relative h-48 w-64">
        {/* Arc track */}
        <div className="absolute inset-0 rounded-t-full border-8 border-green-900/50 bg-green-950/30" />
        {/* Success zone wedge */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 256 192" preserveAspectRatio="xMidYMax meet">
          <SuccessZoneWedge start={successZone.start} end={successZone.end} />
        </svg>
        {/* Needle pivot */}
        <div className="absolute bottom-0 left-1/2 h-full w-0">
          <div
            className="absolute bottom-0 left-0 h-[90%] w-1 origin-bottom bg-yellow-300"
            style={{ transform: needleTransform }}
          />
        </div>
        {/* Pivot dot */}
        <div className="absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full bg-yellow-300" />
      </div>

      <div className="flex gap-2">
        {Array.from({ length: HITS_TO_WIN }).map((_, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full border-2 border-white ${
              i < streak ? 'bg-blue-400' : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      {message && <p className="font-vt323 text-2xl text-yellow-300">{message}</p>}

      <button
        type="button"
        onClick={handleHit}
        className="rounded border-2 border-white bg-green-600 px-6 py-2 font-vt323 text-2xl text-white transition hover:bg-green-500 active:scale-95"
      >
        Space / Tap
      </button>
    </div>
  );
}
