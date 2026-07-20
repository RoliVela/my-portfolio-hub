'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getAssetPath } from '@/lib/assets';

const CANVAS_SIZE = 400;
const MAX_STRETCH = 0.6;

interface Point {
  x: number;
  y: number;
}

export default function NeeDohInteraction() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<Point>({ x: 0, y: 0 });
  const offsetRef = useRef<Point>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const getCanvasPoint = useCallback((e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_SIZE,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_SIZE,
    };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    if (!canvas || !ctx || !img) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    if (!imgW || !imgH) return;

    // Fit image inside the canvas while preserving aspect ratio.
    const canvasAspect = CANVAS_SIZE / CANVAS_SIZE;
    const imgAspect = imgW / imgH;
    let drawW: number;
    let drawH: number;
    if (imgAspect > canvasAspect) {
      drawW = CANVAS_SIZE;
      drawH = CANVAS_SIZE / imgAspect;
    } else {
      drawW = CANVAS_SIZE * imgAspect;
      drawH = CANVAS_SIZE;
    }

    // Convert drag offset into stretch factors.
    // Pulling right stretches horizontally and squashes vertically (and vice versa)
    // to keep the deformation feeling like a soft stress ball.
    const dx = offsetRef.current.x;
    const dy = offsetRef.current.y;
    const maxDist = CANVAS_SIZE / 2;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
    const factor = (dist / maxDist) * MAX_STRETCH;
    const angle = Math.atan2(dy, dx);
    const stretch = 1 + factor;
    const squash = 1 - factor * 0.5;

    // Build an anisotropic scale matrix aligned with the pull direction
    // so the image stretches toward the cursor without rotating.
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const a = stretch * c * c + squash * s * s;
    const d = stretch * s * s + squash * c * c;
    const b = s * c * (stretch - squash);

    ctx.save();
    ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    ctx.transform(a, b, b, d, 0, 0);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }, []);

  const startSpringBack = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const startOffsets = { ...offsetRef.current };
    const startTime = performance.now();

    const animate = (now: number) => {
      const t = Math.min((now - startTime) / 1400, 1);
      // Elastic out easing for a bouncy stress-ball feel.
      const ease = t === 1 ? 1 : 1 - Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3));

      offsetRef.current = {
        x: startOffsets.x * (1 - ease),
        y: startOffsets.y * (1 - ease),
      };

      draw();

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rafRef.current = null;
        offsetRef.current = { x: 0, y: 0 };
        draw();
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  }, [draw]);

  useEffect(() => {
    const img = new Image();
    img.src = getAssetPath('/assets/nee-doh.png');
    img.onload = () => {
      imageRef.current = img;
      draw();
    };

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    isDraggingRef.current = true;
    const point = getCanvasPoint(e);
    dragStartRef.current = point;
    offsetRef.current = { x: 0, y: 0 };
    draw();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const point = getCanvasPoint(e);
    offsetRef.current = {
      x: point.x - dragStartRef.current.x,
      y: point.y - dragStartRef.current.y,
    };
    draw();
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    startSpringBack();
  };

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="w-full max-w-[400px] cursor-grab touch-none rounded-lg border-2 border-white/30 bg-black/50 active:cursor-grabbing"
      aria-label="Nee-Doh stress ball. Drag to stretch."
    />
  );
}
