'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAssetPath } from '@/lib/assets';

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

interface KermitSimonSaysProps {
  onComplete?: () => void;
}

export default function KermitSimonSays({ onComplete }: KermitSimonSaysProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [sequence, setSequence] = useState<Direction[]>([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [activeDirection, setActiveDirection] = useState<Direction | null>(null);
  const [message, setMessage] = useState('Help Kermit remember the pattern!');
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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

    let delay = 500;
    seq.forEach((dir, index) => {
      queueTimeout(() => {
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
      if (phase !== 'input') return;

      const expected = sequence[inputIndex];
      if (direction !== expected) {
        setPhase('failure');
        setActiveDirection(null);
        setMessage('Oops! Kermit got confused.');
        return;
      }

      setActiveDirection(direction);
      queueTimeout(() => setActiveDirection(null), 200);

      const nextIndex = inputIndex + 1;
      if (nextIndex >= sequence.length) {
        setPhase('success');
        setMessage('Great job! Next round...');
        queueTimeout(() => {
          const nextSequence: Direction[] = [...sequence, getRandomDirection()];
          setSequence(nextSequence);
          setInputIndex(0);
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

  return (
    <div className="flex w-full flex-col items-center gap-6 p-2 font-vt323 text-white">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl">Kermit Says</h2>
        <p className="text-lg text-white/80 md:text-xl">
          Round: {Math.max(1, sequence.length)}
        </p>
      </div>

      <div className="relative">
        <div className="relative h-48 w-48 md:h-64 md:w-64">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getAssetPath(currentImage)}
            alt="Kermit"
            className="h-full w-full object-contain pixel-art drop-shadow-2xl"
          />
          {activeDirection && (
            <div className="pointer-events-none absolute -right-8 top-1/2 -translate-y-1/2 text-5xl text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)] md:text-6xl">
              {DIRECTION_ICONS[activeDirection]}
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div />
          <button
            type="button"
            onClick={() => handleUserPress('up')}
            disabled={phase !== 'input'}
            className="flex h-10 w-10 items-center justify-center rounded bg-white/10 text-xl hover:bg-white/20 disabled:opacity-50"
            aria-label="Up"
          >
            ▲
          </button>
          <div />
          <button
            type="button"
            onClick={() => handleUserPress('left')}
            disabled={phase !== 'input'}
            className="flex h-10 w-10 items-center justify-center rounded bg-white/10 text-xl hover:bg-white/20 disabled:opacity-50"
            aria-label="Left"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => handleUserPress('down')}
            disabled={phase !== 'input'}
            className="flex h-10 w-10 items-center justify-center rounded bg-white/10 text-xl hover:bg-white/20 disabled:opacity-50"
            aria-label="Down"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={() => handleUserPress('right')}
            disabled={phase !== 'input'}
            className="flex h-10 w-10 items-center justify-center rounded bg-white/10 text-xl hover:bg-white/20 disabled:opacity-50"
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
        <button
          type="button"
          onClick={onComplete}
          className="rounded border-2 border-white bg-black px-6 py-2 text-2xl text-white transition hover:bg-white hover:text-black"
        >
          Exit
        </button>
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
