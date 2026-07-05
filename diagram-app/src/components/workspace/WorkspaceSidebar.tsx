import { useState } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useDiagramStore } from '../../store/diagramStore';
import { useReactFlow } from '@xyflow/react';

export function WorkspaceSidebar() {
  const { directoryHandle, files, currentFileName, openWorkspace, closeWorkspace, openFile, createFile } = useWorkspaceStore();
  const { loadState, nodes, edges } = useDiagramStore();
  const { fitView } = useReactFlow();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleOpenFile = async (file: ReturnType<typeof useWorkspaceStore.getState>['files'][0]) => {
    const { saveFile } = useWorkspaceStore.getState();
    // Auto-save current before switching
    if (currentFileName) {
      await saveFile(currentFileName, nodes, edges);
    }
    const result = await openFile(file);
    if (result) {
      loadState(result.nodes as never, result.edges as never);
      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const file = await createFile(newName.trim());
    if (file) {
      loadState([], []);
      setCreating(false);
      setNewName('');
    }
  };

  const handleSaveCurrent = async () => {
    if (!currentFileName) return;
    const { saveFile } = useWorkspaceStore.getState();
    setSaving(true);
    await saveFile(currentFileName, nodes, edges);
    setSaving(false);
  };

  if (!directoryHandle) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 p-4 text-center"
        style={{ width: 220, background: '#f8fafc', borderRight: '1px solid #e2e8f0', minHeight: '100%' }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h8l3 4H30a2.5 2.5 0 0 1 2.5 2.5v15A2.5 2.5 0 0 1 30 30H6.5A2.5 2.5 0 0 1 4 27.5V8.5z" stroke="#94a3b8" strokeWidth="2" />
        </svg>
        <p className="text-xs text-gray-500 leading-relaxed">Open a folder to manage your diagrams</p>
        <button
          onClick={openWorkspace}
          className="px-3 py-1.5 text-xs font-medium text-white rounded transition-colors"
          style={{ background: '#3b82f6' }}
        >
          Open Folder
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{ width: 220, background: '#f8fafc', borderRight: '1px solid #e2e8f0', minHeight: '100%' }}
    >
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M1 4.5V12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5.5a1 1 0 0 0-1-1H7L5.5 3H2a1 1 0 0 0-1 1.5z" stroke="#64748b" strokeWidth="1.4" />
          </svg>
          <span className="text-xs font-semibold text-gray-700 truncate">{directoryHandle.name}</span>
        </div>
        <button onClick={closeWorkspace} title="Close workspace" className="text-gray-400 hover:text-gray-600 shrink-0">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Save current */}
      {currentFileName && (
        <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between gap-2">
          <span className="text-xs text-gray-500 truncate">{currentFileName}</span>
          <button
            onClick={handleSaveCurrent}
            disabled={saving}
            className="text-xs px-2 py-0.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 shrink-0"
          >
            {saving ? '...' : 'Save'}
          </button>
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-4 px-3">No diagram files found</p>
        )}
        {files.map((file) => (
          <button
            key={file.name}
            onClick={() => handleOpenFile(file)}
            className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-100 transition-colors"
            style={{
              background: file.name === currentFileName ? '#eff6ff' : undefined,
              color: file.name === currentFileName ? '#1d4ed8' : '#374151',
              fontWeight: file.name === currentFileName ? 600 : 400,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ shrink: 0 }}>
              <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M3.5 4.5h5M3.5 6.5h5M3.5 8.5h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <span className="truncate">{file.name.replace(/\.json$/, '')}</span>
          </button>
        ))}
      </div>

      {/* New file */}
      <div className="border-t border-gray-200 p-2">
        {creating ? (
          <div className="flex gap-1">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') { setCreating(false); setNewName(''); }
              }}
              placeholder="diagram name"
              className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 min-w-0"
            />
            <button onClick={handleCreate} className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">✓</button>
            <button onClick={() => { setCreating(false); setNewName(''); }} className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100">✕</button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            New Diagram
          </button>
        )}
      </div>
    </div>
  );
}
