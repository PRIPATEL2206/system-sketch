import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from 'reactflow';
import type { SystemEdgeData } from '@/types';
import { cn } from '@/utils/cn';

const FLOW_DASH: Record<NonNullable<SystemEdgeData['flowType']>, string> = {
  sync: '0',
  async: '6 4',
  data: '2 3',
};

const FLOW_COLOR: Record<NonNullable<SystemEdgeData['flowType']>, string> = {
  sync: 'hsl(var(--foreground))',
  async: '#a855f7',
  data: '#0ea5e9',
};

/**
 * Smooth-step edge with an optional centered label and a flow-type styling
 * hook. Label renders as plain HTML through EdgeLabelRenderer so it stays
 * crisp at any zoom and supports interactive controls in later batches.
 */
function SmartEdgeImpl({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<SystemEdgeData>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  });

  const flow = data?.flowType ?? 'sync';
  const stroke = FLOW_COLOR[flow];

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth: selected ? 2.5 : 1.75,
          strokeDasharray: FLOW_DASH[flow],
          transition: 'stroke-width 120ms ease-out',
        }}
      />
      {data?.label ? (
        <EdgeLabelRenderer>
          <div
            // nodrag/nopan let the label receive pointer events without
            // panning/dragging the canvas underneath.
            className={cn(
              'nodrag nopan pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2',
              'rounded-md border bg-card px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm',
              'animate-fade-in transition-shadow duration-150 hover:shadow',
              selected ? 'ring-1 ring-ring' : '',
            )}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

function areEdgePropsEqual(
  prev: EdgeProps<SystemEdgeData>,
  next: EdgeProps<SystemEdgeData>,
): boolean {
  if (prev.selected !== next.selected) return false;
  if (prev.id !== next.id) return false;
  if (
    prev.sourceX !== next.sourceX ||
    prev.sourceY !== next.sourceY ||
    prev.targetX !== next.targetX ||
    prev.targetY !== next.targetY ||
    prev.sourcePosition !== next.sourcePosition ||
    prev.targetPosition !== next.targetPosition
  ) {
    return false;
  }
  const a = prev.data;
  const b = next.data;
  return (
    a === b ||
    ((a?.label ?? null) === (b?.label ?? null) &&
      (a?.flowType ?? null) === (b?.flowType ?? null))
  );
}

export const SmartEdge = memo(SmartEdgeImpl, areEdgePropsEqual);
