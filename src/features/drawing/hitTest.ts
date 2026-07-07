import type { DrawingElement } from '@/types';

/**
 * Check if a point (px, py) is "close enough" to a drawing element.
 * Used by the eraser to decide what to highlight/delete.
 */
export function isPointNearDrawing(
  px: number,
  py: number,
  drawing: DrawingElement,
  threshold = 12,
): boolean {
  switch (drawing.type) {
    case 'freehand':
      return isPointNearPath(px, py, drawing.points, threshold);
    case 'line':
    case 'arrow':
      return isPointNearPath(px, py, drawing.points, threshold);
    case 'rect':
      return isPointNearRect(px, py, drawing.points, threshold);
    case 'ellipse':
      return isPointNearEllipse(px, py, drawing.points, threshold);
  }
}

function isPointNearPath(px: number, py: number, points: number[][], threshold: number): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const dist = distToSegment(px, py, x1, y1, x2, y2);
    if (dist < threshold) return true;
  }
  // Single point check
  if (points.length === 1) {
    const dx = px - points[0][0];
    const dy = py - points[0][1];
    return dx * dx + dy * dy < threshold * threshold;
  }
  return false;
}

function isPointNearRect(px: number, py: number, pts: number[][], threshold: number): boolean {
  if (pts.length < 2) return false;
  const x1 = Math.min(pts[0][0], pts[1][0]);
  const y1 = Math.min(pts[0][1], pts[1][1]);
  const x2 = Math.max(pts[0][0], pts[1][0]);
  const y2 = Math.max(pts[0][1], pts[1][1]);
  // Check proximity to any of the 4 edges.
  const edges: number[][][] = [
    [[x1, y1], [x2, y1]],
    [[x2, y1], [x2, y2]],
    [[x2, y2], [x1, y2]],
    [[x1, y2], [x1, y1]],
  ];
  for (const [a, b] of edges) {
    if (distToSegment(px, py, a[0], a[1], b[0], b[1]) < threshold) return true;
  }
  return false;
}

function isPointNearEllipse(px: number, py: number, pts: number[][], threshold: number): boolean {
  if (pts.length < 2) return false;
  const cx = (pts[0][0] + pts[1][0]) / 2;
  const cy = (pts[0][1] + pts[1][1]) / 2;
  const rx = Math.abs(pts[1][0] - pts[0][0]) / 2;
  const ry = Math.abs(pts[1][1] - pts[0][1]) / 2;
  if (rx === 0 || ry === 0) return false;
  // Normalized radius: distance from center in ellipse-space.
  const dx = (px - cx) / rx;
  const dy = (py - cy) / ry;
  const normalizedDist = Math.sqrt(dx * dx + dy * dy);
  // Near the ellipse perimeter if normalizedDist ≈ 1.
  const ringThreshold = threshold / Math.min(rx, ry);
  return Math.abs(normalizedDist - 1) < ringThreshold;
}

/** Distance from point (px,py) to segment (x1,y1)→(x2,y2). */
function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const nx = x1 + t * dx;
  const ny = y1 + t * dy;
  return Math.sqrt((px - nx) ** 2 + (py - ny) ** 2);
}
