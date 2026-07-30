'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { playPopSound } from '@/lib/sfx';
import { PopBurst, FallingDust, FallingDustOverlay } from '@/components/game/GameParticles';
import {
  clamp,
  surfaceHeightAt,
  resolveHorizontalMove,
  isCrushedByFallingBlock,
  type LandedBlock,
} from '@/lib/cloudClimberPhysics';


// ======================== Tunables ========================
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const MIN_BLOCK_WIDTH = 50;
const MAX_BLOCK_WIDTH = 140;
const BLOCK_FALL_SPEED = 4; // world pixels per frame (y decreases)
const BLOCK_SPAWN_INTERVAL_MS = 1000;
const LAVA_RISE_SPEED = 0.5; // world pixels per frame (lavaY increases)
const CHAR_WIDTH = 28;
const CHAR_HEIGHT = 28;
const CHAR_SPEED = 5; // world pixels per frame
const GRAVITY = -0.6; // y decreases each frame when falling
const JUMP_VELOCITY = 13;
const WALL_JUMP_VELOCITY = JUMP_VELOCITY * 0.7;
const WALL_JUMP_KICK = 6;
const WALL_JUMP_KICK_DECAY = 0.88;
const WALL_SLIDE_SPEED = -2;
const CAMERA_THRESHOLD_SCREEN_Y = CANVAS_HEIGHT * 0.5;
const COYOTE_FRAMES = 8;
const FEET_PER_WORLD = 0.25;
const HIGH_SCORE_KEY = 'cloud-climber-high-score';

// ======================== Types ========================
interface FallingBlock {
  x: number;
  width: number;
  y: number; // bottom of the falling block in world-space
  height: number;
  color: string;
}

interface InputState {
  left: boolean;
  right: boolean;
}

interface PuffParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

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

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

const BLOCK_COLORS = [
  '#f472b6', // pink/rose
  '#60a5fa', // blue
  '#22d3ee', // sky blue
  '#fb923c', // coral/orange
  '#34d399', // green
  '#facc15', // tan-ish yellow
  '#a8712a', // brown
  '#818cf8', // indigo
  '#9ca3af', // gray
  '#f87171', // red
];

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  const roundedCtx = ctx as CanvasRenderingContext2D & { roundRect: (x: number, y: number, w: number, h: number, r: number) => void };
  if (typeof roundedCtx.roundRect === 'function') {
    ctx.beginPath();
    roundedCtx.roundRect(x, y, width, height, r);
    ctx.closePath();
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

export default function CloudClimberGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(readStoredHighScore);
  const [popEffects, setPopEffects] = useState<{ id: number; x: number; y: number }[]>([]);
  const [dustParticles, setDustParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const popIdRef = useRef(0);
  const dustIdRef = useRef(0);

  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const landedRef = useRef<LandedBlock[]>([]);
  const fallingRef = useRef<FallingBlock[]>([]);
  const charXRef = useRef(CANVAS_WIDTH / 2 - CHAR_WIDTH / 2);
  const charYRef = useRef(0); // feet position
  const prevCharYRef = useRef(0);
  const charVyRef = useRef(0);
  const groundedRef = useRef(true);
  const lavaYRef = useRef(-200);
  const cameraYRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const scoreRef = useRef(0);
  const highScoreRef = useRef(readStoredHighScore());
  const highestHeadYRef = useRef(0);
  const inputRef = useRef<InputState>({ left: false, right: false });
  const shakeRef = useRef({ frames: 0, intensity: 0 });
  const puffsRef = useRef<PuffParticle[]>([]);
  const squashRef = useRef(1);
  const coyoteTimeRef = useRef(0);
  const wallSideRef = useRef<'left' | 'right' | null>(null);
  const charKickVxRef = useRef(0);
  const wallSlideDustTimerRef = useRef(0);

  const updateHighScore = useCallback((value: number) => {
    if (value > highScoreRef.current) {
      highScoreRef.current = value;
      setHighScore(value);
    }
  }, []);

  const saveHighScore = useCallback((value: number) => {
    updateHighScore(value);
    try {
      window.localStorage.setItem(HIGH_SCORE_KEY, String(highScoreRef.current));
    } catch {
      // ignore storage errors
    }
  }, [updateHighScore]);

  const resetGame = useCallback(() => {
    landedRef.current = [];
    fallingRef.current = [];
    charXRef.current = CANVAS_WIDTH / 2 - CHAR_WIDTH / 2;
    charYRef.current = 0;
    prevCharYRef.current = 0;
    charVyRef.current = 0;
    groundedRef.current = true;
    lavaYRef.current = -200;
    cameraYRef.current = 0;
    lastSpawnRef.current = 0;
    scoreRef.current = 0;
    highestHeadYRef.current = 0;
    inputRef.current = { left: false, right: false };
    shakeRef.current = { frames: 0, intensity: 0 };
    puffsRef.current = [];
    squashRef.current = 1;
    coyoteTimeRef.current = 0;
    wallSideRef.current = null;
    charKickVxRef.current = 0;
    wallSlideDustTimerRef.current = 0;
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

  const spawnPuffs = useCallback(() => {
    const feetX = charXRef.current + CHAR_WIDTH / 2;
    const feetY = charYRef.current;
    for (let i = 0; i < 8; i += 1) {
      puffsRef.current.push({
        x: feetX + randomRange(-CHAR_WIDTH * 0.4, CHAR_WIDTH * 0.4),
        y: feetY + randomRange(-2, 4),
        vx: randomRange(-2, 2),
        vy: randomRange(-3, -1),
        life: 25,
        maxLife: 25,
        size: randomRange(2, 4),
      });
    }
  }, []);

  const spawnLandingDust = useCallback(() => {
    const feetX = charXRef.current + CHAR_WIDTH / 2;
    const feetY = charYRef.current;
    for (let i = 0; i < 10; i += 1) {
      puffsRef.current.push({
        x: feetX + randomRange(-CHAR_WIDTH * 0.5, CHAR_WIDTH * 0.5),
        y: feetY + randomRange(-2, 2),
        vx: randomRange(-3, 3),
        vy: randomRange(1, 3),
        life: 18,
        maxLife: 18,
        size: randomRange(2, 5),
      });
    }
  }, []);

  const spawnWallSlideDust = useCallback(() => {
    const sideX = wallSideRef.current === 'right'
      ? charXRef.current + CHAR_WIDTH
      : charXRef.current;
    const sideY = charYRef.current + CHAR_HEIGHT * 0.5;
    const outward = wallSideRef.current === 'right' ? 1 : -1;
    for (let i = 0; i < 4; i += 1) {
      puffsRef.current.push({
        x: sideX + randomRange(-3, 3),
        y: sideY + randomRange(-CHAR_HEIGHT * 0.3, CHAR_HEIGHT * 0.3),
        vx: randomRange(0, 2) * outward,
        vy: randomRange(-1, 1),
        life: 12,
        maxLife: 12,
        size: randomRange(1.5, 3),
      });
    }
  }, []);

  const jump = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    if (groundedRef.current || coyoteTimeRef.current > 0) {
      charVyRef.current = JUMP_VELOCITY;
      groundedRef.current = false;
      coyoteTimeRef.current = 0;
      squashRef.current = 1.25;
      playPopSound();
      const x = charXRef.current + CHAR_WIDTH / 2;
      const y = CANVAS_HEIGHT - (charYRef.current - cameraYRef.current) - CHAR_HEIGHT / 2;
      spawnPop(x, y);
      spawnPuffs();
    } else if (wallSideRef.current) {
      charVyRef.current = WALL_JUMP_VELOCITY;
      charKickVxRef.current = wallSideRef.current === 'right' ? -WALL_JUMP_KICK : WALL_JUMP_KICK;
      wallSideRef.current = null;
      groundedRef.current = false;
      squashRef.current = 1.25;
      playPopSound();
      const x = charXRef.current + CHAR_WIDTH / 2;
      const y = CANVAS_HEIGHT - (charYRef.current - cameraYRef.current) - CHAR_HEIGHT / 2;
      spawnPop(x, y);
      spawnPuffs();
    }
  }, [spawnPop, spawnPuffs]);

  const startLeft = useCallback(() => {
    inputRef.current.left = true;
  }, []);

  const stopLeft = useCallback(() => {
    inputRef.current.left = false;
    if (wallSideRef.current === 'left') {
      wallSideRef.current = null;
    }
  }, []);

  const startRight = useCallback(() => {
    inputRef.current.right = true;
  }, []);

  const stopRight = useCallback(() => {
    inputRef.current.right = false;
    if (wallSideRef.current === 'right') {
      wallSideRef.current = null;
    }
  }, []);

  // ======================== Canvas game loop ========================
  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    interface CloudLayer {
      x: number;
      y: number;
      width: number;
      height: number;
      speed: number;
      alpha: number;
    }

    const cloudLayers: CloudLayer[] = [
      { x: 50, y: 80, width: 120, height: 40, speed: 0.15, alpha: 0.12 },
      { x: 250, y: 150, width: 160, height: 50, speed: 0.25, alpha: 0.1 },
      { x: 140, y: 260, width: 100, height: 35, speed: 0.35, alpha: 0.08 },
      { x: 320, y: 40, width: 90, height: 30, speed: 0.2, alpha: 0.1 },
    ];

    const drawCloud = (cloud: CloudLayer) => {
      // Parallax offset: clouds drift horizontally as the camera rises
      const parallaxOffset = (cameraYRef.current * cloud.speed) % (CANVAS_WIDTH + cloud.width);
      const baseX = cloud.x - parallaxOffset;
      const wrap = CANVAS_WIDTH + cloud.width;
      let x = baseX;
      while (x < -cloud.width) x += wrap;

      // Draw the cloud twice to seamlessly wrap across the screen
      for (let i = 0; i < 2; i += 1) {
        const drawX = x + i * wrap;
        if (drawX > CANVAS_WIDTH + cloud.width) continue;

        ctx.fillStyle = `rgba(255, 255, 255, ${cloud.alpha})`;
        // Main puff
        ctx.beginPath();
        ctx.ellipse(drawX, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Extra puffs for fluffiness
        ctx.beginPath();
        ctx.ellipse(drawX - cloud.width * 0.25, cloud.y + cloud.height * 0.1, cloud.width * 0.25, cloud.height * 0.35, 0, 0, Math.PI * 2);
        ctx.ellipse(drawX + cloud.width * 0.25, cloud.y + cloud.height * 0.1, cloud.width * 0.25, cloud.height * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawSky = () => {
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, '#1e3a8a');
      gradient.addColorStop(0.5, '#0e7490');
      gradient.addColorStop(1, '#115e59');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Subtle horizontal bands
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < 6; i += 1) {
        const y = ((i * 97 + cameraYRef.current * 0.1) % (CANVAS_HEIGHT + 80)) - 40;
        ctx.fillRect(0, y, CANVAS_WIDTH, 20);
      }

      // Parallax cloud layers
      cloudLayers.forEach((cloud) => drawCloud(cloud));
    };

    const drawBlock = (block: LandedBlock | FallingBlock, isFalling: boolean) => {
      const topY = block.y + block.height;
      const screenTop = CANVAS_HEIGHT - (topY - cameraYRef.current);
      const { x, width, height } = block;

      // Body
      ctx.fillStyle = block.color;
      drawRoundedRect(ctx, x, screenTop, width, height, 8);
      ctx.fill();

      // Thick black outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      drawRoundedRect(ctx, x, screenTop, width, height, 8);
      ctx.stroke();

      // Centered ring/hole (unfilled bead-like outline)
      const cx = x + width / 2;
      const cy = screenTop + height / 2;
      const ringRadius = Math.min(width, height) * 0.2;
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Sparkle dots near one corner
      ctx.fillStyle = '#ffffff';
      const sparkleBaseX = x + width * 0.15;
      const sparkleBaseY = screenTop + height * 0.15;
      const dotSize = Math.max(2, Math.min(width, height) * 0.04);
      ctx.beginPath();
      ctx.arc(sparkleBaseX, sparkleBaseY, dotSize, 0, Math.PI * 2);
      ctx.arc(sparkleBaseX + dotSize * 2.5, sparkleBaseY + dotSize * 1.2, dotSize * 0.7, 0, Math.PI * 2);
      ctx.arc(sparkleBaseX + dotSize * 1.2, sparkleBaseY - dotSize * 2, dotSize * 0.6, 0, Math.PI * 2);
      ctx.fill();

      if (isFalling) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        drawRoundedRect(ctx, x + 4, screenTop + 4, width - 8, height / 3, 6);
        ctx.fill();
      }
    };

    const drawPuffs = () => {
      puffsRef.current.forEach((p) => {
        const screenX = p.x;
        const screenY = CANVAS_HEIGHT - (p.y - cameraYRef.current);
        const alpha = p.life / p.maxLife;
        const size = p.size * alpha;
        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
        ctx.fill();
      });
    };

    const drawCharacter = () => {
      const x = charXRef.current;
      const y = charYRef.current;
      const screenBottom = CANVAS_HEIGHT - (y - cameraYRef.current);
      const screenTop = screenBottom - CHAR_HEIGHT;

      const centerX = x + CHAR_WIDTH / 2;
      const centerY = screenTop + CHAR_HEIGHT / 2;
      const scaleY = squashRef.current;
      const scaleX = 1 / squashRef.current;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(scaleX, scaleY);
      ctx.translate(-centerX, -centerY);

      // Cream body with black outline
      ctx.fillStyle = '#000000';
      drawRoundedRect(ctx, x - 2, screenTop - 2, CHAR_WIDTH + 4, CHAR_HEIGHT + 4, 8);
      ctx.fill();

      ctx.fillStyle = '#fdf4dc';
      drawRoundedRect(ctx, x, screenTop, CHAR_WIDTH, CHAR_HEIGHT, 7);
      ctx.fill();

      // Simple face
      ctx.fillStyle = '#1e1224';
      const eyeY = screenTop + CHAR_HEIGHT * 0.35;
      ctx.fillRect(x + CHAR_WIDTH * 0.25, eyeY, 4, 4);
      ctx.fillRect(x + CHAR_WIDTH * 0.65, eyeY, 4, 4);
      ctx.fillRect(x + CHAR_WIDTH * 0.35, eyeY + CHAR_HEIGHT * 0.25, CHAR_WIDTH * 0.3, 2);

      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(x + 5, screenTop + 5, CHAR_WIDTH * 0.25, 2);
      ctx.restore();
    };

    const drawLava = (now: number) => {
      const lavaScreenY = CANVAS_HEIGHT - (lavaYRef.current - cameraYRef.current);
      if (lavaScreenY >= CANVAS_HEIGHT) return;

      // Base lava gradient
      const lavaGradient = ctx.createLinearGradient(0, lavaScreenY, 0, CANVAS_HEIGHT);
      lavaGradient.addColorStop(0, 'rgba(255, 100, 50, 0.95)');
      lavaGradient.addColorStop(0.3, 'rgba(255, 80, 30, 0.9)');
      lavaGradient.addColorStop(1, 'rgba(180, 30, 0, 0.95)');
      ctx.fillStyle = lavaGradient;
      ctx.fillRect(0, lavaScreenY, CANVAS_WIDTH, CANVAS_HEIGHT - lavaScreenY);

      // Shimmering surface highlight
      const shimmer = (Math.sin(now / 400) + 1) / 2; // 0..1 pulse
      ctx.fillStyle = `rgba(255, 220, 120, ${0.25 + shimmer * 0.25})`;
      ctx.fillRect(0, lavaScreenY, CANVAS_WIDTH, 4);

      // Horizontal shimmer bands moving upward
      ctx.fillStyle = `rgba(255, 160, 60, ${0.1 + shimmer * 0.1})`;
      const bandOffset = (now / 60) % 40;
      for (let y = lavaScreenY + 10 + bandOffset; y < CANVAS_HEIGHT; y += 40) {
        ctx.fillRect(0, y, CANVAS_WIDTH, 2);
      }

      // Glowing bubbles along the surface
      ctx.fillStyle = 'rgba(255, 220, 120, 0.85)';
      const bubbleOffset = (now / 20) % 40;
      for (let x = bubbleOffset; x < CANVAS_WIDTH; x += 40) {
        ctx.fillRect(x, lavaScreenY - 4, 6, 4);
      }

      // Soft glow above the surface
      const glowGradient = ctx.createLinearGradient(0, lavaScreenY - 30, 0, lavaScreenY);
      glowGradient.addColorStop(0, 'rgba(255, 80, 30, 0)');
      glowGradient.addColorStop(1, `rgba(255, 100, 40, ${0.15 + shimmer * 0.1})`);
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, lavaScreenY - 30, CANVAS_WIDTH, 30);
    };

    const drawHud = () => {
      const current = Math.floor(highestHeadYRef.current * FEET_PER_WORLD);
      const best = highScoreRef.current;
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 4;
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(`${current}ft`, CANVAS_WIDTH - 12, 36);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(`Best: ${best}ft`, CANVAS_WIDTH - 12, 58);
      ctx.shadowBlur = 0;
    };

    const draw = () => {
      const now = performance.now();
      let gameOverThisFrame = false;

      // Update camera (deadzone: keep character in lower half, only scroll up)
      const desiredCameraY = charYRef.current - (CANVAS_HEIGHT - CAMERA_THRESHOLD_SCREEN_Y);
      cameraYRef.current = Math.max(cameraYRef.current, desiredCameraY, 0);

      // Update lava
      lavaYRef.current += LAVA_RISE_SPEED;

      // Spawn falling blocks
      if (now - lastSpawnRef.current > BLOCK_SPAWN_INTERVAL_MS) {
        lastSpawnRef.current = now;
        const width = Math.round(randomRange(MIN_BLOCK_WIDTH, MAX_BLOCK_WIDTH));
        const height = Math.round(width * randomRange(0.85, 1.15));
        const x = Math.round(randomRange(0, CANVAS_WIDTH - width));
        const color = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)] ?? '#f472b6';
        fallingRef.current.push({
          x,
          width,
          height,
          y: cameraYRef.current + CANVAS_HEIGHT + height + Math.random() * 100,
          color,
        });
      }

      // Update falling blocks
      for (let i = fallingRef.current.length - 1; i >= 0; i -= 1) {
        const block = fallingRef.current[i];
        if (!block) continue;

        block.y -= BLOCK_FALL_SPEED;
        const surface = surfaceHeightAt(block.x, block.x + block.width, landedRef.current);

        if (block.y <= surface) {
          block.y = surface;
          landedRef.current.push({ ...block });
          fallingRef.current.splice(i, 1);
          playPopSound();
        }
      }

      // Character horizontal movement
      const input = inputRef.current;
      let nextX = charXRef.current;
      if (input.left && !input.right) {
        nextX -= CHAR_SPEED;
      }
      if (input.right && !input.left) {
        nextX += CHAR_SPEED;
      }
      nextX += charKickVxRef.current;
      charKickVxRef.current *= WALL_JUMP_KICK_DECAY;
      if (Math.abs(charKickVxRef.current) < 0.1) {
        charKickVxRef.current = 0;
      }

      const prevX = charXRef.current;
      const rawX = clamp(nextX, 0, CANVAS_WIDTH - CHAR_WIDTH);
      const resolvedX = resolveHorizontalMove(
        prevX,
        rawX,
        charYRef.current,
        CHAR_WIDTH,
        CHAR_HEIGHT,
        landedRef.current
      );

      if (!groundedRef.current && input.right && rawX > prevX && resolvedX < rawX) {
        wallSideRef.current = 'right';
      } else if (!groundedRef.current && input.left && rawX < prevX && resolvedX > rawX) {
        wallSideRef.current = 'left';
      } else if (groundedRef.current) {
        wallSideRef.current = null;
      } else if (wallSideRef.current) {
        wallSideRef.current = null;
      }
      charXRef.current = resolvedX;

      // Character vertical physics
      const wasGrounded = groundedRef.current;
      charVyRef.current += GRAVITY;

      // Wall slide: clamp fall speed when sliding against a wall
      if (wallSideRef.current && charVyRef.current < WALL_SLIDE_SPEED) {
        charVyRef.current = WALL_SLIDE_SPEED;
      }

      // Spawn dust trail while wall-sliding
      if (wallSideRef.current && !groundedRef.current) {
        wallSlideDustTimerRef.current -= 1;
        if (wallSlideDustTimerRef.current <= 0) {
          spawnWallSlideDust();
          wallSlideDustTimerRef.current = 6;
        }
      } else {
        wallSlideDustTimerRef.current = 0;
      }

      charYRef.current += charVyRef.current;

      const ground = surfaceHeightAt(charXRef.current, charXRef.current + CHAR_WIDTH, landedRef.current);
      const canLand = wasGrounded || (charVyRef.current <= 0 && prevCharYRef.current >= ground);
      if (canLand && charYRef.current <= ground) {
        charYRef.current = ground;
        charVyRef.current = 0;
        if (!wasGrounded) {
          squashRef.current = 0.75;
          spawnLandingDust();
        }
        groundedRef.current = true;
        wallSideRef.current = null;
        coyoteTimeRef.current = COYOTE_FRAMES;
      } else {
        groundedRef.current = false;
        if (coyoteTimeRef.current > 0) {
          coyoteTimeRef.current -= 1;
        }
      }

      highestHeadYRef.current = Math.max(highestHeadYRef.current, charYRef.current + CHAR_HEIGHT);

      // Update score state (feet)
      const currentFeet = Math.floor(highestHeadYRef.current * FEET_PER_WORLD);
      if (currentFeet > scoreRef.current) {
        scoreRef.current = currentFeet;
        setScore(currentFeet);
        updateHighScore(currentFeet);
      }

      // Crush check (falling blocks vs character)
      const charRect = {
        x: charXRef.current,
        y: charYRef.current,
        width: CHAR_WIDTH,
        height: CHAR_HEIGHT,
      };
      const groundHeight = surfaceHeightAt(charXRef.current, charXRef.current + CHAR_WIDTH, landedRef.current);
      for (let i = 0; i < fallingRef.current.length; i += 1) {
        const block = fallingRef.current[i];
        if (!block) continue;
        const blockRect = { x: block.x, y: block.y, width: block.width, height: block.height };
        if (!isCrushedByFallingBlock(charRect, blockRect, groundHeight)) {
          playPopSound();
          spawnDust(15);
          shakeRef.current = { frames: 20, intensity: 8 };
          setGameState('gameover');
          saveHighScore(scoreRef.current);
          gameOverThisFrame = true;
          break;
        }
      }

      // Lava death
      if (!gameOverThisFrame && charYRef.current <= lavaYRef.current) {
        playPopSound();
        spawnDust(15);
        shakeRef.current = { frames: 20, intensity: 8 };
        setGameState('gameover');
        saveHighScore(scoreRef.current);
        gameOverThisFrame = true;
      }

      // Prune blocks far below camera
      const pruneThreshold = cameraYRef.current - CANVAS_HEIGHT;
      landedRef.current = landedRef.current.filter((b) => b.y + b.height >= pruneThreshold);
      fallingRef.current = fallingRef.current.filter((b) => b.y + b.height >= pruneThreshold);

      // Remember feet position before next frame so we can tell if we came from above the ground.
      prevCharYRef.current = charYRef.current;

      // Update puff particles
      puffsRef.current = puffsRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += GRAVITY;
        p.life -= 1;
        return p.life > 0;
      });

      // ======================== Draw ========================
      ctx.save();

      // Apply screen shake
      if (shakeRef.current.frames > 0) {
        const sx = (Math.random() - 0.5) * shakeRef.current.intensity;
        const sy = (Math.random() - 0.5) * shakeRef.current.intensity;
        ctx.translate(sx, sy);
        shakeRef.current.frames -= 1;
        shakeRef.current.intensity *= 0.9;
      }

      drawSky();

      // Draw landed blocks first, then falling
      landedRef.current.forEach((block) => drawBlock(block, false));
      fallingRef.current.forEach((block) => drawBlock(block, true));

      // Update squash/stretch animation
      squashRef.current += (1 - squashRef.current) * 0.15;

      drawPuffs();
      drawCharacter();
      drawLava(now);
      drawHud();

      ctx.restore();

      if (gameOverThisFrame) return;

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [gameState, saveHighScore, spawnDust, spawnLandingDust, spawnWallSlideDust, updateHighScore]);

  // ======================== Keyboard controls ========================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (gameStateRef.current === 'gameover' && e.code === 'Space') {
        e.preventDefault();
        resetGame();
        return;
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        inputRef.current.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        inputRef.current.right = true;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        jump();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        inputRef.current.left = false;
        if (wallSideRef.current === 'left') {
          wallSideRef.current = null;
        }
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        inputRef.current.right = false;
        if (wallSideRef.current === 'right') {
          wallSideRef.current = null;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [jump, resetGame]);

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4 rounded-lg border-4 border-pink-300 bg-purple-950 p-6 shadow-[0_0_0_4px_#000]">
      <h2 className="font-vt323 text-3xl text-pink-200">Cloud Climber</h2>
      <p className="text-center font-vt323 text-lg text-pink-100/80">
        ← / A and → / D to move · Space / ↑ / W to jump · Avoid lava and falling blocks.
      </p>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={() => {
            if (gameStateRef.current === 'gameover') {
              resetGame();
            } else {
              jump();
            }
          }}
          className="w-full max-w-[400px] cursor-pointer rounded bg-purple-900"
          aria-label="Cloud Climber game canvas. Use left/right arrows or A/D to move. Press space, up arrow, or W to jump."
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
            <p className="font-vt323 text-xl text-pink-100/80">Height: {score}ft</p>
            <p className="font-vt323 text-lg text-pink-100/70">Best: {highScore}ft</p>
            <p className="font-vt323 text-sm text-pink-100/60">Press Space or click to restart</p>
          </div>
        )}
      </div>

      <div className="flex w-full flex-wrap items-center justify-center gap-4">
        <div className="flex gap-3">
          <button
            type="button"
            onPointerDown={startLeft}
            onPointerUp={stopLeft}
            onPointerLeave={stopLeft}
            onPointerCancel={stopLeft}
            className="min-h-[44px] min-w-[44px] select-none rounded border-2 border-pink-300/50 bg-purple-900 px-6 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800"
          >
            ←
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              jump();
            }}
            className="min-h-[44px] min-w-[44px] select-none rounded border-2 border-pink-300/50 bg-purple-900 px-6 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800"
          >
            Jump
          </button>
          <button
            type="button"
            onPointerDown={startRight}
            onPointerUp={stopRight}
            onPointerLeave={stopRight}
            onPointerCancel={stopRight}
            className="min-h-[44px] min-w-[44px] select-none rounded border-2 border-pink-300/50 bg-purple-900 px-6 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800"
          >
            →
          </button>
        </div>
        <div className="flex items-center gap-4">
          <p className="font-vt323 text-2xl text-pink-200">Height: {score}ft</p>
          <p className="font-vt323 text-xl text-pink-100/70">Best: {highScore}ft</p>
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
    </div>
  );
}
