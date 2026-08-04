import { useState, useRef, useCallback, useEffect } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import type { BranchToggleNodeData } from '../../../store/diagramStore';
import { useDiagramStore } from '../../../store/diagramStore';

export function BranchToggleNode({ id, data }: NodeProps) {
  const nodeData = data as unknown as BranchToggleNodeData;
  const { presentationMode, toggleBranchCollapsed } = useDiagramStore();
  const { updateNodeData } = useReactFlow();

  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(nodeData.label);
  const labelRef = useRef<HTMLSpanElement>(null);
  const downAt = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { setLabel(nodeData.label); }, [nodeData.label]);

  const collapsed = nodeData.collapsed ?? false;

  // Node stays draggable, so a click that ends a drag must not also toggle.
  const movedSinceDown = (e: React.MouseEvent) => {
    const from = downAt.current;
    downAt.current = null;
    if (!from) return false;
    return Math.abs(e.clientX - from.x) > 3 || Math.abs(e.clientY - from.y) > 3;
  };

  const startEdit = useCallback(() => {
    if (presentationMode) return;
    setEditing(true);
    setTimeout(() => {
      labelRef.current?.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      if (labelRef.current && sel) {
        range.selectNodeContents(labelRef.current);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 10);
  }, [presentationMode]);

  const finishEdit = useCallback(() => {
    setEditing(false);
    const next = labelRef.current?.innerText ?? label;
    setLabel(next);
    updateNodeData(id, { label: next } as Record<string, unknown>);
  }, [id, label, updateNodeData]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finishEdit(); }
    if (e.key === 'Escape') {
      setEditing(false);
      if (labelRef.current) labelRef.current.innerText = label;
    }
    e.stopPropagation();
  }, [finishEdit, label]);

  const handlePositions = [
    { position: Position.Top, id: 'top' },
    { position: Position.Bottom, id: 'bottom' },
    { position: Position.Left, id: 'left' },
    { position: Position.Right, id: 'right' },
  ];

  return (
    <>
      {handlePositions.map(({ position, id: handleId }) => (
        <Handle
          key={handleId}
          type="source"
          position={position}
          id={handleId}
          className="react-flow__handle-custom"
        />
      ))}

      <div
        className="w-full h-full flex items-center justify-center gap-1.5 select-none"
        onMouseDown={(e) => { downAt.current = { x: e.clientX, y: e.clientY }; }}
        onClick={(e) => {
          if (editing) return;
          if (movedSinceDown(e)) return;
          toggleBranchCollapsed(id);
        }}
        onDoubleClick={startEdit}
        title={editing ? undefined : collapsed ? 'Click để mở lại nhánh' : 'Click để thu gọn nhánh · Double-click để đổi tên'}
        style={{
          background: collapsed ? nodeData.collapsedBgColor : nodeData.bgColor,
          color: nodeData.textColor,
          fontSize: nodeData.fontSize,
          fontWeight: 600,
          borderRadius: nodeData.borderRadius,
          border: nodeData.borderWidth > 0
            ? `${nodeData.borderWidth}px solid ${nodeData.borderColor}`
            : undefined,
          padding: '0 12px',
          cursor: editing ? 'text' : 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'background 0.2s ease, transform 0.25s ease',
          transform: (nodeData as { __hovered?: boolean }).__hovered ? 'scale(1.3)' : undefined,
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            flexShrink: 0,
            fontSize: nodeData.fontSize + 3,
            fontWeight: 700,
            lineHeight: 1,
            width: 12,
            textAlign: 'center',
          }}
        >
          {collapsed ? '+' : '−'}
        </span>
        <span
          ref={labelRef}
          contentEditable={editing}
          suppressContentEditableWarning
          onBlur={finishEdit}
          onKeyDown={handleKeyDown}
          className="outline-none"
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            userSelect: editing ? 'text' : 'none',
          }}
        >
          {label}
        </span>
      </div>
    </>
  );
}
