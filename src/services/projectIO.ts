import type {
  NodeKind,
  ProjectConfig,
  ProjectMetadata,
  SystemEdge,
  SystemEdgeData,
  SystemNode,
  SystemNodeData,
  SystemNodeGroup,
} from '@/types';

/* -------------------------------------------------------------------- */
/* Constants                                                            */
/* -------------------------------------------------------------------- */

/** Newest version we *write*. We can read versions 1 and 2. */
const CURRENT_VERSION = 2 as const;
const SUPPORTED_VERSIONS = [1, 2] as const;

const NODE_KINDS: readonly NodeKind[] = [
  'api-gateway',
  'load-balancer',
  'microservice',
  'database-sql',
  'database-nosql',
  'cache',
  'queue',
  'cdn',
  'auth',
  'external-api',
  'custom',
  'client',
  'web-server',
  'object-storage',
  'search',
  'analytics',
  'ml-model',
  'websocket',
  'monitoring',
  'dns',
  'scheduler',
  'notification',
  'payment',
  'sticky',
  'text',
] as const;

const NODE_TYPES = ['system', 'sticky', 'text'] as const;
type NodeTypeLiteral = (typeof NODE_TYPES)[number];

function asNodeType(v: unknown, kind: NodeKind, path: string): NodeTypeLiteral {
  // v1 / v2 configs may omit `type` — derive from kind.
  if (v === undefined || v === null) {
    if (kind === 'sticky') return 'sticky';
    if (kind === 'text') return 'text';
    return 'system';
  }
  if (typeof v !== 'string' || !NODE_TYPES.includes(v as NodeTypeLiteral)) {
    throw new ProjectIOError(`unknown node type "${String(v)}"`, path);
  }
  return v as NodeTypeLiteral;
}

/* -------------------------------------------------------------------- */
/* Validation primitives                                                */
/* -------------------------------------------------------------------- */

export class ProjectIOError extends Error {
  constructor(message: string, public readonly path: string = '') {
    super(path ? `${path}: ${message}` : message);
    this.name = 'ProjectIOError';
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function asNumber(v: unknown, path: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new ProjectIOError('expected finite number', path);
  }
  return v;
}

function asString(v: unknown, path: string): string {
  if (typeof v !== 'string') throw new ProjectIOError('expected string', path);
  return v;
}

function asOptionalString(v: unknown, path: string): string | undefined {
  if (v === undefined || v === null) return undefined;
  return asString(v, path);
}

function asNodeKind(v: unknown, path: string): NodeKind {
  const s = asString(v, path);
  if (!NODE_KINDS.includes(s as NodeKind)) {
    throw new ProjectIOError(`unknown node kind "${s}"`, path);
  }
  return s as NodeKind;
}

/* -------------------------------------------------------------------- */
/* Parsers                                                              */
/* -------------------------------------------------------------------- */

function parseMetadata(raw: unknown): ProjectMetadata {
  if (!isObject(raw)) throw new ProjectIOError('expected object', 'metadata');
  const version = raw.version;
  if (
    typeof version !== 'number' ||
    !SUPPORTED_VERSIONS.includes(version as 1 | 2)
  ) {
    throw new ProjectIOError(
      `unsupported version (got ${String(version)}, expected one of ${SUPPORTED_VERSIONS.join(',')})`,
      'metadata.version',
    );
  }
  return {
    name: asString(raw.name, 'metadata.name'),
    description: asOptionalString(raw.description, 'metadata.description'),
    createdAt: asString(raw.createdAt, 'metadata.createdAt'),
    updatedAt: asString(raw.updatedAt, 'metadata.updatedAt'),
    version: version as 1 | 2,
  };
}

function parseNodeData(raw: unknown, path: string): SystemNodeData {
  if (!isObject(raw)) throw new ProjectIOError('expected object', path);
  const metadata = raw.metadata;
  let cleanedMetadata: SystemNodeData['metadata'];
  if (metadata !== undefined) {
    if (!isObject(metadata)) {
      throw new ProjectIOError('expected object', `${path}.metadata`);
    }
    cleanedMetadata = {};
    for (const [k, v] of Object.entries(metadata)) {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        cleanedMetadata[k] = v;
      }
    }
  }
  return {
    title: asString(raw.title, `${path}.title`),
    description: asOptionalString(raw.description, `${path}.description`),
    kind: asNodeKind(raw.kind, `${path}.kind`),
    color: asOptionalString(raw.color, `${path}.color`),
    icon: asOptionalString(raw.icon, `${path}.icon`),
    metadata: cleanedMetadata,
    groupId: asOptionalString(raw.groupId, `${path}.groupId`),
  };
}

function parseNode(raw: unknown, idx: number): SystemNode {
  const path = `nodes[${idx}]`;
  if (!isObject(raw)) throw new ProjectIOError('expected object', path);
  if (!isObject(raw.position)) {
    throw new ProjectIOError('expected object', `${path}.position`);
  }
  const data = parseNodeData(raw.data, `${path}.data`);
  return {
    id: asString(raw.id, `${path}.id`),
    type: asNodeType(raw.type, data.kind, `${path}.type`),
    position: {
      x: asNumber(raw.position.x, `${path}.position.x`),
      y: asNumber(raw.position.y, `${path}.position.y`),
    },
    data,
    width: typeof raw.width === 'number' ? raw.width : undefined,
    height: typeof raw.height === 'number' ? raw.height : undefined,
  };
}

function parseEdgeData(raw: unknown, path: string): SystemEdgeData | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (!isObject(raw)) throw new ProjectIOError('expected object', path);
  let flowType: SystemEdgeData['flowType'];
  if (raw.flowType !== undefined) {
    const s = asString(raw.flowType, `${path}.flowType`);
    if (s !== 'sync' && s !== 'async' && s !== 'data') {
      throw new ProjectIOError(`unknown flowType "${s}"`, `${path}.flowType`);
    }
    flowType = s;
  }
  return {
    label: asOptionalString(raw.label, `${path}.label`),
    flowType,
  };
}

function parseEdge(raw: unknown, idx: number): SystemEdge {
  const path = `edges[${idx}]`;
  if (!isObject(raw)) throw new ProjectIOError('expected object', path);
  return {
    id: asString(raw.id, `${path}.id`),
    source: asString(raw.source, `${path}.source`),
    target: asString(raw.target, `${path}.target`),
    sourceHandle:
      raw.sourceHandle === undefined
        ? undefined
        : raw.sourceHandle === null
          ? null
          : asString(raw.sourceHandle, `${path}.sourceHandle`),
    targetHandle:
      raw.targetHandle === undefined
        ? undefined
        : raw.targetHandle === null
          ? null
          : asString(raw.targetHandle, `${path}.targetHandle`),
    type: 'smart',
    animated: typeof raw.animated === 'boolean' ? raw.animated : undefined,
    label: asOptionalString(raw.label, `${path}.label`),
    data: parseEdgeData(raw.data, `${path}.data`),
  };
}

function parseGroup(raw: unknown, idx: number): SystemNodeGroup {
  const path = `groups[${idx}]`;
  if (!isObject(raw)) throw new ProjectIOError('expected object', path);
  return {
    id: asString(raw.id, `${path}.id`),
    label: asString(raw.label, `${path}.label`),
    color: asString(raw.color, `${path}.color`),
    collapsed: typeof raw.collapsed === 'boolean' ? raw.collapsed : false,
  };
}

/* -------------------------------------------------------------------- */
/* Public API                                                           */
/* -------------------------------------------------------------------- */

export interface SerializeInput {
  projectName: string;
  nodes: SystemNode[];
  edges: SystemEdge[];
  groups?: SystemNodeGroup[];
  nowIso?: string;
}

export function serializeProject(input: SerializeInput): ProjectConfig {
  const now = input.nowIso ?? new Date().toISOString();
  return {
    nodes: input.nodes,
    edges: input.edges,
    groups: input.groups ?? [],
    metadata: {
      name: input.projectName,
      description: '',
      createdAt: now,
      updatedAt: now,
      version: CURRENT_VERSION,
    },
  };
}

export function projectToJsonString(config: ProjectConfig): string {
  return JSON.stringify(config, null, 2);
}

export function parseProjectJson(text: string): ProjectConfig {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    throw new ProjectIOError(
      `invalid JSON (${err instanceof Error ? err.message : String(err)})`,
    );
  }
  if (!isObject(raw)) throw new ProjectIOError('expected object', '<root>');

  const metadata = parseMetadata(raw.metadata);

  if (!Array.isArray(raw.nodes)) throw new ProjectIOError('expected array', 'nodes');
  if (!Array.isArray(raw.edges)) throw new ProjectIOError('expected array', 'edges');

  const nodes = raw.nodes.map((n, i) => parseNode(n, i));
  const edges = raw.edges.map((e, i) => parseEdge(e, i));

  // groups is optional (v1 doesn't have it; v2 may also legitimately have []).
  let groups: SystemNodeGroup[] = [];
  if (raw.groups !== undefined && raw.groups !== null) {
    if (!Array.isArray(raw.groups)) {
      throw new ProjectIOError('expected array', 'groups');
    }
    groups = raw.groups.map((g, i) => parseGroup(g, i));
  }

  // Referential integrity — drop edges that point to missing nodes.
  const nodeIds = new Set(nodes.map((n) => n.id));
  const cleanEdges = edges.filter(
    (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
  );

  // Drop groups that have zero surviving members (guards against stale data).
  const referencedGroupIds = new Set<string>();
  for (const n of nodes) {
    if (n.data.groupId) referencedGroupIds.add(n.data.groupId);
  }
  const cleanGroups = groups.filter((g) => referencedGroupIds.has(g.id));

  // Strip groupId on nodes whose group is missing — keeps the graph consistent.
  const validGroupIds = new Set(cleanGroups.map((g) => g.id));
  const cleanNodes = nodes.map((n) =>
    n.data.groupId && !validGroupIds.has(n.data.groupId)
      ? { ...n, data: { ...n.data, groupId: undefined } }
      : n,
  );

  return { nodes: cleanNodes, edges: cleanEdges, groups: cleanGroups, metadata };
}

export function downloadJson(filename: string, config: ProjectConfig): void {
  const blob = new Blob([projectToJsonString(config)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('read error'));
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsText(file);
  });
}

function triggerDownload(href: string, filename: string): void {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
