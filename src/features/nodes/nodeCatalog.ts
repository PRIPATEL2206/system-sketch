import type { NodeKind } from '@/types';

export interface NodeCatalogEntry {
  kind: NodeKind;
  label: string;
  description: string;
  /** Lucide icon name, resolved at render time. */
  icon: string;
  color: string;
  /** Used to group entries in the sidebar. */
  category: 'edge' | 'compute' | 'data' | 'integration' | 'observability' | 'annotation' | 'other';
}

/**
 * Catalog of prebuilt node kinds. The left sidebar reads from this list,
 * so adding a new kind here is enough to expose it in the UI.
 */
export const NODE_CATALOG: NodeCatalogEntry[] = [
  // ---------- Edge / entry ----------
  {
    kind: 'client',
    label: 'Client',
    description: 'Browser, mobile, or device',
    icon: 'Smartphone',
    color: '#0ea5e9',
    category: 'edge',
  },
  {
    kind: 'dns',
    label: 'DNS',
    description: 'Name resolution',
    icon: 'Compass',
    color: '#22d3ee',
    category: 'edge',
  },
  {
    kind: 'cdn',
    label: 'CDN',
    description: 'Edge content distribution',
    icon: 'Globe',
    color: '#14b8a6',
    category: 'edge',
  },
  {
    kind: 'load-balancer',
    label: 'Load Balancer',
    description: 'Distributes traffic across instances',
    icon: 'Scale',
    color: '#0ea5e9',
    category: 'edge',
  },
  {
    kind: 'api-gateway',
    label: 'API Gateway',
    description: 'Single entry point for client traffic',
    icon: 'DoorOpen',
    color: '#6366f1',
    category: 'edge',
  },
  {
    kind: 'web-server',
    label: 'Web Server',
    description: 'HTTP frontend (Nginx, Apache)',
    icon: 'Server',
    color: '#3b82f6',
    category: 'edge',
  },

  // ---------- Compute ----------
  {
    kind: 'microservice',
    label: 'Microservice',
    description: 'Stateless application service',
    icon: 'Boxes',
    color: '#10b981',
    category: 'compute',
  },
  {
    kind: 'auth',
    label: 'Auth Service',
    description: 'Identity & authorization',
    icon: 'ShieldCheck',
    color: '#22c55e',
    category: 'compute',
  },
  {
    kind: 'scheduler',
    label: 'Scheduler / Cron',
    description: 'Periodic & batch jobs',
    icon: 'Clock',
    color: '#84cc16',
    category: 'compute',
  },
  {
    kind: 'ml-model',
    label: 'ML Model',
    description: 'Inference / scoring service',
    icon: 'Brain',
    color: '#d946ef',
    category: 'compute',
  },

  // ---------- Data ----------
  {
    kind: 'database-sql',
    label: 'SQL Database',
    description: 'Relational data store',
    icon: 'Database',
    color: '#f59e0b',
    category: 'data',
  },
  {
    kind: 'database-nosql',
    label: 'NoSQL Database',
    description: 'Document / wide-column store',
    icon: 'Database',
    color: '#f97316',
    category: 'data',
  },
  {
    kind: 'cache',
    label: 'Cache',
    description: 'In-memory cache (e.g. Redis)',
    icon: 'Zap',
    color: '#ef4444',
    category: 'data',
  },
  {
    kind: 'queue',
    label: 'Queue / Stream',
    description: 'Async messaging (Kafka, SQS)',
    icon: 'ListOrdered',
    color: '#a855f7',
    category: 'data',
  },
  {
    kind: 'object-storage',
    label: 'Object Storage',
    description: 'Blob store (S3, GCS)',
    icon: 'HardDrive',
    color: '#eab308',
    category: 'data',
  },
  {
    kind: 'search',
    label: 'Search Index',
    description: 'Full-text search (Elasticsearch)',
    icon: 'Search',
    color: '#fb923c',
    category: 'data',
  },
  {
    kind: 'analytics',
    label: 'Analytics / DWH',
    description: 'Warehouse, OLAP (BigQuery, Snowflake)',
    icon: 'BarChart3',
    color: '#facc15',
    category: 'data',
  },

  // ---------- Integration ----------
  {
    kind: 'websocket',
    label: 'WebSocket',
    description: 'Persistent bidirectional connection',
    icon: 'Radio',
    color: '#8b5cf6',
    category: 'integration',
  },
  {
    kind: 'notification',
    label: 'Notification',
    description: 'Email, SMS, push',
    icon: 'Bell',
    color: '#f43f5e',
    category: 'integration',
  },
  {
    kind: 'payment',
    label: 'Payment',
    description: 'Charge processor (Stripe, PayPal)',
    icon: 'CreditCard',
    color: '#10b981',
    category: 'integration',
  },
  {
    kind: 'external-api',
    label: 'External API',
    description: 'Third-party dependency',
    icon: 'CloudCog',
    color: '#64748b',
    category: 'integration',
  },

  // ---------- Observability ----------
  {
    kind: 'monitoring',
    label: 'Monitoring',
    description: 'Metrics, logs, traces',
    icon: 'Activity',
    color: '#06b6d4',
    category: 'observability',
  },

  // ---------- Other ----------
  {
    kind: 'custom',
    label: 'Custom',
    description: 'User-defined component',
    icon: 'Shapes',
    color: '#94a3b8',
    category: 'other',
  },

  // ---------- Annotations ----------
  {
    kind: 'sticky',
    label: 'Sticky Note',
    description: 'Inline comment / callout',
    icon: 'StickyNote',
    color: '#facc15',
    category: 'annotation',
  },
  {
    kind: 'text',
    label: 'Text Label',
    description: 'Section header / caption',
    icon: 'Type',
    color: '#94a3b8',
    category: 'annotation',
  },
];

export function getCatalogEntry(kind: NodeKind): NodeCatalogEntry {
  return (
    NODE_CATALOG.find((entry) => entry.kind === kind) ??
    NODE_CATALOG.find((entry) => entry.kind === 'custom')!
  );
}

export type NodeCategory = NodeCatalogEntry['category'];

export const CATEGORY_ORDER: NodeCategory[] = [
  'edge',
  'compute',
  'data',
  'integration',
  'observability',
  'other',
  'annotation',
];

export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  edge: 'Edge & entry',
  compute: 'Compute',
  data: 'Data',
  integration: 'Integration',
  observability: 'Observability',
  other: 'Other',
  annotation: 'Annotations',
};
