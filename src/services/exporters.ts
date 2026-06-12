import { toPng, toSvg } from 'html-to-image';
import jsPDF from 'jspdf';
import { getNodesBounds, getViewportForBounds, type Node } from 'reactflow';
import type { SystemNode } from '@/types';

/* -------------------------------------------------------------------- */
/* Capture target                                                       */
/* -------------------------------------------------------------------- */

/**
 * The on-screen element we screenshot. Capturing the whole `.react-flow`
 * wrapper bakes in the controls/minimap; capturing `.react-flow__viewport`
 * gives us just the diagram. We pick the viewport for clean exports and
 * temporarily reset its transform so the full graph fits in the frame.
 */
function findViewport(): HTMLElement {
  const el = document.querySelector<HTMLElement>('.react-flow__viewport');
  if (!el) throw new Error('Canvas not mounted — nothing to export.');
  return el;
}

interface CaptureOptions {
  nodes: SystemNode[];
  /** Padding around the bounds in flow units. */
  padding?: number;
  /** Pixel ratio (DPI multiplier) for raster captures. */
  pixelRatio?: number;
  /** Background color for raster captures. SVG/PDF use this too. */
  background?: string;
}

interface CaptureFrame {
  /** Pixel size of the output image. */
  width: number;
  height: number;
  /** Inverse transform we restore after capture. */
  restore: () => void;
}

/**
 * Move and scale the React Flow viewport so the bounding box of `nodes`
 * fits exactly into the capture frame. We mutate the live DOM transform,
 * snapshot, then restore — no React state involved, no flicker because
 * html-to-image clones the DOM synchronously on capture.
 */
function frameViewportToNodes(opts: CaptureOptions): CaptureFrame {
  const viewport = findViewport();
  const wrapper = viewport.parentElement as HTMLElement | null;
  if (!wrapper) throw new Error('React Flow wrapper missing — cannot export.');

  if (opts.nodes.length === 0) {
    // No nodes — capture the visible viewport at its current transform.
    const w = wrapper.clientWidth || 1200;
    const h = wrapper.clientHeight || 800;
    return { width: w, height: h, restore: () => {} };
  }

  const padding = opts.padding ?? 32;
  const bounds = getNodesBounds(opts.nodes as unknown as Node[]);

  // Output frame: bounds + padding, snapped to whole pixels.
  const width = Math.max(1, Math.round(bounds.width + padding * 2));
  const height = Math.max(1, Math.round(bounds.height + padding * 2));

  // Compute a transform such that bounds (with padding) maps to (0,0,width,height)
  // at zoom = 1 (so text/strokes export crisply, with `pixelRatio` handling DPI).
  const vp = getViewportForBounds(bounds, width, height, 1, 1, padding);

  const prev = viewport.style.transform;
  viewport.style.transform = `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`;

  return {
    width,
    height,
    restore: () => {
      viewport.style.transform = prev;
    },
  };
}

/* -------------------------------------------------------------------- */
/* Common helpers                                                       */
/* -------------------------------------------------------------------- */

function triggerDownload(href: string, filename: string): void {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function htmlToImageOptions(width: number, height: number, opts: CaptureOptions) {
  const background = opts.background ?? '#ffffff';
  return {
    width,
    height,
    pixelRatio: opts.pixelRatio ?? 2,
    backgroundColor: background,
    cacheBust: true,
    // Skip elements we don't want in the export (controls/minimap/panel).
    filter: (node: HTMLElement) => {
      if (!(node instanceof HTMLElement)) return true;
      if (node.classList?.contains('react-flow__controls')) return false;
      if (node.classList?.contains('react-flow__minimap')) return false;
      if (node.classList?.contains('react-flow__panel')) return false;
      return true;
    },
  };
}

/* -------------------------------------------------------------------- */
/* PNG                                                                  */
/* -------------------------------------------------------------------- */

export async function exportAsPng(
  filename: string,
  opts: CaptureOptions,
): Promise<void> {
  const viewport = findViewport();
  const frame = frameViewportToNodes(opts);
  try {
    const dataUrl = await toPng(viewport, htmlToImageOptions(frame.width, frame.height, opts));
    triggerDownload(dataUrl, filename);
  } finally {
    frame.restore();
  }
}

/* -------------------------------------------------------------------- */
/* SVG                                                                  */
/* -------------------------------------------------------------------- */

export async function exportAsSvg(
  filename: string,
  opts: CaptureOptions,
): Promise<void> {
  const viewport = findViewport();
  const frame = frameViewportToNodes(opts);
  try {
    const dataUrl = await toSvg(viewport, htmlToImageOptions(frame.width, frame.height, opts));
    triggerDownload(dataUrl, filename);
  } finally {
    frame.restore();
  }
}

/* -------------------------------------------------------------------- */
/* PDF                                                                  */
/* -------------------------------------------------------------------- */

/**
 * PDF export = render to PNG, then place inside a single-page jsPDF
 * document sized to fit the image. Landscape/portrait is auto-chosen.
 */
export async function exportAsPdf(
  filename: string,
  opts: CaptureOptions,
): Promise<void> {
  const viewport = findViewport();
  const frame = frameViewportToNodes(opts);
  try {
    const dataUrl = await toPng(viewport, htmlToImageOptions(frame.width, frame.height, opts));
    const orientation = frame.width >= frame.height ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
      orientation,
      unit: 'pt',
      // jsPDF expects [width, height]; we feed it the captured frame size
      // so the image fills the page edge-to-edge with no scaling artifacts.
      format: [frame.width, frame.height],
      compress: true,
    });
    pdf.addImage(dataUrl, 'PNG', 0, 0, frame.width, frame.height, undefined, 'FAST');
    pdf.save(filename);
  } finally {
    frame.restore();
  }
}
