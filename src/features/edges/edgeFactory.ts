import type { Connection } from 'reactflow';
import type { SystemEdge } from '@/types';

let counter = 0;

export function makeEdgeId(): string {
  counter += 1;
  return `e_${counter.toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** Build a SystemEdge from a React Flow Connection payload. */
export function createEdgeFromConnection(conn: Connection): SystemEdge | null {
  if (!conn.source || !conn.target) return null;
  if (conn.source === conn.target) return null; // disallow self-loops for now
  return {
    id: makeEdgeId(),
    source: conn.source,
    target: conn.target,
    sourceHandle: conn.sourceHandle ?? null,
    targetHandle: conn.targetHandle ?? null,
    type: 'smart',
    data: { flowType: 'sync' },
  };
}
