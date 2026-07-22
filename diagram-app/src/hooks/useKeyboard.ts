import { useEffect } from 'react';
import { useDiagramStore } from '../store/diagramStore';
import { useWorkspaceStore } from '../store/workspaceStore';

export function useKeyboard() {
  const { undo, redo, deleteSelected, copySelected, copyToClipboard, pasteFromClipboard, selectAll, presentationMode, nodes, edges } = useDiagramStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      const isEditing = tag === 'input' || tag === 'textarea' || (e.target as HTMLElement).isContentEditable;

      if (isEditing) return;
      if (presentationMode) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        copySelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copyToClipboard();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        pasteFromClipboard();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const { currentFileName, saveFile } = useWorkspaceStore.getState();
        if (currentFileName) saveFile(currentFileName, nodes, edges);
      }
      if (e.key === 'Delete') {
        deleteSelected();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, deleteSelected, copySelected, copyToClipboard, pasteFromClipboard, selectAll, presentationMode, nodes, edges]);
}
