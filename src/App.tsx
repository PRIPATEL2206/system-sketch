import { useCallback, useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Canvas, type CanvasHandle } from '@/features/canvas/Canvas';
import { ShortcutsDialog } from '@/features/help/ShortcutsDialog';
import { TemplatesDialog } from '@/features/templates/TemplatesDialog';
import { LeftSidebar } from '@/features/toolbar/LeftSidebar';
import { QuickAddPalette } from '@/features/toolbar/QuickAddPalette';
import { RightSidebar } from '@/features/toolbar/RightSidebar';
import { TopBar } from '@/features/toolbar/TopBar';
import { createSystemNode } from '@/features/nodes/nodeFactory';
import type { NodeCatalogEntry } from '@/features/nodes/nodeCatalog';
import { useCursorPosition } from '@/hooks/useCursorPosition';
import { useEntranceAnimations } from '@/hooks/useEntranceAnimations';
import {
  useKeyboardShortcuts,
  useSpacebarPanMode,
} from '@/hooks/useKeyboardShortcuts';
import { exportImage, saveProjectAsJson } from '@/services/projectActions';
import { useStore } from '@/store';

export default function App() {
  const projectName = useStore((s) => s.projectName);
  const setProjectName = useStore((s) => s.setProjectName);
  const addNode = useStore((s) => s.addNode);
  const nodeCount = useStore((s) => s.nodes.length);

  const canvasRef = useRef<CanvasHandle>(null);
  const cursor = useCursorPosition();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [bulkDelete, setBulkDelete] = useState<{ count: number } | null>(null);

  const handleAddFromSidebar = useCallback(
    (entry: NodeCatalogEntry) => {
      const offset = nodeCount * 24;
      addNode(createSystemNode(entry.kind, { x: 240 + offset, y: 160 + offset }));
    },
    [addNode, nodeCount],
  );

  const handleQuickAddPick = useCallback(
    (entry: NodeCatalogEntry) => {
      const flow = canvasRef.current?.clientToFlow(cursor.current.x, cursor.current.y) ?? {
        x: 280,
        y: 200,
      };
      addNode(createSystemNode(entry.kind, flow));
    },
    [addNode, cursor],
  );

  const resolvePastePosition = useCallback(() => {
    return (
      canvasRef.current?.clientToFlow(cursor.current.x, cursor.current.y) ?? {
        x: 0,
        y: 0,
      }
    );
  }, [cursor]);

  const handleSave = useCallback(() => { saveProjectAsJson(); }, []);
  const handleExport = useCallback(() => { void exportImage('png'); }, []);
  const handleShowShortcuts = useCallback(() => { setShortcutsOpen(true); }, []);
  const handleShowTemplates = useCallback(() => { setTemplatesOpen(true); }, []);
  const handleQuickAdd = useCallback(() => { setPaletteOpen(true); }, []);

  const handleRequestBulkDelete = useCallback((count: number) => {
    setBulkDelete({ count });
    return true;
  }, []);

  const confirmBulkDelete = useCallback(() => {
    const ids = useStore.getState().selectedNodeIds;
    useStore.getState().removeNodes(ids);
  }, []);

  useKeyboardShortcuts({
    onQuickAdd: handleQuickAdd,
    onSave: handleSave,
    onExport: handleExport,
    onShowShortcuts: handleShowShortcuts,
    onShowTemplates: handleShowTemplates,
    onRequestBulkDelete: handleRequestBulkDelete,
    resolvePastePosition,
  });
  useSpacebarPanMode();
  useEntranceAnimations();

  return (
    <div className="flex h-full w-full flex-col">
      <TopBar
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onShowShortcuts={handleShowShortcuts}
        onShowTemplates={handleShowTemplates}
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar onAddNode={handleAddFromSidebar} />
        <div className="relative flex-1">
          <Canvas
            ref={canvasRef}
            onQuickAdd={handleQuickAdd}
            onShowShortcuts={handleShowShortcuts}
            onRequestBulkDelete={(count) => setBulkDelete({ count })}
          />
        </div>
        <RightSidebar onRequestBulkDelete={(count) => setBulkDelete({ count })} />
      </div>

      <QuickAddPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onPick={handleQuickAddPick}
      />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <TemplatesDialog open={templatesOpen} onOpenChange={setTemplatesOpen} />
      <ConfirmDialog
        open={bulkDelete !== null}
        onOpenChange={(open) => !open && setBulkDelete(null)}
        title="Delete a lot of nodes?"
        description={
          bulkDelete
            ? `This will permanently remove ${bulkDelete.count} nodes and any edges connected to them. You can still undo with Ctrl+Z.`
            : ''
        }
        confirmLabel={bulkDelete ? `Delete ${bulkDelete.count}` : 'Delete'}
        destructive
        onConfirm={confirmBulkDelete}
      />
    </div>
  );
}
