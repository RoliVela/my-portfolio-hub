'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { playPopSound, DinoAudioEngine } from '@/lib/sfx';
import { PopBurst } from '@/components/game/GameParticles';

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
const DAY_NIGHT_PERIOD = 60 * 60; // frames for a full day/night cycle (60s at 60fps)

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bl] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const blVal = Math.round(ab + (bl - ab) * t);
  return `rgb(${r}, ${g}, ${blVal})`;
}

interface DayNightColors {
  topColor: string;
  bottomColor: string;
  starOpacity: number;
  phase: number;
  dayness: number;
}

function getDayNightColors(frame: number): DayNightColors {
  const phase = (frame % DAY_NIGHT_PERIOD) / DAY_NIGHT_PERIOD;
  const stops = [
    { at: 0.0, top: '#0f0826', bottom: '#1a0b2e' },
    { at: 0.25, top: '#2c1445', bottom: '#5a3b4d' },
    { at: 0.5, top: '#60a5fa', bottom: '#f9a8d4' },
    { at: 0.75, top: '#4a2b4d', bottom: '#2c1445' },
    { at: 1.0, top: '#0f0826', bottom: '#1a0b2e' },
  ];
  let i = 0;
  while (i < stops.length - 1 && phase > stops[i + 1].at) {
    i += 1;
  }
  const start = stops[i]!;
  const end = stops[i + 1] ?? start;
  const t = end.at === start.at ? 0 : (phase - start.at) / (end.at - start.at);

  const topColor = lerpColor(start.top, end.top, t);
  const bottomColor = lerpColor(start.bottom, end.bottom, t);
  const dayness = (Math.sin((phase - 0.25) * Math.PI * 2) + 1) / 2;
  const starOpacity = 1 - dayness;
  return { topColor, bottomColor, starOpacity, phase, dayness };
}

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
  const [popEffects, setPopEffects] = useState<{ id: number; x: number; y: number; particleColorClass?: string; ringColorClass?: string }[]>([]);

  const dinoYRef = useRef(GROUND_Y - DINO_SIZE);
  const popIdRef = useRef(0);
  const dinoVyRef = useRef(0);
  const audioEngineRef = useRef<DinoAudioEngine | null>(null);
  const isJumpingRef = useRef(false);
  const isDuckingRef = useRef(false);
  const landingTimerRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const speedRef = useRef(BASE_SPEED);
  const lastAudioSpeedRef = useRef(BASE_SPEED);
  const frameRef = useRef(0);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const highScoreRef = useRef<number>(readStoredDinoHighScore());
  const freezeFramesRef = useRef(0);
  const shakeFramesRef = useRef(0);

  const resetGame = useCallback(() => {
    dinoYRef.current = GROUND_Y - DINO_SIZE;
    dinoVyRef.current = 0;
    isJumpingRef.current = false;
    isDuckingRef.current = false;
    obstaclesRef.current = [];
    speedRef.current = BASE_SPEED;
    lastAudioSpeedRef.current = BASE_SPEED;
    frameRef.current = 0;
    scoreRef.current = 0;
    gameOverRef.current = false;
    freezeFramesRef.current = 0;
    shakeFramesRef.current = 0;
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    setPopEffects([]);
    audioEngineRef.current?.start();
  }, []);

  const spawnPop = useCallback((x: number, y: number, particleColorClass?: string, ringColorClass?: string) => {
    const id = popIdRef.current++;
    setPopEffects((prev) => [...prev, { id, x, y, particleColorClass, ringColorClass }]);
    setTimeout(() => {
      setPopEffects((prev) => prev.filter((p) => p.id !== id));
    }, 500);
  }, []);

  const startJump = useCallback(() => {
    if (gameOverRef.current) {
      resetGame();
      return;
    }
    if (!isJumpingRef.current) {
      dinoVyRef.current = JUMP_STRENGTH;
      isJumpingRef.current = true;
      audioEngineRef.current?.start();
      spawnPop(DINO_X + DINO_SIZE / 2, GROUND_Y);
    }
  }, [resetGame, spawnPop]);

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
    audioEngineRef.current = new DinoAudioEngine();
    return () => {
      audioEngineRef.current?.stop();
      audioEngineRef.current = null;
    };
  }, []);

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

    let cachedDayNight: DayNightColors | null = null;
    const getCurrentDayNight = () => {
      if (!cachedDayNight) {
        cachedDayNight = getDayNightColors(frameRef.current);
      }
      return cachedDayNight;
    };

    // Shared pixel-art block helper. Inverse-scales the outline so it stays crisp
    // even when the drawing context is squashed or stretched.
    const drawBlock = (
      bx: number,
      by: number,
      bw: number,
      bh: number,
      color: string,
      outline: string,
      scaleX = 1,
      scaleY = 1
    ) => {
      ctx.fillStyle = outline;
      ctx.fillRect(bx - 1 / scaleX, by - 1 / scaleY, bw + 2 / scaleX, bh + 2 / scaleY);
      ctx.fillStyle = color;
      ctx.fillRect(bx, by, bw, bh);
    };

    const drawSky = () => {
      const { topColor, bottomColor, starOpacity } = getCurrentDayNight();

      const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      gradient.addColorStop(0, topColor);
      gradient.addColorStop(1, bottomColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);

      // Stars fade out during the day and shine at night
      if (starOpacity > 0.01) {
        ctx.fillStyle = `rgba(251, 207, 232, ${starOpacity})`;
        for (let j = 0; j < 30; j += 1) {
          const starX = (j * 47 - frameRef.current * 0.2) % CANVAS_WIDTH;
          const x = starX < 0 ? starX + CANVAS_WIDTH : starX;
          const y = (j * 93) % (GROUND_Y - 40);
          if (Math.sin(frameRef.current * 0.05 + j) > -0.5) {
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }
    };

    const drawSun = () => {
      const cx = CANVAS_WIDTH - 80;
      const cy = 60;
      const radius = 30;

      const { topColor, dayness } = getCurrentDayNight();

      // Synthwave gradient sun; smoothly transitions from warm dawn/dusk to bright midday,
      // and dims at night so it doesn't glow against a dark sky.
      const sunLerp = Math.max(0, Math.min(1, (dayness - 0.2) / 0.8));
      const sunTop = lerpColor('#f97316', '#f9a8d4', sunLerp);
      const sunBottom = lerpColor('#fb923c', '#fde047', sunLerp);
      const sunOpacity = 0.4 + dayness * 0.6;

      const sunGrad = ctx.createLinearGradient(0, cy - radius, 0, cy + radius);
      sunGrad.addColorStop(0, sunTop);
      sunGrad.addColorStop(1, sunBottom);
      ctx.fillStyle = sunGrad;
      ctx.globalAlpha = sunOpacity;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Horizontal retro cuts (blend with current sky top)
      ctx.fillStyle = topColor;
      for (let i = 0; i < 5; i += 1) {
        const yCut = cy + 5 + i * 6;
        const cutHeight = i + 1;
        ctx.fillRect(cx - radius, yCut, radius * 2, cutHeight);
      }
    };

    const drawClouds = () => {
      ctx.fillStyle = 'rgba(251, 207, 232, 0.15)';
      // Slow parallax drift; the whole cloud band scrolls left and wraps seamlessly.
      const spacing = 500;
      const cloudSpeed = 0.3;
      const offset = (frameRef.current * cloudSpeed) % spacing;

      for (let xBase = -offset; xBase < CANVAS_WIDTH + spacing; xBase += spacing) {
        // Cloud A with gentle vertical bob
        const cloud1X = xBase + 80 + Math.sin(frameRef.current * 0.005) * 10;
        const cloud1Y = 45 + Math.sin(frameRef.current * 0.003 + 1) * 5;
        ctx.fillRect(cloud1X - 10, cloud1Y + 6, 68, 14);
        ctx.fillRect(cloud1X + 2, cloud1Y - 6, 48, 18);
        ctx.fillRect(cloud1X + 16, cloud1Y - 14, 24, 14);

        // Cloud B with its own offset and bob
        const cloud2X = xBase + 300 + Math.sin(frameRef.current * 0.004) * 12;
        const cloud2Y = 70 + Math.sin(frameRef.current * 0.003) * 6;
        ctx.fillRect(cloud2X - 10, cloud2Y + 6, 68, 14);
        ctx.fillRect(cloud2X + 2, cloud2Y - 6, 48, 18);
        ctx.fillRect(cloud2X + 16, cloud2Y - 14, 24, 14);
      }
    };

    const drawCitySkyline = () => {
      const width = 140;
      const offset = (frameRef.current * speedRef.current * 0.1) % width;

      const drawWindow = (wx: number, wy: number, color = 'rgba(255, 248, 180, 0.95)') => {
        // Soft glow behind the window
        ctx.fillStyle = 'rgba(255, 248, 180, 0.22)';
        ctx.fillRect(wx - 1, wy - 1, 6, 6);
        // Bright window core
        ctx.fillStyle = color;
        ctx.fillRect(wx, wy, 4, 4);
      };

      for (let x = -offset; x < CANVAS_WIDTH; x += width) {
        // Buildings
        ctx.fillStyle = '#241038';
        ctx.fillRect(x + 10, GROUND_Y - 70, 20, 70);
        ctx.fillRect(x + 35, GROUND_Y - 45, 30, 45);
        ctx.fillRect(x + 70, GROUND_Y - 85, 25, 85);
        ctx.fillRect(x + 105, GROUND_Y - 35, 20, 35);

        // Glowing windows (fixed positions so they don't flicker)
        // Tall building 1
        drawWindow(x + 14, GROUND_Y - 64);
        drawWindow(x + 22, GROUND_Y - 52);
        drawWindow(x + 16, GROUND_Y - 40);
        drawWindow(x + 20, GROUND_Y - 26);

        // Mid building 2
        drawWindow(x + 40, GROUND_Y - 36);
        drawWindow(x + 50, GROUND_Y - 36);
        drawWindow(x + 42, GROUND_Y - 22);
        drawWindow(x + 52, GROUND_Y - 22);

        // Tall building 3
        drawWindow(x + 76, GROUND_Y - 76);
        drawWindow(x + 84, GROUND_Y - 62);
        drawWindow(x + 76, GROUND_Y - 48);
        drawWindow(x + 84, GROUND_Y - 34);
        drawWindow(x + 80, GROUND_Y - 20);

        // Small building 4
        drawWindow(x + 112, GROUND_Y - 28);
        drawWindow(x + 120, GROUND_Y - 28);
        drawWindow(x + 112, GROUND_Y - 16);
      }
    };

    const drawTrees = () => {
      ctx.fillStyle = '#2d1445';
      const width = 90;
      const offset = (frameRef.current * speedRef.current * 0.2) % width;
      for (let x = -offset; x < CANVAS_WIDTH; x += width) {
        // Tall tree
        ctx.fillRect(x + 15, GROUND_Y - 25, 8, 25);
        ctx.fillRect(x + 5, GROUND_Y - 45, 28, 20);
        ctx.fillRect(x + 10, GROUND_Y - 55, 18, 10);
        // Small tree
        ctx.fillRect(x + 60, GROUND_Y - 15, 6, 15);
        ctx.fillRect(x + 52, GROUND_Y - 30, 22, 15);
        ctx.fillRect(x + 56, GROUND_Y - 40, 14, 10);
      }
    };

    const drawMountains = () => {
      ctx.fillStyle = '#3a1c4a';
      const mountOffset = (frameRef.current * speedRef.current * 0.3) % 100;
      for (let x = -mountOffset; x < CANVAS_WIDTH; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.lineTo(x + 50, GROUND_Y - 40);
        ctx.lineTo(x + 100, GROUND_Y);
        ctx.fill();
      }
    };

    const drawGround = () => {
      ctx.fillStyle = '#100914';
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

      // Neon horizon line
      ctx.strokeStyle = '#c026d3';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
      ctx.stroke();

      // Scrolling ground texture
      ctx.fillStyle = '#a21caf';
      const offset = (frameRef.current * speedRef.current) % 40;
      for (let x = -offset; x < CANVAS_WIDTH; x += 40) {
        ctx.fillRect(x + 10, GROUND_Y + 5, 8, 2);
        ctx.fillRect(x + 25, GROUND_Y + 15, 4, 2);
        ctx.fillRect(x + 5, GROUND_Y + 25, 12, 2);
      }
    };

    const drawDinoSprite = (x: number, y: number, ducking: boolean) => {
      const bodyHeight = ducking ? DINO_SIZE * 0.6 : DINO_SIZE;
      const yOffset = DINO_SIZE - bodyHeight;

      // Squish / stretch based on landing and velocity
      let scaleX = 1;
      let scaleY = 1;
      if (landingTimerRef.current > 0) {
        scaleX = 1.25;
        scaleY = 0.75;
      } else if (dinoVyRef.current < -3) {
        scaleX = 0.85;
        scaleY = 1.15;
      } else if (dinoVyRef.current > 3) {
        scaleX = 0.9;
        scaleY = 1.1;
      }

      ctx.save();
      ctx.translate(x + DINO_SIZE / 2, y + DINO_SIZE);
      ctx.scale(scaleX, scaleY);
      ctx.translate(-(x + DINO_SIZE / 2), -(y + DINO_SIZE));

      const OUTLINE = '#1e1224';
      const SKIN = '#e879f9';
      const SKIN_SHADOW = '#c026d3';
      const HIGHLIGHT = '#f5a6fd';

      // Body
      drawBlock(x + 8, y + 10 + yOffset, 28, bodyHeight - 10, SKIN, OUTLINE, scaleX, scaleY);
      // Highlight on upper-left torso
      ctx.fillStyle = HIGHLIGHT;
      ctx.fillRect(x + 9, y + 11 + yOffset, 8, bodyHeight - 14);
      // Head
      drawBlock(x + 28, y + 4 + yOffset, 16, 12, SKIN, OUTLINE, scaleX, scaleY);
      ctx.fillStyle = HIGHLIGHT;
      ctx.fillRect(x + 29, y + 5 + yOffset, 8, 4);
      // Snout
      drawBlock(x + 36, y + 6 + yOffset, 8, 8, SKIN, OUTLINE, scaleX, scaleY);
      // Eye
      drawBlock(x + 34, y + 6 + yOffset, 4, 4, '#000000', OUTLINE, scaleX, scaleY);

      // Tail (attached to torso)
      drawBlock(x, y + 16 + yOffset, 8, 8, SKIN_SHADOW, OUTLINE, scaleX, scaleY);
      drawBlock(x - 6, y + 18 + yOffset, 6, 6, SKIN_SHADOW, OUTLINE, scaleX, scaleY);

      // Back spikes
      ctx.fillStyle = SKIN_SHADOW;
      ctx.fillRect(x + 10, y + 6 + yOffset, 4, 4);
      ctx.fillRect(x + 14, y + 8 + yOffset, 4, 4);
      ctx.fillRect(x + 18, y + 6 + yOffset, 4, 4);

      // Legs
      const legOffset = Math.floor(frameRef.current / 10) % 2 === 0 ? 0 : 4;
      if (ducking) {
        drawBlock(x + 10 + legOffset, y + yOffset + bodyHeight - 2, 8, 5, SKIN_SHADOW, OUTLINE, scaleX, scaleY);
        drawBlock(x + 24 - legOffset, y + yOffset + bodyHeight - 2, 8, 5, SKIN_SHADOW, OUTLINE, scaleX, scaleY);
      } else {
        drawBlock(x + 10 + legOffset, y + bodyHeight - 2, 8, 8, SKIN_SHADOW, OUTLINE, scaleX, scaleY);
        drawBlock(x + 24 - legOffset, y + bodyHeight - 2, 8, 8, SKIN_SHADOW, OUTLINE, scaleX, scaleY);
      }

      ctx.restore();
    };

    const drawDino = () => {
      const x = DINO_X;
      const y = dinoYRef.current;
      const ducking = isDuckingRef.current;

      // Speed trail ghosts
      if (speedRef.current > BASE_SPEED + 2 && !gameOverRef.current) {
        ctx.save();
        ctx.globalAlpha = 0.25;
        const trailOffset = speedRef.current * 1.5;
        drawDinoSprite(x - trailOffset, y, ducking);
        ctx.restore();
      }

      drawDinoSprite(x, y, ducking);
    };

    const drawCactus = (obstacle: Obstacle) => {
      const { x, y, width, height } = obstacle;
      const OUTLINE = '#1e1224';
      const MAIN = '#a21caf';
      const SHADOW = '#701a75';
      const HIGHLIGHT = '#d946ef';

      // Main trunk with highlight
      drawBlock(x + width * 0.35, y, width * 0.3, height, MAIN, OUTLINE);
      ctx.fillStyle = HIGHLIGHT;
      ctx.fillRect(x + width * 0.35 + 2, y + 2, width * 0.1, height - 4);

      // Arms
      drawBlock(x, y + height * 0.3, width * 0.35, height * 0.15, MAIN, OUTLINE);
      drawBlock(x, y + height * 0.2, width * 0.15, height * 0.3, MAIN, OUTLINE);
      drawBlock(x + width * 0.65, y + height * 0.4, width * 0.35, height * 0.15, MAIN, OUTLINE);
      drawBlock(x + width * 0.85, y + height * 0.3, width * 0.15, height * 0.3, MAIN, OUTLINE);

      // Ground shadow
      ctx.fillStyle = SHADOW;
      ctx.fillRect(x + width * 0.35, y + height, width * 0.3, 3);
    };

    const drawFlyingCat = (obstacle: Obstacle) => {
      const { x, y, width, height } = obstacle;
      const hover = Math.sin(frameRef.current * 0.15) * 3;
      const catX = x;
      const catY = y + hover;
      const legOffset = Math.sin(frameRef.current * 0.2) * 2;

      const OUTLINE = '#1e1224';
      const FUR = '#d8b4fe';
      const FUR_SHADOW = '#b07ce8';
      const FUR_HIGHLIGHT = '#ecdbff';

      // Tail (behind body)
      drawBlock(catX + width * 0.15, catY + height * 0.6, width * 0.15, height * 0.1, FUR_SHADOW, OUTLINE);
      drawBlock(catX + width * 0.05, catY + height * 0.65, width * 0.1, height * 0.15, FUR_SHADOW, OUTLINE);
      drawBlock(catX - width * 0.05, catY + height * 0.75, width * 0.1, height * 0.1, FUR_SHADOW, OUTLINE);

      // Body block
      drawBlock(catX + width * 0.25, catY + height * 0.5, width * 0.55, height * 0.35, FUR, OUTLINE);
      // Lighter highlight along back
      ctx.fillStyle = FUR_HIGHLIGHT;
      ctx.fillRect(catX + width * 0.25, catY + height * 0.5, width * 0.2, height * 0.1);

      // Head block
      drawBlock(catX + width * 0.6, catY + height * 0.25, width * 0.35, height * 0.35, FUR, OUTLINE);
      // Ears as small squares
      drawBlock(catX + width * 0.65, catY + height * 0.1, width * 0.1, height * 0.15, FUR, OUTLINE);
      drawBlock(catX + width * 0.8, catY + height * 0.1, width * 0.1, height * 0.15, FUR, OUTLINE);

      // Legs (hovering blocks)
      drawBlock(catX + width * 0.3, catY + height * 0.85, width * 0.12, height * 0.2, FUR, OUTLINE);
      drawBlock(catX + width * 0.55, catY + height * 0.85, width * 0.12, height * 0.2, FUR, OUTLINE);
      // Animated dangling paws
      drawBlock(catX + width * 0.3 - legOffset, catY + height * 1.05, width * 0.08, height * 0.1, FUR_SHADOW, OUTLINE);
      drawBlock(catX + width * 0.6 + legOffset, catY + height * 1.05, width * 0.08, height * 0.1, FUR_SHADOW, OUTLINE);

      // Eye
      drawBlock(catX + width * 0.75, catY + height * 0.35, width * 0.08, height * 0.08, '#1e1224', OUTLINE);
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
      // Keep rendering briefly after game over to show freeze/shake impact.
      const active = !gameOverRef.current || shakeFramesRef.current > 0 || freezeFramesRef.current > 0;
      if (!active) return;

      // Apply screen shake with decaying intensity.
      ctx.save();
      if (shakeFramesRef.current > 0) {
        shakeFramesRef.current -= 1;
        const intensity = shakeFramesRef.current * 0.4;
        ctx.translate((Math.random() - 0.5) * intensity, (Math.random() - 0.5) * intensity);
      }

      drawSky();
      drawSun();
      drawClouds();
      drawCitySkyline();
      drawTrees();
      drawMountains();
      drawGround();

      // Freeze frame: skip physics updates but keep drawing the last frame.
      if (freezeFramesRef.current > 0) {
        freezeFramesRef.current -= 1;
      } else if (!gameOverRef.current) {
        dinoVyRef.current += GRAVITY;
        dinoYRef.current += dinoVyRef.current;

        if (dinoYRef.current >= GROUND_Y - DINO_SIZE) {
          if (isJumpingRef.current) {
            landingTimerRef.current = 8;
            spawnPop(DINO_X + DINO_SIZE / 2, GROUND_Y, 'bg-gray-300', 'border-gray-300 bg-gray-300/40');
          }
          dinoYRef.current = GROUND_Y - DINO_SIZE;
          dinoVyRef.current = 0;
          isJumpingRef.current = false;
        }

        // Decrement landing squish timer
        if (landingTimerRef.current > 0) {
          landingTimerRef.current -= 1;
        }

        speedRef.current = Math.min(MAX_SPEED, BASE_SPEED + scoreRef.current / 500);
        if (Math.abs(speedRef.current - lastAudioSpeedRef.current) > 0.1) {
          lastAudioSpeedRef.current = speedRef.current;
          audioEngineRef.current?.setSpeed(speedRef.current);
        }

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
      }

      drawDino();
      drawObstacles();

      if (checkCollision()) {
        gameOverRef.current = true;
        setGameOver(true);
        setIsPlaying(false);
        audioEngineRef.current?.stop();
        spawnPop(DINO_X + DINO_SIZE / 2, dinoYRef.current + DINO_SIZE / 2);
        if (scoreRef.current > highScoreRef.current) {
          highScoreRef.current = Math.floor(scoreRef.current);
          setHighScore(highScoreRef.current);
          try {
            localStorage.setItem('dino-high-score', String(highScoreRef.current));
          } catch {
            // ignore storage errors
          }
        }
        // Brief hit-stop and screen shake for impact.
        freezeFramesRef.current = 10;
        shakeFramesRef.current = 20;
      }

      ctx.restore();

      rafRef.current = requestAnimationFrame(gameLoop);
    };

    rafRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, spawnPop]);

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
        {popEffects.map((effect) => (
          <PopBurst
            key={effect.id}
            id={effect.id}
            x={effect.x}
            y={effect.y}
            particleColorClass={effect.particleColorClass}
            ringColorClass={effect.ringColorClass}
          />
        ))}
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
