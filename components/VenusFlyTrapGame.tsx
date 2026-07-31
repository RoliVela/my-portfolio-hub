'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { playPopSound } from '@/lib/sfx';
import VenusFlyTrapSVG from '@/components/game/VenusFlyTrapSVG';
import { PopBurst, FallingDust, FallingDustOverlay } from '@/components/game/GameParticles';

interface VenusFlyTrapGameProps {
  onComplete?: () => void;
  onSuccess?: () => void;
}

// ======================== Tunables ========================
const WATER_MAX = 100;
const WATER_RISE_RATE = 1.0; // percent per frame at 60fps
const WATER_TARGET_MIN = 55;
const WATER_TARGET_MAX = 80;

const TARGET_BUG_COUNT = 5;
const BUG_SPAWN_INTERVAL_MS = 1200;
const BUG_LIFETIME_MS = 8000;
const BUG_WARNING_MS = 1500;
const BUG_SPEED = 0.7;

const NUTRIENT_TARGET = 30;
const NUTRIENT_MASH_AMOUNT = 1;

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
  warning: boolean;
}

interface PopEffect {
  id: number;
  x: number;
  y: number;
}

interface DustParticle {
  id: number;
  x: number;
  y: number;
  color: string;
}

// ======================== Helpers ========================
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// ======================== Sub-components ========================

/** Small SVG watering can that tilts when pouring. */
function WateringCan({ pouring }: { pouring: boolean }) {
  return (
    <div
      className="transition-transform duration-200"
      style={{ transform: pouring ? 'rotate(-35deg)' : 'rotate(0deg)', transformOrigin: '70% 80%' }}
    >
      <svg viewBox="0 0 72 56" className="w-16 h-12 drop-shadow-lg" aria-hidden="true">
        {/* Body */}
        <rect x="18" y="16" width="38" height="28" rx="4" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
        {/* Body highlight */}
        <rect x="22" y="19" width="10" height="4" rx="2" fill="#7dd3fc" opacity="0.5" />
        {/* Handle */}
        <path d="M 54,16 C 66,4 66,-2 54,-2 L 42,-2" stroke="#0284c7" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        {/* Spout */}
        <path d="M 18,22 L 3,12 L 0,16 L 15,26" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Spout holes */}
        <circle cx="3" cy="14" r="1.2" fill="#0284c7" />
        <circle cx="5.5" cy="13" r="1" fill="#0284c7" />
        <circle cx="8" cy="12" r="1" fill="#0284c7" />
      </svg>
      {/* Water drops when pouring */}
      {pouring && (
        <div className="absolute -bottom-6 -left-2 pointer-events-none">
          <svg viewBox="0 0 20 40" className="w-5 h-10" aria-hidden="true">
            <circle cx="6" cy="5" r="2.5" fill="#38bdf8" opacity="0.9">
              <animate attributeName="cy" values="5;35" dur="0.45s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0" dur="0.45s" repeatCount="indefinite" />
            </circle>
            <circle cx="10" cy="10" r="1.8" fill="#7dd3fc" opacity="0.7">
              <animate attributeName="cy" values="10;38" dur="0.35s" begin="0.12s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0" dur="0.35s" begin="0.12s" repeatCount="indefinite" />
            </circle>
            <circle cx="4" cy="8" r="1.5" fill="#bae6fd" opacity="0.6">
              <animate attributeName="cy" values="8;36" dur="0.4s" begin="0.22s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0" dur="0.4s" begin="0.22s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      )}
    </div>
  );
}

/** SVG fly bug that buzzes in place. */
function FlyBug({
  x,
  y,
  warning,
  onClick,
}: {
  x: number;
  y: number;
  warning: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ left: x, top: y }}
      className={`absolute cursor-pointer transition-transform hover:scale-125 focus:outline-none ${warning ? 'animate-pulse opacity-70' : ''}`}
      aria-label="Catch fly"
    >
      <svg viewBox="0 0 36 28" className="w-9 h-7" aria-hidden="true">
        {/* Wings - with flapping animation */}
        <ellipse cx="9" cy="8" rx="7" ry="4.5" fill="white" opacity="0.45" style={{ transformOrigin: '12px 10px', animation: 'wing-flap 0.08s ease-in-out infinite alternate' }} />
        <ellipse cx="27" cy="8" rx="7" ry="4.5" fill="white" opacity="0.45" style={{ transformOrigin: '24px 10px', animation: 'wing-flap 0.08s ease-in-out infinite alternate 0.04s' }} />
        {/* Body */}
        <ellipse cx="18" cy="15" rx="6.5" ry="4.5" fill="#374151" stroke="#1f2937" strokeWidth="0.5" />
        {/* Abdomen stripes */}
        <line x1="14" y1="16" x2="22" y2="16" stroke="#6b7280" strokeWidth="0.5" opacity="0.4" />
        <line x1="15" y1="18" x2="21" y2="18" stroke="#6b7280" strokeWidth="0.5" opacity="0.3" />
        {/* Head */}
        <circle cx="18" cy="8" r="3.5" fill="#4b5563" />
        {/* Compound eyes */}
        <circle cx="15.5" cy="7" r="2" fill="#dc2626" />
        <circle cx="20.5" cy="7" r="2" fill="#dc2626" />
        {/* Eye shine */}
        <circle cx="16" cy="6.5" r="0.6" fill="white" opacity="0.7" />
        <circle cx="21" cy="6.5" r="0.6" fill="white" opacity="0.7" />
        {/* Antennae */}
        <line x1="16" y1="4.5" x2="12" y2="1" stroke="#9ca3af" strokeWidth="0.7" strokeLinecap="round" />
        <line x1="20" y1="4.5" x2="24" y2="1" stroke="#9ca3af" strokeWidth="0.7" strokeLinecap="round" />
        <circle cx="12" cy="1" r="0.8" fill="#9ca3af" />
        <circle cx="24" cy="1" r="0.8" fill="#9ca3af" />
        {/* Legs */}
        <line x1="14" y1="18" x2="10" y2="24" stroke="#6b7280" strokeWidth="0.6" />
        <line x1="18" y1="19" x2="18" y2="25" stroke="#6b7280" strokeWidth="0.6" />
        <line x1="22" y1="18" x2="26" y2="24" stroke="#6b7280" strokeWidth="0.6" />
      </svg>
    </button>
  );
}

// ======================== Main component ========================
export default function VenusFlyTrapGame({ onComplete, onSuccess }: VenusFlyTrapGameProps) {
  const [phase, setPhase] = useState<Phase>('water');

  // Water phase
  const [waterLevel, setWaterLevel] = useState(0);
  const [waterQuality, setWaterQuality] = useState<WaterQuality>('too little');
  const [isHolding, setIsHolding] = useState(false);
  const holdingRef = useRef(false);
  const waterLevelRef = useRef(0);
  const waterBarRef = useRef<HTMLDivElement>(null);
  const waterPercentRef = useRef<HTMLSpanElement>(null);
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

  // Visual FX
  const [popEffects, setPopEffects] = useState<PopEffect[]>([]);
  const popIdRef = useRef(0);
  const [dustParticles, setDustParticles] = useState<DustParticle[]>([]);
  const dustIdRef = useRef(0);
  const [snapTrigger, setSnapTrigger] = useState(0);

  // Success reporting
  const successReportedRef = useRef(false);

  // ======================== Water phase ========================
  useEffect(() => {
    if (phase !== 'water') return;
    let active = true;
    waterLevelRef.current = 0;

    const loop = () => {
      if (!active) return;
      if (holdingRef.current) {
        waterLevelRef.current = clamp(waterLevelRef.current + WATER_RISE_RATE, 0, WATER_MAX);
        // Direct DOM updates for instant visual feedback (bypasses React batching)
        if (waterBarRef.current) {
          waterBarRef.current.style.height = `${waterLevelRef.current}%`;
        }
        if (waterPercentRef.current) {
          waterPercentRef.current.textContent = `${Math.round(waterLevelRef.current)}%`;
        }
      }
      waterRafRef.current = requestAnimationFrame(loop);
    };

    waterRafRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      if (waterRafRef.current) cancelAnimationFrame(waterRafRef.current);
    };
  }, [phase]);

  const evaluateWater = useCallback(() => {
    const level = waterLevelRef.current;
    let quality: WaterQuality = 'too little';
    if (level >= WATER_TARGET_MIN && level <= WATER_TARGET_MAX) {
      quality = 'just right';
    } else if (level > WATER_TARGET_MAX) {
      quality = 'overflow';
    }
    setWaterQuality(quality);
    setWaterLevel(level);
    playPopSound();
    window.setTimeout(() => {
      setPhase('bugs');
    }, 900);
  }, []);

  const startHolding = useCallback(() => {
    if (phase !== 'water') return;
    holdingRef.current = true;
    setIsHolding(true);
  }, [phase]);

  const stopHolding = useCallback(() => {
    if (phase !== 'water') return;
    holdingRef.current = false;
    setIsHolding(false);
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
      x: Math.random() * (width - 36),
      y: 8 + Math.random() * 40,
      vx: Math.cos(angle) * BUG_SPEED,
      vy: Math.sin(angle) * BUG_SPEED * 0.4,
      bornAt: Date.now(),
      warning: false,
    };
    bugsRef.current = [...bugsRef.current, bug];
    setBugs(bugsRef.current);
  }, []);

  const removeBugById = useCallback((id: number) => {
    bugsRef.current = bugsRef.current.filter((b) => b.id !== id);
    setBugs(bugsRef.current);
  }, []);

  const spawnPop = useCallback((x: number, y: number) => {
    const id = popIdRef.current++;
    setPopEffects((prev) => [...prev, { id, x, y }]);
    window.setTimeout(() => {
      setPopEffects((prev) => prev.filter((p) => p.id !== id));
    }, 500);
  }, []);

  const spawnDust = useCallback((count: number) => {
    const fresh: DustParticle[] = [];
    for (let i = 0; i < count; i += 1) {
      fresh.push({
        id: dustIdRef.current++,
        x: randomRange(15, 85),
        y: randomRange(0, 20),
        color: ['#fcd34d', '#fbbf24', '#f59e0b', '#d97706'][Math.floor(Math.random() * 4)] ?? '#fbbf24',
      });
    }
    setDustParticles((prev) => [...prev, ...fresh]);
    window.setTimeout(() => {
      setDustParticles((prev) => prev.filter((p) => !fresh.find((f) => f.id === p.id)));
    }, 900);
  }, []);

  const handleCatchBug = useCallback(
    (bug: Bug) => {
      removeBugById(bug.id);
      playPopSound();
      spawnPop(bug.x + 14, bug.y + 14);
      setSnapTrigger((prev) => prev + 1);
      setCaughtBugs((prev) => {
        const next = prev + 1;
        caughtBugsRef.current = next;
        if (next >= TARGET_BUG_COUNT) {
          setPhase('nutrients');
        }
        return next;
      });
    },
    [removeBugById, spawnPop],
  );

  useEffect(() => {
    if (phase !== 'bugs') return;

    if (bugsRef.current.length === 0) {
      for (let i = 0; i < 3; i += 1) spawnBug();
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
          let nextVx = bug.vx + (Math.random() - 0.5) * 0.35;
          let nextVy = bug.vy + (Math.random() - 0.5) * 0.2;
          nextVx = clamp(nextVx, -BUG_SPEED * 1.5, BUG_SPEED * 1.5);
          nextVy = clamp(nextVy, -BUG_SPEED * 1, BUG_SPEED * 1);

          let nextX = bug.x + nextVx;
          let nextY = bug.y + nextVy;

          if (nextX <= 0 || nextX >= width - 32) {
            nextVx = -nextVx;
            nextX = clamp(nextX, 0, width - 32);
          }
          if (nextY <= 0 || nextY >= height - 28) {
            nextVy = -nextVy;
            nextY = clamp(nextY, 0, height - 28);
          }

          return {
            ...bug,
            x: nextX,
            y: nextY,
            vx: nextVx,
            vy: nextVy,
            warning: now - bug.bornAt > BUG_LIFETIME_MS - BUG_WARNING_MS,
          };
        })
        .filter((bug) => now - bug.bornAt < BUG_LIFETIME_MS);

      if (now - lastSpawn > BUG_SPAWN_INTERVAL_MS) {
        lastSpawn = now;
        if (bugsRef.current.length < 8) spawnBug();
      }
      if (bugsRef.current.length === 0) spawnBug();

      setBugs(bugsRef.current);
      requestAnimationFrame(loop);
    };

    const id = requestAnimationFrame(loop);
    return () => { active = false; cancelAnimationFrame(id); };
  }, [phase, spawnBug]);

  // ======================== Nutrients phase ========================
  const mashNutrients = useCallback(() => {
    if (phase !== 'nutrients') return;
    nutrientRef.current = clamp(nutrientRef.current + NUTRIENT_MASH_AMOUNT, 0, NUTRIENT_TARGET);
    setNutrientLevel(nutrientRef.current);
    playPopSound();
    spawnDust(5);
    if (nutrientRef.current >= NUTRIENT_TARGET) {
      setPhase('result');
      if (!successReportedRef.current) {
        successReportedRef.current = true;
        onSuccess?.();
      }
    }
  }, [phase, onSuccess, spawnDust]);

  // ======================== Keyboard controls ========================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (phase === 'water') startHolding();
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
  }, [phase, startHolding, stopHolding, mashNutrients]);

  // ======================== Result helpers ========================
  const trapReaction = () => {
    const bugWord = caughtBugs >= TARGET_BUG_COUNT ? 'yummy' : 'okay';
    const waterWord =
      waterQuality === 'just right' ? 'refreshing' : waterQuality === 'overflow' ? 'soggy' : 'thirsty';
    return `That was a ${waterWord}, ${bugWord} meal!`;
  };

  const resetGame = () => {
    setPhase('water');
    setWaterLevel(0);
    waterLevelRef.current = 0;
    setWaterQuality('too little');
    holdingRef.current = false;
    setIsHolding(false);
    setBugs([]);
    bugsRef.current = [];
    setCaughtBugs(0);
    caughtBugsRef.current = 0;
    setNutrientLevel(0);
    nutrientRef.current = 0;
    setPopEffects([]);
    setDustParticles([]);
    setSnapTrigger(0);
    successReportedRef.current = false;
  };

  // ======================== Derived values ========================
  const nutrientPercent = (nutrientLevel / NUTRIENT_TARGET) * 100;

  // Plant visual state
  const trapOpen = phase === 'bugs' ? 0.85 : phase === 'water' ? 0.4 : phase === 'nutrients' ? 0.2 : 0.5;
  const plantWilting = phase === 'water' && waterLevel < WATER_TARGET_MIN * 0.5;
  const plantWaterLevel = phase === 'water' ? waterLevel : waterQuality === 'just right' ? 60 : waterQuality === 'overflow' ? 100 : 20;

  return (
    <div className="relative flex w-full max-w-2xl flex-col items-center gap-4 rounded-lg border-4 border-emerald-700 bg-gradient-to-b from-emerald-950 via-green-950 to-emerald-950 p-6 shadow-[0_0_0_4px_#000]">
      {/* Wing-flap keyframes */}
      <style>{`
        @keyframes wing-flap {
          0% { transform: scaleY(1) rotate(-10deg); }
          100% { transform: scaleY(0.25) rotate(-10deg); }
        }
      `}</style>

      <h2 className="font-vt323 text-3xl text-emerald-200">Feed the Venus Fly Trap</h2>
      <p className="text-center font-vt323 text-lg text-emerald-100/80">
        Water it, catch some flies, and sprinkle nutrients to keep it happy.
      </p>

      {/* Phase progress indicator */}
      <div className="flex items-center gap-3 font-vt323 text-xl">
        <span
          className={
            phase === 'water'
              ? 'text-sky-300 scale-125'
              : waterQuality === 'just right'
                ? 'text-sky-500'
                : 'text-gray-600'
          }
        >
          💧
        </span>
        <span className="text-emerald-700">→</span>
        <span
          className={
            phase === 'bugs'
              ? 'text-lime-300 scale-125'
              : caughtBugs >= TARGET_BUG_COUNT
                ? 'text-lime-500'
                : 'text-gray-600'
          }
        >
          🪰
        </span>
        <span className="text-emerald-700">→</span>
        <span
          className={
            phase === 'nutrients'
              ? 'text-amber-300 scale-125'
              : nutrientLevel >= NUTRIENT_TARGET
                ? 'text-amber-500'
                : 'text-gray-600'
          }
        >
          🌱
        </span>
      </div>

      {/* ===== Plant ===== */}
      <VenusFlyTrapSVG
        trapOpen={trapOpen}
        waterLevel={plantWaterLevel}
        caughtBugs={caughtBugs}
        nutrientLevel={nutrientPercent}
        isWilting={plantWilting}
        snapTrigger={snapTrigger}
        className="h-64 w-48"
      />

      {/* ===== Water Phase ===== */}
      {phase === 'water' && (
        <div className="flex w-full flex-col items-center gap-4">
          <p className="font-vt323 text-xl text-emerald-100">
            Hold Space or the button to fill with water. Release in the green zone!
          </p>
          <div className="flex items-end gap-6">
            {/* Watering can */}
            <div className="relative">
              <WateringCan pouring={isHolding} />
            </div>

            {/* Water bar */}
            <div className="relative h-64 w-14 rounded-lg border-2 border-sky-400/50 bg-emerald-900/60 p-1 shadow-inner">
              {/* Green zone indicator */}
              <div
                className="absolute left-0 right-0 border-y-2 border-dashed border-green-400 bg-green-400/15"
                style={{
                  top: `${100 - (WATER_TARGET_MAX / WATER_MAX) * 100}%`,
                  height: `${((WATER_TARGET_MAX - WATER_TARGET_MIN) / WATER_MAX) * 100}%`,
                }}
              >
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-vt323 text-[10px] text-green-300/80">
                  sweet spot
                </span>
              </div>
              {/* Water fill — uses ref for instant DOM updates */}
              <div
                ref={waterBarRef}
                className="absolute bottom-1 left-1 right-1 rounded-sm"
                style={{
                  height: '0%',
                  background: 'linear-gradient(to top, #0369a1, #38bdf8)',
                  transition: 'none',
                }}
              />

            </div>

            {/* Hold button */}
            <button
              type="button"
              onPointerDown={startHolding}
              onPointerUp={stopHolding}
              onPointerLeave={stopHolding}
              onPointerCancel={stopHolding}
              className="select-none rounded-lg border-2 border-sky-400/50 bg-emerald-900 px-6 py-3 font-vt323 text-xl text-sky-100 transition hover:border-sky-300 hover:bg-emerald-800 active:bg-emerald-700"
            >
              Hold (Space)
            </button>
          </div>
          <p className="font-vt323 text-lg text-sky-200">
            Water: <span ref={waterPercentRef}>0</span>%
          </p>
        </div>
      )}

      {/* ===== Bugs Phase ===== */}
      {phase === 'bugs' && (
        <div className="flex w-full flex-col items-center gap-4">
          <p className="font-vt323 text-xl text-emerald-100">
            Click the flies to feed the trap!
          </p>
          <div
            ref={bugsAreaRef}
            className="relative h-48 w-full max-w-md overflow-hidden rounded-lg border-2 border-lime-400/40 bg-emerald-900/50"
          >
            {/* Ambient background dots */}
            <div className="pointer-events-none absolute inset-0 opacity-20">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute h-1 w-1 rounded-full bg-lime-300"
                  style={{ left: `${(i * 31 + 7) % 100}%`, top: `${(i * 23 + 13) % 100}%` }}
                />
              ))}
            </div>

            {bugs.map((bug) => (
              <FlyBug
                key={bug.id}
                x={bug.x}
                y={bug.y}
                warning={bug.warning}
                onClick={() => handleCatchBug(bug)}
              />
            ))}
            {popEffects.map((effect) => (
              <PopBurst key={effect.id} id={effect.id} x={effect.x} y={effect.y} />
            ))}
          </div>
          <p className="font-vt323 text-xl text-lime-200">
            Caught: {caughtBugs} / {TARGET_BUG_COUNT}
          </p>
        </div>
      )}

      {/* ===== Nutrients Phase ===== */}
      {phase === 'nutrients' && (
        <div className="relative flex w-full flex-col items-center gap-4">
          <p className="font-vt323 text-xl text-emerald-100">
            Mash Space or tap to sprinkle nutrients!
          </p>
          <div className="w-full max-w-md rounded-lg border-2 border-amber-400/40 bg-emerald-900/50 p-2">
            <div className="h-7 rounded bg-emerald-800">
              <div
                className="h-full rounded bg-gradient-to-r from-amber-600 to-amber-400 transition-[width]"
                style={{ width: `${nutrientPercent}%` }}
              />
            </div>
          </div>
          <FallingDustOverlay>
            {dustParticles.map((p) => (
              <FallingDust key={p.id} id={p.id} x={p.x} y={p.y} color={p.color} />
            ))}
          </FallingDustOverlay>
          <button
            type="button"
            onPointerDown={mashNutrients}
            className="min-h-[44px] min-w-[44px] select-none rounded-lg border-2 border-amber-400/50 bg-emerald-900 px-6 py-2 font-vt323 text-xl text-amber-100 transition hover:border-amber-300 hover:bg-emerald-800 active:bg-emerald-700"
          >
            Sprinkle (Space)
          </button>
        </div>
      )}

      {/* ===== Result Phase ===== */}
      {phase === 'result' && (
        <div className="flex w-full flex-col items-center gap-4">
          <p className="font-vt323 text-3xl text-emerald-200">Meal Complete!</p>
          <div className="text-center font-vt323 text-xl text-emerald-100">
            <p>
              Water:{' '}
              <span
                className={
                  waterQuality === 'just right'
                    ? 'text-green-400'
                    : waterQuality === 'overflow'
                      ? 'text-sky-400'
                      : 'text-yellow-400'
                }
              >
                {waterQuality}
              </span>
            </p>
            <p>
              Bugs caught:{' '}
              <span className={caughtBugs >= TARGET_BUG_COUNT ? 'text-green-400' : 'text-yellow-400'}>
                {caughtBugs} / {TARGET_BUG_COUNT}
              </span>
            </p>
            <p>
              Nutrients:{' '}
              <span className={nutrientPercent >= 100 ? 'text-green-400' : 'text-yellow-400'}>
                {Math.round(nutrientPercent)}%
              </span>
            </p>
          </div>
          <p className="font-vt323 text-2xl text-yellow-300">{trapReaction()}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={resetGame}
              className="min-h-[44px] min-w-[44px] select-none rounded-lg border-2 border-emerald-400/50 bg-emerald-900 px-6 py-2 font-vt323 text-xl text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-800"
            >
              Feed Again
            </button>
            <button
              type="button"
              onClick={onComplete}
              className="min-h-[44px] min-w-[44px] select-none rounded-lg border-2 border-emerald-400/50 bg-emerald-900 px-6 py-2 font-vt323 text-xl text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
