import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { createCanvasSlice } from '@/store/canvasSlice';
import { createClipboardSlice } from '@/store/clipboardSlice';
import { createDrawingSlice } from '@/store/drawingSlice';
import { createEdgeSlice } from '@/store/edgeSlice';
import { createGroupSlice } from '@/store/groupSlice';
import { createHistorySlice } from '@/store/historySlice';
import { createNodeSlice } from '@/store/nodeSlice';
import { createSelectionSlice } from '@/store/selectionSlice';
import type { StoreState } from '@/store/types';
import type { SystemEdge, SystemNode, SystemNodeGroup } from '@/types';

export const useStore = create<StoreState>()((...args) => ({
  ...createCanvasSlice(...args),
  ...createNodeSlice(...args),
  ...createEdgeSlice(...args),
  ...createSelectionSlice(...args),
  ...createGroupSlice(...args),
  ...createDrawingSlice(...args),
  ...createHistorySlice(...args),
  ...createClipboardSlice(...args),
}));

/* -------------------------------------------------------------------- */
/* Selectors                                                            */
/* -------------------------------------------------------------------- */

export function useCanvasData(): {
  nodes: SystemNode[];
  edges: SystemEdge[];
  setNodes: (next: SystemNode[]) => void;
  setEdges: (next: SystemEdge[]) => void;
  setSelection: StoreState['setSelection'];
} {
  return useStore(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      setNodes: s.setNodes,
      setEdges: s.setEdges,
      setSelection: s.setSelection,
    })),
  );
}

export function useSelectedNode(): SystemNode | null {
  return useStore((s) =>
    s.selection?.kind === 'node'
      ? s.nodes.find((n) => n.id === s.selection!.id) ?? null
      : null,
  );
}

export function useSelectedEdge(): SystemEdge | null {
  return useStore((s) =>
    s.selection?.kind === 'edge'
      ? s.edges.find((e) => e.id === s.selection!.id) ?? null
      : null,
  );
}

export function useHistoryAvailability(): { canUndo: boolean; canRedo: boolean } {
  return useStore(
    useShallow((s) => ({ canUndo: s.past.length > 0, canRedo: s.future.length > 0 })),
  );
}

export function useSelectedEdgeEndpoints(): { source: string; target: string } | null {
  return useStore(
    useShallow((s) => {
      if (s.selection?.kind !== 'edge') return null;
      const edge = s.edges.find((e) => e.id === s.selection!.id);
      if (!edge) return null;
      const find = (id: string) => s.nodes.find((n) => n.id === id)?.data.title ?? id;
      return { source: find(edge.source), target: find(edge.target) };
    }),
  );
}

export function useGraphCounts(): { nodes: number; edges: number; groups: number } {
  return useStore(
    useShallow((s) => ({
      nodes: s.nodes.length,
      edges: s.edges.length,
      groups: s.groups.length,
    })),
  );
}

/**
 * Stable counts for the multi-selection. Right sidebar uses this to
 * decide which panel to render — it doesn't need the actual id arrays
 * for that decision, just the sizes.
 */
export function useSelectionCount(): { nodes: number; edges: number } {
  return useStore(
    useShallow((s) => ({
      nodes: s.selectedNodeIds.length,
      edges: s.selectedEdgeIds.length,
    })),
  );
}

/** Materialize the selected nodes — referentially stable across renders. */
export function useSelectedNodes(): SystemNode[] {
  return useStore(
    useShallow((s) => {
      if (s.selectedNodeIds.length === 0) return [];
      const idSet = new Set(s.selectedNodeIds);
      return s.nodes.filter((n) => idSet.has(n.id));
    }),
  );
}

/** All groups, with member counts attached for the bulk panel UI. */
export function useGroups(): SystemNodeGroup[] {
  return useStore((s) => s.groups);
}
