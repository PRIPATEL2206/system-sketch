import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Row {
  label: string;
  keys: string[];
}

const SECTIONS: { title: string; rows: Row[] }[] = [
  {
    title: 'Edit',
    rows: [
      { label: 'Undo', keys: ['Ctrl', 'Z'] },
      { label: 'Redo', keys: ['Ctrl', 'Shift', 'Z'] },
      { label: 'Copy selection', keys: ['Ctrl', 'C'] },
      { label: 'Cut selection', keys: ['Ctrl', 'X'] },
      { label: 'Paste at cursor', keys: ['Ctrl', 'V'] },
      { label: 'Duplicate', keys: ['Ctrl', 'D'] },
      { label: 'Delete', keys: ['Del'] },
    ],
  },
  {
    title: 'Selection',
    rows: [
      { label: 'Select all', keys: ['Ctrl', 'A'] },
      { label: 'Lasso (drag)', keys: ['Shift', 'drag'] },
      { label: 'Add to selection', keys: ['Shift', 'click'] },
      { label: 'Group', keys: ['Ctrl', 'G'] },
      { label: 'Ungroup', keys: ['Ctrl', 'Shift', 'G'] },
      { label: 'Clear selection', keys: ['Esc'] },
    ],
  },
  {
    title: 'Canvas',
    rows: [
      { label: 'Add component (palette)', keys: ['A'] },
      { label: 'Pan canvas (hold)', keys: ['Space'] },
      { label: 'Focus mode', keys: ['F'] },
      { label: 'Templates', keys: ['T'] },
    ],
  },
  {
    title: 'Project',
    rows: [
      { label: 'Save JSON', keys: ['Ctrl', 'S'] },
      { label: 'Export PNG', keys: ['Ctrl', 'E'] },
      { label: 'Show shortcuts', keys: ['?'] },
    ],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
      {children}
    </kbd>
  );
}

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Keyboard shortcuts</DialogTitle>
        <DialogDescription>
          Cmd works in place of Ctrl on macOS.
        </DialogDescription>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <section key={s.title} className="flex flex-col gap-1">
              <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {s.title}
              </h3>
              <ul className="flex flex-col">
                {s.rows.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center justify-between gap-3 py-1 text-xs"
                  >
                    <span>{row.label}</span>
                    <span className="flex flex-wrap items-center gap-1">
                      {row.keys.map((k, i) => (
                        <Kbd key={`${row.label}-${i}`}>{k}</Kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
