import type { StateCreator } from 'zustand';
import { flushCoalesce } from '@/store/coalesce';
import type { CanvasSlice, StoreState } from '@/store/types';
import type { ProjectMetadata } from '@/types';

const ISO_PLACEHOLDER = '1970-01-01T00:00:00.000Z';

export function makeMetadata(name: string): ProjectMetadata {
  return {
    name,
    description: '',
    createdAt: ISO_PLACEHOLDER,
    updatedAt: ISO_PLACEHOLDER,
    version: 2,
  };
}

export const createCanvasSlice: StateCreator<StoreState, [], [], CanvasSlice> = (set) => ({
  projectName: 'Untitled system',
  metadata: makeMetadata('Untitled system'),

  setProjectName: (name) => {
    set((s) => ({
      projectName: name,
      metadata: { ...s.metadata, name },
    }));
  },

  hydrate: ({ nodes, edges, groups, projectName }) => {
    flushCoalesce();
    set((s) => ({
      nodes,
      edges,
      groups: groups ?? [],
      projectName: projectName ?? s.projectName,
      metadata: { ...s.metadata, name: projectName ?? s.metadata.name },
      selection: null,
      selectedNodeIds: [],
      selectedEdgeIds: [],
      selectionBox: null,
      past: [],
      future: [],
    }));
  },
});
