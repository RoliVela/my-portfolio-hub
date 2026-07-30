'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { playPopSound } from '@/lib/sfx';
import { PopBurst, FallingDust, FallingDustOverlay } from '@/components/game/GameParticles';

interface CloudClimberGameProps {
  onComplete?: () => void;
}

// ======================== Tunables ========================
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const LANE_COUNT = 5;
const LANE_WIDTH = CANVAS_WIDTH / LANE_COUNT;
const BLOCK_SIZE = 40;
const BLOCK_FALL_SPEED = 5; // world pixels per frame at ~60fps
const BLOCK_SPAWN_INTERVAL_MS = 1300;
const LAVA_RISE_SPEED = 0.6; // world pixels per frame
const MARSHMALLOW_SIZE = 32;
const BOUNCE_AMPLITUDE = 8;
const BOUNCE_SPEED = 0.005; // radians per ms
const MOVE_SPEED = 0.25; // lane progress per frame (~4 frames to switch)
const GROUND_BUFFER = 120; // keep this much headroom below the highest stack
const HIGH_SCORE_KEY = 'cloud-climber-high-score';

// ======================== Helpers ========================
function readStoredHighScore(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const saved = window.localStorage.getItem(HIGH_SCORE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

interface FallingBlock {
  lane: number;
  y: number; // world Y, bottom-up, top of block
  settled: boolean;
}

export default function CloudClimberGame({ onComplete }: CloudClimberGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(readStoredHighScore);
  const [popEffects, setPopEffects] = useState<{ id: number; x: number; y: number }[]>([]);
  const [dustParticles, setDustParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const popIdRef = useRef(0);
  const dustIdRef = useRef(0);
  const marshmallowPosRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 80 });

  const laneStacksRef = useRef<number[]>(new Array(LANE_COUNT).fill(0));
  const blocksRef = useRef<FallingBlock[]>([]);
  const playerLaneRef = useRef(0);
  const targetLaneRef = useRef(0);
  const laneProgressRef = useRef(0.5); // 0 = previous lane, 1 = target lane
  const lavaYRef = useRef(-200);
  const cameraYRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const scoreRef = useRef(0);
  const highScoreRef = useRef(readStoredHighScore());
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const saveHighScore = useCallback((value: number) => {
    if (value > highScoreRef.current) {
      highScoreRef.current = value;
      setHighScore(value);
      try {
        window.localStorage.setItem(HIGH_SCORE_KEY, String(value));
      } catch {
        // ignore storage errors
      }
    }
  }, []);

  const resetGame = useCallback(() => {
    laneStacksRef.current = new Array(LANE_COUNT).fill(0);
    blocksRef.current = [];
    playerLaneRef.current = 0;
    targetLaneRef.current = 0;
    laneProgressRef.current = 0.5;
    lavaYRef.current = -200;
    cameraYRef.current = 0;
    lastSpawnRef.current = 0;
    scoreRef.current = 0;
    setScore(0);
    setGameState('playing');
    setPopEffects([]);
    setDustParticles([]);
    playPopSound();
  }, []);

  const spawnPop = useCallback((x: number, y: number) => {
    const id = popIdRef.current++;
    setPopEffects((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setPopEffects((prev) => prev.filter((p) => p.id !== id));
    }, 500);
  }, []);

  const spawnDust = useCallback((count = 12) => {
    const fresh = Array.from({ length: count }).map(() => ({
      id: dustIdRef.current++,
      x: Math.random() * 100,
      y: Math.random() * 10,
      color: ['#fde047', '#f472b6', '#60a5fa', '#34d399', '#fb923c'][Math.floor(Math.random() * 5)] ?? '#fde047',
    }));
    setDustParticles((prev) => [...prev, ...fresh]);
    setTimeout(() => {
      setDustParticles((prev) => prev.filter((p) => !fresh.find((f) => f.id === p.id)));
    }, 900);
  }, []);

  const moveLeft = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    const current = playerLaneRef.current;
    const target = clamp(current - 1, 0, LANE_COUNT - 1);
    if (target !== current) {
      targetLaneRef.current = target;
      laneProgressRef.current = 0;
      playPopSound();
      const pos = marshmallowPosRef.current;
      spawnPop(pos.x, pos.y);
    }
  }, [spawnPop]);

  const moveRight = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    const current = playerLaneRef.current;
    const target = clamp(current + 1, 0, LANE_COUNT - 1);
    if (target !== current) {
      targetLaneRef.current = target;
      laneProgressRef.current = 0;
      playPopSound();
      const pos = marshmallowPosRef.current;
      spawnPop(pos.x, pos.y);
    }
  }, [spawnPop]);

  // ======================== Canvas game loop ========================
  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const now = performance.now();

      // Update camera based on tallest stack
      const maxStack = Math.max(...laneStacksRef.current);
      const desiredCamera = Math.max(0, maxStack * BLOCK_SIZE - (CANVAS_HEIGHT - GROUND_BUFFER));
      cameraYRef.current = desiredCamera;

      // Update lava
      lavaYRef.current += LAVA_RISE_SPEED;

      // Spawn blocks
      if (now - lastSpawnRef.current > BLOCK_SPAWN_INTERVAL_MS) {
        lastSpawnRef.current = now;
        const lane = Math.floor(Math.random() * LANE_COUNT);
        blocksRef.current.push({
          lane,
          y: cameraYRef.current + CANVAS_HEIGHT + BLOCK_SIZE + Math.random() * 80,
          settled: false,
        });
      }

      // Update falling blocks
      for (let i = blocksRef.current.length - 1; i >= 0; i -= 1) {
        const block = blocksRef.current[i];
        if (block.settled) continue;

        block.y -= BLOCK_FALL_SPEED;
        const stackTop = laneStacksRef.current[block.lane] * BLOCK_SIZE;

        if (block.y <= stackTop) {
          // Block lands
          if (block.lane === playerLaneRef.current) {
            // Crushed!
            playPopSound();
            spawnDust(15);
            setGameState('gameover');
            saveHighScore(scoreRef.current);
            return;
          }

          block.y = stackTop;
          block.settled = true;
          laneStacksRef.current[block.lane] += 1;
          const newScore = Math.max(
            scoreRef.current,
            laneStacksRef.current[block.lane]
          );
          scoreRef.current = newScore;
          setScore(newScore);
        }

        // Remove blocks that fell far below camera
        if (block.y < cameraYRef.current - BLOCK_SIZE) {
          blocksRef.current.splice(i, 1);
        }
      }

      // Clean settled blocks that are way off screen to avoid memory growth
      blocksRef.current = blocksRef.current.filter(
        (b) => !b.settled || b.y + BLOCK_SIZE >= cameraYRef.current - BLOCK_SIZE
      );

      // Move player between lanes
      if (playerLaneRef.current !== targetLaneRef.current) {
        laneProgressRef.current = clamp(
          laneProgressRef.current + MOVE_SPEED,
          0,
          1
        );
        if (laneProgressRef.current >= 1) {
          playerLaneRef.current = targetLaneRef.current;
          laneProgressRef.current = 0.5;
        }
      }

      // Lava death check
      const playerStackTop = laneStacksRef.current[playerLaneRef.current] * BLOCK_SIZE;
      if (playerStackTop <= lavaYRef.current) {
        playPopSound();
        spawnDust(15);
        setGameState('gameover');
        saveHighScore(scoreRef.current);
        return;
      }

      // ======================== Draw ========================
      // Sky / background
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, '#2d1b4e');
      gradient.addColorStop(1, '#4a1d4a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw lanes
      ctx.strokeStyle = 'rgba(251, 207, 232, 0.15)';
      ctx.lineWidth = 2;
      for (let i = 0; i <= LANE_COUNT; i += 1) {
        const x = i * LANE_WIDTH;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }

      // Draw settled blocks
      blocksRef.current.forEach((block) => {
        if (!block.settled) return;
        drawBlock(ctx, block.lane, block.y, false);
      });

      // Draw falling blocks
      blocksRef.current.forEach((block) => {
        if (block.settled) return;
        drawBlock(ctx, block.lane, block.y, true);
      });

      // Draw marshmallow
      drawMarshmallow(ctx, now);

      // Draw lava
      const lavaScreenY = CANVAS_HEIGHT - (lavaYRef.current - cameraYRef.current);
      if (lavaScreenY < CANVAS_HEIGHT) {
        const lavaGradient = ctx.createLinearGradient(0, lavaScreenY, 0, CANVAS_HEIGHT);
        lavaGradient.addColorStop(0, 'rgba(255, 100, 50, 0.9)');
        lavaGradient.addColorStop(1, 'rgba(180, 30, 0, 0.95)');
        ctx.fillStyle = lavaGradient;
        ctx.fillRect(0, lavaScreenY, CANVAS_WIDTH, CANVAS_HEIGHT - lavaScreenY);
        // Pixel bubbles
        ctx.fillStyle = 'rgba(255, 200, 80, 0.8)';
        const bubbleOffset = (now / 20) % 20;
        for (let x = bubbleOffset; x < CANVAS_WIDTH; x += 40) {
          ctx.fillRect(x, lavaScreenY - 4, 6, 4);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    const drawBlock = (context: CanvasRenderingContext2D, lane: number, worldY: number, falling: boolean) => {
      const x = lane * LANE_WIDTH + (LANE_WIDTH - BLOCK_SIZE) / 2;
      const y = CANVAS_HEIGHT - (worldY + BLOCK_SIZE - cameraYRef.current);

      // Pastel fill
      const hues = [250, 270, 290, 310, 330];
      const hue = hues[lane % hues.length];
      context.fillStyle = `hsl(${hue}, 70%, 75%)`;
      context.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);

      // Pixel outline
      context.strokeStyle = '#1e1224';
      context.lineWidth = 2;
      context.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);

      // Simple highlight
      context.fillStyle = 'rgba(255, 255, 255, 0.3)';
      context.fillRect(x + 4, y + 4, BLOCK_SIZE - 8, 4);

      if (falling) {
        context.fillStyle = 'rgba(255, 255, 255, 0.2)';
        context.fillRect(x + 4, y + 12, BLOCK_SIZE - 8, 4);
      }
    };

    const drawMarshmallow = (context: CanvasRenderingContext2D, time: number) => {
      const fromLane = playerLaneRef.current;
      const toLane = targetLaneRef.current;
      let visualLane: number;
      if (fromLane === toLane) {
        visualLane = fromLane;
      } else {
        // Linear interpolation between lanes based on progress
        visualLane = fromLane + (toLane - fromLane) * laneProgressRef.current;
      }
      const centerX = visualLane * LANE_WIDTH + LANE_WIDTH / 2;
      const stackTop = laneStacksRef.current[playerLaneRef.current] * BLOCK_SIZE;
      const bounce = Math.sin(time * BOUNCE_SPEED) * BOUNCE_AMPLITUDE;
      const bottomY = stackTop + bounce;
      const y = CANVAS_HEIGHT - (bottomY + MARSHMALLOW_SIZE - cameraYRef.current);
      marshmallowPosRef.current = { x: centerX, y: y + MARSHMALLOW_SIZE / 2 };

      const x = centerX - MARSHMALLOW_SIZE / 2;
      const size = MARSHMALLOW_SIZE;

      // Cream body with dark outline
      context.fillStyle = '#1e1224';
      context.fillRect(x - 1, y - 1, size + 2, size + 2);
      context.fillStyle = '#fdf4dc';
      context.fillRect(x, y, size, size);

      // Cute face
      context.fillStyle = '#1e1224';
      context.fillRect(x + size * 0.25, y + size * 0.35, 4, 4);
      context.fillRect(x + size * 0.65, y + size * 0.35, 4, 4);
      context.fillRect(x + size * 0.35, y + size * 0.65, size * 0.3, 3);

      // Highlight
      context.fillStyle = 'rgba(255, 255, 255, 0.6)';
      context.fillRect(x + 4, y + 4, size * 0.3, 3);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [gameState, saveHighScore, spawnDust]);

  // ======================== Keyboard controls ========================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current === 'gameover' && e.code === 'Space') {
        e.preventDefault();
        resetGame();
        return;
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        moveLeft();
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        moveRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [moveLeft, moveRight, resetGame]);

  // The game starts automatically in the 'playing' state.
  // resetGame() is available for restarting after game over.

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4 rounded-lg border-4 border-pink-300 bg-purple-950 p-6 shadow-[0_0_0_4px_#000]">
      <h2 className="font-vt323 text-3xl text-pink-200">Cloud Climber</h2>
      <p className="text-center font-vt323 text-lg text-pink-100/80">
        ← / A and → / D to move · Avoid falling blocks and rising lava.
      </p>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full max-w-[400px] cursor-pointer rounded bg-purple-900"
          aria-label="Cloud Climber game canvas. Use left/right arrows or A/D to move between lanes."
        />
        {popEffects.map((effect) => (
          <PopBurst key={effect.id} id={effect.id} x={effect.x} y={effect.y} />
        ))}
        {gameState === 'gameover' && (
          <FallingDustOverlay>
            {dustParticles.map((p) => (
              <FallingDust key={p.id} id={p.id} x={p.x} y={p.y} color={p.color} />
            ))}
          </FallingDustOverlay>
        )}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-vt323 text-4xl text-pink-200">Game Over</p>
            <p className="font-vt323 text-xl text-pink-100/80">Height: {score}</p>
            <p className="font-vt323 text-lg text-pink-100/70">Best: {highScore}</p>
            <p className="font-vt323 text-sm text-pink-100/60">Press Space or click to restart</p>
          </div>
        )}
      </div>

      <div className="flex w-full flex-wrap items-center justify-center gap-4">
        <div className="flex gap-3">
          <button
            type="button"
            onPointerDown={moveLeft}
            className="min-h-[44px] min-w-[44px] select-none rounded border-2 border-pink-300/50 bg-purple-900 px-6 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800"
          >
            ←
          </button>
          <button
            type="button"
            onPointerDown={moveRight}
            className="min-h-[44px] min-w-[44px] select-none rounded border-2 border-pink-300/50 bg-purple-900 px-6 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800"
          >
            →
          </button>
        </div>
        <div className="flex items-center gap-4">
          <p className="font-vt323 text-2xl text-pink-200">Height: {score}</p>
          <p className="font-vt323 text-xl text-pink-100/70">Best: {highScore}</p>
        </div>
      </div>

      {gameState === 'gameover' && (
        <button
          type="button"
          onClick={resetGame}
          className="min-h-[44px] min-w-[44px] select-none rounded border-2 border-pink-300/50 bg-purple-900 px-6 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800"
        >
          Restart (Space)
        </button>
      )}

      <button
        type="button"
        onClick={onComplete}
        className="min-h-[44px] min-w-[44px] select-none rounded border-2 border-pink-300/50 bg-purple-900 px-6 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800"
      >
        Exit
      </button>
    </div>
  );
}
