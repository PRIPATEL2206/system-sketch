import { useStore } from '@/store';
import {
  ProjectIOError,
  downloadJson,
  parseProjectJson,
  readFileAsText,
  serializeProject,
} from '@/services/projectIO';
import {
  exportAsPdf,
  exportAsPng,
  exportAsSvg,
} from '@/services/exporters';

/** Slugify a project name into a safe filename stem. */
function slugify(name: string): string {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return base || 'system-sketch';
}

export type ImageFormat = 'png' | 'svg' | 'pdf';

/**
 * Save the current project as JSON. Used by the toolbar and Ctrl+S.
 * Returns the filename used, or null if there was nothing to save.
 */
export function saveProjectAsJson(): string | null {
  const s = useStore.getState();
  const config = serializeProject({
    projectName: s.projectName,
    nodes: s.nodes,
    edges: s.edges,
    groups: s.groups,
  });
  const filename = `${slugify(s.projectName)}.json`;
  downloadJson(filename, config);
  return filename;
}

export async function importProjectFromFile(file: File): Promise<void> {
  const text = await readFileAsText(file);
  const config = parseProjectJson(text);
  useStore.getState().hydrate({
    nodes: config.nodes,
    edges: config.edges,
    groups: config.groups,
    projectName: config.metadata.name,
  });
}

/** Export the current canvas as PNG, SVG, or PDF. */
export async function exportImage(format: ImageFormat): Promise<string> {
  const s = useStore.getState();
  const stem = slugify(s.projectName);
  const filename = `${stem}.${format}`;
  const opts = { nodes: s.nodes, padding: 32, pixelRatio: 2 };
  switch (format) {
    case 'png':
      await exportAsPng(filename, opts);
      break;
    case 'svg':
      await exportAsSvg(filename, opts);
      break;
    case 'pdf':
      await exportAsPdf(filename, opts);
      break;
  }
  return filename;
}

export { ProjectIOError };
