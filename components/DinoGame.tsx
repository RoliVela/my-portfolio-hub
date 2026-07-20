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

    const drawDino = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(DINO_X, dinoYRef.current, DINO_SIZE, DINO_SIZE);
    };

    const drawGround = () => {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
      ctx.stroke();
    };

    const drawObstacles = () => {
      ctx.fillStyle = '#ffffff';
      obstaclesRef.current.forEach((obstacle) => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      });
    };

    const checkCollision = () => {
      const dino = {
        x: DINO_X,
        y: dinoYRef.current,
        width: DINO_SIZE,
        height: DINO_SIZE,
      };

      return obstaclesRef.current.some((obstacle) => {
        const overlapX = dino.x < obstacle.x + obstacle.width && dino.x + dino.width > obstacle.x;
        const overlapY = dino.y < obstacle.y + obstacle.height && dino.y + dino.height > obstacle.y;
        return overlapX && overlapY;
      });
    };

    const gameLoop = () => {
      if (!gameOverRef.current && isPlaying) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

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
        if (
          frameRef.current % Math.max(60, 150 - Math.floor(scoreRef.current / 20)) === 0
        ) {
          const height = 30 + Math.random() * 30;
          obstaclesRef.current.push({
            x: CANVAS_WIDTH,
            y: GROUND_Y - height,
            width: 20,
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

        // Check collision
        if (checkCollision()) {
          gameOverRef.current = true;
          setGameOver(true);
          setIsPlaying(false);
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          return;
        }

        drawGround();
        drawDino();
        drawObstacles();

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
