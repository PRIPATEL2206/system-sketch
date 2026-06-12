import type { StateCreator } from 'zustand';
import { shouldPushFor } from '@/store/coalesce';
import { pushSnapshot } from '@/store/historySlice';
import type { EdgeSlice, StoreState } from '@/store/types';

function applyEdgePatch<T extends { id: string; data?: unknown }>(
  edge: T,
  patch: Record<string, unknown>,
): T {
  const { data: dataPatch, ...rest } = patch;
  return {
    ...edge,
    ...rest,
    data: dataPatch
      ? { ...((edge.data as Record<string, unknown> | undefined) ?? {}), ...(dataPatch as Record<string, unknown>) }
      : edge.data,
  } as T;
}

export const createEdgeSlice: StateCreator<StoreState, [], [], EdgeSlice> = (set) => ({
  edges: [],

  setEdges: (next) => {
    set({ edges: next });
  },

  addEdge: (edge) => {
    set((s) => {
      const dup = s.edges.some(
        (e) =>
          e.source === edge.source &&
          e.target === edge.target &&
          (e.sourceHandle ?? null) === (edge.sourceHandle ?? null) &&
          (e.targetHandle ?? null) === (edge.targetHandle ?? null),
      );
      if (dup) return {};
      return {
        ...pushSnapshot(s),
        edges: [...s.edges, edge],
        selection: { kind: 'edge', id: edge.id },
      };
    });
  },

  patchEdge: (id, patch) => {
    set((s) => ({
      ...pushSnapshot(s),
      edges: s.edges.map((e) =>
        e.id === id ? applyEdgePatch(e, patch as Record<string, unknown>) : e,
      ),
    }));
  },

  patchEdgeCoalesced: (id, patch) => {
    const top = Object.keys(patch).filter((k) => k !== 'data').sort().join(',');
    const dataKeys = patch.data ? Object.keys(patch.data).sort().join(',') : '';
    const key = `edge:${id}:${top}|${dataKeys}`;
    const fresh = shouldPushFor(key);
    set((s) => ({
      ...(fresh ? pushSnapshot(s) : {}),
      edges: s.edges.map((e) =>
        e.id === id ? applyEdgePatch(e, patch as Record<string, unknown>) : e,
      ),
    }));
  },

  removeEdge: (id) => {
    set((s) => ({
      ...pushSnapshot(s),
      edges: s.edges.filter((e) => e.id !== id),
      selection:
        s.selection?.kind === 'edge' && s.selection.id === id ? null : s.selection,
    }));
  },
});
