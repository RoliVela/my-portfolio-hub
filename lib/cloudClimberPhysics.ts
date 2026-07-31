export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LandedBlock {
  x: number;
  width: number;
  y: number; // bottom of the block in world-space
  height: number;
  color: string;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const MIN_SURFACE_OVERLAP = 10; // px: ignore blocks that barely graze the character horizontally

/**
 * Returns the nearest underside (bottom-y) among all landed blocks that
 * overlap the horizontal interval [xStart, xEnd] and sit *above* the given
 * reference point. Useful for ceiling collision when jumping upward.
 */
export function ceilingHeightAt(xStart: number, xEnd: number, aboveY: number, landed: LandedBlock[]): number | null {
  let nearest: number | null = null;
  for (const b of landed) {
    const overlapLeft = Math.max(b.x, xStart);
    const overlapRight = Math.min(b.x + b.width, xEnd);
    if (overlapRight - overlapLeft <= MIN_SURFACE_OVERLAP) continue;
    if (b.y < aboveY) continue; // this block's underside is already at/below the reference point
    if (nearest === null || b.y < nearest) nearest = b.y;
  }
  return nearest;
}

/**
 * Returns the highest surface (top) among all landed blocks that overlap the
 * horizontal interval [xStart, xEnd]. Falls back to 0 (the floor).
 * Empty or reversed/zero-width intervals short-circuit to 0.
 */
export function surfaceHeightAt(xStart: number, xEnd: number, landed: LandedBlock[]): number {
  if (xStart >= xEnd) return 0;
  let maxY = 0; // the floor
  for (const b of landed) {
    const overlapLeft = Math.max(b.x, xStart);
    const overlapRight = Math.min(b.x + b.width, xEnd);
    if (overlapRight - overlapLeft <= MIN_SURFACE_OVERLAP) continue;
    maxY = Math.max(maxY, b.y + b.height);
  }
  return maxY;
}

/**
 * Axis-aligned rectangle intersection test.
 * Rectangles are treated as closed on the left/top and open on the right/bottom,
 * which means edges that merely touch do not count as overlapping.
 */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  const aRight = a.x + a.width;
  const bRight = b.x + b.width;
  const aTop = a.y + a.height;
  const bTop = b.y + b.height;
  return a.x < bRight && aRight > b.x && a.y < bTop && b.y < aTop;
}

/**
 * Resolve horizontal movement against landed block sides.
 * A block acts as a wall only when the character's feet are below the block's top surface
 * (i.e., the character is not already standing on it) and the character vertically overlaps
 * the block. Returns the clamped x position.
 */
export function resolveHorizontalMove(
  currentX: number,
  nextX: number,
  charY: number,
  charWidth: number,
  charHeight: number,
  landed: LandedBlock[]
): number {
  const movingRight = nextX > currentX;
  let resolvedX = nextX;
  for (const b of landed) {
    const blockTop = b.y + b.height;
    if (charY >= blockTop) continue; // standing on/above it — not a wall
    if (charY + charHeight <= b.y) continue; // fully below it — no vertical overlap
    const overlapsX = nextX < b.x + b.width && nextX + charWidth > b.x;
    if (!overlapsX) continue;
    const candidate = movingRight ? b.x - charWidth : b.x + b.width;
    resolvedX = movingRight ? Math.min(resolvedX, candidate) : Math.max(resolvedX, candidate);
  }
  return resolvedX;
}

const PIN_TOLERANCE = 2; // px: feet can be this far above the ground and still count as pinned
const FROM_ABOVE_TOLERANCE = 4; // px: block bottom can be this far below character head and still count as "from above"

/**
 * Returns true when a falling block is actually crushing the character against the
 * ground or another landed block. The block must be descending from above the
 * character's head while the character is pinned to a surface below.
 * This prevents unfair deaths when the player merely brushes the bottom of a
 * falling block while jumping.
 */
export function isCrushedByFallingBlock(
  charRect: Rect,
  blockRect: Rect,
  groundHeight: number,
  pinTolerance: number = PIN_TOLERANCE,
  fromAboveTolerance: number = FROM_ABOVE_TOLERANCE
): boolean {
  const isPinned = charRect.y <= groundHeight + pinTolerance;
  const fromAbove = blockRect.y >= charRect.y + charRect.height - fromAboveTolerance;
  return isPinned && fromAbove && rectsOverlap(charRect, blockRect);
}
