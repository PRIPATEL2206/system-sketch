import type { StateCreator } from 'zustand';
import { pushSnapshot } from '@/store/historySlice';
import type { GroupSlice, StoreState } from '@/store/types';
import { createGroup } from '@/features/groups/groupFactory';

export const createGroupSlice: StateCreator<StoreState, [], [], GroupSlice> = (
  set,
  get,
) => ({
  groups: [],

  /**
   * Build a new group from the current node selection. Strips any prior
   * groupId from the selected nodes so a regroup is a single "move" not
   * a stale-membership leak. Returns the new group id, or null if there
   * weren't enough nodes to group.
   */
  groupSelection: () => {
    const s = get();
    const ids = s.selectedNodeIds;
    if (ids.length < 2) return null;
    const idSet = new Set(ids);
    const seed = s.groups.length + 1;
    const group = createGroup(`Group ${seed}`, seed);

    // Surviving groups: any group that still has at least one member NOT
    // in this new group becomes its old self with reduced membership;
    // groups that lose all members are dropped.
    const remainingNodesByGroup = new Map<string, number>();
    for (const n of s.nodes) {
      if (n.data.groupId && !idSet.has(n.id)) {
        remainingNodesByGroup.set(
          n.data.groupId,
          (remainingNodesByGroup.get(n.data.groupId) ?? 0) + 1,
        );
      }
    }
    const survivingGroups = s.groups.filter(
      (g) => (remainingNodesByGroup.get(g.id) ?? 0) > 0,
    );

    set({
      ...pushSnapshot(s),
      groups: [...survivingGroups, group],
      nodes: s.nodes.map((n) =>
        idSet.has(n.id) ? { ...n, data: { ...n.data, groupId: group.id } } : n,
      ),
    });
    return group.id;
  },

  ungroupSelection: () => {
    const s = get();
    const ids = s.selectedNodeIds;
    if (ids.length === 0) return;
    const groupIds = new Set<string>();
    for (const n of s.nodes) {
      if (ids.includes(n.id) && n.data.groupId) groupIds.add(n.data.groupId);
    }
    if (groupIds.size === 0) return;
    set({
      ...pushSnapshot(s),
      // Strip groupId on every node belonging to a touched group.
      nodes: s.nodes.map((n) =>
        n.data.groupId && groupIds.has(n.data.groupId)
          ? { ...n, data: { ...n.data, groupId: undefined } }
          : n,
      ),
      groups: s.groups.filter((g) => !groupIds.has(g.id)),
    });
  },

  toggleGroupCollapsed: (groupId) => {
    set((s) => ({
      ...pushSnapshot(s),
      groups: s.groups.map((g) =>
        g.id === groupId ? { ...g, collapsed: !g.collapsed } : g,
      ),
    }));
  },

  patchGroup: (groupId, patch) => {
    set((s) => ({
      ...pushSnapshot(s),
      groups: s.groups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)),
    }));
  },

  removeGroup: (groupId) => {
    set((s) => ({
      ...pushSnapshot(s),
      groups: s.groups.filter((g) => g.id !== groupId),
      nodes: s.nodes.map((n) =>
        n.data.groupId === groupId
          ? { ...n, data: { ...n.data, groupId: undefined } }
          : n,
      ),
    }));
  },
});
