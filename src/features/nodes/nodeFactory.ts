import type { NodeKind, SystemNode, SystemNodeType } from '@/types';
import { ANNOTATION_KINDS } from '@/types';
import { getCatalogEntry } from '@/features/nodes/nodeCatalog';

let counter = 0;

export function makeNodeId(): string {
  counter += 1;
  return `n_${counter.toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function resolveNodeType(kind: NodeKind): SystemNodeType {
  if (kind === 'sticky') return 'sticky';
  if (kind === 'text') return 'text';
  return 'system';
}

/** Build a fresh SystemNode at the given canvas position. */
export function createSystemNode(
  kind: NodeKind,
  position: { x: number; y: number },
  overrides: Partial<SystemNode['data']> = {},
): SystemNode {
  const entry = getCatalogEntry(kind);
  const isAnnotation = ANNOTATION_KINDS.has(kind);
  return {
    id: makeNodeId(),
    type: resolveNodeType(kind),
    position,
    data: {
      title: overrides.title ?? (isAnnotation ? '' : entry.label),
      description: overrides.description ?? (isAnnotation ? undefined : entry.description),
      kind,
      color: overrides.color ?? entry.color,
      icon: overrides.icon ?? entry.icon,
      metadata: overrides.metadata ?? {},
    },
  };
}
