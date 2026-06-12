import { useCallback } from 'react';
import { ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { SystemEdge, SystemEdgeData } from '@/types';
import { cn } from '@/utils/cn';

interface EdgePropertiesPanelProps {
  edge: SystemEdge;
  /** Title of source node (for display only). */
  sourceLabel: string;
  /** Title of target node (for display only). */
  targetLabel: string;
  onPatch: (id: string, patch: Partial<SystemEdge> & { data?: Partial<SystemEdgeData> }) => void;
  /** Coalesced variant for text inputs. */
  onPatchCoalesced?: (
    id: string,
    patch: Partial<SystemEdge> & { data?: Partial<SystemEdgeData> },
  ) => void;
  onDelete: (id: string) => void;
}

const FLOW_OPTIONS: { value: NonNullable<SystemEdgeData['flowType']>; label: string }[] = [
  { value: 'sync', label: 'Sync' },
  { value: 'async', label: 'Async' },
  { value: 'data', label: 'Data' },
];

export function EdgePropertiesPanel({
  edge,
  sourceLabel,
  targetLabel,
  onPatch,
  onPatchCoalesced,
  onDelete,
}: EdgePropertiesPanelProps) {
  const patcher = onPatchCoalesced ?? onPatch;
  const patchData = useCallback(
    (next: Partial<SystemEdgeData>) =>
      onPatch(edge.id, { data: { ...edge.data, ...next } }),
    [edge.id, edge.data, onPatch],
  );
  const patchDataCoalesced = useCallback(
    (next: Partial<SystemEdgeData>) =>
      patcher(edge.id, { data: { ...edge.data, ...next } }),
    [edge.id, edge.data, patcher],
  );
  const flow = edge.data?.flowType ?? 'sync';

  return (
    <div className="scrollbar-thin flex flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-5 p-4">
        <header>
          <p className="text-sm font-semibold">Connection</p>
          <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
            <span className="truncate">{sourceLabel}</span>
            <ArrowRight className="h-3 w-3 shrink-0" />
            <span className="truncate">{targetLabel}</span>
          </p>
        </header>

        <Separator />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edge-label">Label</Label>
          <Input
            id="edge-label"
            value={edge.data?.label ?? ''}
            onChange={(e) => patchDataCoalesced({ label: e.target.value })}
            placeholder="e.g. POST /login"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Flow type</Label>
          <div className="flex gap-1.5">
            {FLOW_OPTIONS.map((opt) => {
              const isActive = flow === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => patchData({ flowType: opt.value })}
                  className={cn(
                    'h-8 flex-1 rounded-md border text-xs font-medium transition-colors',
                    isActive
                      ? 'border-transparent bg-primary text-primary-foreground'
                      : 'border-input bg-background hover:bg-accent',
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Sync = solid, Async = dashed, Data = dotted.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Animated</Label>
          <button
            type="button"
            onClick={() => onPatch(edge.id, { animated: !edge.animated })}
            className={cn(
              'h-8 rounded-md border text-xs font-medium transition-colors',
              edge.animated
                ? 'border-transparent bg-primary text-primary-foreground'
                : 'border-input bg-background hover:bg-accent',
            )}
          >
            {edge.animated ? 'On' : 'Off'}
          </button>
        </div>

        <Separator />

        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(edge.id)}
          className="self-start"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete connection
        </Button>
      </div>
    </div>
  );
}
