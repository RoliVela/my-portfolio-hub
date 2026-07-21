'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { playPopSound } from '@/lib/sfx';

interface DinoGameProps {
  onComplete?: () => void;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  isFlying: boolean;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 200;
const GROUND_Y = 160;
const DINO_SIZE = 40;
const DINO_X = 50;
const GRAVITY = 0.6;
const JUMP_STRENGTH = -12;
const BASE_SPEED = 4;
const MAX_SPEED = 12;

function readStoredDinoHighScore(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const saved = localStorage.getItem('dino-high-score');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return 0;
}

// Keep onComplete prop available for callers; it's passed by the shared wrapper.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function DinoGame({ onComplete }: DinoGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => readStoredDinoHighScore());
  const [isPlaying, setIsPlaying] = useState(true);

  const dinoYRef = useRef(GROUND_Y - DINO_SIZE);
  const dinoVyRef = useRef(0);
  const isJumpingRef = useRef(false);
  const isDuckingRef = useRef(false);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const speedRef = useRef(BASE_SPEED);
  const frameRef = useRef(0);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const highScoreRef = useRef<number>(readStoredDinoHighScore());

  const resetGame = useCallback(() => {
    dinoYRef.current = GROUND_Y - DINO_SIZE;
    dinoVyRef.current = 0;
    isJumpingRef.current = false;
    isDuckingRef.current = false;
    obstaclesRef.current = [];
    speedRef.current = BASE_SPEED;
    frameRef.current = 0;
    scoreRef.current = 0;
    gameOverRef.current = false;
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  }, []);

  const startJump = useCallback(() => {
    if (gameOverRef.current) {
      resetGame();
      return;
    }
    if (!isJumpingRef.current) {
      dinoVyRef.current = JUMP_STRENGTH;
      isJumpingRef.current = true;
    }
  }, [resetGame]);

  const startDuck = useCallback(() => {
    isDuckingRef.current = true;
  }, []);

  const stopDuck = useCallback(() => {
    isDuckingRef.current = false;
  }, []);

  const jump = useCallback(() => {
    startJump();
  }, [startJump]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        jump();
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        isDuckingRef.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        isDuckingRef.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawSky = () => {
      const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      gradient.addColorStop(0, '#4a1d4a');
      gradient.addColorStop(1, '#2d1b4e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);
    };

    const drawSun = () => {
      const cx = CANVAS_WIDTH - 60;
      const cy = 40;
      const px = 4;

      ctx.fillStyle = '#f9a8d4';
      // Stepped blocky core
      ctx.fillRect(cx - px * 3, cy - px * 4, px * 6, px * 8);
      ctx.fillRect(cx - px * 4, cy - px * 3, px * 8, px * 6);
      ctx.fillRect(cx - px * 2, cy - px * 2, px * 4, px * 4);

      // Rays as small squares
      ctx.fillStyle = '#fbcfe8';
      const rays = [
        { x: 0, y: -5 }, { x: 0, y: 4 },
        { x: -5, y: 0 }, { x: 4, y: 0 },
        { x: -4, y: -4 }, { x: 4, y: -4 },
        { x: -4, y: 3 }, { x: 4, y: 3 },
      ];
      rays.forEach((r) => {
        ctx.fillRect(cx + r.x * px, cy + r.y * px, px, px);
      });
    };

    const drawClouds = () => {
      ctx.fillStyle = 'rgba(251, 207, 232, 0.15)';
      const cloud1X = 120 + Math.sin(frameRef.current * 0.005) * 10;
      const cloud2X = 350 + Math.sin(frameRef.current * 0.004) * 12;
      [cloud1X, cloud2X].forEach((cx, i) => {
        const cy = i === 0 ? 45 : 70;
        // Blocky cloud silhouette made of stacked rectangles
        ctx.fillRect(cx - 10, cy + 6, 68, 14);
        ctx.fillRect(cx + 2, cy - 6, 48, 18);
        ctx.fillRect(cx + 16, cy - 14, 24, 14);
      });
    };

    const drawGround = () => {
      ctx.fillStyle = '#1e1224';
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
      ctx.strokeStyle = '#701a75';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
      ctx.stroke();

      ctx.fillStyle = '#701a75';
      const offset = (frameRef.current * speedRef.current) % 40;
      for (let x = -offset; x < CANVAS_WIDTH; x += 40) {
        ctx.fillRect(x + 20, GROUND_Y + 10, 6, 3);
      }
    };

    const drawDino = () => {
      const x = DINO_X;
      const y = dinoYRef.current;
      const ducking = isDuckingRef.current;
      const bodyHeight = ducking ? DINO_SIZE * 0.6 : DINO_SIZE;
      const yOffset = DINO_SIZE - bodyHeight;

      ctx.fillStyle = '#e879f9';
      // Chunky pixel body
      ctx.fillRect(x + 8, y + 10 + yOffset, 28, bodyHeight - 10);
      ctx.fillRect(x + 28, y + 4 + yOffset, 16, 12);
      // Snout
      ctx.fillRect(x + 36, y + 6 + yOffset, 8, 8);

      // Eye
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 34, y + 6 + yOffset, 4, 4);

      // Tail
      ctx.fillStyle = '#c026d3';
      ctx.fillRect(x - 4, y + 16 + yOffset, 8, 8);
      ctx.fillRect(x - 8, y + 18 + yOffset, 6, 6);

      // Legs
      const legOffset = Math.floor(frameRef.current / 10) % 2 === 0 ? 0 : 4;
      if (ducking) {
        ctx.fillRect(x + 10 + legOffset, y + yOffset + bodyHeight - 2, 8, 5);
        ctx.fillRect(x + 24 - legOffset, y + yOffset + bodyHeight - 2, 8, 5);
      } else {
        ctx.fillRect(x + 10 + legOffset, y + bodyHeight - 2, 8, 8);
        ctx.fillRect(x + 24 - legOffset, y + bodyHeight - 2, 8, 8);
      }
    };

    const drawCactus = (obstacle: Obstacle) => {
      const { x, y, width, height } = obstacle;
      ctx.fillStyle = '#a21caf';

      ctx.fillRect(x + width * 0.35, y, width * 0.3, height);
      ctx.fillRect(x, y + height * 0.3, width * 0.35, height * 0.15);
      ctx.fillRect(x, y + height * 0.2, width * 0.15, height * 0.3);
      ctx.fillRect(x + width * 0.65, y + height * 0.4, width * 0.35, height * 0.15);
      ctx.fillRect(x + width * 0.85, y + height * 0.3, width * 0.15, height * 0.3);

      ctx.fillStyle = '#701a75';
      ctx.fillRect(x + width * 0.35, y + height, width * 0.3, 3);
    };

    const drawFlyingCat = (obstacle: Obstacle) => {
      const { x, y, width, height } = obstacle;
      const hover = Math.sin(frameRef.current * 0.15) * 3;
      const catX = x;
      const catY = y + hover;
      const legOffset = Math.sin(frameRef.current * 0.2) * 2;

      ctx.fillStyle = '#d8b4fe';
      // Body block
      ctx.fillRect(catX + width * 0.25, catY + height * 0.5, width * 0.55, height * 0.35);
      // Head block
      ctx.fillRect(catX + width * 0.6, catY + height * 0.25, width * 0.35, height * 0.35);
      // Ears as small squares
      ctx.fillRect(catX + width * 0.65, catY + height * 0.1, width * 0.1, height * 0.15);
      ctx.fillRect(catX + width * 0.8, catY + height * 0.1, width * 0.1, height * 0.15);

      // Tail (stepped blocks)
      ctx.fillRect(catX + width * 0.15, catY + height * 0.6, width * 0.15, height * 0.1);
      ctx.fillRect(catX + width * 0.05, catY + height * 0.65, width * 0.1, height * 0.15);
      ctx.fillRect(catX - width * 0.05, catY + height * 0.75, width * 0.1, height * 0.1);

      // Legs (hovering blocks)
      ctx.fillRect(catX + width * 0.3, catY + height * 0.85, width * 0.12, height * 0.2);
      ctx.fillRect(catX + width * 0.55, catY + height * 0.85, width * 0.12, height * 0.2);
      // Animated dangling paws
      ctx.fillRect(catX + width * 0.3 - legOffset, catY + height * 1.05, width * 0.08, height * 0.1);
      ctx.fillRect(catX + width * 0.6 + legOffset, catY + height * 1.05, width * 0.08, height * 0.1);

      // Eye
      ctx.fillStyle = '#1e1224';
      ctx.fillRect(catX + width * 0.75, catY + height * 0.35, width * 0.08, height * 0.08);
    };

    const drawObstacles = () => {
      obstaclesRef.current.forEach((obstacle) => {
        if (obstacle.isFlying) {
          drawFlyingCat(obstacle);
        } else {
          drawCactus(obstacle);
        }
      });
    };

    const checkCollision = () => {
      const ducking = isDuckingRef.current;
      const dinoWidth = DINO_SIZE - 8;
      const dinoHeight = ducking ? (DINO_SIZE - 8) * 0.6 : DINO_SIZE - 8;
      const dinoY = dinoYRef.current + (DINO_SIZE - dinoHeight);
      const dino = {
        x: DINO_X + 4,
        y: dinoY + 4,
        width: dinoWidth,
        height: dinoHeight,
      };

      return obstaclesRef.current.some((obstacle) => {
        const overlapX = dino.x < obstacle.x + obstacle.width && dino.x + dino.width > obstacle.x;
        const overlapY = dino.y < obstacle.y + obstacle.height && dino.y + dino.height > obstacle.y;
        return overlapX && overlapY;
      });
    };

    const gameLoop = () => {
      if (!gameOverRef.current && isPlaying) {
        drawSky();
        drawSun();
        drawClouds();
        drawGround();

        dinoVyRef.current += GRAVITY;
        dinoYRef.current += dinoVyRef.current;

        if (dinoYRef.current >= GROUND_Y - DINO_SIZE) {
          dinoYRef.current = GROUND_Y - DINO_SIZE;
          dinoVyRef.current = 0;
          isJumpingRef.current = false;
        }

        speedRef.current = Math.min(MAX_SPEED, BASE_SPEED + scoreRef.current / 500);

        frameRef.current += 1;
        if (frameRef.current % Math.max(60, 150 - Math.floor(scoreRef.current / 20)) === 0) {
          const isFlying = Math.random() < 0.35;
          if (isFlying) {
            const height = 28 + Math.random() * 24;
            obstaclesRef.current.push({
              x: CANVAS_WIDTH,
              y: GROUND_Y - height - 20,
              width: 24,
              height,
              isFlying: true,
            });
          } else {
            const height = 30 + Math.random() * 30;
            obstaclesRef.current.push({
              x: CANVAS_WIDTH,
              y: GROUND_Y - height,
              width: 24,
              height,
              isFlying: false,
            });
          }
        }

        obstaclesRef.current = obstaclesRef.current
          .map((obstacle) => ({ ...obstacle, x: obstacle.x - speedRef.current }))
          .filter((obstacle) => obstacle.x + obstacle.width > 0);

        scoreRef.current += 0.1;
        setScore(Math.floor(scoreRef.current));

        drawDino();
        drawObstacles();

        if (checkCollision()) {
          gameOverRef.current = true;
          setGameOver(true);
          setIsPlaying(false);
          if (scoreRef.current > highScoreRef.current) {
            highScoreRef.current = Math.floor(scoreRef.current);
            setHighScore(highScoreRef.current);
            try {
              localStorage.setItem('dino-high-score', String(highScoreRef.current));
            } catch {
              // ignore storage errors
            }
          }
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          return;
        }

        rafRef.current = requestAnimationFrame(gameLoop);
      }
    };

    rafRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4 rounded-lg border-4 border-pink-300 bg-purple-950 p-6 shadow-[0_0_0_4px_#000]">
      <h2 className="font-vt323 text-3xl text-pink-200">No Internet Dinosaur</h2>
      <p className="text-center font-vt323 text-lg text-pink-100/80">
        Space / ↑ / W to jump · ↓ / S to duck · Avoid the obstacles.
      </p>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={() => {
            playPopSound();
            jump();
          }}
          className="w-full max-w-[600px] cursor-pointer rounded bg-purple-900"
          aria-label="Dinosaur game canvas. Press space, up arrow, or W to jump. Press down arrow or S to duck."
        />
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-vt323 text-4xl text-pink-200">Game Over</p>
            <p className="font-vt323 text-xl text-pink-100/80">Score: {score}</p>
            <p className="font-vt323 text-lg text-pink-100/70">Best: {highScore}</p>
            <p className="font-vt323 text-sm text-pink-100/60">Press Space or click to restart</p>
          </div>
        )}
      </div>

      <div className="flex w-full flex-wrap items-center justify-center gap-4">
        <div className="flex gap-3">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              startJump();
            }}
            className="min-h-[44px] min-w-[44px] select-none rounded border-2 border-pink-300/50 bg-purple-900 px-6 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800"
          >
            Jump
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              startDuck();
            }}
            onPointerUp={stopDuck}
            onPointerLeave={stopDuck}
            onPointerCancel={stopDuck}
            className="min-h-[44px] min-w-[44px] select-none rounded border-2 border-pink-300/50 bg-purple-900 px-6 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800"
          >
            Duck
          </button>
        </div>
        <div className="flex items-center gap-4">
          <p className="font-vt323 text-2xl text-pink-200">Score: {Math.floor(score)}</p>
          <p className="font-vt323 text-xl text-pink-100/70">Best: {highScore}</p>
        </div>
      </div>
    </div>
  );
}
