import { useState, useRef, useCallback, useEffect } from 'react';
import { Handle, Position, NodeResizer, useReactFlow, type NodeProps } from '@xyflow/react';
import type { RectNodeData } from '../../../store/diagramStore';
import { useDiagramStore } from '../../../store/diagramStore';

export function RectNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as RectNodeData;
  const { presentationMode } = useDiagramStore();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(nodeData.label);
  const textRef = useRef<HTMLDivElement>(null);
  const { updateNodeData } = useReactFlow();

  useEffect(() => {
    setLabel(nodeData.label);
  }, [nodeData.label]);

  const startEdit = useCallback(() => {
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
  }, []);

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

  const borderStyle = {
    backgroundColor: nodeData.bgColor,
    border: `${nodeData.borderWidth}px ${nodeData.borderStyle} ${nodeData.borderColor}`,
    color: nodeData.textColor,
    fontSize: `${nodeData.fontSize}px`,
    borderRadius: `${nodeData.borderRadius ?? 8}px`,
  };

  const handlePositions = [
    { position: Position.Top, id: 'top', style: { top: -5, left: '50%', transform: 'translateX(-50%)' } },
    { position: Position.Bottom, id: 'bottom', style: { bottom: -5, left: '50%', transform: 'translateX(-50%)' } },
    { position: Position.Left, id: 'left', style: { left: -5, top: '50%', transform: 'translateY(-50%)' } },
    { position: Position.Right, id: 'right', style: { right: -5, top: '50%', transform: 'translateY(-50%)' } },
  ];

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={36}
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

      <div
        className="w-full h-full flex items-center justify-center overflow-hidden select-none"
        style={borderStyle}
        onDoubleClick={startEdit}
      >
        <div
          ref={textRef}
          contentEditable={editing}
          suppressContentEditableWarning
          onBlur={finishEdit}
          onKeyDown={handleKeyDown}
          className="w-full h-full flex items-center justify-center text-center px-2 py-1 outline-none leading-tight"
          style={{
            cursor: editing ? 'text' : 'default',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            userSelect: editing ? 'text' : 'none',
          }}
        >
          {label}
        </div>
      </div>

      {/* Presentation order badge */}
      {!presentationMode && nodeData.showAtStep !== undefined && nodeData.showAtStep > 0 && (
        <div
          style={{
            position: 'absolute',
            top: -10,
            right: -10,
            minWidth: 20,
            height: 20,
            borderRadius: 10,
            padding: '0 4px',
            background: '#7c3aed',
            color: 'white',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <span>{nodeData.showAtStep}</span>
          {nodeData.hideAtStep !== undefined && nodeData.hideAtStep > 0 && (
            <span style={{ opacity: 0.7 }}>→{nodeData.hideAtStep}</span>
          )}
        </div>
      )}
    </>
  );
}
