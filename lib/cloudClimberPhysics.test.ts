import { describe, it, expect } from 'vitest';
import { clamp, surfaceHeightAt, rectsOverlap, type LandedBlock } from './cloudClimberPhysics';

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
