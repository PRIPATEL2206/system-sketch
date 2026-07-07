import { useStore } from '@/store';
import { cn } from '@/utils/cn';

const DRAWING_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#22c55e', // green
  '#0ea5e9', // sky
  '#6366f1', // indigo
  '#a855f7', // purple
  '#ec4899', // pink
  '#ffffff', // white
  '#000000', // black
] as const;

const STROKE_WIDTHS = [2, 3, 5, 8, 12] as const;

/**
 * Compact options bar for drawing color + stroke width.
 * Appears below the floating toolbar when a drawing tool is active.
 */
export function DrawingOptionsBar() {
  const drawingMode = useStore((s) => s.drawingMode);
  const drawingColor = useStore((s) => s.drawingColor);
  const drawingStrokeWidth = useStore((s) => s.drawingStrokeWidth);
  const setDrawingColor = useStore((s) => s.setDrawingColor);
  const setDrawingStrokeWidth = useStore((s) => s.setDrawingStrokeWidth);

  if (drawingMode === 'none') return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-14 z-10 -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-3 rounded-lg border bg-card/90 px-3 py-2 shadow-md backdrop-blur animate-fade-in">
        {/* Color swatches */}
        <div className="flex items-center gap-1">
          {DRAWING_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setDrawingColor(c)}
              aria-label={`Color ${c}`}
              className={cn(
                'h-5 w-5 rounded-full border transition-transform hover:scale-110',
                drawingColor === c
                  ? 'ring-2 ring-ring ring-offset-1 ring-offset-background scale-110'
                  : 'border-border/60',
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-border" />

        {/* Stroke width */}
        <div className="flex items-center gap-1">
          {STROKE_WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setDrawingStrokeWidth(w)}
              aria-label={`Width ${w}px`}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
                drawingStrokeWidth === w
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input bg-background hover:bg-accent',
              )}
            >
              <div
                className="rounded-full"
                style={{
                  width: Math.min(w * 1.5, 16),
                  height: Math.min(w * 1.5, 16),
                  backgroundColor: drawingColor,
                }}
              />
            </button>
          ))}
        </div>

        {/* Active tool indicator */}
        <div className="h-5 w-px bg-border" />
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {drawingMode === 'freehand' ? 'Pencil' : drawingMode}
        </span>
      </div>
    </div>
  );
}
