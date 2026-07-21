'use client';

import { useEffect } from 'react';
import { playPopSound } from '@/lib/sfx';

/**
 * Attach a global click listener that plays a short UI "pop" sound for every
 * `<button>` or `[role="button"]` press.
 *
 * Elements (or their ancestors) with `data-no-pop` are skipped — useful for
 * disabling the sound during drag/reposition mode.
 */
export function useInteractionSound() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Skip elements explicitly marked as no-pop (e.g. during reposition drag).
      if (target.closest('[data-no-pop]')) return;

      // Only fire for actual interactive buttons.
      const interactive = target.closest('button, [role="button"]');
      if (!interactive) return;

      playPopSound();
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
}
