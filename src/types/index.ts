/**
 * Domain types for SystemSketch.
 */

/**
 * Component kinds.
 *
 * `sticky` and `text` are annotation kinds — they render with their own
 * node components and don't use the standard SystemNode chrome.
 */
export type NodeKind =
  | 'api-gateway'
  | 'load-balancer'
  | 'microservice'
  | 'database-sql'
  | 'database-nosql'
  | 'cache'
  | 'queue'
  | 'cdn'
  | 'auth'
  | 'external-api'
  | 'custom'
  // Batch 12 — interview essentials
  | 'client'
  | 'web-server'
  | 'object-storage'
  | 'search'
  | 'analytics'
  | 'ml-model'
  | 'websocket'
  | 'monitoring'
  | 'dns'
  | 'scheduler'
  | 'notification'
  | 'payment'
  // Batch 12 — annotations
  | 'sticky'
  | 'text';

/** True for kinds that render as annotations (no edge handles, no kind chip). */
export const ANNOTATION_KINDS: ReadonlySet<NodeKind> = new Set<NodeKind>([
  'sticky',
  'text',
]);

export interface NodeMetadata {
  [key: string]: string | number | boolean | undefined;
}

export interface SystemNodeData {
  title: string;
  description?: string;
  kind: NodeKind;
  color?: string;
  icon?: string;
  metadata?: NodeMetadata;
  groupId?: string;
}

/**
 * React Flow node `type` discriminator. We render `sticky` / `text`
 * through their own components; everything else through `system`.
 */
export type SystemNodeType = 'system' | 'sticky' | 'text';

export interface SystemNode {
  id: string;
  type: SystemNodeType;
  position: { x: number; y: number };
  data: SystemNodeData;
  width?: number;
  height?: number;
}

export interface SystemEdgeData {
  label?: string;
  flowType?: 'sync' | 'async' | 'data';
}

export interface SystemEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: 'smart';
  animated?: boolean;
  data?: SystemEdgeData;
  label?: string;
}

export interface SystemNodeGroup {
  id: string;
  label: string;
  color: string;
  collapsed: boolean;
}

export interface ProjectMetadata {
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  version: 1 | 2;
}

export interface ProjectConfig {
  nodes: SystemNode[];
  edges: SystemEdge[];
  groups?: SystemNodeGroup[];
  metadata: ProjectMetadata;
}

export type Theme = 'light' | 'dark';
