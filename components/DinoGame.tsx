'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface DinoGameProps {
  onComplete?: () => void;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
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

export default function DinoGame({ onComplete }: DinoGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const dinoYRef = useRef(GROUND_Y - DINO_SIZE);
  const dinoVyRef = useRef(0);
  const isJumpingRef = useRef(false);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const speedRef = useRef(BASE_SPEED);
  const frameRef = useRef(0);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);

  const resetGame = useCallback(() => {
    dinoYRef.current = GROUND_Y - DINO_SIZE;
    dinoVyRef.current = 0;
    isJumpingRef.current = false;
    obstaclesRef.current = [];
    speedRef.current = BASE_SPEED;
    frameRef.current = 0;
    scoreRef.current = 0;
    gameOverRef.current = false;
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  }, []);

  const jump = useCallback(() => {
    if (gameOverRef.current) {
      resetGame();
      return;
    }
    if (!isJumpingRef.current) {
      dinoVyRef.current = JUMP_STRENGTH;
      isJumpingRef.current = true;
    }
  }, [resetGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawSky = () => {
      const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#334155');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);
    };

    const drawSun = () => {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH - 60, 40, 18, 0, Math.PI * 2);
      ctx.fill();
      // Pixel sun rays
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x1 = CANVAS_WIDTH - 60 + Math.cos(angle) * 24;
        const y1 = 40 + Math.sin(angle) * 24;
        const x2 = CANVAS_WIDTH - 60 + Math.cos(angle) * 32;
        const y2 = 40 + Math.sin(angle) * 32;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    const drawClouds = () => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      const cloud1X = 120 + Math.sin(frameRef.current * 0.005) * 10;
      const cloud2X = 350 + Math.sin(frameRef.current * 0.004) * 12;
      [cloud1X, cloud2X].forEach((cx, i) => {
        const cy = i === 0 ? 45 : 70;
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.arc(cx + 22, cy, 24, 0, Math.PI * 2);
        ctx.arc(cx + 48, cy, 18, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawGround = () => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
      ctx.stroke();

      // Moving ground dots for speed sensation
      ctx.fillStyle = '#475569';
      const offset = (frameRef.current * speedRef.current) % 40;
      for (let x = -offset; x < CANVAS_WIDTH; x += 40) {
        ctx.fillRect(x + 20, GROUND_Y + 10, 6, 3);
      }
    };

    const drawDino = () => {
      const x = DINO_X;
      const y = dinoYRef.current;

      // Body (green)
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(x + 8, y + 10, 28, 22);

      // Head
      ctx.fillRect(x + 28, y, 16, 16);

      // Eye
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 36, y + 4, 4, 4);

      // Legs (alternate when running)
      ctx.fillStyle = '#22c55e';
      const legOffset = Math.floor(frameRef.current / 10) % 2 === 0 ? 0 : 4;
      ctx.fillRect(x + 10 + legOffset, y + 32, 8, 8);
      ctx.fillRect(x + 24 - legOffset, y + 32, 8, 8);

      // Tail
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(x, y + 16, 8, 8);
    };

    const drawCactus = (obstacle: Obstacle) => {
      const { x, y, width, height } = obstacle;

      // Main trunk
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(x + width * 0.35, y, width * 0.3, height);

      // Left arm
      ctx.fillRect(x, y + height * 0.3, width * 0.35, height * 0.15);
      ctx.fillRect(x, y + height * 0.2, width * 0.15, height * 0.3);

      // Right arms
      ctx.fillRect(x + width * 0.65, y + height * 0.4, width * 0.35, height * 0.15);
      ctx.fillRect(x + width * 0.85, y + height * 0.3, width * 0.15, height * 0.3);

      // Outline detail
      ctx.fillStyle = '#14532d';
      ctx.fillRect(x + width * 0.35, y + height, width * 0.3, 3);
    };

    const drawObstacles = () => {
      obstaclesRef.current.forEach((obstacle) => {
        drawCactus(obstacle);
      });
    };

    const checkCollision = () => {
      const dino = {
        x: DINO_X + 4,
        y: dinoYRef.current + 4,
        width: DINO_SIZE - 8,
        height: DINO_SIZE - 8,
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

        // Update dino physics
        dinoVyRef.current += GRAVITY;
        dinoYRef.current += dinoVyRef.current;

        if (dinoYRef.current >= GROUND_Y - DINO_SIZE) {
          dinoYRef.current = GROUND_Y - DINO_SIZE;
          dinoVyRef.current = 0;
          isJumpingRef.current = false;
        }

        // Increase speed gradually
        speedRef.current = Math.min(MAX_SPEED, BASE_SPEED + scoreRef.current / 500);

        // Spawn obstacles
        frameRef.current += 1;
        if (frameRef.current % Math.max(60, 150 - Math.floor(scoreRef.current / 20)) === 0) {
          const height = 30 + Math.random() * 30;
          obstaclesRef.current.push({
            x: CANVAS_WIDTH,
            y: GROUND_Y - height,
            width: 24,
            height,
          });
        }

        // Move obstacles
        obstaclesRef.current = obstaclesRef.current
          .map((obstacle) => ({ ...obstacle, x: obstacle.x - speedRef.current }))
          .filter((obstacle) => obstacle.x + obstacle.width > 0);

        // Update score
        scoreRef.current += 0.1;
        setScore(Math.floor(scoreRef.current));

        drawDino();
        drawObstacles();

        // Check collision
        if (checkCollision()) {
          gameOverRef.current = true;
          setGameOver(true);
          setIsPlaying(false);
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
    <div className="flex w-full max-w-2xl flex-col items-center gap-4 rounded-lg border-4 border-white bg-black p-6 shadow-[0_0_0_4px_#000]">
      <h2 className="font-vt323 text-3xl text-white">No Internet Dinosaur</h2>
      <p className="text-center font-vt323 text-lg text-white/80">
        Press Space to jump. Avoid the obstacles.
      </p>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={jump}
          className="w-full max-w-[600px] cursor-pointer rounded bg-zinc-900"
          aria-label="Dinosaur game canvas. Press space to jump."
        />
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-vt323 text-4xl text-white">Game Over</p>
            <p className="font-vt323 text-xl text-white/80">Score: {score}</p>
            <p className="font-vt323 text-sm text-white/60">Press Space or click to restart</p>
          </div>
        )}
      </div>

      <div className="flex w-full items-center justify-between">
        <p className="font-vt323 text-2xl text-white">Score: {Math.floor(score)}</p>
        <button
          type="button"
          onClick={onComplete}
          className="rounded border-2 border-white/50 bg-black px-6 py-2 font-vt323 text-xl text-white transition hover:border-white hover:bg-white/10"
        >
          Exit
        </button>
      </div>
    </div>
  );
}
