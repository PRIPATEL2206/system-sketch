import { memo, useCallback } from 'react';
import { type NodeProps } from 'reactflow';
import type { SystemNodeData } from '@/types';
import { useStore } from '@/store';
import { cn } from '@/utils/cn';

/**
 * Yellow sticky note for inline annotations and callouts. No edge handles —
 * sticky notes are commentary, they don't participate in the system graph.
 * Title doubles as the body (multi-line) for fast keyboard-only entry.
 */
function StickyNodeImpl({ id, data, selected }: NodeProps<SystemNodeData>) {
  const patchNodeCoalesced = useStore((s) => s.patchNodeCoalesced);
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      patchNodeCoalesced(id, { title: e.target.value });
    },
    [id, patchNodeCoalesced],
  );

  const color = data.color ?? '#facc15';

  return (
    <div
      className={cn(
        'system-node-entrance',
        'group relative w-[200px] rounded-md p-2 shadow-sm',
        'transition-shadow duration-150 hover:shadow-md',
        selected ? 'ring-2 ring-ring ring-offset-2 ring-offset-background' : '',
      )}
      style={{
        backgroundColor: `${color}33`,
        border: `1px solid ${color}99`,
      }}
    >
      <textarea
        value={data.title}
        onChange={onChange}
        // nodrag/nopan prevent React Flow from intercepting text selection.
        className="nodrag nopan block h-full w-full resize-none border-0 bg-transparent text-xs leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
        rows={3}
        placeholder="Add a note…"
      />
    </div>
  );
}

export const StickyNode = memo(StickyNodeImpl);
