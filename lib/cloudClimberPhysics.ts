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

/**
 * Returns the highest surface (top) among all landed blocks that overlap the
 * horizontal interval [xStart, xEnd]. Falls back to 0 (the floor).
 * Empty or reversed/zero-width intervals short-circuit to 0.
 */
export function surfaceHeightAt(xStart: number, xEnd: number, landed: LandedBlock[]): number {
  if (xStart >= xEnd) return 0;
  let maxY = 0; // the floor
  for (const b of landed) {
    if (b.x < xEnd && b.x + b.width > xStart) {
      maxY = Math.max(maxY, b.y + b.height);
    }
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
  let resolvedX = nextX;
  for (const b of landed) {
    const blockTop = b.y + b.height;
    if (charY >= blockTop) continue; // standing on/above it — not a wall
    if (charY + charHeight <= b.y) continue; // fully below it — no vertical overlap
    const overlapsX = resolvedX < b.x + b.width && resolvedX + charWidth > b.x;
    if (!overlapsX) continue;
    resolvedX = nextX > currentX ? b.x - charWidth : b.x + b.width;
  }
  return resolvedX;
}
