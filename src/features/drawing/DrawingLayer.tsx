import { useCallback, useRef, useState } from 'react';
import { useStore as useRfStore, type ReactFlowState } from 'reactflow';
import { useStore } from '@/store';
import { pointsToSmoothPath, simplifyPoints } from '@/features/drawing/smoothPath';
import { isPointNearDrawing } from '@/features/drawing/hitTest';
import type { DrawingElement, DrawingElementType } from '@/types';

const viewportSelector = (s: ReactFlowState) =>
  ({ x: s.transform[0], y: s.transform[1], zoom: s.transform[2] }) as const;

let drawingIdCounter = 0;
function makeDrawingId(): string {
  drawingIdCounter += 1;
  return `draw_${drawingIdCounter.toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/**
 * Drawing layer split into two parts:
 * 1. A **display layer** (always visible, pointer-events:none, z-index:0)
 *    that renders committed drawings. This sits below ReactFlow's
 *    interaction pane so drawings are visible but don't block clicks.
 * 2. An **interaction layer** (only visible when drawingMode !== 'none',
 *    pointer-events:auto, z-index:5) that captures pointer events for
 *    drawing/erasing AND renders the live preview + committed drawings
 *    (so the user sees both while drawing).
 */
export function DrawingLayer() {
  const { x, y, zoom } = useRfStore(viewportSelector);
  const drawings = useStore((s) => s.drawings);
  const drawingMode = useStore((s) => s.drawingMode);
  const drawingColor = useStore((s) => s.drawingColor);
  const drawingStrokeWidth = useStore((s) => s.drawingStrokeWidth);
  const addDrawing = useStore((s) => s.addDrawing);
  const removeDrawing = useStore((s) => s.removeDrawing);

  const [activePoints, setActivePoints] = useState<number[][] | null>(null);
  const [hoveredDrawingId, setHoveredDrawingId] = useState<string | null>(null);
  const isDrawingRef = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const isActive = drawingMode !== 'none';

  const clientToFlow = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { fx: 0, fy: 0 };
      const rect = svg.getBoundingClientRect();
      const fx = (clientX - rect.left - x) / zoom;
      const fy = (clientY - rect.top - y) / zoom;
      return { fx, fy };
    },
    [x, y, zoom],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isActive || e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);

      const { fx, fy } = clientToFlow(e.clientX, e.clientY);

      if (drawingMode === 'eraser') {
        const hit = drawings.find((d) => isPointNearDrawing(fx, fy, d));
        if (hit) removeDrawing(hit.id);
        isDrawingRef.current = true;
        return;
      }

      isDrawingRef.current = true;
      setActivePoints([[fx, fy]]);
    },
    [isActive, drawingMode, clientToFlow, drawings, removeDrawing],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isActive) return;
      const { fx, fy } = clientToFlow(e.clientX, e.clientY);

      if (drawingMode === 'eraser') {
        const hit = drawings.find((d) => isPointNearDrawing(fx, fy, d));
        setHoveredDrawingId(hit?.id ?? null);
        if (isDrawingRef.current && hit) {
          removeDrawing(hit.id);
        }
        return;
      }

      if (!isDrawingRef.current || !activePoints) return;
      e.stopPropagation();

      if (drawingMode === 'freehand') {
        setActivePoints((prev) => (prev ? [...prev, [fx, fy]] : [[fx, fy]]));
      } else {
        setActivePoints([activePoints[0], [fx, fy]]);
      }
    },
    [isActive, drawingMode, clientToFlow, activePoints, drawings, removeDrawing],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      (e.target as Element).releasePointerCapture?.(e.pointerId);

      if (drawingMode === 'eraser' || !activePoints || activePoints.length === 0) {
        setActivePoints(null);
        return;
      }

      let type: DrawingElementType;
      let pts: number[][];

      switch (drawingMode) {
        case 'freehand':
          type = 'freehand';
          pts = simplifyPoints(activePoints);
          break;
        case 'rect':
          type = 'rect';
          pts = activePoints.length >= 2 ? activePoints : [activePoints[0], activePoints[0]];
          break;
        case 'ellipse':
          type = 'ellipse';
          pts = activePoints.length >= 2 ? activePoints : [activePoints[0], activePoints[0]];
          break;
        case 'line':
          type = 'line';
          pts = activePoints.length >= 2 ? activePoints : [activePoints[0], activePoints[0]];
          break;
        case 'arrow':
          type = 'arrow';
          pts = activePoints.length >= 2 ? activePoints : [activePoints[0], activePoints[0]];
          break;
        default:
          setActivePoints(null);
          return;
      }

      // Don't commit zero-size shapes
      if (type !== 'freehand' && pts.length >= 2) {
        const dx = pts[1][0] - pts[0][0];
        const dy = pts[1][1] - pts[0][1];
        if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
          setActivePoints(null);
          return;
        }
      }

      const drawing: DrawingElement = {
        id: makeDrawingId(),
        type,
        points: pts,
        stroke: drawingColor,
        strokeWidth: drawingStrokeWidth,
      };
      addDrawing(drawing);
      setActivePoints(null);
    },
    [drawingMode, activePoints, drawingColor, drawingStrokeWidth, addDrawing],
  );

  const cursorClass =
    drawingMode === 'eraser'
      ? 'cursor-cell'
      : isActive
        ? 'cursor-crosshair'
        : '';

  const transformStyle = `translate(${x}px, ${y}px) scale(${zoom})`;

  return (
    <>
      {/* Display layer — always visible, behind RF interaction pane */}
      {drawings.length > 0 && !isActive ? (
        <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
          <svg className="absolute inset-0 h-full w-full">
            <g style={{ transform: transformStyle, transformOrigin: '0 0' }}>
              <ArrowDefs />
              {drawings.map((d) => (
                <DrawingPath key={d.id} drawing={d} highlighted={false} />
              ))}
            </g>
          </svg>
        </div>
      ) : null}

      {/* Interaction layer — on top when drawing mode is active */}
      <div
        className={`absolute inset-0 ${cursorClass}`}
        style={{
          pointerEvents: isActive ? 'auto' : 'none',
          zIndex: isActive ? 5 : -1,
        }}
      >
        <svg
          ref={svgRef}
          className="absolute inset-0 h-full w-full"
          style={{ pointerEvents: isActive ? 'auto' : 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <g style={{ transform: transformStyle, transformOrigin: '0 0' }}>
            <ArrowDefs />
            {/* When active, render all committed drawings here too (so they're visible) */}
            {isActive
              ? drawings.map((d) => (
                  <DrawingPath
                    key={d.id}
                    drawing={d}
                    highlighted={d.id === hoveredDrawingId}
                  />
                ))
              : null}
            {/* Live preview */}
            {activePoints && activePoints.length > 0 && drawingMode !== 'eraser' ? (
              <ActivePreview
                mode={drawingMode as DrawingElementType}
                points={activePoints}
                stroke={drawingColor}
                strokeWidth={drawingStrokeWidth}
              />
            ) : null}
          </g>
        </svg>
      </div>
    </>
  );
}

/* ---- Sub-components ---- */

function ArrowDefs() {
  return (
    <defs>
      <marker
        id="drawing-arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="10"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
      </marker>
    </defs>
  );
}

function DrawingPath({ drawing, highlighted }: { drawing: DrawingElement; highlighted: boolean }) {
  const opacity = drawing.opacity ?? 1;
  const strokeWidth = highlighted ? drawing.strokeWidth + 3 : drawing.strokeWidth;
  const stroke = highlighted ? '#f59e0b' : drawing.stroke;

  switch (drawing.type) {
    case 'freehand': {
      const d = pointsToSmoothPath(drawing.points);
      return (
        <path
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={opacity}
        />
      );
    }
    case 'rect': {
      if (drawing.points.length < 2) return null;
      const rx = Math.min(drawing.points[0][0], drawing.points[1][0]);
      const ry = Math.min(drawing.points[0][1], drawing.points[1][1]);
      const w = Math.abs(drawing.points[1][0] - drawing.points[0][0]);
      const h = Math.abs(drawing.points[1][1] - drawing.points[0][1]);
      return (
        <rect
          x={rx} y={ry} width={w} height={h}
          fill={drawing.fill ?? 'none'}
          stroke={stroke}
          strokeWidth={strokeWidth}
          rx={4}
          opacity={opacity}
        />
      );
    }
    case 'ellipse': {
      if (drawing.points.length < 2) return null;
      const cx = (drawing.points[0][0] + drawing.points[1][0]) / 2;
      const cy = (drawing.points[0][1] + drawing.points[1][1]) / 2;
      const erx = Math.abs(drawing.points[1][0] - drawing.points[0][0]) / 2;
      const ery = Math.abs(drawing.points[1][1] - drawing.points[0][1]) / 2;
      return (
        <ellipse
          cx={cx} cy={cy} rx={erx} ry={ery}
          fill={drawing.fill ?? 'none'}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
        />
      );
    }
    case 'line': {
      if (drawing.points.length < 2) return null;
      return (
        <line
          x1={drawing.points[0][0]} y1={drawing.points[0][1]}
          x2={drawing.points[1][0]} y2={drawing.points[1][1]}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={opacity}
        />
      );
    }
    case 'arrow': {
      if (drawing.points.length < 2) return null;
      return (
        <line
          x1={drawing.points[0][0]} y1={drawing.points[0][1]}
          x2={drawing.points[1][0]} y2={drawing.points[1][1]}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          markerEnd="url(#drawing-arrowhead)"
          style={{ color: stroke }}
          opacity={opacity}
        />
      );
    }
  }
}

function ActivePreview({
  mode,
  points,
  stroke,
  strokeWidth,
}: {
  mode: DrawingElementType;
  points: number[][];
  stroke: string;
  strokeWidth: number;
}) {
  switch (mode) {
    case 'freehand': {
      const d = pointsToSmoothPath(points);
      return (
        <path
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.7}
        />
      );
    }
    case 'rect': {
      if (points.length < 2) return null;
      const px = Math.min(points[0][0], points[1][0]);
      const py = Math.min(points[0][1], points[1][1]);
      const w = Math.abs(points[1][0] - points[0][0]);
      const h = Math.abs(points[1][1] - points[0][1]);
      return (
        <rect
          x={px} y={py} width={w} height={h}
          fill="none" stroke={stroke} strokeWidth={strokeWidth}
          strokeDasharray="6 3" rx={4} opacity={0.7}
        />
      );
    }
    case 'ellipse': {
      if (points.length < 2) return null;
      const cx = (points[0][0] + points[1][0]) / 2;
      const cy = (points[0][1] + points[1][1]) / 2;
      const erx = Math.abs(points[1][0] - points[0][0]) / 2;
      const ery = Math.abs(points[1][1] - points[0][1]) / 2;
      return (
        <ellipse
          cx={cx} cy={cy} rx={erx} ry={ery}
          fill="none" stroke={stroke} strokeWidth={strokeWidth}
          strokeDasharray="6 3" opacity={0.7}
        />
      );
    }
    case 'line': {
      if (points.length < 2) return null;
      return (
        <line
          x1={points[0][0]} y1={points[0][1]}
          x2={points[1][0]} y2={points[1][1]}
          stroke={stroke} strokeWidth={strokeWidth}
          strokeDasharray="6 3" opacity={0.7}
        />
      );
    }
    case 'arrow': {
      if (points.length < 2) return null;
      return (
        <line
          x1={points[0][0]} y1={points[0][1]}
          x2={points[1][0]} y2={points[1][1]}
          stroke={stroke} strokeWidth={strokeWidth}
          strokeDasharray="6 3" markerEnd="url(#drawing-arrowhead)"
          style={{ color: stroke }} opacity={0.7}
        />
      );
    }
  }
}
