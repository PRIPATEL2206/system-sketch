import type { StateCreator } from 'zustand';
import { flushCoalesce } from '@/store/coalesce';
import type { HistorySlice, HistorySnapshot, StoreState } from '@/store/types';

export const HISTORY_LIMIT = 100;

function snapshot(state: StoreState): HistorySnapshot {
  return { nodes: state.nodes, edges: state.edges, groups: state.groups };
}

export function pushSnapshot(prev: StoreState): Pick<StoreState, 'past' | 'future'> {
  const past =
    prev.past.length >= HISTORY_LIMIT
      ? [...prev.past.slice(prev.past.length - HISTORY_LIMIT + 1), snapshot(prev)]
      : [...prev.past, snapshot(prev)];
  return { past, future: [] };
}

export const createHistorySlice: StateCreator<StoreState, [], [], HistorySlice> = (
  set,
  get,
) => ({
  past: [],
  future: [],

  pushHistory: () => {
    set((s) => pushSnapshot(s));
  },

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;
    flushCoalesce();
    const previous = past[past.length - 1];
    const current = snapshot(get());
    set({
      nodes: previous.nodes,
      edges: previous.edges,
      groups: previous.groups,
      past: past.slice(0, -1),
      future: [...future, current],
      selection: null,
      selectedNodeIds: [],
      selectedEdgeIds: [],
    });
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;
    flushCoalesce();
    const next = future[future.length - 1];
    const current = snapshot(get());
    set({
      nodes: next.nodes,
      edges: next.edges,
      groups: next.groups,
      past: [...past, current],
      future: future.slice(0, -1),
      selection: null,
      selectedNodeIds: [],
      selectedEdgeIds: [],
    });
  },

  resetHistory: () => {
    set({ past: [], future: [] });
  },
});
