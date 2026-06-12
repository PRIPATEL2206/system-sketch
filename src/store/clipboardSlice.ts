import type { StateCreator } from 'zustand';
import { pushSnapshot } from '@/store/historySlice';
import type { ClipboardSlice, StoreState } from '@/store/types';
import { makeEdgeId } from '@/features/edges/edgeFactory';
import { makeNodeId } from '@/features/nodes/nodeFactory';
import { makeGroupId } from '@/features/groups/groupFactory';
import type { SystemEdge, SystemNode, SystemNodeGroup } from '@/types';

const PASTE_OFFSET = 32;

function selectedNodeIds(s: StoreState): string[] {
  return s.selectedNodeIds;
}

function cloneNode(
  n: SystemNode,
  dx: number,
  dy: number,
  groupRemap: Map<string, string>,
): SystemNode {
  const oldGroup = n.data.groupId;
  const newGroup = oldGroup ? groupRemap.get(oldGroup) ?? undefined : undefined;
  return {
    ...n,
    id: makeNodeId(),
    position: { x: n.position.x + dx, y: n.position.y + dy },
    data: {
      ...n.data,
      groupId: newGroup,
      metadata: n.data.metadata ? { ...n.data.metadata } : undefined,
    },
  };
}

function remapEdges(
  edges: SystemEdge[],
  idMap: Map<string, string>,
): SystemEdge[] {
  const cloned: SystemEdge[] = [];
  for (const e of edges) {
    const src = idMap.get(e.source);
    const tgt = idMap.get(e.target);
    if (!src || !tgt) continue;
    cloned.push({
      ...e,
      id: makeEdgeId(),
      source: src,
      target: tgt,
      data: e.data ? { ...e.data } : undefined,
    });
  }
  return cloned;
}

/** Groups whose membership is fully inside `idSet` come along for the ride. */
function pickContainedGroups(
  nodes: SystemNode[],
  groups: SystemNodeGroup[],
  idSet: Set<string>,
): SystemNodeGroup[] {
  const memberCount = new Map<string, number>();
  const totalByGroup = new Map<string, number>();
  for (const n of nodes) {
    if (!n.data.groupId) continue;
    totalByGroup.set(n.data.groupId, (totalByGroup.get(n.data.groupId) ?? 0) + 1);
    if (idSet.has(n.id)) {
      memberCount.set(n.data.groupId, (memberCount.get(n.data.groupId) ?? 0) + 1);
    }
  }
  return groups.filter(
    (g) =>
      (memberCount.get(g.id) ?? 0) > 0 &&
      memberCount.get(g.id) === totalByGroup.get(g.id),
  );
}

export const createClipboardSlice: StateCreator<StoreState, [], [], ClipboardSlice> = (
  set,
  get,
) => ({
  clipboard: null,

  copySelection: () => {
    const s = get();
    const ids = selectedNodeIds(s);
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const nodes = s.nodes.filter((n) => idSet.has(n.id));
    const edges = s.edges.filter((e) => idSet.has(e.source) && idSet.has(e.target));
    const groups = pickContainedGroups(s.nodes, s.groups, idSet);
    set({ clipboard: { nodes, edges, groups } });
  },

  cutSelection: () => {
    const s = get();
    const ids = selectedNodeIds(s);
    if (ids.length === 0) {
      if (s.selection?.kind === 'edge') s.removeEdge(s.selection.id);
      return;
    }
    const idSet = new Set(ids);
    const nodes = s.nodes.filter((n) => idSet.has(n.id));
    const edges = s.edges.filter((e) => idSet.has(e.source) && idSet.has(e.target));
    const groups = pickContainedGroups(s.nodes, s.groups, idSet);
    set((curr) => {
      const remainingNodes = curr.nodes.filter((n) => !idSet.has(n.id));
      const surviving = new Set<string>();
      for (const n of remainingNodes) {
        if (n.data.groupId) surviving.add(n.data.groupId);
      }
      return {
        ...pushSnapshot(curr),
        clipboard: { nodes, edges, groups },
        nodes: remainingNodes,
        edges: curr.edges.filter(
          (e) => !idSet.has(e.source) && !idSet.has(e.target),
        ),
        groups: curr.groups.filter((g) => surviving.has(g.id)),
        selection: null,
        selectedNodeIds: [],
      };
    });
  },

  pasteAt: (position) => {
    const { clipboard } = get();
    if (!clipboard || clipboard.nodes.length === 0) return;

    // Centroid of clipboard → cursor.
    const cx =
      clipboard.nodes.reduce((sum, n) => sum + n.position.x, 0) /
      clipboard.nodes.length;
    const cy =
      clipboard.nodes.reduce((sum, n) => sum + n.position.y, 0) /
      clipboard.nodes.length;
    const dx = position.x - cx;
    const dy = position.y - cy;

    // Fresh group ids so paste-then-paste doesn't share membership.
    const groupRemap = new Map<string, string>();
    const newGroups: SystemNodeGroup[] = clipboard.groups.map((g) => {
      const newId = makeGroupId();
      groupRemap.set(g.id, newId);
      return { ...g, id: newId };
    });

    const idMap = new Map<string, string>();
    const cloned = clipboard.nodes.map((n) => {
      const c = cloneNode(n, dx, dy, groupRemap);
      idMap.set(n.id, c.id);
      return c;
    });
    const remapped = remapEdges(clipboard.edges, idMap);

    set((s) => ({
      ...pushSnapshot(s),
      nodes: [...s.nodes, ...cloned],
      edges: [...s.edges, ...remapped],
      groups: [...s.groups, ...newGroups],
      selectedNodeIds: cloned.map((n) => n.id),
      selectedEdgeIds: [],
      selection:
        cloned.length === 1 ? { kind: 'node', id: cloned[0].id } : null,
    }));
  },

  duplicateSelection: () => {
    const s = get();
    const ids = selectedNodeIds(s);
    if (ids.length === 0) return;

    const idSet = new Set(ids);
    const sourceNodes = s.nodes.filter((n) => idSet.has(n.id));
    const sourceEdges = s.edges.filter(
      (e) => idSet.has(e.source) && idSet.has(e.target),
    );
    const sourceGroups = pickContainedGroups(s.nodes, s.groups, idSet);

    const groupRemap = new Map<string, string>();
    const newGroups: SystemNodeGroup[] = sourceGroups.map((g) => {
      const newId = makeGroupId();
      groupRemap.set(g.id, newId);
      return { ...g, id: newId };
    });

    const idMap = new Map<string, string>();
    const cloned = sourceNodes.map((n) => {
      const c = cloneNode(n, PASTE_OFFSET, PASTE_OFFSET, groupRemap);
      idMap.set(n.id, c.id);
      return c;
    });
    const remapped = remapEdges(sourceEdges, idMap);

    set((curr) => ({
      ...pushSnapshot(curr),
      nodes: [...curr.nodes, ...cloned],
      edges: [...curr.edges, ...remapped],
      groups: [...curr.groups, ...newGroups],
      selectedNodeIds: cloned.map((n) => n.id),
      selectedEdgeIds: [],
      selection:
        cloned.length === 1 ? { kind: 'node', id: cloned[0].id } : null,
    }));
  },

  deleteSelection: () => {
    const s = get();
    if (s.selectedNodeIds.length > 0) {
      s.removeNodes(s.selectedNodeIds);
      return;
    }
    if (s.selectedEdgeIds.length > 0) {
      // Single-edge fast-path; multi-edge delete is rare enough that
      // looping the cheap removeEdge action is fine and keeps each as
      // its own undo entry.
      for (const id of s.selectedEdgeIds) s.removeEdge(id);
    }
  },
});
