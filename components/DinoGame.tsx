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

export default function DinoGame({ onComplete }: DinoGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
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
      ctx.fillStyle = '#f9a8d4';
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH - 60, 40, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fbcfe8';
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
      ctx.fillStyle = 'rgba(251, 207, 232, 0.15)';
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
      ctx.fillRect(x + 8, y + 10 + yOffset, 28, bodyHeight - 10);
      ctx.fillRect(x + 28, y + yOffset, 16, 16);

      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 36, y + 4 + yOffset, 4, 4);

      ctx.fillStyle = '#c026d3';
      const legOffset = Math.floor(frameRef.current / 10) % 2 === 0 ? 0 : 4;
      if (ducking) {
        ctx.fillRect(x + 10 + legOffset, y + bodyHeight - 2, 8, 5);
        ctx.fillRect(x + 24 - legOffset, y + bodyHeight - 2, 8, 5);
      } else {
        ctx.fillRect(x + 10 + legOffset, y + bodyHeight - 2, 8, 8);
        ctx.fillRect(x + 24 - legOffset, y + bodyHeight - 2, 8, 8);
      }

      ctx.fillStyle = '#c026d3';
      ctx.fillRect(x, y + 16 + yOffset, 8, 8);
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

      // Body
      ctx.fillStyle = '#d8b4fe';
      ctx.beginPath();
      ctx.ellipse(catX + width / 2, catY + height * 0.6, width * 0.45, height * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.arc(catX + width * 0.75, catY + height * 0.35, width * 0.22, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      ctx.beginPath();
      ctx.moveTo(catX + width * 0.65, catY + height * 0.2);
      ctx.lineTo(catX + width * 0.72, catY + height * 0.05);
      ctx.lineTo(catX + width * 0.78, catY + height * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(catX + width * 0.78, catY + height * 0.2);
      ctx.lineTo(catX + width * 0.85, catY + height * 0.05);
      ctx.lineTo(catX + width * 0.9, catY + height * 0.2);
      ctx.closePath();
      ctx.fill();

      // Legs (hovering pose)
      ctx.strokeStyle = '#d8b4fe';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      const legOffset = Math.sin(frameRef.current * 0.2) * 2;
      ctx.beginPath();
      ctx.moveTo(catX + width * 0.35, catY + height * 0.75);
      ctx.lineTo(catX + width * 0.25 - legOffset, catY + height * 0.95);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(catX + width * 0.55, catY + height * 0.75);
      ctx.lineTo(catX + width * 0.5 + legOffset, catY + height * 0.95);
      ctx.stroke();

      // Tail
      ctx.beginPath();
      ctx.moveTo(catX + width * 0.15, catY + height * 0.6);
      ctx.quadraticCurveTo(catX - width * 0.1, catY + height * 0.5, catX + width * 0.05, catY + height * 0.75);
      ctx.stroke();

      // Eye
      ctx.fillStyle = '#1e1224';
      ctx.beginPath();
      ctx.arc(catX + width * 0.78, catY + height * 0.32, width * 0.04, 0, Math.PI * 2);
      ctx.fill();
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
              y: GROUND_Y - height - 30,
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
          onClick={jump}
          className="w-full max-w-[600px] cursor-pointer rounded bg-purple-900"
          aria-label="Dinosaur game canvas. Press space, up arrow, or W to jump. Press down arrow or S to duck."
        />
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-vt323 text-4xl text-pink-200">Game Over</p>
            <p className="font-vt323 text-xl text-pink-100/80">Score: {score}</p>
            <p className="font-vt323 text-sm text-pink-100/60">Press Space or click to restart</p>
          </div>
        )}
      </div>

      <div className="flex w-full items-center justify-between">
        <p className="font-vt323 text-2xl text-pink-200">Score: {Math.floor(score)}</p>
        <button
          type="button"
          onClick={onComplete}
          className="rounded border-2 border-pink-300/50 bg-purple-900 px-6 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800"
        >
          Exit
        </button>
      </div>
    </div>
  );
}
