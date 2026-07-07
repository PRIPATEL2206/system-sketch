import type { StateCreator } from 'zustand';
import { pushSnapshot } from '@/store/historySlice';
import type { DrawingSlice, StoreState } from '@/store/types';
import type { DrawingElement, DrawingTool } from '@/types';

export const createDrawingSlice: StateCreator<StoreState, [], [], DrawingSlice> = (
  set,
) => ({
  drawings: [],
  drawingMode: 'none' as DrawingTool,
  drawingColor: '#ef4444',
  drawingStrokeWidth: 3,

  setDrawingMode: (mode) => {
    set({ drawingMode: mode });
  },

  setDrawingColor: (color) => {
    set({ drawingColor: color });
  },

  setDrawingStrokeWidth: (w) => {
    set({ drawingStrokeWidth: w });
  },

  addDrawing: (d: DrawingElement) => {
    set((s) => ({
      ...pushSnapshot(s),
      drawings: [...s.drawings, d],
    }));
  },

  removeDrawing: (id) => {
    set((s) => ({
      ...pushSnapshot(s),
      drawings: s.drawings.filter((d) => d.id !== id),
    }));
  },

  removeDrawings: (ids) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    set((s) => ({
      ...pushSnapshot(s),
      drawings: s.drawings.filter((d) => !idSet.has(d.id)),
    }));
  },

  clearAllDrawings: () => {
    set((s) => ({
      ...pushSnapshot(s),
      drawings: [],
    }));
  },
});
