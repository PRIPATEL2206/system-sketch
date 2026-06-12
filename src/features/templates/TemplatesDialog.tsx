import { LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { TEMPLATES, type Template } from '@/features/templates/templateData';
import { useStore } from '@/store';

interface TemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplatesDialog({ open, onOpenChange }: TemplatesDialogProps) {
  const hydrate = useStore((s) => s.hydrate);

  const apply = (template: Template) => {
    const { nodes, edges } = template.build();
    hydrate({ nodes, edges, groups: [], projectName: template.label });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Start from a template</DialogTitle>
        <DialogDescription>
          Classic interview system-design problems, pre-wired.
          Your current canvas will be replaced.
        </DialogDescription>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => apply(t)}
              className="flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t.label}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{t.description}</p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
