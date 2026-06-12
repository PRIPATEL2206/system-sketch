import { useCallback, useState } from 'react';
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  Copy,
  Group,
  StretchHorizontal,
  StretchVertical,
  Trash2,
  Ungroup,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { NODE_COLOR_PALETTE } from '@/features/nodes/colorPalette';
import {
  alignNodes,
  distributeNodes,
  type AlignAxis,
  type DistributeAxis,
} from '@/features/selection/alignment';
import { useSelectedNodes, useStore } from '@/store';
import { cn } from '@/utils/cn';

interface MultiSelectionPanelProps {
  selectionCount: number;
  onRequestDelete: () => void;
}

export function MultiSelectionPanel({
  selectionCount,
  onRequestDelete,
}: MultiSelectionPanelProps) {
  const selected = useSelectedNodes();
  const bulkPatchNodes = useStore((s) => s.bulkPatchNodes);
  const bulkUpdateNodes = useStore((s) => s.bulkUpdateNodes);
  const duplicateSelection = useStore((s) => s.duplicateSelection);
  const groupSelection = useStore((s) => s.groupSelection);
  const ungroupSelection = useStore((s) => s.ungroupSelection);

  const [renamePattern, setRenamePattern] = useState('');

  const ids = selected.map((n) => n.id);

  const setColor = useCallback(
    (color: string) => bulkPatchNodes(ids, { color }),
    [bulkPatchNodes, ids],
  );

  const align = useCallback(
    (axis: AlignAxis) => {
      const positions = alignNodes(selected, axis);
      if (positions.size === 0) return;
      bulkUpdateNodes(
        (n) => {
          const pos = positions.get(n.id);
          return pos ? { ...n, position: pos } : n;
        },
        Array.from(positions.keys()),
      );
    },
    [bulkUpdateNodes, selected],
  );

  const distribute = useCallback(
    (axis: DistributeAxis) => {
      const positions = distributeNodes(selected, axis);
      if (positions.size === 0) return;
      bulkUpdateNodes(
        (n) => {
          const pos = positions.get(n.id);
          return pos ? { ...n, position: pos } : n;
        },
        Array.from(positions.keys()),
      );
    },
    [bulkUpdateNodes, selected],
  );

  const applyRenamePattern = useCallback(() => {
    const pattern = renamePattern.trim();
    if (!pattern) return;
    const sorted = [...selected].sort((a, b) =>
      a.position.y === b.position.y
        ? a.position.x - b.position.x
        : a.position.y - b.position.y,
    );
    const orderById = new Map<string, number>();
    sorted.forEach((n, i) => orderById.set(n.id, i + 1));
    bulkUpdateNodes(
      (n) => {
        const i = orderById.get(n.id) ?? 1;
        return {
          ...n,
          data: { ...n.data, title: pattern.replace(/\{i\}/g, String(i)) },
        };
      },
      sorted.map((n) => n.id),
    );
  }, [bulkUpdateNodes, renamePattern, selected]);

  // True when at least one selected node already belongs to a group.
  const anyGrouped = selected.some((n) => n.data.groupId);

  return (
    <div className="scrollbar-thin flex flex-1 flex-col gap-5 overflow-y-auto p-4">
      <header>
        <p className="text-sm font-semibold">Multi-selection</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {selectionCount} {selectionCount === 1 ? 'node' : 'nodes'} selected
        </p>
      </header>

      <Separator />

      <Section label="Bulk color">
        <div className="flex flex-wrap gap-1.5">
          {NODE_COLOR_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Set color ${c}`}
              className="h-6 w-6 rounded-md border border-border/60 transition-transform hover:scale-110"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </Section>

      <Section label="Rename pattern">
        <div className="flex items-center gap-1.5">
          <Input
            value={renamePattern}
            onChange={(e) => setRenamePattern(e.target.value)}
            placeholder="Service {i}"
            className="h-7 flex-1 text-xs"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={applyRenamePattern}
            disabled={!renamePattern.trim()}
          >
            Apply
          </Button>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Use <code>{'{i}'}</code> for 1-based index (top-left to bottom-right).
        </p>
      </Section>

      <Section label="Align">
        <div className="grid grid-cols-3 gap-1">
          <AlignBtn icon={<AlignStartVertical className="h-3.5 w-3.5" />} label="Left" onClick={() => align('left')} />
          <AlignBtn icon={<AlignCenterVertical className="h-3.5 w-3.5" />} label="Center" onClick={() => align('h-center')} />
          <AlignBtn icon={<AlignEndVertical className="h-3.5 w-3.5" />} label="Right" onClick={() => align('right')} />
          <AlignBtn icon={<AlignStartHorizontal className="h-3.5 w-3.5" />} label="Top" onClick={() => align('top')} />
          <AlignBtn icon={<AlignCenterHorizontal className="h-3.5 w-3.5" />} label="Middle" onClick={() => align('v-center')} />
          <AlignBtn icon={<AlignEndHorizontal className="h-3.5 w-3.5" />} label="Bottom" onClick={() => align('bottom')} />
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Aligns relative to the first-selected node.
        </p>
      </Section>

      <Section label="Distribute">
        <div className="grid grid-cols-2 gap-1">
          <AlignBtn
            icon={<StretchHorizontal className="h-3.5 w-3.5" />}
            label="Horizontally"
            onClick={() => distribute('horizontal')}
            disabled={selectionCount < 3}
          />
          <AlignBtn
            icon={<StretchVertical className="h-3.5 w-3.5" />}
            label="Vertically"
            onClick={() => distribute('vertical')}
            disabled={selectionCount < 3}
          />
        </div>
      </Section>

      <Separator />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={duplicateSelection}>
          <Copy className="h-3.5 w-3.5" /> Duplicate
        </Button>
        {anyGrouped ? (
          <Button variant="outline" size="sm" onClick={ungroupSelection}>
            <Ungroup className="h-3.5 w-3.5" /> Ungroup
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => groupSelection()}
            disabled={selectionCount < 2}
          >
            <Group className="h-3.5 w-3.5" /> Group
          </Button>
        )}
      </div>

      <Button
        variant="destructive"
        size="sm"
        className="self-start"
        onClick={onRequestDelete}
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete {selectionCount}
      </Button>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function AlignBtn({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-8 items-center justify-center gap-1 rounded-md border bg-background text-[11px]',
        'transition-colors hover:bg-accent disabled:opacity-40 disabled:hover:bg-background',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
