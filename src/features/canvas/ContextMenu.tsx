import { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';

export interface ContextMenuItem {
  /** Display label. */
  label: string;
  /** Optional shortcut hint shown on the right. */
  shortcut?: string;
  /** Disable when no-op for current selection. */
  disabled?: boolean;
  /** Set true for a divider; other fields ignored. */
  separator?: boolean;
  /** Render this item in destructive style. */
  danger?: boolean;
  onSelect?: () => void;
}

interface ContextMenuProps {
  /** Client-coords position; menu auto-shifts to stay on-screen. */
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}

const MENU_WIDTH = 200;

export function ContextMenu({ position, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Esc.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('blur', onClose);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', onClose);
    };
  }, [onClose]);

  // Clamp into viewport.
  const x = Math.min(position.x, window.innerWidth - MENU_WIDTH - 8);
  const y = Math.min(position.y, window.innerHeight - 8 - items.length * 28);

  return (
    <div
      ref={ref}
      role="menu"
      style={{ left: x, top: y, width: MENU_WIDTH }}
      className="fixed z-50 overflow-hidden rounded-md border bg-card text-card-foreground shadow-lg animate-fade-in"
    >
      {items.map((it, idx) =>
        it.separator ? (
          <div key={`sep-${idx}`} className="my-1 h-px bg-border" />
        ) : (
          <button
            key={`${it.label}-${idx}`}
            role="menuitem"
            disabled={it.disabled}
            onClick={() => {
              if (it.disabled) return;
              it.onSelect?.();
              onClose();
            }}
            className={cn(
              'flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-xs',
              'disabled:opacity-40',
              it.danger
                ? 'text-destructive hover:bg-destructive/10 disabled:hover:bg-transparent'
                : 'hover:bg-accent disabled:hover:bg-transparent',
            )}
          >
            <span>{it.label}</span>
            {it.shortcut ? (
              <span className="text-[10px] tracking-wide text-muted-foreground">
                {it.shortcut}
              </span>
            ) : null}
          </button>
        ),
      )}
    </div>
  );
}
