import { useMemo } from 'react';
import { useStore as useRfStore, type ReactFlowState } from 'reactflow';
import { useSelectedNodes, useStore } from '@/store';
import { nodesBounds } from '@/features/selection/alignment';
import { cn } from '@/utils/cn';

const viewportSelector = (s: ReactFlowState) =>
  ({ x: s.transform[0], y: s.transform[1], zoom: s.transform[2] }) as const;

/**
 * Bounding box around the multi-selection + frames around expanded
 * groups. Rendered as absolute-positioned DOM overlaying the React Flow
 * pane and transformed with the same matrix as the viewport so it
 * pans/zooms correctly.
 *
 * Two overlays:
 *  1. Group frames (one per non-collapsed group with members on canvas)
 *  2. Multi-selection bounding box (only when 2+ nodes selected)
 *
 * Both are pointer-events: none — they're decorative; selection itself
 * still flows through node clicks / lasso.
 */
export function SelectionOverlay() {
  const { x, y, zoom } = useRfStore(viewportSelector);
  const selected = useSelectedNodes();
  const groups = useStore((s) => s.groups);
  const allNodes = useStore((s) => s.nodes);

  const selectionBounds = useMemo(() => {
    if (selected.length < 2) return null;
    return nodesBounds(selected);
  }, [selected]);

  const groupFrames = useMemo(() => {
    if (groups.length === 0) return [] as Array<{
      id: string;
      label: string;
      color: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
    const byGroup = new Map<string, typeof allNodes>();
    for (const n of allNodes) {
      if (!n.data.groupId) continue;
      const arr = byGroup.get(n.data.groupId) ?? [];
      arr.push(n);
      byGroup.set(n.data.groupId, arr);
    }
    const frames: Array<{
      id: string;
      label: string;
      color: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];
    for (const g of groups) {
      if (g.collapsed) continue;
      const members = byGroup.get(g.id);
      if (!members || members.length === 0) continue;
      const b = nodesBounds(members);
      if (!b) continue;
      const padding = 12;
      frames.push({
        id: g.id,
        label: g.label,
        color: g.color,
        x: b.x - padding,
        y: b.y - padding - 18, // room for label tag above
        width: b.width + padding * 2,
        height: b.height + padding * 2 + 18,
      });
    }
    return frames;
  }, [allNodes, groups]);

  if (!selectionBounds && groupFrames.length === 0) return null;

  return (
    <div
      // Fixed absolute layer; we apply the same transform React Flow
      // applies to its viewport so our coordinates are flow coords.
      className="pointer-events-none absolute left-0 top-0 z-0 h-full w-full overflow-hidden"
    >
      <div
        style={{
          transform: `translate(${x}px, ${y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          inset: 0,
          willChange: 'transform',
        }}
      >
        {groupFrames.map((g) => (
          <div
            key={g.id}
            className="absolute rounded-lg border-2 border-dashed bg-transparent transition-colors"
            style={{
              left: g.x,
              top: g.y,
              width: g.width,
              height: g.height,
              borderColor: g.color,
              backgroundColor: `${g.color}10`,
            }}
          >
            <div
              className="absolute left-2 top-1 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm"
              style={{ backgroundColor: g.color }}
            >
              {g.label}
            </div>
          </div>
        ))}

        {selectionBounds ? (
          <div
            className={cn(
              'absolute rounded-md border-2 border-primary/60 bg-primary/5',
              'animate-fade-in',
            )}
            style={{
              left: selectionBounds.x - 8,
              top: selectionBounds.y - 8,
              width: selectionBounds.width + 16,
              height: selectionBounds.height + 16,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
