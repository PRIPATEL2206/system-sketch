import type { SystemNode } from '@/types';

/**
 * Default node footprint when `width`/`height` aren't yet measured.
 * Matches the actual SystemNode min-width and a typical rendered height.
 * Used only as a fallback so alignment doesn't NaN-out before the first
 * resize observer pass.
 */
const FALLBACK_W = 200;
const FALLBACK_H = 70;

function size(n: SystemNode): { w: number; h: number } {
  return { w: n.width ?? FALLBACK_W, h: n.height ?? FALLBACK_H };
}

export type AlignAxis =
  | 'left'
  | 'h-center'
  | 'right'
  | 'top'
  | 'v-center'
  | 'bottom';

/**
 * Move every node so the given axis lines up with the *first* node's
 * position. We pick the first selected node as the reference because
 * "Align to selection bounds" produces unintuitive results when the user
 * is, e.g., trying to line everything up to "this node here".
 */
export function alignNodes(
  nodes: SystemNode[],
  axis: AlignAxis,
): Map<string, { x: number; y: number }> {
  const map = new Map<string, { x: number; y: number }>();
  if (nodes.length < 2) return map;
  const ref = nodes[0];
  const refS = size(ref);

  for (const n of nodes) {
    if (n === ref) continue;
    const s = size(n);
    let { x, y } = n.position;
    switch (axis) {
      case 'left':
        x = ref.position.x;
        break;
      case 'h-center':
        x = ref.position.x + (refS.w - s.w) / 2;
        break;
      case 'right':
        x = ref.position.x + refS.w - s.w;
        break;
      case 'top':
        y = ref.position.y;
        break;
      case 'v-center':
        y = ref.position.y + (refS.h - s.h) / 2;
        break;
      case 'bottom':
        y = ref.position.y + refS.h - s.h;
        break;
    }
    map.set(n.id, { x, y });
  }
  return map;
}

export type DistributeAxis = 'horizontal' | 'vertical';

/**
 * Distribute nodes evenly along the chosen axis. The outermost two nodes
 * stay put; the rest are spaced so the gap between consecutive nodes
 * (along that axis) is constant. Returns positions to assign per id.
 */
export function distributeNodes(
  nodes: SystemNode[],
  axis: DistributeAxis,
): Map<string, { x: number; y: number }> {
  const map = new Map<string, { x: number; y: number }>();
  if (nodes.length < 3) return map;

  const sortKey = (n: SystemNode) =>
    axis === 'horizontal' ? n.position.x : n.position.y;
  const ordered = [...nodes].sort((a, b) => sortKey(a) - sortKey(b));

  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  if (axis === 'horizontal') {
    const totalGap =
      last.position.x -
      first.position.x -
      ordered.slice(1, -1).reduce((sum, n) => sum + size(n).w, 0);
    const slots = ordered.length - 1;
    const gap = totalGap / slots;
    let cursor = first.position.x + size(first).w + gap;
    for (let i = 1; i < ordered.length - 1; i += 1) {
      const n = ordered[i];
      map.set(n.id, { x: cursor, y: n.position.y });
      cursor += size(n).w + gap;
    }
  } else {
    const totalGap =
      last.position.y -
      first.position.y -
      ordered.slice(1, -1).reduce((sum, n) => sum + size(n).h, 0);
    const slots = ordered.length - 1;
    const gap = totalGap / slots;
    let cursor = first.position.y + size(first).h + gap;
    for (let i = 1; i < ordered.length - 1; i += 1) {
      const n = ordered[i];
      map.set(n.id, { x: n.position.x, y: cursor });
      cursor += size(n).h + gap;
    }
  }
  return map;
}

/** Bounding box of a node set in flow coords. */
export function nodesBounds(
  nodes: SystemNode[],
): { x: number; y: number; width: number; height: number } | null {
  if (nodes.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    const s = size(n);
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + s.w);
    maxY = Math.max(maxY, n.position.y + s.h);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
