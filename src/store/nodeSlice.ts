import type { StateCreator } from 'zustand';
import { shouldPushFor } from '@/store/coalesce';
import { pushSnapshot } from '@/store/historySlice';
import type { NodeSlice, StoreState } from '@/store/types';

export const createNodeSlice: StateCreator<StoreState, [], [], NodeSlice> = (set) => ({
  nodes: [],

  /** Hot path — drag/zoom frames. No history push. */
  setNodes: (next) => {
    set({ nodes: next });
  },

  addNode: (node) => {
    set((s) => ({
      ...pushSnapshot(s),
      nodes: [...s.nodes, node],
      selection: { kind: 'node', id: node.id },
      selectedNodeIds: [node.id],
      selectedEdgeIds: [],
    }));
  },

  patchNode: (id, patch) => {
    set((s) => ({
      ...pushSnapshot(s),
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } } : n,
      ),
    }));
  },

  patchNodeCoalesced: (id, patch) => {
    const fields = Object.keys(patch).sort().join(',');
    const key = `node:${id}:${fields}`;
    const fresh = shouldPushFor(key);
    set((s) => ({
      ...(fresh ? pushSnapshot(s) : {}),
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } } : n,
      ),
    }));
  },

  /** Patch the same `data` fields on every node in `ids`. One history step. */
  bulkPatchNodes: (ids, patch) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    set((s) => ({
      ...pushSnapshot(s),
      nodes: s.nodes.map((n) =>
        idSet.has(n.id) ? { ...n, data: { ...n.data, ...patch } } : n,
      ),
    }));
  },

  /**
   * Run `updater` against each node whose id is in `matchedIds` and
   * substitute the result. Used for align/distribute (where each node
   * gets a *different* position update). One history step.
   */
  bulkUpdateNodes: (updater, matchedIds) => {
    if (matchedIds.length === 0) return;
    const idSet = new Set(matchedIds);
    set((s) => {
      const nextNodes: typeof s.nodes = [];
      for (const n of s.nodes) {
        if (!idSet.has(n.id)) {
          nextNodes.push(n);
          continue;
        }
        const updated = updater(n);
        if (updated !== null) nextNodes.push(updated);
      }
      return { ...pushSnapshot(s), nodes: nextNodes };
    });
  },

  removeNode: (id) => {
    set((s) => ({
      ...pushSnapshot(s),
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selection:
        s.selection?.kind === 'node' && s.selection.id === id ? null : s.selection,
      selectedNodeIds: s.selectedNodeIds.filter((nid) => nid !== id),
    }));
  },

  /** Multi-delete with cascading edge cleanup + group cleanup, single push. */
  removeNodes: (ids) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    set((s) => {
      const remainingNodes = s.nodes.filter((n) => !idSet.has(n.id));
      // Remove groups that have no surviving members.
      const survivingGroupIds = new Set<string>();
      for (const n of remainingNodes) {
        if (n.data.groupId) survivingGroupIds.add(n.data.groupId);
      }
      const remainingGroups = s.groups.filter((g) => survivingGroupIds.has(g.id));
      return {
        ...pushSnapshot(s),
        nodes: remainingNodes,
        edges: s.edges.filter((e) => !idSet.has(e.source) && !idSet.has(e.target)),
        groups: remainingGroups,
        selectedNodeIds: s.selectedNodeIds.filter((nid) => !idSet.has(nid)),
        selection:
          s.selection?.kind === 'node' && idSet.has(s.selection.id)
            ? null
            : s.selection,
      };
    });
  },
});
