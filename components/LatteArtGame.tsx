'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface LatteArtGameProps {
  onComplete?: () => void;
  onToggle?: () => void;
}

interface Point {
  x: number;
  y: number;
}

type Stroke = Point[];

interface SavedDesign {
  id: string;
  date: number;
  thumbnail: string;
  strokes: Stroke[];
}

const CANVAS_SIZE = 360;
const CUP_X = CANVAS_SIZE / 2;
const CUP_Y = CANVAS_SIZE / 2;
const CUP_MARGIN = 24;
const CUP_RADIUS = CANVAS_SIZE / 2 - CUP_MARGIN;
const CREAM_WIDTH = 7;
const GUIDE_ALPHA = 0.25;
const GALLERY_KEY = 'latte-art-gallery';
const MAX_GALLERY_ITEMS = 10;

const REACTIONS = [
  'Ooh, fancy!',
  'Roli would be impressed!',
  "That's basically a Michelin-star latte.",
  'Barista skills: unlocked.',
  'A masterpiece in milk foam.',
  'Latte art complete!',
];

function drawHeartPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const bottomY = cy + size * 0.55;
  const leftX = cx - size * 0.55;
  const rightX = cx + size * 0.55;
  const midY = cy + size * 0.15;

  ctx.beginPath();
  ctx.moveTo(cx, bottomY);
  ctx.bezierCurveTo(cx, midY, leftX, cy - size * 0.25, leftX, cy - size * 0.05);
  ctx.bezierCurveTo(leftX, cy - size * 0.45, cx - size * 0.15, cy - size * 0.55, cx, cy - size * 0.25);
  ctx.bezierCurveTo(cx + size * 0.15, cy - size * 0.55, rightX, cy - size * 0.45, rightX, cy - size * 0.05);
  ctx.bezierCurveTo(rightX, cy - size * 0.25, cx, midY, cx, bottomY);
  ctx.closePath();
}

function readGallery(): SavedDesign[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(GALLERY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as SavedDesign[];
  } catch {
    // ignore storage errors
  }
  return [];
}

function writeGallery(gallery: SavedDesign[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
  } catch {
    // ignore storage errors
  }
}

export default function LatteArtGame({ onComplete, onToggle }: LatteArtGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dprRef = useRef(1);
  const isDrawingRef = useRef(false);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke>([]);
  const redoStackRef = useRef<Stroke[]>([]);
  const doneTimerRef = useRef<number | null>(null);
  const galleryMessageTimerRef = useRef<number | null>(null);
  const isDoneRef = useRef(false);

  const [message, setMessage] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [gallery, setGallery] = useState<SavedDesign[]>(() => readGallery());
  const [galleryMessage, setGalleryMessage] = useState<string | null>(null);

  const updateHistoryState = useCallback(() => {
    setCanUndo(strokesRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, []);

  const getCanvasPoint = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvas.width / rect.width / dprRef.current);
    const y = (clientY - rect.top) * (canvas.height / rect.height / dprRef.current);
    return { x, y };
  }, []);

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Clip to the circular cup area
    ctx.save();
    ctx.beginPath();
    ctx.arc(CUP_X, CUP_Y, CUP_RADIUS, 0, Math.PI * 2);
    ctx.clip();

    // Coffee fill
    const grad = ctx.createRadialGradient(
      CUP_X - CUP_RADIUS * 0.3,
      CUP_Y - CUP_RADIUS * 0.3,
      CUP_RADIUS * 0.15,
      CUP_X,
      CUP_Y,
      CUP_RADIUS
    );
    grad.addColorStop(0, '#8B5E3C');
    grad.addColorStop(0.5, '#5D3A1A');
    grad.addColorStop(1, '#2E1A0F');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Faint heart guide
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${GUIDE_ALPHA})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    drawHeartPath(ctx, CUP_X, CUP_Y, CUP_RADIUS * 0.7);
    ctx.stroke();
    ctx.restore();

    // Cream strokes
    ctx.strokeStyle = '#FFF8E7';
    ctx.lineWidth = CREAM_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const allStrokes = [...strokesRef.current, currentStrokeRef.current];
    for (const stroke of allStrokes) {
      if (stroke.length === 0) continue;
      if (stroke.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke[0].x, stroke[0].y, CREAM_WIDTH / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFF8E7';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i += 1) {
          ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        ctx.stroke();
      }
    }

    ctx.restore();

    // Cup outline (drawn after clip so it sits on top)
    ctx.beginPath();
    ctx.arc(CUP_X, CUP_Y, CUP_RADIUS, 0, Math.PI * 2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#1a0b2e';
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f9a8d4';
    ctx.stroke();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    canvas.style.width = `${CANVAS_SIZE}px`;
    canvas.style.height = `${CANVAS_SIZE}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      drawScene();
    }
  }, [drawScene]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (isDoneRef.current) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      const point = getCanvasPoint(e.clientX, e.clientY);
      isDrawingRef.current = true;
      currentStrokeRef.current = [point];
      // New stroke invalidates redo history
      redoStackRef.current = [];
      setCanRedo(false);
      drawScene();
    },
    [getCanvasPoint, drawScene]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || isDoneRef.current) return;
      e.preventDefault();
      const point = getCanvasPoint(e.clientX, e.clientY);
      currentStrokeRef.current = [...currentStrokeRef.current, point];
      drawScene();
    },
    [getCanvasPoint, drawScene]
  );

  const finishStroke = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      if (currentStrokeRef.current.length > 0) {
        strokesRef.current = [...strokesRef.current, currentStrokeRef.current];
      }
      currentStrokeRef.current = [];
      updateHistoryState();
      drawScene();
    },
    [drawScene, updateHistoryState]
  );

  const handleClear = useCallback(() => {
    if (isDoneRef.current) return;
    strokesRef.current = [];
    currentStrokeRef.current = [];
    redoStackRef.current = [];
    isDrawingRef.current = false;
    updateHistoryState();
    drawScene();
  }, [drawScene, updateHistoryState]);

  const handleUndo = useCallback(() => {
    if (isDoneRef.current) return;
    if (strokesRef.current.length === 0) return;
    const lastStroke = strokesRef.current[strokesRef.current.length - 1];
    strokesRef.current = strokesRef.current.slice(0, -1);
    redoStackRef.current = [...redoStackRef.current, lastStroke];
    updateHistoryState();
    drawScene();
  }, [drawScene, updateHistoryState]);

  const handleRedo = useCallback(() => {
    if (isDoneRef.current) return;
    if (redoStackRef.current.length === 0) return;
    const stroke = redoStackRef.current[redoStackRef.current.length - 1];
    redoStackRef.current = redoStackRef.current.slice(0, -1);
    strokesRef.current = [...strokesRef.current, stroke];
    updateHistoryState();
    drawScene();
  }, [drawScene, updateHistoryState]);

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `latte-art-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleKeep = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const thumbnail = canvas.toDataURL('image/jpeg', 0.5);
    const design: SavedDesign = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      date: Date.now(),
      thumbnail,
      strokes: strokesRef.current.map((stroke) => stroke.map((point) => ({ ...point }))),
    };

    setGallery((prev) => {
      const next = [design, ...prev].slice(0, MAX_GALLERY_ITEMS);
      writeGallery(next);
      return next;
    });

    setGalleryMessage('Saved to gallery!');
    if (galleryMessageTimerRef.current) {
      clearTimeout(galleryMessageTimerRef.current);
    }
    galleryMessageTimerRef.current = window.setTimeout(() => setGalleryMessage(null), 1500);
  }, []);

  const handleLoadDesign = useCallback(
    (design: SavedDesign) => {
      if (isDoneRef.current) return;
      strokesRef.current = design.strokes.map((stroke) => stroke.map((point) => ({ ...point })));
      currentStrokeRef.current = [];
      redoStackRef.current = [];
      isDrawingRef.current = false;
      updateHistoryState();
      drawScene();
    },
    [drawScene, updateHistoryState]
  );

  const handleDeleteDesign = useCallback(
    (id: string) => {
      setGallery((prev) => {
        const next = prev.filter((design) => design.id !== id);
        writeGallery(next);
        return next;
      });
    },
    []
  );

  const handleDone = useCallback(() => {
    if (isDoneRef.current) return;
    isDoneRef.current = true;

    const reaction = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
    setMessage(`Latte Art Complete!\n${reaction}`);

    onToggle?.();

    doneTimerRef.current = window.setTimeout(() => {
      onComplete?.();
    }, 1800);
  }, [onComplete, onToggle]);

  useEffect(() => {
    return () => {
      if (doneTimerRef.current) {
        clearTimeout(doneTimerRef.current);
      }
      if (galleryMessageTimerRef.current) {
        clearTimeout(galleryMessageTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative flex w-full max-w-md flex-col items-center gap-4 rounded-lg border-4 border-pink-300 bg-purple-950 p-6 shadow-[0_0_0_4px_#000]">
      <h2 className="font-vt323 text-3xl text-pink-200">Latte Art</h2>
      <p className="text-center font-vt323 text-lg text-pink-100/80">
        Draw something fancy in the foam. Use your mouse or finger.
      </p>

      <div className="relative">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          className="touch-none rounded-full"
          aria-label="Latte art drawing canvas. Drag to draw cream on the coffee."
        />
        {message && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 p-4 text-center">
            <p className="whitespace-pre-line font-vt323 text-2xl text-pink-200">{message}</p>
          </div>
        )}
      </div>

      <div className="flex w-full flex-col items-center gap-3">
        <div className="flex w-full flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className="min-h-[44px] min-w-[44px] select-none rounded border-2 border-pink-300/50 bg-purple-900 px-4 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className="min-h-[44px] min-w-[44px] select-none rounded border-2 border-pink-300/50 bg-purple-900 px-4 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Redo
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="min-h-[44px] min-w-[44px] select-none rounded border-2 border-pink-300/50 bg-purple-900 px-4 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800"
          >
            Clear
          </button>
        </div>
        <div className="flex w-full flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="min-h-[44px] min-w-[44px] select-none rounded border-2 border-pink-300/50 bg-purple-900 px-4 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleKeep}
            className="min-h-[44px] min-w-[44px] select-none rounded border-2 border-pink-300/50 bg-purple-900 px-4 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800"
          >
            Keep
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="min-h-[44px] min-w-[44px] select-none rounded border-2 border-pink-300/50 bg-purple-900 px-4 py-2 font-vt323 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 active:border-pink-300 active:bg-purple-800"
          >
            Done
          </button>
        </div>
      </div>

      {galleryMessage && (
        <p className="font-vt323 text-lg text-pink-300">{galleryMessage}</p>
      )}

      {gallery.length > 0 && (
        <div className="w-full">
          <h3 className="mb-2 text-center font-vt323 text-xl text-pink-200">My Creations</h3>
          <div className="flex w-full gap-2 overflow-x-auto pb-2">
            {gallery.map((design) => (
              <div key={design.id} className="group relative shrink-0">
                <button
                  type="button"
                  onClick={() => handleLoadDesign(design)}
                  className="h-20 w-20 overflow-hidden rounded-full border-2 border-pink-300/50 bg-purple-900 transition hover:border-pink-300"
                  aria-label="Load saved design"
                >
                  <img
                    src={design.thumbnail}
                    alt="Saved latte art thumbnail"
                    className="h-full w-full object-cover"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteDesign(design.id)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-xs text-white opacity-0 transition hover:bg-pink-400 group-hover:opacity-100"
                  aria-label="Delete saved design"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
