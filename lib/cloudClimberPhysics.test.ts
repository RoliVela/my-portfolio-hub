import { describe, it, expect } from 'vitest';
import { clamp, surfaceHeightAt, ceilingHeightAt, rectsOverlap, resolveHorizontalMove, isCrushedByFallingBlock, type LandedBlock } from './cloudClimberPhysics';

describe('clamp', () => {
  it('returns the value when inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to the minimum', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it('clamps to the maximum', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('returns the min when value equals min', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('returns the max when value equals max', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('surfaceHeightAt', () => {
  it('returns 0 for an empty world', () => {
    expect(surfaceHeightAt(0, 100, [])).toBe(0);
  });

  it('returns the top surface of a single overlapping block', () => {
    const blocks: LandedBlock[] = [{ x: 10, width: 50, y: 20, height: 30, color: '#f472b6' }];
    expect(surfaceHeightAt(15, 35, blocks)).toBe(50);
  });

  it('returns the highest surface among multiple overlapping blocks', () => {
    const blocks: LandedBlock[] = [
      { x: 0, width: 100, y: 10, height: 20, color: '#f472b6' },
      { x: 30, width: 40, y: 50, height: 25, color: '#60a5fa' },
    ];
    expect(surfaceHeightAt(35, 60, blocks)).toBe(75);
  });

  it('ignores blocks that do not overlap the queried interval', () => {
    const blocks: LandedBlock[] = [
      { x: 0, width: 20, y: 5, height: 10, color: '#f472b6' },
      { x: 200, width: 50, y: 80, height: 30, color: '#60a5fa' },
    ];
    expect(surfaceHeightAt(50, 150, blocks)).toBe(0);
  });

  it('treats blocks just touching the interval edges as non-overlapping', () => {
    const blocks: LandedBlock[] = [{ x: 100, width: 50, y: 10, height: 20, color: '#f472b6' }];
    // Block spans [100, 150). Query [50, 100) touches at x=100 only.
    expect(surfaceHeightAt(50, 100, blocks)).toBe(0);
    // Query [150, 200) touches at x=150 only.
    expect(surfaceHeightAt(150, 200, blocks)).toBe(0);
  });

  it('returns 0 for zero-width intervals', () => {
    const blocks: LandedBlock[] = [{ x: 0, width: 400, y: 5, height: 10, color: '#f472b6' }];
    expect(surfaceHeightAt(0, 0, blocks)).toBe(0);
    expect(surfaceHeightAt(100, 100, blocks)).toBe(0);
  });

  it('ignores blocks that only barely graze the query interval horizontally', () => {
    const blocks: LandedBlock[] = [{ x: 50, y: 20, width: 60, height: 30, color: '#f472b6' }];
    // Query [49, 50] touches the block edge (overlap 0)
    expect(surfaceHeightAt(49, 50, blocks)).toBe(0);
    // Query [48, 50] still touches the block edge (overlap 0)
    expect(surfaceHeightAt(48, 50, blocks)).toBe(0);
    // Query [47, 61] overlaps the block by 11px -> counted
    expect(surfaceHeightAt(47, 61, blocks)).toBe(50);
  });

  it('still counts blocks with meaningful horizontal overlap', () => {
    const blocks: LandedBlock[] = [{ x: 50, y: 20, width: 60, height: 30, color: '#f472b6' }];
    expect(surfaceHeightAt(55, 90, blocks)).toBe(50);
  });
});

describe('rectsOverlap', () => {
  it('returns true for overlapping rectangles', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    expect(rectsOverlap(a, b)).toBe(true);
  });

  it('returns true when one rectangle is inside the other', () => {
    const a = { x: 0, y: 0, width: 20, height: 20 };
    const b = { x: 5, y: 5, width: 5, height: 5 };
    expect(rectsOverlap(a, b)).toBe(true);
  });

  it('returns false for non-overlapping rectangles', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 20, y: 20, width: 10, height: 10 };
    expect(rectsOverlap(a, b)).toBe(false);
  });

  it('returns false when rectangles only touch on an edge', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 10, y: 0, width: 10, height: 10 };
    expect(rectsOverlap(a, b)).toBe(false);
  });

  it('returns false when rectangles only touch at a corner', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 10, y: 10, width: 10, height: 10 };
    expect(rectsOverlap(a, b)).toBe(false);
  });

  it('returns true for identical rectangles', () => {
    const a = { x: 3, y: 3, width: 7, height: 7 };
    expect(rectsOverlap(a, a)).toBe(true);
  });
});

describe('resolveHorizontalMove', () => {
  it('stops rightward movement at the left edge of a wall block', () => {
    const landed: LandedBlock[] = [{ x: 50, y: 10, width: 40, height: 60, color: '#f472b6' }];
    // Character (width 10, height 10, feet at y=5) is below the block top (y=10+60=70) and moving right into it.
    expect(resolveHorizontalMove(30, 42, 5, 10, 10, landed)).toBe(40);
  });

  it('stops leftward movement at the right edge of a wall block', () => {
    const landed: LandedBlock[] = [{ x: 10, y: 10, width: 40, height: 60, color: '#f472b6' }];
    // Character is below the block top and moving left into it.
    expect(resolveHorizontalMove(52, 40, 5, 10, 10, landed)).toBe(50);
  });

  it('does not block movement across a block the character is standing on', () => {
    const landed: LandedBlock[] = [{ x: 50, y: 10, width: 40, height: 60, color: '#f472b6' }];
    const blockTop = 70;
    // Character's feet are at or above the block top, so it is standing on it.
    expect(resolveHorizontalMove(55, 65, blockTop, 10, 10, landed)).toBe(65);
    expect(resolveHorizontalMove(85, 75, blockTop, 10, 10, landed)).toBe(75);
  });

  it('does not block movement when the character is fully below the block', () => {
    const landed: LandedBlock[] = [{ x: 50, y: 100, width: 40, height: 60, color: '#f472b6' }];
    // Character feet at y=0, head at y=10, block bottom at 100 — no vertical overlap.
    expect(resolveHorizontalMove(30, 60, 0, 10, 10, landed)).toBe(60);
  });

  it('returns the raw nextX when there are no landed blocks', () => {
    expect(resolveHorizontalMove(10, 30, 0, 10, 10, [])).toBe(30);
  });
});

describe('isCrushedByFallingBlock', () => {
  it('returns true when a falling block pins the character against the ground', () => {
    const charRect = { x: 100, y: 0, width: 28, height: 28 };
    const blockRect = { x: 90, y: 25, width: 50, height: 30 }; // bottom just above character head
    expect(isCrushedByFallingBlock(charRect, blockRect, 0)).toBe(true);
  });

  it('returns false when the character is jumping and only touches the bottom of the block', () => {
    const charRect = { x: 100, y: 50, width: 28, height: 28 };
    const blockRect = { x: 90, y: 75, width: 50, height: 30 }; // bottom at character head, character is mid-air
    expect(isCrushedByFallingBlock(charRect, blockRect, 0)).toBe(false);
  });

  it('returns false when the block is below the character', () => {
    const charRect = { x: 100, y: 100, width: 28, height: 28 };
    const blockRect = { x: 90, y: 50, width: 50, height: 30 }; // entirely below character
    expect(isCrushedByFallingBlock(charRect, blockRect, 0)).toBe(false);
  });

  it('returns false when the block is to the side and not overlapping', () => {
    const charRect = { x: 100, y: 0, width: 28, height: 28 };
    const blockRect = { x: 200, y: 25, width: 50, height: 30 }; // far to the right
    expect(isCrushedByFallingBlock(charRect, blockRect, 0)).toBe(false);
  });

  it('returns true when the character is pinned against a landed block below them', () => {
    const charRect = { x: 100, y: 60, width: 28, height: 28 };
    const blockRect = { x: 90, y: 85, width: 50, height: 30 }; // descending onto character
    expect(isCrushedByFallingBlock(charRect, blockRect, 60)).toBe(true);
  });
});

describe('ceilingHeightAt', () => {
  it('returns null for an empty world', () => {
    expect(ceilingHeightAt(0, 100, 0, [])).toBeNull();
  });

  it('returns the underside of a single overlapping block above the reference point', () => {
    const blocks: LandedBlock[] = [{ x: 10, width: 50, y: 100, height: 30, color: '#f472b6' }];
    // Block bottom is y=100. Reference point at y=80 (below block underside).
    expect(ceilingHeightAt(15, 35, 80, blocks)).toBe(100);
  });

  it('returns null when all blocks are below the reference point', () => {
    const blocks: LandedBlock[] = [{ x: 10, width: 50, y: 50, height: 30, color: '#f472b6' }];
    // Block bottom is y=50. Reference point at y=60 (above block underside).
    expect(ceilingHeightAt(15, 35, 60, blocks)).toBeNull();
  });

  it('returns the nearest (lowest) underside among multiple overlapping blocks', () => {
    const blocks: LandedBlock[] = [
      { x: 0, width: 100, y: 200, height: 20, color: '#f472b6' },
      { x: 30, width: 40, y: 150, height: 25, color: '#60a5fa' },
    ];
    // Both blocks overlap horizontally with [35, 60].
    // Block 1 underside: y=200. Block 2 underside: y=150.
    // Nearest (lowest) above ref point y=100 is 150.
    expect(ceilingHeightAt(35, 60, 100, blocks)).toBe(150);
  });

  it('ignores blocks that do not overlap the queried interval', () => {
    const blocks: LandedBlock[] = [
      { x: 0, width: 20, y: 100, height: 10, color: '#f472b6' },
      { x: 200, width: 50, y: 80, height: 30, color: '#60a5fa' },
    ];
    expect(ceilingHeightAt(50, 150, 0, blocks)).toBeNull();
  });

  it('ignores blocks that barely graze the query interval', () => {
    const blocks: LandedBlock[] = [{ x: 50, y: 100, width: 60, height: 30, color: '#f472b6' }];
    expect(ceilingHeightAt(49, 50, 0, blocks)).toBeNull();
    expect(ceilingHeightAt(47, 61, 0, blocks)).toBe(100);
  });
});

describe('resolveHorizontalMove — multi-block', () => {
  it('produces the same result regardless of block iteration order', () => {
    // Two adjacent blocks sharing a boundary at x=100.
    // Character moving right into the boundary from the left block.
    const blockA: LandedBlock = { x: 50, y: 10, width: 50, height: 60, color: '#f472b6' };
    const blockB: LandedBlock = { x: 100, y: 10, width: 50, height: 60, color: '#60a5fa' };

    const resultAB = resolveHorizontalMove(80, 95, 5, 10, 10, [blockA, blockB]);
    const resultBA = resolveHorizontalMove(80, 95, 5, 10, 10, [blockB, blockA]);

    expect(resultAB).toBe(resultBA);
  });

  it('resolves correctly with three adjacent blocks', () => {
    const blockA: LandedBlock = { x: 0, y: 10, width: 40, height: 60, color: '#f472b6' };
    const blockB: LandedBlock = { x: 40, y: 10, width: 40, height: 60, color: '#60a5fa' };
    const blockC: LandedBlock = { x: 80, y: 10, width: 40, height: 60, color: '#34d399' };

    // Moving right from inside blockB toward blockC
    const resultABC = resolveHorizontalMove(50, 78, 5, 10, 10, [blockA, blockB, blockC]);
    const resultCBA = resolveHorizontalMove(50, 78, 5, 10, 10, [blockC, blockB, blockA]);

    expect(resultABC).toBe(resultCBA);
  });
});
