import { useCallback, useMemo, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Info, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { NODE_COLOR_PALETTE } from '@/features/nodes/colorPalette';
import { getCatalogEntry } from '@/features/nodes/nodeCatalog';
import type { NodeMetadata, SystemNode, SystemNodeData } from '@/types';
import { cn } from '@/utils/cn';

interface PropertiesPanelProps {
  node: SystemNode | null;
  onPatch: (id: string, patch: Partial<SystemNodeData>) => void;
  /** Optional coalesced variant — used by text inputs that fire per keystroke. */
  onPatchCoalesced?: (id: string, patch: Partial<SystemNodeData>) => void;
  onDelete: (id: string) => void;
}

/** Curated icon list — covers common system-design glyphs. */
const ICON_OPTIONS = [
  'DoorOpen',
  'Scale',
  'Boxes',
  'Database',
  'Zap',
  'ListOrdered',
  'Globe',
  'ShieldCheck',
  'CloudCog',
  'Shapes',
  'Server',
  'Layers',
  'Cpu',
  'Network',
  'KeyRound',
  'Lock',
  'Mail',
  'Search',
] as const;

function Icon({ name, className }: { name: string; className?: string }) {
  const Comp = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  return Comp ? <Comp className={className} /> : null;
}

export function PropertiesPanel({
  node,
  onPatch,
  onPatchCoalesced,
  onDelete,
}: PropertiesPanelProps) {
  if (!node) {
    return (
      <div className="scrollbar-thin flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
        <Info className="h-5 w-5" />
        <p className="text-xs">
          Select a node to edit its title, description, color and metadata.
        </p>
      </div>
    );
  }

  return (
    <div className="scrollbar-thin flex flex-1 flex-col overflow-y-auto">
      <NodeEditor
        node={node}
        onPatch={onPatch}
        onPatchCoalesced={onPatchCoalesced ?? onPatch}
        onDelete={onDelete}
      />
    </div>
  );
}

function NodeEditor({
  node,
  onPatch,
  onPatchCoalesced,
  onDelete,
}: {
  node: SystemNode;
  onPatch: PropertiesPanelProps['onPatch'];
  onPatchCoalesced: NonNullable<PropertiesPanelProps['onPatchCoalesced']>;
  onDelete: PropertiesPanelProps['onDelete'];
}) {
  const entry = getCatalogEntry(node.data.kind);
  const patch = useCallback(
    (next: Partial<SystemNodeData>) => onPatch(node.id, next),
    [node.id, onPatch],
  );
  const patchCoalesced = useCallback(
    (next: Partial<SystemNodeData>) => onPatchCoalesced(node.id, next),
    [node.id, onPatchCoalesced],
  );

  return (
    <div className="flex flex-col gap-5 p-4">
      <header className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white"
          style={{ backgroundColor: node.data.color ?? entry.color }}
        >
          <Icon name={node.data.icon ?? entry.icon} className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{node.data.title || entry.label}</p>
          <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
            {entry.label} · {node.id}
          </p>
        </div>
      </header>

      <Separator />

      <Field label="Title">
        <Input
          value={node.data.title}
          onChange={(e) => patchCoalesced({ title: e.target.value })}
          placeholder={entry.label}
        />
      </Field>

      <Field label="Description">
        <Textarea
          value={node.data.description ?? ''}
          onChange={(e) => patchCoalesced({ description: e.target.value })}
          placeholder="What does this component do?"
        />
      </Field>

      <Field label="Color">
        <ColorPicker
          value={node.data.color ?? entry.color}
          onChange={(color) => patch({ color })}
        />
      </Field>

      <Field label="Icon">
        <IconPicker
          value={node.data.icon ?? entry.icon}
          color={node.data.color ?? entry.color}
          onChange={(icon) => patch({ icon })}
        />
      </Field>

      <Separator />

      <MetadataEditor
        metadata={node.data.metadata ?? {}}
        onChange={(metadata) => patch({ metadata })}
      />

      <Separator />

      <Button
        variant="destructive"
        size="sm"
        onClick={() => onDelete(node.id)}
        className="self-start"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete node
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {NODE_COLOR_PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={`Set color ${c}`}
          className={cn(
            'h-6 w-6 rounded-md border border-border/60 transition-transform',
            value.toLowerCase() === c.toLowerCase()
              ? 'ring-2 ring-ring ring-offset-2 ring-offset-background'
              : 'hover:scale-110',
          )}
          style={{ backgroundColor: c }}
        />
      ))}
      <label className="ml-1 flex h-6 cursor-pointer items-center rounded-md border border-input bg-background px-1.5 text-[10px] text-muted-foreground hover:bg-accent">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
          aria-label="Custom color"
        />
        <span className="ml-1 hidden sm:inline">Custom</span>
      </label>
    </div>
  );
}

function IconPicker({
  value,
  color,
  onChange,
}: {
  value: string;
  color: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {ICON_OPTIONS.map((name) => {
        const isActive = value === name;
        return (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            aria-label={name}
            title={name}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md border text-foreground transition-colors',
              isActive
                ? 'border-transparent text-white'
                : 'border-input bg-background hover:bg-accent',
            )}
            style={isActive ? { backgroundColor: color } : undefined}
          >
            <Icon name={name} className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

interface MetadataEditorProps {
  metadata: NodeMetadata;
  onChange: (next: NodeMetadata) => void;
}

/**
 * Local-row state so editing a key doesn't lose focus on every keystroke.
 * We commit to the parent only on blur or value change.
 */
function MetadataEditor({ metadata, onChange }: MetadataEditorProps) {
  const entries = useMemo(
    () => Object.entries(metadata).map(([k, v]) => ({ k, v: v?.toString() ?? '' })),
    [metadata],
  );
  const [draftKey, setDraftKey] = useState('');
  const [draftValue, setDraftValue] = useState('');

  const updateKey = (oldKey: string, newKey: string) => {
    if (newKey === oldKey) return;
    const next: NodeMetadata = {};
    for (const [k, v] of Object.entries(metadata)) {
      next[k === oldKey ? newKey : k] = v;
    }
    onChange(next);
  };
  const updateValue = (key: string, value: string) => {
    onChange({ ...metadata, [key]: value });
  };
  const remove = (key: string) => {
    const next = { ...metadata };
    delete next[key];
    onChange(next);
  };
  const add = () => {
    const key = draftKey.trim();
    if (!key) return;
    if (Object.prototype.hasOwnProperty.call(metadata, key)) return;
    onChange({ ...metadata, [key]: draftValue });
    setDraftKey('');
    setDraftValue('');
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>Metadata</Label>
        <span className="text-[10px] text-muted-foreground">{entries.length} pairs</span>
      </div>

      {entries.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">No metadata yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {entries.map(({ k, v }) => (
            <li key={k} className="flex items-center gap-1.5">
              <Input
                defaultValue={k}
                onBlur={(e) => updateKey(k, e.target.value.trim() || k)}
                className="h-7 w-28 text-xs"
                aria-label={`Key for ${k}`}
              />
              <Input
                value={v}
                onChange={(e) => updateValue(k, e.target.value)}
                className="h-7 flex-1 text-xs"
                aria-label={`Value for ${k}`}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => remove(k)}
                aria-label={`Remove ${k}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-1.5">
        <Input
          value={draftKey}
          onChange={(e) => setDraftKey(e.target.value)}
          placeholder="key"
          className="h-7 w-28 text-xs"
          onKeyDown={(e) => {
            if (e.key === 'Enter') add();
          }}
        />
        <Input
          value={draftValue}
          onChange={(e) => setDraftValue(e.target.value)}
          placeholder="value"
          className="h-7 flex-1 text-xs"
          onKeyDown={(e) => {
            if (e.key === 'Enter') add();
          }}
        />
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={add}
          aria-label="Add metadata"
          disabled={!draftKey.trim()}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
