'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getAssetPath } from '@/lib/assets';

// Canvas animation mutates refs directly; refs are the correct mutable store here.
/* eslint-disable react-hooks/immutability */

const GRID_COLS = 12;
const GRID_ROWS = 12;
const CANVAS_SIZE = 400;
const INFLUENCE_RADIUS = CANVAS_SIZE * 0.35;

interface Vertex {
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
}

interface Point {
  x: number;
  y: number;
}

function getAffineTransform(
  s1: Point,
  s2: Point,
  s3: Point,
  d1: Point,
  d2: Point,
  d3: Point
): [number, number, number, number, number, number] {
  const p1x = s2.x - s1.x;
  const p1y = s2.y - s1.y;
  const p2x = s3.x - s1.x;
  const p2y = s3.y - s1.y;

  const q1x = d2.x - d1.x;
  const q1y = d2.y - d1.y;
  const q2x = d3.x - d1.x;
  const q2y = d3.y - d1.y;

  const det = p1x * p2y - p2x * p1y;
  if (Math.abs(det) < 1e-10) {
    return [1, 0, 0, 1, 0, 0];
  }

  const invDet = 1 / det;

  const l11 = invDet * (q1x * p2y - q2x * p1y);
  const l12 = invDet * (q2x * p1x - q1x * p2x);
  const l21 = invDet * (q1y * p2y - q2y * p1y);
  const l22 = invDet * (q2y * p1x - q1y * p2x);

  const a = l11;
  const b = l21;
  const c = l12;
  const d = l22;
  const e = d1.x - l11 * s1.x - l12 * s1.y;
  const f = d1.y - l21 * s1.x - l22 * s1.y;

  return [a, b, c, d, e, f];
}

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  s1: Point,
  s2: Point,
  s3: Point,
  d1: Point,
  d2: Point,
  d3: Point
) {
  const [a, b, c, d, e, f] = getAffineTransform(s1, s2, s3, d1, d2, d3);
  ctx.save();
  ctx.setTransform(a, b, c, d, e, f);
  ctx.beginPath();
  ctx.moveTo(d1.x, d1.y);
  ctx.lineTo(d2.x, d2.y);
  ctx.lineTo(d3.x, d3.y);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

export default function NeeDohInteraction() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const verticesRef = useRef<Vertex[]>([]);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<Point>({ x: 0, y: 0 });
  const currentPosRef = useRef<Point>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const initVertices = useCallback(() => {
    const vertices: Vertex[] = [];
    for (let y = 0; y <= GRID_ROWS; y++) {
      for (let x = 0; x <= GRID_COLS; x++) {
        vertices.push({
          x: (x / GRID_COLS) * CANVAS_SIZE,
          y: (y / GRID_ROWS) * CANVAS_SIZE,
          offsetX: 0,
          offsetY: 0,
        });
      }
    }
    verticesRef.current = vertices;
  }, []);

  const getCanvasPoint = useCallback((e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_SIZE,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_SIZE,
    };
  }, []);

  const applyDisplacement = useCallback(() => {
    const dragDeltaX = currentPosRef.current.x - dragStartRef.current.x;
    const dragDeltaY = currentPosRef.current.y - dragStartRef.current.y;
    const cursorX = currentPosRef.current.x;
    const cursorY = currentPosRef.current.y;

    for (const v of verticesRef.current) {
      const dx = cursorX - v.x;
      const dy = cursorY - v.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let falloff = 0;
      if (dist < INFLUENCE_RADIUS) {
        const t = dist / INFLUENCE_RADIUS;
        falloff = (1 - t) * (1 - t);
      }
      v.offsetX = dragDeltaX * falloff;
      v.offsetY = dragDeltaY * falloff;
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    if (!canvas || !ctx || !img) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    const scaleX = imgW / CANVAS_SIZE;
    const scaleY = imgH / CANVAS_SIZE;

    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const i = y * (GRID_COLS + 1) + x;
        const v00 = verticesRef.current[i];
        const v10 = verticesRef.current[i + 1];
        const v01 = verticesRef.current[i + GRID_COLS + 1];
        const v11 = verticesRef.current[i + GRID_COLS + 2];

        const s00: Point = { x: v00.x * scaleX, y: v00.y * scaleY };
        const s10: Point = { x: v10.x * scaleX, y: v10.y * scaleY };
        const s01: Point = { x: v01.x * scaleX, y: v01.y * scaleY };
        const s11: Point = { x: v11.x * scaleX, y: v11.y * scaleY };

        const d00: Point = { x: v00.x + v00.offsetX, y: v00.y + v00.offsetY };
        const d10: Point = { x: v10.x + v10.offsetX, y: v10.y + v10.offsetY };
        const d01: Point = { x: v01.x + v01.offsetX, y: v01.y + v01.offsetY };
        const d11: Point = { x: v11.x + v11.offsetX, y: v11.y + v11.offsetY };

        drawTriangle(ctx, img, s00, s10, s01, d00, d10, d01);
        drawTriangle(ctx, img, s10, s11, s01, d10, d11, d01);
      }
    }
  }, []);

  const startSpringBack = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const startOffsets = verticesRef.current.map((v) => ({ offsetX: v.offsetX, offsetY: v.offsetY }));
    const startTime = performance.now();

    const animate = (now: number) => {
      const t = Math.min((now - startTime) / 1000, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      for (let i = 0; i < verticesRef.current.length; i++) {
        const v = verticesRef.current[i];
        const so = startOffsets[i];
        v.offsetX = so.offsetX * (1 - ease);
        v.offsetY = so.offsetY * (1 - ease);
      }

      draw();

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rafRef.current = null;
        for (const v of verticesRef.current) {
          v.offsetX = 0;
          v.offsetY = 0;
        }
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
      initVertices();
      draw();
    };

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw, initVertices]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    isDraggingRef.current = true;
    const point = getCanvasPoint(e);
    dragStartRef.current = point;
    currentPosRef.current = point;
    applyDisplacement();
    draw();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    currentPosRef.current = getCanvasPoint(e);
    applyDisplacement();
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
      aria-label="Nee-Doh stress ball. Drag to stretch and distort."
    />
  );
}
