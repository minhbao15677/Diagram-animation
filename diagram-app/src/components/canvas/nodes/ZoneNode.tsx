import { useState, useRef, useCallback, useEffect } from 'react';
import { Handle, Position, NodeResizer, useReactFlow, type NodeProps } from '@xyflow/react';
import type { ZoneNodeData } from '../../../store/diagramStore';
import { useDiagramStore } from '../../../store/diagramStore';

export function ZoneNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as ZoneNodeData;
  const { presentationMode } = useDiagramStore();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(nodeData.label);
  const textRef = useRef<HTMLDivElement>(null);
  const { updateNodeData } = useReactFlow();

  useEffect(() => {
    setLabel(nodeData.label);
  }, [nodeData.label]);

  const startEdit = useCallback(() => {
    if (presentationMode) return;
    setEditing(true);
    setTimeout(() => {
      textRef.current?.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      if (textRef.current && sel) {
        range.selectNodeContents(textRef.current);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 10);
  }, [presentationMode]);

  const finishEdit = useCallback(() => {
    setEditing(false);
    const newLabel = textRef.current?.innerText ?? label;
    setLabel(newLabel);
    updateNodeData(id, { label: newLabel } as Record<string, unknown>);
  }, [id, label, updateNodeData]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        finishEdit();
      }
      if (e.key === 'Escape') {
        setEditing(false);
        if (textRef.current) textRef.current.innerText = label;
      }
      e.stopPropagation();
    },
    [finishEdit, label]
  );

  const handlePositions = [
    { position: Position.Top, id: 'top' },
    { position: Position.Bottom, id: 'bottom' },
    { position: Position.Left, id: 'left' },
    { position: Position.Right, id: 'right' },
  ];

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={40}
        minHeight={30}
        handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
        lineStyle={{ borderColor: '#3b82f6', borderWidth: 1 }}
      />

      {handlePositions.map(({ position, id: handleId }) => (
        <Handle
          key={handleId}
          type="source"
          position={position}
          id={handleId}
          className="react-flow__handle-custom"
        />
      ))}

      {/* Fill + border — whole surface is a drag handle. Inner nodes render above
          the zone (zone has zIndex -1), so they stay clickable; the zone only
          catches clicks on empty space inside it. */}
      <div
        className="zone-drag-handle w-full h-full overflow-hidden"
        style={{
          backgroundColor: nodeData.bgColor,
          border: `${nodeData.borderWidth}px ${nodeData.borderStyle} ${nodeData.borderColor}`,
          borderRadius: `${nodeData.borderRadius ?? 8}px`,
          boxSizing: 'border-box',
          cursor: 'move',
          transform: (nodeData as { __hovered?: boolean }).__hovered ? 'scale(1.3)' : undefined,
          transition: 'transform 0.25s ease',
        }}
      />

      {/* Label chip */}
      <div
        className="zone-drag-handle absolute select-none"
        style={{
          top: 6,
          left: 8,
          padding: '2px 8px',
          borderRadius: 4,
          background: nodeData.labelBgColor,
          color: nodeData.textColor,
          fontSize: `${nodeData.fontSize}px`,
          fontWeight: 600,
          maxWidth: 'calc(100% - 16px)',
          cursor: editing ? 'text' : 'move',
        }}
        onDoubleClick={startEdit}
      >
        <div
          ref={textRef}
          contentEditable={editing}
          suppressContentEditableWarning
          onBlur={finishEdit}
          onKeyDown={handleKeyDown}
          className="outline-none leading-tight"
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            userSelect: editing ? 'text' : 'none',
          }}
        >
          {label}
        </div>
      </div>

    </>
  );
}
