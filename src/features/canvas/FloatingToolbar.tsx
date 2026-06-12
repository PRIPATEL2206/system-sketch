import {
  Maximize2,
  Plus,
  Redo2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useReactFlow } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useHistoryAvailability, useStore } from '@/store';

interface FloatingToolbarProps {
  onQuickAdd: () => void;
}

interface FtbButtonProps {
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

function FtbButton({ label, shortcut, icon, onClick, disabled }: FtbButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className="h-8 w-8"
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span>{label}</span>
        {shortcut ? (
          <span className="ml-2 text-[10px] opacity-70">{shortcut}</span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Glass toolbar floating at the top-center of the canvas. Reaches the
 * highest-frequency actions (add/zoom/fit/undo/redo) without traveling
 * the cursor up to the TopBar.
 */
export function FloatingToolbar({ onQuickAdd }: FloatingToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { canUndo, canRedo } = useHistoryAvailability();
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2">
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg border bg-card/85 p-1 shadow-md backdrop-blur animate-slide-in-down">
          <FtbButton
            label="Add component"
            shortcut="A"
            icon={<Plus className="h-4 w-4" />}
            onClick={onQuickAdd}
          />
          <Separator orientation="vertical" className="mx-0.5 h-5" />
          <FtbButton
            label="Zoom in"
            icon={<ZoomIn className="h-4 w-4" />}
            onClick={() => zoomIn({ duration: 200 })}
          />
          <FtbButton
            label="Zoom out"
            icon={<ZoomOut className="h-4 w-4" />}
            onClick={() => zoomOut({ duration: 200 })}
          />
          <FtbButton
            label="Fit to canvas"
            icon={<Maximize2 className="h-4 w-4" />}
            onClick={() => fitView({ duration: 300, padding: 0.2 })}
          />
          <Separator orientation="vertical" className="mx-0.5 h-5" />
          <FtbButton
            label="Undo"
            shortcut="Ctrl+Z"
            icon={<Undo2 className="h-4 w-4" />}
            onClick={undo}
            disabled={!canUndo}
          />
          <FtbButton
            label="Redo"
            shortcut="Ctrl+Shift+Z"
            icon={<Redo2 className="h-4 w-4" />}
            onClick={redo}
            disabled={!canRedo}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
