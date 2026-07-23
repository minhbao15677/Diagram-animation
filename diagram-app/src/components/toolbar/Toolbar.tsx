import { useCallback, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useDiagramStore } from '../../store/diagramStore';
import { toPng, toSvg } from 'html-to-image';

export function Toolbar() {
  const { addNode, undo, redo, history, historyIndex, copySelected, selectedNodes, enterPresentation, nodes, edges, loadState, addLabeledBoxNode, addZoneNode, addTableNode, addTextBoxNode, clearAllSteps } = useDiagramStore();
  const { fitView, getViewport } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(() => {
    const data = JSON.stringify({ version: 1, nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleOpen = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.nodes && parsed.edges) {
          loadState(parsed.nodes, parsed.edges);
          setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
        }
      } catch {
        alert('Invalid diagram file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [loadState, fitView]);

  const handleAddLabeledBox = useCallback(() => {
    const { x, y, zoom } = getViewport();
    const canvasX = (-x + window.innerWidth / 2) / zoom;
    const canvasY = (-y + window.innerHeight / 2) / zoom;
    addLabeledBoxNode({ x: canvasX - 80 + (Math.random() - 0.5) * 80, y: canvasY - 50 + (Math.random() - 0.5) * 80 });
  }, [addLabeledBoxNode, getViewport]);

  const handleAddNode = useCallback(() => {
    const { x, y, zoom } = getViewport();
    const canvasX = (-x + window.innerWidth / 2) / zoom;
    const canvasY = (-y + window.innerHeight / 2) / zoom;
    addNode({ x: canvasX - 70 + (Math.random() - 0.5) * 80, y: canvasY - 30 + (Math.random() - 0.5) * 80 });
  }, [addNode, getViewport]);

  const handleAddZone = useCallback(() => {
    const { x, y, zoom } = getViewport();
    const canvasX = (-x + window.innerWidth / 2) / zoom;
    const canvasY = (-y + window.innerHeight / 2) / zoom;
    addZoneNode({ x: canvasX - 140, y: canvasY - 100 });
  }, [addZoneNode, getViewport]);

  const handleAddTable = useCallback(() => {
    const { x, y, zoom } = getViewport();
    const canvasX = (-x + window.innerWidth / 2) / zoom;
    const canvasY = (-y + window.innerHeight / 2) / zoom;
    addTableNode({ x: canvasX - 120, y: canvasY - 40 });
  }, [addTableNode, getViewport]);

  const handleAddTextBox = useCallback(() => {
    const { x, y, zoom } = getViewport();
    const canvasX = (-x + window.innerWidth / 2) / zoom;
    const canvasY = (-y + window.innerHeight / 2) / zoom;
    addTextBoxNode({ x: canvasX - 110 + (Math.random() - 0.5) * 80, y: canvasY - 60 + (Math.random() - 0.5) * 80 });
  }, [addTextBoxNode, getViewport]);

  const handleExportPng = useCallback(async () => {
    const el = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!el) return;
    try {
      const dataUrl = await toPng(el, { backgroundColor: '#f0f2f5', quality: 1, pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'diagram.png';
      a.click();
    } catch (e) {
      console.error('Export PNG failed', e);
    }
  }, []);

  const handleExportSvg = useCallback(async () => {
    const el = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!el) return;
    try {
      const dataUrl = await toSvg(el, { backgroundColor: '#f0f2f5' });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'diagram.svg';
      a.click();
    } catch (e) {
      console.error('Export SVG failed', e);
    }
  }, []);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  const stepCount = [...nodes, ...edges].filter((el) => {
    const s = (el.data as Record<string, unknown>)?.showAtStep as number | undefined;
    return s !== undefined && s > 0;
  }).length;

  const handleClearSteps = useCallback(() => {
    if (window.confirm('Xóa toàn bộ thứ tự hiển thị của sơ đồ?')) {
      clearAllSteps();
    }
  }, [clearAllSteps]);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="0.5" fill="white" />
            <rect x="8" y="1" width="5" height="5" rx="0.5" fill="white" />
            <rect x="1" y="8" width="5" height="5" rx="0.5" fill="white" />
            <rect x="8" y="8" width="5" height="5" rx="0.5" fill="white" />
          </svg>
        </div>
        <span className="font-semibold text-gray-800 text-sm">DiagramApp</span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Add node */}
      <button
        onClick={handleAddNode}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors font-medium"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Add Box
      </button>

      <button
        onClick={handleAddLabeledBox}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors font-medium text-white"
        style={{ background: '#0ea5e9' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#0284c7'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#0ea5e9'; }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="12" height="12" rx="1.5" stroke="white" strokeWidth="1.5" />
          <rect x="1" y="1" width="12" height="4.5" rx="1.5" fill="white" fillOpacity="0.4" />
          <path d="M4 2.5h6" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M3 8h8M3 10.5h5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        Add Labeled Box
      </button>

      <button
        onClick={handleAddZone}
        title="Add dashed zone rectangle"
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors font-medium text-white"
        style={{ background: '#8b5cf6' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#7c3aed'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#8b5cf6'; }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="12" height="12" rx="1.5" stroke="white" strokeWidth="1.5" strokeDasharray="2.5 2" />
        </svg>
        Add Zone
      </button>

      <button
        onClick={handleAddTable}
        title="Add table (editable rows & columns)"
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors font-medium text-white"
        style={{ background: '#0d9488' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#0f766e'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#0d9488'; }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="12" height="12" rx="1.5" stroke="white" strokeWidth="1.5" />
          <path d="M1 5h12M1 9h12M5 1v12M9 1v12" stroke="white" strokeWidth="1.2" />
        </svg>
        Add Table
      </button>

      <button
        onClick={handleAddTextBox}
        title="Add text box (multiline, monospace font)"
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors font-medium text-white"
        style={{ background: '#64748b' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#475569'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#64748b'; }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="12" height="12" rx="1.5" stroke="white" strokeWidth="1.5" />
          <path d="M3.5 4h7M3.5 6.5h7M3.5 9h5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        Add Text Box
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Undo/Redo */}
      <button
        onClick={undo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 6H9.5a4 4 0 0 1 0 8H5" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M3 6L6 3M3 6L6 9" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13 6H6.5a4 4 0 0 0 0 8H11" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M13 6L10 3M13 6L10 9" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Duplicate */}
      <button
        onClick={copySelected}
        disabled={selectedNodes.length === 0}
        title="Duplicate selected (Ctrl+D)"
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="4" width="8" height="9" rx="1" stroke="#374151" strokeWidth="1.5" />
          <path d="M4 4V2.5A1.5 1.5 0 0 1 5.5 1h7A1.5 1.5 0 0 1 14 2.5v7A1.5 1.5 0 0 1 12.5 11H11" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Duplicate
      </button>

      {/* Fit view */}
      <button
        onClick={() => fitView({ padding: 0.1, duration: 300 })}
        title="Fit to screen"
        className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M1 5V2h3M12 2h3v3M15 11v3h-3M4 14H1v-3" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="5" y="5" width="6" height="6" rx="0.5" stroke="#374151" strokeWidth="1" strokeDasharray="2 1" />
        </svg>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Keyboard hint */}
      <span className="text-xs text-gray-400 mr-2">
        Double-click to edit · Ctrl+D duplicate · Del to delete
      </span>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Clear presentation order */}
      <button
        onClick={handleClearSteps}
        disabled={stepCount === 0}
        title="Xóa toàn bộ thứ tự hiển thị"
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="#374151" strokeWidth="1.5" />
          <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Clear thứ tự{stepCount > 0 ? ` (${stepCount})` : ''}
      </button>

      {/* Present */}
      <button
        onClick={enterPresentation}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded transition-colors"
        style={{ background: '#7c3aed' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#6d28d9'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#7c3aed'; }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="12" height="9" rx="1.5" stroke="white" strokeWidth="1.5" />
          <path d="M5 10v3M9 10v3M3 13h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M5.5 4.5l4 2-4 2V4.5z" fill="white" />
        </svg>
        Present
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Save / Open */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleOpen}
        style={{ display: 'none' }}
      />
      <button
        onClick={handleSave}
        title="Save diagram as JSON"
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2h8l2 2v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2z" stroke="#374151" strokeWidth="1.5" />
          <rect x="4" y="2" width="6" height="3.5" rx="0.5" stroke="#374151" strokeWidth="1.2" />
          <rect x="3.5" y="7" width="7" height="4" rx="0.5" stroke="#374151" strokeWidth="1.2" />
        </svg>
        Save
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        title="Open diagram from JSON"
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 4.5V12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5.5a1 1 0 0 0-1-1H7L5.5 3H2a1 1 0 0 0-1 1.5z" stroke="#374151" strokeWidth="1.5" />
        </svg>
        Open
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Export */}
      <button
        onClick={handleExportPng}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v8M4 6l3 3 3-3" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 10v2h10v-2" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        PNG
      </button>
      <button
        onClick={handleExportSvg}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v8M4 6l3 3 3-3" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 10v2h10v-2" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        SVG
      </button>
    </div>
  );
}
