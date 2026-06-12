import type { StateCreator } from 'zustand';
import type { SelectionSlice, StoreState } from '@/store/types';

function unique(ids: readonly string[]): string[] {
  return Array.from(new Set(ids));
}

/**
 * Derive the `selection` (legacy single primary) from the multi-selection
 * arrays: a single node beats a single edge; otherwise the first node;
 * otherwise the first edge; otherwise null. Keeps existing single-selection
 * consumers (right sidebar property panel, selectors) working untouched.
 */
function deriveSelection(
  nodeIds: readonly string[],
  edgeIds: readonly string[],
): SelectionSlice['selection'] {
  if (nodeIds.length === 1 && edgeIds.length === 0) {
    return { kind: 'node', id: nodeIds[0] };
  }
  if (edgeIds.length === 1 && nodeIds.length === 0) {
    return { kind: 'edge', id: edgeIds[0] };
  }
  if (nodeIds.length > 0) return { kind: 'node', id: nodeIds[0] };
  if (edgeIds.length > 0) return { kind: 'edge', id: edgeIds[0] };
  return null;
}

export const createSelectionSlice: StateCreator<StoreState, [], [], SelectionSlice> = (
  set,
  get,
) => ({
  selection: null,
  selectedNodeIds: [],
  selectedEdgeIds: [],
  selectionBox: null,
  focusMode: false,

  setSelection: (next) => {
    if (next === null) {
      set({ selection: null, selectedNodeIds: [], selectedEdgeIds: [] });
      return;
    }
    if (next.kind === 'node') {
      set({ selection: next, selectedNodeIds: [next.id], selectedEdgeIds: [] });
    } else {
      set({ selection: next, selectedNodeIds: [], selectedEdgeIds: [next.id] });
    }
  },

  setSelectedIds: (nodeIds, edgeIds) => {
    const n = unique(nodeIds);
    const e = unique(edgeIds);
    set({
      selectedNodeIds: n,
      selectedEdgeIds: e,
      selection: deriveSelection(n, e),
    });
  },

  addToSelection: (nodeIds, edgeIds = []) => {
    const s = get();
    const n = unique([...s.selectedNodeIds, ...nodeIds]);
    const e = unique([...s.selectedEdgeIds, ...edgeIds]);
    set({
      selectedNodeIds: n,
      selectedEdgeIds: e,
      selection: deriveSelection(n, e),
    });
  },

  removeFromSelection: (nodeIds, edgeIds = []) => {
    const removeN = new Set(nodeIds);
    const removeE = new Set(edgeIds);
    const s = get();
    const n = s.selectedNodeIds.filter((id) => !removeN.has(id));
    const e = s.selectedEdgeIds.filter((id) => !removeE.has(id));
    set({
      selectedNodeIds: n,
      selectedEdgeIds: e,
      selection: deriveSelection(n, e),
    });
  },

  clearSelection: () => {
    set({ selectedNodeIds: [], selectedEdgeIds: [], selection: null });
  },

  selectAll: () => {
    const s = get();
    const n = s.nodes.map((node) => node.id);
    const e = s.edges.map((edge) => edge.id);
    set({
      selectedNodeIds: n,
      selectedEdgeIds: e,
      selection: deriveSelection(n, e),
    });
  },

  setSelectionBox: (box) => {
    set({ selectionBox: box });
  },

  toggleFocusMode: () => {
    set((s) => ({ focusMode: !s.focusMode }));
  },
});
