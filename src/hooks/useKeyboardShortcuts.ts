import { useEffect } from 'react';
import { useStore } from '@/store';

function isEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

interface ShortcutBindings {
  onQuickAdd: () => void;
  onSave: () => void;
  onExport: () => void;
  onShowShortcuts: () => void;
  onShowTemplates: () => void;
  /** Called instead of immediate delete when selection is large. */
  onRequestBulkDelete: (count: number) => boolean;
  resolvePastePosition: () => { x: number; y: number };
}

export function useKeyboardShortcuts({
  onQuickAdd,
  onSave,
  onExport,
  onShowShortcuts,
  onShowTemplates,
  onRequestBulkDelete,
  resolvePastePosition,
}: ShortcutBindings) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const editing = isEditingTarget(e.target);
      const meta = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (key === 'escape') {
        useStore.getState().clearSelection();
        return;
      }

      if (meta) {
        switch (key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) useStore.getState().redo();
            else useStore.getState().undo();
            return;
          case 'y':
            e.preventDefault();
            useStore.getState().redo();
            return;
          case 'a':
            if (editing) return; // let the browser handle text select-all
            e.preventDefault();
            useStore.getState().selectAll();
            return;
          case 'c':
            if (editing) return;
            e.preventDefault();
            useStore.getState().copySelection();
            return;
          case 'x':
            if (editing) return;
            e.preventDefault();
            useStore.getState().cutSelection();
            return;
          case 'v':
            if (editing) return;
            e.preventDefault();
            useStore.getState().pasteAt(resolvePastePosition());
            return;
          case 'd':
            if (editing) return;
            e.preventDefault();
            useStore.getState().duplicateSelection();
            return;
          case 'g':
            if (editing) return;
            e.preventDefault();
            if (e.shiftKey) useStore.getState().ungroupSelection();
            else useStore.getState().groupSelection();
            return;
          case 's':
            e.preventDefault();
            onSave();
            return;
          case 'e':
            e.preventDefault();
            onExport();
            return;
        }
        return;
      }

      if (editing) return;

      switch (key) {
        case 'delete':
        case 'backspace':
          e.preventDefault();
          {
            const s = useStore.getState();
            const count = s.selectedNodeIds.length;
            if (count > 20 && onRequestBulkDelete(count)) return; // confirm flow
            s.deleteSelection();
          }
          return;
        case 'a':
          if (e.shiftKey) return;
          e.preventDefault();
          onQuickAdd();
          return;
        case 'f':
          e.preventDefault();
          useStore.getState().toggleFocusMode();
          return;
        case 't':
          e.preventDefault();
          onShowTemplates();
          return;
        case '?':
          e.preventDefault();
          onShowShortcuts();
          return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    onQuickAdd,
    onSave,
    onExport,
    onShowShortcuts,
    onShowTemplates,
    onRequestBulkDelete,
    resolvePastePosition,
  ]);
}

export function useSpacebarPanMode() {
  useEffect(() => {
    let active = false;
    const enter = () => {
      if (active) return;
      active = true;
      document.body.classList.add('panning');
    };
    const exit = () => {
      if (!active) return;
      active = false;
      document.body.classList.remove('panning');
    };
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      if (isEditingTarget(e.target)) return;
      e.preventDefault();
      enter();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      exit();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', exit);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', exit);
      exit();
    };
  }, []);
}
