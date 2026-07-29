'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { playPopSound } from '@/lib/sfx';

interface VenusFlyTrapGameProps {
  onComplete?: () => void;
  onSuccess?: () => void;
}

// ======================== Tunables ========================
const WATER_MAX = 100;
const WATER_RISE_RATE = 0.8; // percent per frame at 60fps
const WATER_TARGET_MIN = 55;
const WATER_TARGET_MAX = 80;

const TARGET_BUG_COUNT = 5;
const BUG_SPAWN_INTERVAL_MS = 1200;
const BUG_LIFETIME_MS = 8000;
const BUG_SPEED = 0.7;

const NUTRIENT_TARGET = 30;
const NUTRIENT_MASH_AMOUNT = 1;
const NUTRIENT_DECAY = 0.15; // per frame at 60fps

// ======================== Types ========================
type Phase = 'water' | 'bugs' | 'nutrients' | 'result';
type WaterQuality = 'too little' | 'just right' | 'overflow';

interface Bug {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  bornAt: number;
}

// ======================== Helpers ========================
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function VenusFlyTrapGame({ onComplete, onSuccess }: VenusFlyTrapGameProps) {
  const [phase, setPhase] = useState<Phase>('water');

  // Water phase
  const [waterLevel, setWaterLevel] = useState(0);
  const [waterQuality, setWaterQuality] = useState<WaterQuality>('too little');
  const holdingRef = useRef(false);
  const waterRafRef = useRef<number | null>(null);

  // Bugs phase
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [caughtBugs, setCaughtBugs] = useState(0);
  const caughtBugsRef = useRef(0);
  const bugsRef = useRef<Bug[]>([]);
  const bugIdRef = useRef(0);
  const bugsAreaRef = useRef<HTMLDivElement>(null);

  // Nutrients phase
  const [nutrientLevel, setNutrientLevel] = useState(0);
  const nutrientRef = useRef(0);
  const nutrientRafRef = useRef<number | null>(null);

  // Success is reported only once so the toggle isn't flipped back and forth
  const successReportedRef = useRef(false);

  // ======================== Water phase ========================
  useEffect(() => {
    if (phase !== 'water') return;
    let active = true;

    const loop = () => {
      if (!active) return;
      setWaterLevel((prev) => {
        if (holdingRef.current) {
          return clamp(prev + WATER_RISE_RATE, 0, WATER_MAX);
        }
        return prev;
      });
      waterRafRef.current = requestAnimationFrame(loop);
    };

    waterRafRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      if (waterRafRef.current) cancelAnimationFrame(waterRafRef.current);
    };
  }, [phase]);

  const evaluateWater = useCallback(() => {
    setWaterLevel((level) => {
      let quality: WaterQuality = 'too little';
      if (level >= WATER_TARGET_MIN && level <= WATER_TARGET_MAX) {
        quality = 'just right';
      } else if (level > WATER_TARGET_MAX) {
        quality = 'overflow';
      }
      setWaterQuality(quality);
      return level;
    });

    playPopSound();
    window.setTimeout(() => {
      setPhase('bugs');
    }, 900);
  }, []);

  const startHolding = useCallback(() => {
    if (phase !== 'water') return;
    holdingRef.current = true;
  }, [phase]);

  const stopHolding = useCallback(() => {
    if (phase !== 'water') return;
    holdingRef.current = false;
    evaluateWater();
  }, [phase, evaluateWater]);

  // ======================== Bugs phase ========================
  const spawnBug = useCallback(() => {
    const area = bugsAreaRef.current;
    const width = area?.clientWidth ?? 320;
    const id = bugIdRef.current++;
    const angle = Math.random() * Math.PI * 2;
    const bug: Bug = {
      id,
      x: Math.random() * (width - 32),
      y: 8 + Math.random() * 40,
      vx: Math.cos(angle) * BUG_SPEED,
      vy: Math.sin(angle) * BUG_SPEED * 0.4,
      bornAt: Date.now(),
    };
    bugsRef.current = [...bugsRef.current, bug];
    setBugs(bugsRef.current);
  }, []);

  const removeBugById = useCallback((id: number) => {
    bugsRef.current = bugsRef.current.filter((b) => b.id !== id);
    setBugs(bugsRef.current);
  }, []);

  const catchNearestBug = useCallback(() => {
    if (phase !== 'bugs' || bugsRef.current.length === 0) return;
    const area = bugsAreaRef.current;
    const width = area?.clientWidth ?? 320;
    const centerX = width / 2;
    const nearest = bugsRef.current.reduce((closest, bug) => {
      const closestDist = Math.abs(closest.x - centerX);
      const bugDist = Math.abs(bug.x - centerX);
      return bugDist < closestDist ? bug : closest;
    }, bugsRef.current[0]);

    if (nearest) {
      removeBugById(nearest.id);
      playPopSound();
      setCaughtBugs((prev) => {
        const next = prev + 1;
        caughtBugsRef.current = next;
        if (next >= TARGET_BUG_COUNT) {
          setPhase('nutrients');
        }
        return next;
      });
    }
  }, [phase, removeBugById]);

  useEffect(() => {
    if (phase !== 'bugs') return;

    // Seed initial bugs
    if (bugsRef.current.length === 0) {
      for (let i = 0; i < 3; i += 1) {
        spawnBug();
      }
    }

    let active = true;
    let lastSpawn = Date.now();
    const loop = () => {
      if (!active) return;

      const area = bugsAreaRef.current;
      const width = area?.clientWidth ?? 320;
      const height = area?.clientHeight ?? 160;
      const now = Date.now();

      bugsRef.current = bugsRef.current
        .map((bug) => {
          let nextX = bug.x + bug.vx;
          let nextY = bug.y + bug.vy;
          let nextVx = bug.vx;
          let nextVy = bug.vy;

          if (nextX <= 0 || nextX >= width - 24) {
            nextVx = -nextVx;
            nextX = clamp(nextX, 0, width - 24);
          }
          if (nextY <= 0 || nextY >= height - 24) {
            nextVy = -nextVy;
            nextY = clamp(nextY, 0, height - 24);
          }

          // Erratic wobble
          if (Math.random() < 0.02) {
            nextVx += (Math.random() - 0.5) * 0.5;
            nextVy += (Math.random() - 0.5) * 0.2;
          }

          return { ...bug, x: nextX, y: nextY, vx: nextVx, vy: nextVy };
        })
        .filter((bug) => now - bug.bornAt < BUG_LIFETIME_MS);

      if (now - lastSpawn > BUG_SPAWN_INTERVAL_MS) {
        lastSpawn = now;
        if (bugsRef.current.length < 8) {
          spawnBug();
        }
      }

      if (bugsRef.current.length === 0) {
        spawnBug();
      }

      setBugs(bugsRef.current);
      requestAnimationFrame(loop);
    };

    const id = requestAnimationFrame(loop);
    return () => {
      active = false;
      cancelAnimationFrame(id);
    };
  }, [phase, spawnBug]);

  // ======================== Nutrients phase ========================
  useEffect(() => {
    if (phase !== 'nutrients') return;
    let active = true;

    const loop = () => {
      if (!active) return;
      nutrientRef.current = clamp(nutrientRef.current - NUTRIENT_DECAY, 0, NUTRIENT_TARGET);
      setNutrientLevel(nutrientRef.current);
      if (nutrientRef.current >= NUTRIENT_TARGET) {
        setPhase('result');
        if (!successReportedRef.current) {
          successReportedRef.current = true;
          onSuccess?.();
        }
        return;
      }
      nutrientRafRef.current = requestAnimationFrame(loop);
    };

    nutrientRafRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      if (nutrientRafRef.current) cancelAnimationFrame(nutrientRafRef.current);
    };
  }, [phase, onSuccess]);

  const mashNutrients = useCallback(() => {
    if (phase !== 'nutrients') return;
    nutrientRef.current = clamp(nutrientRef.current + NUTRIENT_MASH_AMOUNT, 0, NUTRIENT_TARGET);
    setNutrientLevel(nutrientRef.current);
    playPopSound();
  }, [phase]);

  // ======================== Keyboard controls ========================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (phase === 'water') startHolding();
        if (phase === 'bugs') catchNearestBug();
        if (phase === 'nutrients') mashNutrients();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (phase === 'water') stopHolding();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [phase, startHolding, stopHolding, catchNearestBug, mashNutrients]);

  // ======================== Result helpers ========================
  const trapReaction = () => {
    const bugWord = caughtBugs >= TARGET_BUG_COUNT ? 'yummy' : 'okay';
    const waterWord = waterQuality === 'just right' ? 'refreshing' : waterQuality === 'overflow' ? 'soggy' : 'thirsty';
    return `That was a ${waterWord}, ${bugWord} meal!`;
  };

  const resetGame = () => {
    setPhase('water');
    setWaterLevel(0);
    setWaterQuality('too little');
    holdingRef.current = false;
    setBugs([]);
    bugsRef.current = [];
    setCaughtBugs(0);
    setNutrientLevel(0);
    nutrientRef.current = 0;
    successReportedRef.current = false;
  };

  // ======================== Render ========================
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4 rounded-lg border-4 border-pink-300 bg-purple-950 p-6 shadow-[0_0_0_4px_#000]">
      <h2 className="font-vt323 text-3xl text-pink-200">Feed the Venus Fly Trap</h2>
      <p className="text-center font-vt323 text-lg text-pink-100/80">
        Space / on-screen button · Help this hungry plant get a full meal.
      </p>

      {phase === 'water' && (
        <div className="flex w-full flex-col items-center gap-4">
          <p className="font-vt323 text-xl text-pink-100">Hold Space to fill with water, release in the green zone.</p>
          <div className="flex items-end gap-6">
            <div className="relative h-64 w-12 rounded border-2 border-pink-300/50 bg-purple-900/50 p-1">
              <div
                className="absolute bottom-1 left-1 right-1 bg-sky-400 transition-[height]"
                style={{ height: `${(waterLevel / WATER_MAX) * 100}%` }}
              />
              <div
                className="absolute left-0 right-0 border-y-2 border-dashed border-green-400 bg-green-400/20"
                style={{
                  top: `${100 - (WATER_TARGET_MAX / WATER_MAX) * 100}%`,
                  height: `${((WATER_TARGET_MAX - WATER_TARGET_MIN) / WATER_MAX) * 100}%`,
                }}
              />
            </div>
            <button
              type="button"
              onPointerDown={startHolding}
              onPointerUp={stopHolding}
              onPointerLeave={stopHolding}
              onPointerCancel={stopHolding}
              className="select-none rounded border-2 border-pink-300/50 bg-purple-900 px-6 py-3 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800"
            >
              Hold (Space)
            </button>
          </div>
          <p className="font-vt323 text-lg text-pink-200">Water: {Math.round(waterLevel)}%</p>
        </div>
      )}

      {phase === 'bugs' && (
        <div className="flex w-full flex-col items-center gap-4">
          <p className="font-vt323 text-xl text-pink-100">Tap bugs to drop them in, or press Space to catch the nearest one.</p>
          <div
            ref={bugsAreaRef}
            className="relative h-48 w-full max-w-md overflow-hidden rounded border-2 border-pink-300/50 bg-purple-900/50"
          >
            {bugs.map((bug) => (
              <button
                key={bug.id}
                type="button"
                onClick={() => {
                  removeBugById(bug.id);
                  playPopSound();
                  setCaughtBugs((prev) => {
                    const next = prev + 1;
                    caughtBugsRef.current = next;
                    if (next >= TARGET_BUG_COUNT) {
                      setPhase('nutrients');
                    }
                    return next;
                  });
                }}
                style={{ left: bug.x, top: bug.y }}
                className="absolute h-6 w-6 -translate-x-0 -translate-y-0 rounded-full border-2 border-black bg-lime-400 transition hover:scale-110"
                aria-label="Bug"
              />
            ))}
          </div>
          <p className="font-vt323 text-xl text-pink-200">
            Caught: {caughtBugs} / {TARGET_BUG_COUNT}
          </p>
          <button
            type="button"
            onClick={catchNearestBug}
            className="min-h-[44px] min-w-[44px] select-none rounded border-2 border-pink-300/50 bg-purple-900 px-6 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800"
          >
            Catch nearest (Space)
          </button>
        </div>
      )}

      {phase === 'nutrients' && (
        <div className="flex w-full flex-col items-center gap-4">
          <p className="font-vt323 text-xl text-pink-100">Mash Space or tap to sprinkle nutrients!</p>
          <div className="w-full max-w-md rounded border-2 border-pink-300/50 bg-purple-900/50 p-2">
            <div className="h-6 rounded bg-purple-800">
              <div
                className="h-full rounded bg-amber-400 transition-[width]"
                style={{ width: `${(nutrientLevel / NUTRIENT_TARGET) * 100}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onPointerDown={mashNutrients}
            className="min-h-[44px] min-w-[44px] select-none rounded border-2 border-pink-300/50 bg-purple-900 px-6 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800"
          >
            Sprinkle (Space)
          </button>
        </div>
      )}

      {phase === 'result' && (
        <div className="flex w-full flex-col items-center gap-4">
          <p className="font-vt323 text-3xl text-pink-200">Meal Complete!</p>
          <div className="text-center font-vt323 text-xl text-pink-100">
            <p>Water: {waterQuality}</p>
            <p>Bugs caught: {caughtBugs} / {TARGET_BUG_COUNT}</p>
            <p>Nutrients: {Math.round((nutrientLevel / NUTRIENT_TARGET) * 100)}%</p>
          </div>
          <p className="font-vt323 text-2xl text-yellow-300">{trapReaction()}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={resetGame}
              className="min-h-[44px] min-w-[44px] select-none rounded border-2 border-pink-300/50 bg-purple-900 px-6 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800"
            >
              Feed Again
            </button>
            <button
              type="button"
              onClick={onComplete}
              className="min-h-[44px] min-w-[44px] select-none rounded border-2 border-pink-300/50 bg-purple-900 px-6 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
