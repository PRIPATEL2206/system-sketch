import { memo, useCallback } from 'react';
import { type NodeProps } from 'reactflow';
import type { SystemNodeData } from '@/types';
import { useStore } from '@/store';
import { cn } from '@/utils/cn';

/**
 * Bare draggable text label — for layer/section headers like
 * "Frontend tier" or "Data plane". No background, no border, no handles.
 * Selection ring shows on hover/select so it's still grabbable.
 */
function TextNodeImpl({ id, data, selected }: NodeProps<SystemNodeData>) {
  const patchNodeCoalesced = useStore((s) => s.patchNodeCoalesced);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      patchNodeCoalesced(id, { title: e.target.value });
    },
    [id, patchNodeCoalesced],
  );

  return (
    <div
      className={cn(
        'system-node-entrance',
        'group rounded-sm px-1 py-0.5 transition-colors',
        selected
          ? 'ring-2 ring-ring ring-offset-2 ring-offset-background'
          : 'hover:bg-foreground/5',
      )}
    >
      <input
        value={data.title}
        onChange={onChange}
        // nodrag lets text selection inside the input work as expected.
        className="nodrag block min-w-[120px] border-0 bg-transparent text-base font-semibold uppercase tracking-wide text-foreground outline-none placeholder:text-muted-foreground"
        placeholder="Section"
        style={{ color: data.color }}
      />
    </div>
  );
}

export const TextNode = memo(TextNodeImpl);
