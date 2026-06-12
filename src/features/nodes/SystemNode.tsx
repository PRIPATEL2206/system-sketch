import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import * as LucideIcons from 'lucide-react';
import type { SystemNodeData } from '@/types';
import { getCatalogEntry } from '@/features/nodes/nodeCatalog';
import { cn } from '@/utils/cn';

/**
 * Each handle MUST have an explicit unique id when there are multiple
 * handles of the same `type` on a node. React Flow's connection resolver
 * otherwise picks the first matching one, which is why edge drops on the
 * left side were routing to the top.
 *
 * We make every handle bi-directional (`type="source"` + `isConnectableEnd`)
 * so a drop lands on whichever side is closest to the cursor regardless
 * of whether the user started the connection from a source or a target.
 */
const HANDLE_BASE =
  '!h-2 !w-2 !border !border-card !bg-muted-foreground/70 ' +
  'transition-opacity duration-150 group-hover:!bg-foreground';

function SystemNodeImpl({ data, selected }: NodeProps<SystemNodeData>) {
  const fallback = getCatalogEntry(data.kind);
  const color = data.color ?? fallback.color;
  const iconName = data.icon ?? fallback.icon;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];

  return (
    <div
      className={cn(
        'system-node-entrance',
        'group relative min-w-[180px] max-w-[260px] rounded-lg border bg-card text-card-foreground shadow-sm',
        'transition-[box-shadow,transform,border-color] duration-150',
        'hover:-translate-y-px hover:shadow-md',
        selected
          ? 'shadow-md ring-2 ring-ring ring-offset-2 ring-offset-background'
          : 'hover:border-foreground/20',
      )}
    >
      {/* Bidirectional handles — explicit ids per position so routing works
          regardless of which side the cursor is on. */}
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        isConnectableStart
        isConnectableEnd
        className={HANDLE_BASE}
      />
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        isConnectableStart
        isConnectableEnd
        className={HANDLE_BASE}
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        isConnectableStart
        isConnectableEnd
        className={HANDLE_BASE}
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        isConnectableStart
        isConnectableEnd
        className={HANDLE_BASE}
      />

      <div className="h-1 rounded-t-lg" style={{ backgroundColor: color }} />

      <div className="flex items-center gap-2 px-3 py-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white shadow-sm"
          style={{ backgroundColor: color }}
        >
          {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{data.title}</p>
          <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
            {fallback.label}
          </p>
        </div>
      </div>

      {data.description ? (
        <p className="border-t px-3 py-2 text-xs text-muted-foreground line-clamp-3">
          {data.description}
        </p>
      ) : null}
    </div>
  );
}

function areNodePropsEqual(
  prev: NodeProps<SystemNodeData>,
  next: NodeProps<SystemNodeData>,
): boolean {
  if (prev.selected !== next.selected) return false;
  if (prev.dragging !== next.dragging) return false;
  if (prev.id !== next.id) return false;
  const a = prev.data;
  const b = next.data;
  return (
    a === b ||
    (a.title === b.title &&
      a.description === b.description &&
      a.kind === b.kind &&
      a.color === b.color &&
      a.icon === b.icon)
  );
}

export const SystemNode = memo(SystemNodeImpl, areNodePropsEqual);
