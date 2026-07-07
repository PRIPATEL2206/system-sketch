import {
  ArrowUpRight,
  Circle,
  Eraser,
  Maximize2,
  Minus,
  MousePointer2,
  Pencil,
  Plus,
  Redo2,
  Square,
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
import type { DrawingTool } from '@/types';
import { cn } from '@/utils/cn';

interface FloatingToolbarProps {
  onQuickAdd: () => void;
}

interface FtbButtonProps {
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}

function FtbButton({ label, shortcut, icon, onClick, disabled, active }: FtbButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className={cn('h-8 w-8', active && 'bg-primary/15 text-primary')}
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
 * Glass toolbar floating at the top-center of the canvas.
 * Contains: add node, zoom, undo/redo, and drawing tools.
 */
export function FloatingToolbar({ onQuickAdd }: FloatingToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { canUndo, canRedo } = useHistoryAvailability();
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const drawingMode = useStore((s) => s.drawingMode);
  const setDrawingMode = useStore((s) => s.setDrawingMode);

  const toggleTool = (tool: DrawingTool) => {
    setDrawingMode(drawingMode === tool ? 'none' : tool);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2">
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg border bg-card/85 p-1 shadow-md backdrop-blur animate-slide-in-down">
          {/* Selection mode (exit drawing) */}
          <FtbButton
            label="Select"
            shortcut="Esc"
            icon={<MousePointer2 className="h-4 w-4" />}
            onClick={() => setDrawingMode('none')}
            active={drawingMode === 'none'}
          />
          <FtbButton
            label="Add component"
            shortcut="A"
            icon={<Plus className="h-4 w-4" />}
            onClick={onQuickAdd}
          />
          <Separator orientation="vertical" className="mx-0.5 h-5" />

          {/* Drawing tools */}
          <FtbButton
            label="Pencil"
            shortcut="P"
            icon={<Pencil className="h-4 w-4" />}
            onClick={() => toggleTool('freehand')}
            active={drawingMode === 'freehand'}
          />
          <FtbButton
            label="Rectangle"
            shortcut="R"
            icon={<Square className="h-4 w-4" />}
            onClick={() => toggleTool('rect')}
            active={drawingMode === 'rect'}
          />
          <FtbButton
            label="Ellipse"
            shortcut="O"
            icon={<Circle className="h-4 w-4" />}
            onClick={() => toggleTool('ellipse')}
            active={drawingMode === 'ellipse'}
          />
          <FtbButton
            label="Line"
            shortcut="L"
            icon={<Minus className="h-4 w-4" />}
            onClick={() => toggleTool('line')}
            active={drawingMode === 'line'}
          />
          <FtbButton
            label="Arrow"
            shortcut="\"
            icon={<ArrowUpRight className="h-4 w-4" />}
            onClick={() => toggleTool('arrow')}
            active={drawingMode === 'arrow'}
          />
          <FtbButton
            label="Eraser"
            shortcut="E"
            icon={<Eraser className="h-4 w-4" />}
            onClick={() => toggleTool('eraser')}
            active={drawingMode === 'eraser'}
          />
          <Separator orientation="vertical" className="mx-0.5 h-5" />

          {/* Zoom + Fit */}
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

          {/* Undo / Redo */}
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
