import { useEffect, useMemo, useRef, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { NODE_CATALOG, type NodeCatalogEntry } from '@/features/nodes/nodeCatalog';
import { cn } from '@/utils/cn';

interface QuickAddPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (entry: NodeCatalogEntry) => void;
}

function Icon({ name, className }: { name: string; className?: string }) {
  const Comp = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  return Comp ? <Comp className={className} /> : null;
}

/**
 * Cmd-palette-style chooser opened with `A`. Search by label or kind,
 * arrow keys to move, Enter to commit, Esc to cancel.
 */
export function QuickAddPalette({ open, onOpenChange, onPick }: QuickAddPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NODE_CATALOG;
    return NODE_CATALOG.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.kind.includes(q) ||
        n.description.toLowerCase().includes(q),
    );
  }, [query]);

  // Reset state on open; auto-focus the input.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // RAF so the focus call runs after the dialog is in the DOM.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Keep activeIndex valid when the filter shrinks.
  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(0);
  }, [filtered.length, activeIndex]);

  if (!open) return null;

  const commit = (entry: NodeCatalogEntry) => {
    onPick(entry);
    onOpenChange(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/40 pt-[14vh] backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        // Click outside the panel closes the palette.
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Add component"
    >
      <div className="w-[min(520px,92vw)] overflow-hidden rounded-lg border bg-card shadow-xl">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              const entry = filtered[activeIndex];
              if (entry) commit(entry);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onOpenChange(false);
            }
          }}
          placeholder="Add a component… (e.g. database, kafka, gateway)"
          className="h-12 w-full bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
        />
        <div className="scrollbar-thin max-h-80 overflow-y-auto border-t p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No components match.
            </p>
          ) : (
            <ul className="flex flex-col">
              {filtered.map((entry, idx) => {
                const active = idx === activeIndex;
                return (
                  <li key={entry.kind}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => commit(entry)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left',
                        active ? 'bg-accent' : 'hover:bg-accent/60',
                      )}
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white"
                        style={{ backgroundColor: entry.color }}
                      >
                        <Icon name={entry.icon} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {entry.label}
                        </span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {entry.description}
                        </span>
                      </span>
                      {active ? (
                        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          ↵
                        </kbd>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-between border-t bg-muted/40 px-3 py-1.5 text-[10px] text-muted-foreground">
          <span>
            <kbd className="rounded border bg-card px-1">↑</kbd>{' '}
            <kbd className="rounded border bg-card px-1">↓</kbd> to move{' '}
            <kbd className="ml-1 rounded border bg-card px-1">↵</kbd> to add
          </span>
          <span>
            <kbd className="rounded border bg-card px-1">Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
