import type { SystemEdge, SystemNode } from '@/types';

/**
 * Compute the 1-hop neighbor set for a given focus node. Used by the
 * Canvas to dim (reduce opacity) everything outside this set.
 *
 * Returns `null` when focus should be inactive (nothing selected, or
 * focus mode is off). Otherwise returns a set of node ids that should be
 * fully visible — everything else gets `opacity: 0.18`.
 */
export function computeFocusSet(
  focusNodeId: string | null,
  nodes: SystemNode[],
  edges: SystemEdge[],
): Set<string> | null {
  if (!focusNodeId) return null;

  const visible = new Set<string>();
  visible.add(focusNodeId);

  for (const e of edges) {
    if (e.source === focusNodeId) visible.add(e.target);
    if (e.target === focusNodeId) visible.add(e.source);
  }

  return visible;
}
