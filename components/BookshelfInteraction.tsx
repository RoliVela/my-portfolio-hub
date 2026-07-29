'use client';

import { useCallback, useMemo, useState } from 'react';

interface BookshelfInteractionProps {
  onComplete?: () => void;
}

interface Book {
  title: string;
  author: string;
  color: string;
  height: number;
  fontSize: number;
}

interface BookEntry {
  title: string;
  author: string;
}

const STORAGE_KEY = 'bookshelf-visitor-book';

// TODO: replace with Roli's real favorite books.
const FAVORITE_BOOKS: BookEntry[] = [
  { title: 'Where the Wild Things Are', author: 'Maurice Sendak' },
  { title: 'Dune', author: 'Frank Herbert' },
  { title: 'The Name of the Wind', author: 'Patrick Rothfuss' },
  { title: 'Project Hail Mary', author: 'Andy Weir' },
  { title: 'Norwegian Wood', author: 'Haruki Murakami' },
];

const SPINE_COLORS = [
  'bg-rose-700',
  'bg-sky-700',
  'bg-emerald-700',
  'bg-amber-700',
  'bg-violet-700',
  'bg-orange-700',
  'bg-teal-700',
  'bg-indigo-700',
];

const MIN_HEIGHT = 180;
const MAX_HEIGHT = 320;
const PX_PER_CHAR = 10;
const MIN_FONT = 10;
const MAX_FONT = 36;

function randomColor() {
  return SPINE_COLORS[Math.floor(Math.random() * SPINE_COLORS.length)] ?? 'bg-rose-700';
}

function randomSpineHeight(title: string) {
  const base = title.length * PX_PER_CHAR + 80;
  const variation = Math.floor((Math.random() - 0.5) * 80);
  return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, base + variation));
}

function spineFontSize(title: string, height: number) {
  return Math.max(MIN_FONT, Math.min(MAX_FONT, (height - 50) / title.length));
}

function createBook(entry: BookEntry): Book {
  const height = randomSpineHeight(entry.title);
  return {
    ...entry,
    color: randomColor(),
    height,
    fontSize: spineFontSize(entry.title, height),
  };
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j] as T;
    result[j] = temp as T;
  }
  return result;
}

function loadVisitorBook(): BookEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.title === 'string' && typeof parsed.author === 'string') {
      return parsed as BookEntry;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

function saveVisitorBook(entry: BookEntry) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // ignore storage errors
  }
}

export default function BookshelfInteraction({ onComplete }: BookshelfInteractionProps) {
  const [shelfItems, setShelfItems] = useState<(Book | null)[]>(() => {
    const visitor = loadVisitorBook();
    const base = FAVORITE_BOOKS.map(createBook);
    const withSlot = visitor ? [...base, createBook(visitor)] : [...base, null];
    return shuffle(withSlot);
  });
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');

  const slotFilled = useMemo(() => !shelfItems.some((item) => item === null), [shelfItems]);

  const handleAddClick = useCallback((index: number) => {
    setAddingIndex(index);
  }, []);

  const handleSubmit = useCallback(() => {
    const title = newTitle.trim();
    const author = newAuthor.trim() || 'Unknown';
    if (!title) return;

    const entry: BookEntry = { title, author };
    saveVisitorBook(entry);

    setShelfItems((prev) => {
      const next = [...prev];
      const idx = addingIndex ?? next.findIndex((item) => item === null);
      if (idx >= 0) {
        next[idx] = createBook(entry);
      }
      return next;
    });

    setAddingIndex(null);
    setNewTitle('');
    setNewAuthor('');
  }, [newTitle, newAuthor, addingIndex]);

  const handleCancel = useCallback(() => {
    setAddingIndex(null);
    setNewTitle('');
    setNewAuthor('');
  }, []);

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-4">
      <div className="flex w-full flex-col items-center gap-4 rounded-lg border-4 border-pink-300 bg-purple-950 p-6 shadow-[0_0_0_4px_#000]">
        <h2 className="text-center font-vt323 text-3xl text-pink-200">Roli&apos;s Favorite Books</h2>
        <p className="text-center font-vt323 text-lg text-pink-100/80">
          The shelf rearranges itself every time you look. Add your own favorite to the empty slot.
        </p>

        <div className="relative w-full rounded border-4 border-amber-900 bg-amber-900/30 p-4">
          <div className="flex min-h-[360px] items-end justify-center gap-3 px-4 pb-1">
            {shelfItems.map((item, index) =>
              item ? (
                <div
                  key={`${item.title}-${index}`}
                  style={{ height: item.height }}
                  className={`flex w-16 flex-col items-center border-2 border-black pt-1 pb-2 shadow-md ${item.color}`}
                >
                  <span className="w-full truncate px-1 text-center font-vt323 text-[10px] leading-none tracking-wide text-white/90">
                    {item.author}
                  </span>
                  <div className="flex flex-1 w-full items-start justify-center overflow-hidden py-2">
                    <span
                      className="truncate font-vt323 leading-none text-white [writing-mode:vertical-rl]"
                      style={{ fontSize: item.fontSize }}
                      title={item.title}
                    >
                      {item.title}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  key={`empty-${index}`}
                  type="button"
                  onClick={() => handleAddClick(index)}
                  style={{ height: MIN_HEIGHT }}
                  className={`flex w-16 flex-col items-center justify-center border-2 border-dashed border-pink-300/50 bg-purple-900/50 p-1 text-center font-vt323 text-sm text-pink-100 transition hover:text-white ${
                    addingIndex === index ? 'ring-2 ring-pink-300' : ''
                  }`}
                >
                  <span className="text-2xl">+</span>
                  <span className="[writing-mode:vertical-rl]">Add yours</span>
                </button>
              )
            )}
          </div>
          {/* Shelf ledge */}
          <div className="h-3 w-full rounded-sm bg-amber-950 shadow" />
        </div>

        {addingIndex !== null && (
          <div className="flex w-full max-w-md flex-col gap-2 rounded border-2 border-pink-300 bg-purple-900/50 p-3">
            <p className="text-center font-vt323 text-lg text-pink-100">Add your favorite book</p>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Book title"
              className="rounded border border-pink-300/50 bg-purple-900 px-3 py-2 font-vt323 text-lg text-pink-100 placeholder:text-pink-100/50"
            />
            <input
              type="text"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              placeholder="Author"
              className="rounded border border-pink-300/50 bg-purple-900 px-3 py-2 font-vt323 text-lg text-pink-100 placeholder:text-pink-100/50"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 rounded bg-pink-300 px-4 py-2 font-vt323 text-xl text-black transition hover:bg-pink-200"
              >
                Add
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 rounded border border-pink-300 px-4 py-2 font-vt323 text-xl text-pink-100 transition hover:bg-purple-900"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {!slotFilled && (
            <p className="text-center font-vt323 text-sm text-pink-100/70">
              Click the empty slot to add your favorite book.
            </p>
          )}
          <button
            type="button"
            onClick={onComplete}
            className="rounded border-2 border-white/50 bg-black px-6 py-2 font-vt323 text-xl text-white transition hover:border-white hover:bg-white/10"
          >
            Walk Away
          </button>
        </div>
      </div>
    </div>
  );
}
