import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type OnSelectionChangeParams,
  type ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MousePointer2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { nodeTypes } from '@/features/canvas/nodeTypes';
import { defaultEdgeOptions, edgeTypes } from '@/features/canvas/edgeTypes';
import { ContextMenu, type ContextMenuItem } from '@/features/canvas/ContextMenu';
import { FloatingToolbar } from '@/features/canvas/FloatingToolbar';
import { HelpButton } from '@/features/canvas/HelpButton';
import { StatsPill } from '@/features/canvas/StatsPill';
import { SelectionOverlay } from '@/features/selection/SelectionOverlay';
import { DrawingLayer } from '@/features/drawing/DrawingLayer';
import { DrawingOptionsBar } from '@/features/drawing/DrawingOptionsBar';
import { computeFocusSet } from '@/features/selection/focusProjection';
import { expandGroupMoves } from '@/features/groups/groupMovement';
import { createSystemNode } from '@/features/nodes/nodeFactory';
import { createEdgeFromConnection } from '@/features/edges/edgeFactory';
import { useStore } from '@/store';
import type { NodeKind, SystemEdge, SystemNode } from '@/types';

const minimapNodeColor = (n: { data?: { color?: string } }): string =>
  n.data?.color ?? '#94a3b8';

const minimapMaskColor = 'hsl(var(--muted) / 0.6)';

const PRO_OPTIONS = { hideAttribution: true } as const;
const FIT_VIEW_OPTIONS = { padding: 0.2, maxZoom: 1 } as const;
const SNAP_GRID: [number, number] = [16, 16];
const MULTI_SELECTION_KEYS = ['Meta', 'Control', 'Shift'];
const SELECTION_KEY = ['Shift'];

export type SelectionTarget =
  | { kind: 'node'; id: string }
  | { kind: 'edge'; id: string }
  | null;

export const BULK_DELETE_CONFIRM_THRESHOLD = 20;

interface CanvasProps {
  onQuickAdd: () => void;
  onShowShortcuts: () => void;
  onRequestBulkDelete: (count: number) => void;
}

const DND_MIME = 'application/system-sketch-node';

type MenuKind = 'pane' | 'node' | 'edge';
interface MenuState {
  kind: MenuKind;
  position: { x: number; y: number };
  flowPosition: { x: number; y: number };
  targetId?: string;
}

export interface CanvasHandle {
  clientToFlow: (clientX: number, clientY: number) => { x: number; y: number };
}

/** Shallow-equal array compare so id-array selectors don't re-render on identity flips. */
const arraysEqual = (a: readonly string[], b: readonly string[]): boolean => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
};

function CanvasInner({
  exposeRef,
  onQuickAdd,
  onShowShortcuts,
  onRequestBulkDelete,
}: {
  exposeRef: (h: CanvasHandle) => void;
  onQuickAdd: () => void;
  onShowShortcuts: () => void;
  onRequestBulkDelete: (count: number) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rfRef = useRef<ReactFlowInstance | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  // Use shallow array compare so flipping selection doesn't recreate arrays
  // when the underlying ids match — this is the main fix for the loop.
  const selectedNodeIds = useStore(useShallow((s) => s.selectedNodeIds));
  const selectedEdgeIds = useStore(useShallow((s) => s.selectedEdgeIds));

  const setNodes = useStore((s) => s.setNodes);
  const setEdges = useStore((s) => s.setEdges);
  const addNode = useStore((s) => s.addNode);
  const addEdge = useStore((s) => s.addEdge);
  const removeNode = useStore((s) => s.removeNode);
  const removeNodes = useStore((s) => s.removeNodes);
  const removeEdge = useStore((s) => s.removeEdge);
  const setSelection = useStore((s) => s.setSelection);
  const setSelectedIds = useStore((s) => s.setSelectedIds);
  const clearSelection = useStore((s) => s.clearSelection);
  const pushHistory = useStore((s) => s.pushHistory);
  const copySelection = useStore((s) => s.copySelection);
  const cutSelection = useStore((s) => s.cutSelection);
  const pasteAt = useStore((s) => s.pasteAt);
  const duplicateSelection = useStore((s) => s.duplicateSelection);
  const groupSelection = useStore((s) => s.groupSelection);
  const ungroupSelection = useStore((s) => s.ungroupSelection);
  const clipboard = useStore((s) => s.clipboard);

  const [menu, setMenu] = useState<MenuState | null>(null);

  const focusMode = useStore((s) => s.focusMode);
  const drawingMode = useStore((s) => s.drawingMode);
  const isDrawing = drawingMode !== 'none';

  exposeRef({
    clientToFlow: (clientX, clientY) => screenToFlowPosition({ x: clientX, y: clientY }),
  });

  /**
   * Focus mode: dim nodes outside 1-hop of the primary selected node.
   * We apply opacity via `style` on the projected node objects.
   */
  const focusSet = useMemo<Set<string> | null>(() => {
    if (!focusMode) return null;
    const primaryId = selectedNodeIds.length > 0 ? selectedNodeIds[0] : null;
    return computeFocusSet(primaryId, nodes, edges);
  }, [focusMode, selectedNodeIds, nodes, edges]);

  /**
   * Project store selection onto RF nodes/edges. CRITICAL: memoize on
   * (nodes, selectedIds, focusSet) so unrelated re-renders return the SAME
   * array reference.
   */
  const projectedNodes = useMemo<Node[]>(() => {
    const selected = new Set(selectedNodeIds);
    return nodes.map((n) => {
      const isSelected = selected.has(n.id);
      const dimmed = focusSet !== null && !focusSet.has(n.id);
      const base = n as unknown as Node;
      if (!isSelected && !dimmed) return base;
      return {
        ...base,
        ...(isSelected ? { selected: true } : {}),
        ...(dimmed ? { style: { opacity: 0.18, transition: 'opacity 200ms' } } : {}),
      };
    });
  }, [nodes, selectedNodeIds, focusSet]);

  const projectedEdges = useMemo<Edge[]>(() => {
    if (selectedEdgeIds.length === 0) return edges as unknown as Edge[];
    const selected = new Set(selectedEdgeIds);
    return edges.map((e) =>
      selected.has(e.id) ? ({ ...e, selected: true } as unknown as Edge) : (e as unknown as Edge),
    );
  }, [edges, selectedEdgeIds]);

  /* ---------------- Node changes ---------------- */
  const handleNodesChange = useCallback(
    (rawChanges: NodeChange[]) => {
      // Separate select changes — route them to our store, NOT back into
      // setNodes (which would create new object refs and re-trigger RF).
      const selectChanges = rawChanges.filter(
        (c): c is Extract<NodeChange, { type: 'select' }> => c.type === 'select',
      );
      const filtered = rawChanges.filter((c) => c.type !== 'select');

      // Route select changes → our store's selection (single click path).
      if (selectChanges.length > 0) {
        const s = useStore.getState();
        const currentSet = new Set(s.selectedNodeIds);
        let changed = false;
        for (const sc of selectChanges) {
          if (sc.selected && !currentSet.has(sc.id)) {
            currentSet.add(sc.id);
            changed = true;
          } else if (!sc.selected && currentSet.has(sc.id)) {
            currentSet.delete(sc.id);
            changed = true;
          }
        }
        if (changed) {
          s.setSelectedIds(Array.from(currentSet), s.selectedEdgeIds);
        }
      }

      if (filtered.length === 0) return;

      // Mirror moves across group siblings.
      const changes = expandGroupMoves(
        filtered,
        projectedNodes,
        nodes,
        selectedNodeIds,
      );

      const removes = changes.filter(
        (c): c is Extract<NodeChange, { type: 'remove' }> => c.type === 'remove',
      );
      const passthrough = changes.filter((c) => c.type !== 'remove');

      const dropOccurred = passthrough.some(
        (c) => c.type === 'position' && c.dragging === false,
      );
      if (dropOccurred) pushHistory();

      if (passthrough.length > 0) {
        const next = applyNodeChanges(passthrough, projectedNodes);
        setNodes(
          next.map((n) => {
            const { selected: _selected, ...rest } = n as Node & { selected?: boolean };
            return rest as unknown as SystemNode;
          }),
        );
      }

      if (removes.length > 0) {
        if (removes.length === 1) removeNode(removes[0].id);
        else removeNodes(removes.map((r) => r.id));
      }
    },
    [
      nodes,
      projectedNodes,
      pushHistory,
      removeNode,
      removeNodes,
      selectedNodeIds,
      setNodes,
    ],
  );

  /* ---------------- Edge changes ---------------- */
  const handleEdgesChange = useCallback(
    (rawChanges: EdgeChange[]) => {
      // Route edge select changes to our store.
      const selectChanges = rawChanges.filter(
        (c): c is Extract<EdgeChange, { type: 'select' }> => c.type === 'select',
      );
      if (selectChanges.length > 0) {
        const s = useStore.getState();
        const currentSet = new Set(s.selectedEdgeIds);
        let changed = false;
        for (const sc of selectChanges) {
          if (sc.selected && !currentSet.has(sc.id)) {
            currentSet.add(sc.id);
            changed = true;
          } else if (!sc.selected && currentSet.has(sc.id)) {
            currentSet.delete(sc.id);
            changed = true;
          }
        }
        if (changed) {
          s.setSelectedIds(s.selectedNodeIds, Array.from(currentSet));
        }
      }

      const changes = rawChanges.filter((c) => c.type !== 'select');
      if (changes.length === 0) return;

      const removes = changes.filter(
        (c): c is Extract<EdgeChange, { type: 'remove' }> => c.type === 'remove',
      );
      const passthrough = changes.filter((c) => c.type !== 'remove');

      if (passthrough.length > 0) {
        const next = applyEdgeChanges(passthrough, projectedEdges);
        setEdges(
          next.map((e) => {
            const { selected: _selected, ...rest } = e as Edge & { selected?: boolean };
            return rest as unknown as SystemEdge;
          }),
        );
      }

      for (const r of removes) removeEdge(r.id);
    },
    [projectedEdges, removeEdge, setEdges],
  );

  /* ---------------- React Flow → store selection ---------------- */
  // Stable identity — we read fresh ids via getState(), so `useCallback`
  // with no deps is safe and onSelectionChange isn't reinstalled per render.
  const handleSelectionChange = useCallback(
    ({ nodes: rfNodes, edges: rfEdges }: OnSelectionChangeParams) => {
      const nIds = rfNodes.map((n) => n.id);
      const eIds = rfEdges.map((e) => e.id);
      const s = useStore.getState();
      if (
        arraysEqual(nIds, s.selectedNodeIds) &&
        arraysEqual(eIds, s.selectedEdgeIds)
      ) {
        return;
      }
      s.setSelectedIds(nIds, eIds);
    },
    [],
  );

  const handleConnect = useCallback(
    (conn: Connection) => {
      const created = createEdgeFromConnection(conn);
      if (!created) return;
      addEdge(created);
    },
    [addEdge],
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const kind = event.dataTransfer.getData(DND_MIME) as NodeKind | '';
      if (!kind) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNode(createSystemNode(kind, position));
    },
    [addNode, screenToFlowPosition],
  );

  const handlePaneClick = useCallback(() => {
    clearSelection();
    setMenu(null);
  }, [clearSelection]);

  const openContextMenu = useCallback(
    (kind: MenuKind, e: React.MouseEvent, targetId?: string) => {
      e.preventDefault();
      setMenu({
        kind,
        position: { x: e.clientX, y: e.clientY },
        flowPosition: screenToFlowPosition({ x: e.clientX, y: e.clientY }),
        targetId,
      });
    },
    [screenToFlowPosition],
  );

  const closeMenu = useCallback(() => setMenu(null), []);

  /* ---------------- Context menu items per surface ---------------- */
  const buildMenuItems = (m: MenuState): ContextMenuItem[] => {
    const hasClipboard = !!clipboard && clipboard.nodes.length > 0;
    const multi = selectedNodeIds.length;

    if (m.kind === 'node') {
      const items: ContextMenuItem[] = [
        { label: multi > 1 ? `Copy ${multi} nodes` : 'Copy', shortcut: 'Ctrl+C', onSelect: copySelection },
        { label: multi > 1 ? `Cut ${multi} nodes` : 'Cut', shortcut: 'Ctrl+X', onSelect: cutSelection },
        { label: multi > 1 ? `Duplicate ${multi}` : 'Duplicate', shortcut: 'Ctrl+D', onSelect: duplicateSelection },
      ];
      if (multi >= 2) {
        items.push({ separator: true, label: '' });
        items.push({ label: 'Group selection', shortcut: 'Ctrl+G', onSelect: () => groupSelection() });
        items.push({ label: 'Ungroup', shortcut: 'Ctrl+Shift+G', onSelect: ungroupSelection });
      }
      items.push({ separator: true, label: '' });
      items.push({
        label: multi > 1 ? `Delete ${multi}` : 'Delete',
        shortcut: 'Del',
        danger: true,
        onSelect: () => {
          if (multi > BULK_DELETE_CONFIRM_THRESHOLD) {
            onRequestBulkDelete(multi);
          } else if (multi > 1) {
            removeNodes(selectedNodeIds);
          } else if (m.targetId) {
            removeNode(m.targetId);
          }
        },
      });
      return items;
    }

    if (m.kind === 'edge') {
      return [
        {
          label: 'Delete connection',
          shortcut: 'Del',
          danger: true,
          onSelect: () => m.targetId && removeEdge(m.targetId),
        },
      ];
    }

    return [
      {
        label: 'Paste',
        shortcut: 'Ctrl+V',
        disabled: !hasClipboard,
        onSelect: () => pasteAt(m.flowPosition),
      },
      { separator: true, label: '' },
      {
        label: 'Select all',
        shortcut: 'Ctrl+A',
        onSelect: () => useStore.getState().selectAll(),
      },
    ];
  };

  return (
    <div ref={wrapperRef} className="relative h-full w-full">
      <ReactFlow
        nodes={projectedNodes}
        edges={projectedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onPaneClick={handlePaneClick}
        onSelectionChange={handleSelectionChange}
        onPaneContextMenu={(e) => openContextMenu('pane', e as unknown as React.MouseEvent)}
        onNodeContextMenu={(e, n) => {
          if (!selectedNodeIds.includes(n.id)) {
            setSelection({ kind: 'node', id: n.id });
          }
          openContextMenu('node', e, n.id);
        }}
        onEdgeContextMenu={(e, edge) => {
          setSelection({ kind: 'edge', id: edge.id });
          openContextMenu('edge', e, edge.id);
        }}
        onInit={(instance) => {
          rfRef.current = instance;
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        snapToGrid
        snapGrid={SNAP_GRID}
        minZoom={0.2}
        maxZoom={2.5}
        fitView
        fitViewOptions={FIT_VIEW_OPTIONS}
        proOptions={PRO_OPTIONS}
        deleteKeyCode={null}
        multiSelectionKeyCode={MULTI_SELECTION_KEYS}
        selectionKeyCode={SELECTION_KEY}
        panOnDrag={!isDrawing}
        panActivationKeyCode="Space"
        connectionRadius={28}
        connectionMode={ConnectionMode.Loose}
        onlyRenderVisibleElements
        nodesFocusable={false}
        edgesFocusable={false}
        elevateNodesOnSelect={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls position="bottom-right" showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          position="bottom-left"
          maskColor={minimapMaskColor}
          nodeColor={minimapNodeColor}
        />
        {nodes.length === 0 ? (
          <Panel position="top-center" className="pointer-events-none">
            <div className="mt-16 flex flex-col items-center gap-1 rounded-lg border bg-card/80 px-4 py-3 text-center text-muted-foreground shadow-sm backdrop-blur">
              <MousePointer2 className="h-4 w-4" />
              <p className="text-xs">
                Drag a component, press{' '}
                <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">A</kbd>{' '}
                to add, hold{' '}
                <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">Space</kbd>{' '}
                to pan,{' '}
                <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">Shift</kbd>{' '}
                + drag to lasso.
              </p>
            </div>
          </Panel>
        ) : null}
        <SelectionOverlay />
      </ReactFlow>

      <DrawingLayer />

      <FloatingToolbar onQuickAdd={onQuickAdd} />
      <DrawingOptionsBar />
      <HelpButton onClick={onShowShortcuts} />
      <StatsPill />

      {menu ? (
        <ContextMenu
          position={menu.position}
          items={buildMenuItems(menu)}
          onClose={closeMenu}
        />
      ) : null}
    </div>
  );
}

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(function Canvas(props, ref) {
  const innerRef = useRef<CanvasHandle | null>(null);
  useImperativeHandle(ref, () => ({
    clientToFlow: (x, y) =>
      innerRef.current?.clientToFlow(x, y) ?? { x, y },
  }));
  return (
    <ReactFlowProvider>
      <CanvasInner
        exposeRef={(h) => {
          innerRef.current = h;
        }}
        onQuickAdd={props.onQuickAdd}
        onShowShortcuts={props.onShowShortcuts}
        onRequestBulkDelete={props.onRequestBulkDelete}
      />
    </ReactFlowProvider>
  );
});
