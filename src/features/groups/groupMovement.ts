import type { Node, NodeChange } from 'reactflow';
import type { SystemNode } from '@/types';

/**
 * Given React Flow's per-frame change set, expand position changes so
 * any node in the same group moves by the same delta.
 *
 * `selectedIds` is the authoritative selection from our store — using
 * RF's `node.selected` would double-count under our projection scheme
 * and cause echoing updates.
 */
export function expandGroupMoves(
  changes: NodeChange[],
  current: Node[],
  systemNodes: SystemNode[],
  selectedIds: readonly string[],
): NodeChange[] {
  const positionChanges = changes.filter(
    (c): c is Extract<NodeChange, { type: 'position' }> => c.type === 'position',
  );
  if (positionChanges.length === 0) return changes;

  const groupOf = new Map<string, string>();
  const membersOf = new Map<string, string[]>();
  for (const n of systemNodes) {
    const gid = n.data.groupId;
    if (!gid) continue;
    groupOf.set(n.id, gid);
    const arr = membersOf.get(gid) ?? [];
    arr.push(n.id);
    membersOf.set(gid, arr);
  }
  if (groupOf.size === 0) return changes;

  const currentById = new Map<string, Node>();
  for (const n of current) currentById.set(n.id, n);

  const selectedSet = new Set(selectedIds);

  const additions: NodeChange[] = [];
  const handled = new Set<string>();

  for (const c of positionChanges) {
    if (!c.position || c.dragging === false) continue;
    const gid = groupOf.get(c.id);
    if (!gid) continue;
    if (handled.has(gid)) continue;
    handled.add(gid);

    const leader = currentById.get(c.id);
    if (!leader) continue;
    const dx = c.position.x - leader.position.x;
    const dy = c.position.y - leader.position.y;
    if (dx === 0 && dy === 0) continue;

    for (const memberId of membersOf.get(gid) ?? []) {
      if (memberId === c.id) continue;
      // Skip siblings already part of the multi-selection — RF moves
      // them itself, so mirroring would teleport them.
      if (selectedSet.has(memberId)) continue;
      const member = currentById.get(memberId);
      if (!member) continue;
      additions.push({
        id: memberId,
        type: 'position',
        position: { x: member.position.x + dx, y: member.position.y + dy },
        dragging: true,
      });
    }
  }

  return additions.length === 0 ? changes : [...changes, ...additions];
}
