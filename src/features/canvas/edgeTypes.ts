import { MarkerType, type DefaultEdgeOptions, type EdgeTypes } from 'reactflow';
import { SmartEdge } from '@/features/edges/SmartEdge';

/** Registry must live at module scope — see nodeTypes.ts for rationale. */
export const edgeTypes: EdgeTypes = {
  smart: SmartEdge,
};

/**
 * Defaults applied to every newly-created edge (drag-from-handle path).
 * Centralized so all edges start with a consistent look.
 */
export const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'smart',
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
  data: { flowType: 'sync' },
};
