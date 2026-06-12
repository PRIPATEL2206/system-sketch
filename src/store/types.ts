import type { SelectionTarget } from '@/features/canvas/Canvas';
import type {
  ProjectMetadata,
  SystemEdge,
  SystemEdgeData,
  SystemNode,
  SystemNodeData,
  SystemNodeGroup,
} from '@/types';

export interface HistorySnapshot {
  nodes: SystemNode[];
  edges: SystemEdge[];
  groups: SystemNodeGroup[];
}

export interface ClipboardPayload {
  nodes: SystemNode[];
  edges: SystemEdge[];
  /** Groups whose membership is fully contained in the copied set. */
  groups: SystemNodeGroup[];
}

export interface CanvasSlice {
  projectName: string;
  metadata: ProjectMetadata;
  setProjectName: (name: string) => void;
  hydrate: (snapshot: {
    nodes: SystemNode[];
    edges: SystemEdge[];
    groups?: SystemNodeGroup[];
    projectName?: string;
  }) => void;
}

export interface NodeSlice {
  nodes: SystemNode[];
  setNodes: (next: SystemNode[]) => void;
  addNode: (node: SystemNode) => void;
  patchNode: (id: string, patch: Partial<SystemNodeData>) => void;
  patchNodeCoalesced: (id: string, patch: Partial<SystemNodeData>) => void;
  /** Apply the same patch to every id in `ids` in one history entry. */
  bulkPatchNodes: (ids: readonly string[], patch: Partial<SystemNodeData>) => void;
  /** Replace nodes by id with their updated counterparts (one history entry). */
  bulkUpdateNodes: (
    updater: (n: SystemNode) => SystemNode | null,
    matchedIds: readonly string[],
  ) => void;
  removeNode: (id: string) => void;
  /** Delete many nodes (and their edges, group cleanup) atomically. */
  removeNodes: (ids: readonly string[]) => void;
}

export interface EdgeSlice {
  edges: SystemEdge[];
  setEdges: (next: SystemEdge[]) => void;
  addEdge: (edge: SystemEdge) => void;
  patchEdge: (
    id: string,
    patch: Partial<SystemEdge> & { data?: Partial<SystemEdgeData> },
  ) => void;
  patchEdgeCoalesced: (
    id: string,
    patch: Partial<SystemEdge> & { data?: Partial<SystemEdgeData> },
  ) => void;
  removeEdge: (id: string) => void;
}

/**
 * Selection state.
 * - `selection` (legacy): the *primary* selection target — kept so all
 *   existing single-selection consumers (right sidebar property editor,
 *   selectors) keep working without rewrites.
 * - `selectedNodeIds` / `selectedEdgeIds`: the full multi-selection.
 *   Always a superset that includes `selection` when it's set.
 */
export interface SelectionSlice {
  selection: SelectionTarget;
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  selectionBox: { startX: number; startY: number; endX: number; endY: number } | null;
  /** Focus mode — dims everything except the focused node + 1-hop neighbors. */
  focusMode: boolean;
  setSelection: (next: SelectionTarget) => void;
  setSelectedIds: (nodeIds: string[], edgeIds: string[]) => void;
  addToSelection: (nodeIds: string[], edgeIds?: string[]) => void;
  removeFromSelection: (nodeIds: string[], edgeIds?: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;
  setSelectionBox: (box: SelectionSlice['selectionBox']) => void;
  toggleFocusMode: () => void;
}

export interface HistorySlice {
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  resetHistory: () => void;
}

export interface ClipboardSlice {
  clipboard: ClipboardPayload | null;
  copySelection: () => void;
  cutSelection: () => void;
  pasteAt: (position: { x: number; y: number }) => void;
  duplicateSelection: () => void;
  deleteSelection: () => void;
}

export interface GroupSlice {
  groups: SystemNodeGroup[];
  /** Group the current node selection (no-op if <2 nodes selected). */
  groupSelection: () => string | null;
  /** Ungroup every group whose nodes are part of the current selection. */
  ungroupSelection: () => void;
  /** Toggle collapse state of a group. */
  toggleGroupCollapsed: (groupId: string) => void;
  /** Patch label/color of a group. */
  patchGroup: (
    groupId: string,
    patch: Partial<Pick<SystemNodeGroup, 'label' | 'color'>>,
  ) => void;
  /** Remove the group object (does not delete the nodes). */
  removeGroup: (groupId: string) => void;
}

export type StoreState = CanvasSlice &
  NodeSlice &
  EdgeSlice &
  SelectionSlice &
  HistorySlice &
  ClipboardSlice &
  GroupSlice;
