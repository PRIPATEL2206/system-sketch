/**
 * Convert an array of [x, y] points into a smooth SVG path `d` string
 * using Catmull-Rom → cubic Bézier interpolation.
 *
 * Simplification: when there are fewer than 3 points, fall back to a
 * simple polyline. When there's just 1, render a dot.
 */
export function pointsToSmoothPath(points: number[][]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const [x, y] = points[0];
    return `M${x},${y} L${x + 0.1},${y + 0.1}`;
  }
  if (points.length === 2) {
    return `M${points[0][0]},${points[0][1]} L${points[1][0]},${points[1][1]}`;
  }

  let d = `M${points[0][0]},${points[0][1]}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[Math.min(i + 1, points.length - 1)];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    // Catmull-Rom → Cubic Bézier control points (tension = 0.5)
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }

  return d;
}

/**
 * Simplify a freehand point array by dropping points that are within
 * `tolerance` of the previous kept point. This reduces point counts by
 * 2-3× on fast movements without losing visible quality.
 */
export function simplifyPoints(points: number[][], tolerance = 2): number[][] {
  if (points.length <= 2) return points;
  const result = [points[0]];
  let prev = points[0];
  for (let i = 1; i < points.length - 1; i++) {
    const dx = points[i][0] - prev[0];
    const dy = points[i][1] - prev[1];
    if (dx * dx + dy * dy > tolerance * tolerance) {
      result.push(points[i]);
      prev = points[i];
    }
  }
  // Always keep the last point for accuracy.
  result.push(points[points.length - 1]);
  return result;
}
