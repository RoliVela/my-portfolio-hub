'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssetPath } from '@/lib/assets';
import { playMeowSound } from '@/lib/sfx';

type Direction = 'up' | 'down' | 'left' | 'right';
type Phase = 'intro' | 'playing' | 'input' | 'success' | 'failure';

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

const DIRECTION_ICONS: Record<Direction, string> = {
  up: '▲',
  down: '▼',
  left: '◀',
  right: '▶',
};

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
};

const IMAGES: Record<Direction | 'neutral' | 'loss', string> = {
  neutral: '/assets/Kermit_Game_Neutral.png',
  up: '/assets/Kermit_Game_Up.png',
  down: '/assets/Kermit_Game_Down.png',
  left: '/assets/Kermit_Game_Left.png',
  right: '/assets/Kermit_Game_Right.png',
  loss: '/assets/Kermit_Game_Loss.png',
};

const CONFETTI_COLORS = ['#fde047', '#f472b6', '#60a5fa', '#34d399', '#fb923c'];

interface KermitSimonSaysProps {
  onComplete?: () => void;
}

interface ConfettiPiece {
  id: number;
  color: string;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  delay: number;
}

function readStoredHighScore(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const stored = window.localStorage.getItem('kermit-says-high-score');
    if (!stored) return 1;
    const parsed = parseInt(stored, 10);
    return Number.isNaN(parsed) ? 1 : parsed;
  } catch {
    return 1;
  }
}

function updateHighScore(round: number, prev: number): number {
  if (round > prev) {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('kermit-says-high-score', String(round));
      } catch {
        // Ignore storage errors (e.g. private browsing restrictions).
      }
    }
    return round;
  }
  return prev;
}

function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x: (Math.random() - 0.5) * 300,
    y: -(Math.random() * 250 + 100),
    rotate: Math.random() * 360,
    scale: 0.6 + Math.random() * 0.6,
    delay: Math.random() * 0.1,
  }));
}

// Keep onComplete prop available for callers; it's passed by the shared wrapper.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function KermitSimonSays({ onComplete }: KermitSimonSaysProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [sequence, setSequence] = useState<Direction[]>([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [activeDirection, setActiveDirection] = useState<Direction | null>(null);
  const [bounceKey, setBounceKey] = useState(0);
  const [message, setMessage] = useState('Help Kermit remember the pattern!');
  const [highScore, setHighScore] = useState(readStoredHighScore);
  const [celebrating, setCelebrating] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const round = Math.max(1, sequence.length);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  };

  const queueTimeout = (callback: () => void, delay: number) => {
    const id = setTimeout(callback, delay);
    timeoutsRef.current.push(id);
    return id;
  };

  const playSequence = useCallback((seq: Direction[]) => {
    clearAllTimeouts();
    setPhase('playing');
    setActiveDirection(null);
    setMessage('Watch the pattern...');
    setInputIndex(0);
    setCelebrating(false);

    let delay = 500;
    seq.forEach((dir, index) => {
      queueTimeout(() => {
        setBounceKey((prev) => prev + 1);
        setActiveDirection(dir);
        queueTimeout(() => {
          setActiveDirection(null);
          if (index === seq.length - 1) {
            queueTimeout(() => {
              setPhase('input');
              setMessage('Your turn! Repeat the pattern.');
            }, 250);
          }
        }, 600);
      }, delay);
      delay += 900;
    });
  }, []);

  const resetGame = useCallback(() => {
    clearAllTimeouts();
    const first: Direction[] = [getRandomDirection()];
    setSequence(first);
    setInputIndex(0);
    setActiveDirection(null);
    setCelebrating(false);
    setConfetti([]);
    setMessage('Watch the pattern...');
    setPhase('playing');
    playSequence(first);
  }, [playSequence]);

  const handleStart = () => {
    resetGame();
  };

  const handleTryAgain = () => {
    resetGame();
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  const handleUserPress = useCallback(
    (direction: Direction) => {
      playMeowSound();
      if (phase !== 'input') return;

      const expected = sequence[inputIndex];
      if (direction !== expected) {
        setPhase('failure');
        setActiveDirection(null);
        setCelebrating(false);
        setConfetti([]);
        setMessage('Oops! Kermit got confused.');
        return;
      }

      setBounceKey((prev) => prev + 1);
      setActiveDirection(direction);
      queueTimeout(() => setActiveDirection(null), 550);

      const nextIndex = inputIndex + 1;
      if (nextIndex >= sequence.length) {
        const nextSequence: Direction[] = [...sequence, getRandomDirection()];
        const nextRound = nextSequence.length;
        setSequence(nextSequence);
        setInputIndex(0);
        setHighScore((prev) => updateHighScore(nextRound, prev));
        setConfetti(generateConfetti());
        setCelebrating(true);
        setPhase('success');
        setMessage('Great job! Next round...');
        queueTimeout(() => {
          playSequence(nextSequence);
        }, 1200);
      } else {
        setInputIndex(nextIndex);
      }
    },
    [phase, inputIndex, sequence, playSequence]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'input') return;
      const direction = KEY_TO_DIRECTION[e.key];
      if (direction) {
        e.preventDefault();
        handleUserPress(direction);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, inputIndex, sequence, handleUserPress]);

  const currentImage =
    phase === 'failure'
      ? IMAGES.loss
      : activeDirection
        ? IMAGES[activeDirection]
        : IMAGES.neutral;

  const arrowPositionClasses: Record<Direction, string> = {
    up: '-top-8 left-1/2 -translate-x-1/2',
    down: '-bottom-8 left-1/2 -translate-x-1/2',
    left: '-left-8 top-1/2 -translate-y-1/2',
    right: '-right-8 top-1/2 -translate-y-1/2',
  };

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6 rounded-lg border-4 border-pink-300 bg-purple-950 p-6 shadow-[0_0_0_4px_#000] font-vt323 text-white">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl">Kermit Says</h2>
        <p className="text-lg text-white/80 md:text-xl">
          Round: {round} — Best: {highScore}
        </p>
      </div>

      <div className="relative">
        <motion.div
          key={bounceKey}
          className="relative h-48 w-48 will-change-transform md:h-64 md:w-64"
          initial={{ x: 0, y: 0 }}
          animate={{
            x: activeDirection === 'left' ? -16 : activeDirection === 'right' ? 16 : 0,
            y: activeDirection === 'up' ? -16 : activeDirection === 'down' ? 16 : 0,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getAssetPath(currentImage)}
            alt="Kermit"
            className="h-full w-full object-contain pixel-art drop-shadow-2xl"
          />
          <AnimatePresence>
            {celebrating && (
              <div className="pointer-events-none absolute inset-0 overflow-visible">
                {confetti.map((piece) => (
                  <motion.span
                    key={piece.id}
                    initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 0 }}
                    animate={{
                      opacity: [1, 1, 0],
                      x: piece.x,
                      y: piece.y,
                      rotate: piece.rotate,
                      scale: piece.scale,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 1.2,
                      delay: piece.delay,
                      ease: 'easeOut',
                    }}
                    className="absolute left-1/2 top-1/2 block h-2 w-2 rounded-sm"
                    style={{ backgroundColor: piece.color }}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {activeDirection && (
            <motion.div
              key={activeDirection}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15 }}
              className={`pointer-events-none absolute ${arrowPositionClasses[activeDirection]} text-5xl text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)] md:text-6xl`}
            >
              {DIRECTION_ICONS[activeDirection]}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 grid grid-cols-3 gap-2" data-no-pop>
          <div />
          <button
            type="button"
            onClick={() => handleUserPress('up')}
            disabled={phase !== 'input'}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded border-2 border-pink-300/50 bg-purple-900 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 disabled:opacity-50"
            aria-label="Up"
          >
            ▲
          </button>
          <div />
          <button
            type="button"
            onClick={() => handleUserPress('left')}
            disabled={phase !== 'input'}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded border-2 border-pink-300/50 bg-purple-900 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 disabled:opacity-50"
            aria-label="Left"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => handleUserPress('down')}
            disabled={phase !== 'input'}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded border-2 border-pink-300/50 bg-purple-900 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 disabled:opacity-50"
            aria-label="Down"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={() => handleUserPress('right')}
            disabled={phase !== 'input'}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded border-2 border-pink-300/50 bg-purple-900 text-xl text-pink-100 transition hover:border-pink-300 hover:bg-purple-800 disabled:opacity-50"
            aria-label="Right"
          >
            ▶
          </button>
        </div>
      </div>

      <p className="min-h-[1.5em] text-center text-xl md:text-2xl">{message}</p>

      <div className="flex gap-4">
        {phase === 'intro' && (
          <button
            type="button"
            onClick={handleStart}
            className="rounded border-2 border-white bg-white px-6 py-2 text-2xl text-black transition hover:bg-black hover:text-white"
          >
            Start
          </button>
        )}
        {phase === 'failure' && (
          <button
            type="button"
            onClick={handleTryAgain}
            className="rounded border-2 border-white bg-white px-6 py-2 text-2xl text-black transition hover:bg-black hover:text-white"
          >
            Try Again
          </button>
        )}
      </div>

      <p className="max-w-md text-center text-sm text-white/60">
        Use arrow keys or the buttons above. Repeat the full pattern each round.
      </p>
    </div>
  );
}

function getRandomDirection(): Direction {
  return DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
}
