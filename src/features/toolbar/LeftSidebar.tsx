import { useMemo, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  NODE_CATALOG,
  type NodeCatalogEntry,
  type NodeCategory,
} from '@/features/nodes/nodeCatalog';
import { cn } from '@/utils/cn';

interface LeftSidebarProps {
  onAddNode?: (entry: NodeCatalogEntry) => void;
}

function Icon({ name, className }: { name: string; className?: string }) {
  const Comp = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  if (!Comp) return null;
  return <Comp className={className} />;
}

export function LeftSidebar({ onAddNode }: LeftSidebarProps) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NODE_CATALOG;
    return NODE_CATALOG.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.kind.includes(q) ||
        n.category.includes(q),
    );
  }, [query]);

  /** Group filtered items by category. */
  const grouped = useMemo(() => {
    const map = new Map<NodeCategory, NodeCatalogEntry[]>();
    for (const entry of filtered) {
      const arr = map.get(entry.category) ?? [];
      arr.push(entry);
      map.set(entry.category, arr);
    }
    return CATEGORY_ORDER.filter((cat) => map.has(cat)).map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      items: map.get(cat)!,
    }));
  }, [filtered]);

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={150}>
        <aside className="flex w-12 shrink-0 flex-col items-center border-r bg-card py-2 transition-[width] duration-200">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCollapsed(false)}
                aria-label="Expand components panel"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand components</TooltipContent>
          </Tooltip>
          <div className="mt-2 flex w-full flex-col items-center gap-1 px-1">
            {NODE_CATALOG.slice(0, 8).map((entry) => (
              <Tooltip key={entry.kind}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    draggable
                    onClick={() => onAddNode?.(entry)}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/system-sketch-node', entry.kind);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-white shadow-sm transition-transform hover:scale-105"
                    style={{ backgroundColor: entry.color }}
                    aria-label={entry.label}
                  >
                    <Icon name={entry.icon} className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{entry.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </aside>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <aside className="flex w-64 shrink-0 flex-col border-r bg-card transition-[width] duration-200">
        <div className="flex items-center justify-between border-b p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Components
          </h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse components panel"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Collapse</TooltipContent>
          </Tooltip>
        </div>
        <div className="border-b px-3 pb-3 pt-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search… (e.g. kafka, redis)"
              className="h-8 w-full rounded-md border bg-background pl-7 pr-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-2 py-1">
          {grouped.map((g) => (
            <div key={g.category} className="mb-2">
              <p className="mb-1 mt-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {g.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {g.items.map((entry) => (
                  <li key={entry.kind}>
                    <button
                      type="button"
                      draggable
                      onClick={() => onAddNode?.(entry)}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/system-sketch-node', entry.kind);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      className={cn(
                        'group flex w-full items-center gap-2 rounded-md border border-transparent p-1.5 text-left',
                        'transition-all duration-150 hover:-translate-y-px hover:border-border hover:bg-accent hover:shadow-sm',
                      )}
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white transition-transform group-hover:scale-105"
                        style={{ backgroundColor: entry.color }}
                      >
                        <Icon name={entry.icon} className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium">{entry.label}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {grouped.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">No matches.</p>
          ) : null}
        </div>
      </aside>
    </TooltipProvider>
  );
}
