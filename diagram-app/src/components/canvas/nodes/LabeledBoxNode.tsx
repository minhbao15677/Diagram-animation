import { useState, useRef, useCallback, useEffect } from 'react';
import { Handle, Position, NodeResizer, useReactFlow, type NodeProps } from '@xyflow/react';
import type { LabeledBoxNodeData } from '../../../store/diagramStore';
import { useDiagramStore } from '../../../store/diagramStore';

export function LabeledBoxNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as LabeledBoxNodeData;
  const { presentationMode } = useDiagramStore();
  const { updateNodeData } = useReactFlow();

  const [editingLabel, setEditingLabel] = useState(false);
  const [editingBody, setEditingBody] = useState(false);
  const [label, setLabel] = useState(nodeData.label);
  const [bodyText, setBodyText] = useState(nodeData.bodyText);
  const labelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setLabel(nodeData.label); }, [nodeData.label]);
  useEffect(() => { setBodyText(nodeData.bodyText); }, [nodeData.bodyText]);

  const startEditLabel = useCallback(() => {
    if (presentationMode) return;
    setEditingLabel(true);
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

  const finishEditLabel = useCallback(() => {
    setEditingLabel(false);
    const newLabel = labelRef.current?.innerText ?? label;
    setLabel(newLabel);
    updateNodeData(id, { label: newLabel } as Record<string, unknown>);
  }, [id, label, updateNodeData]);

  const startEditBody = useCallback(() => {
    if (presentationMode) return;
    setEditingBody(true);
    setTimeout(() => {
      bodyRef.current?.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      if (bodyRef.current && sel) {
        range.selectNodeContents(bodyRef.current);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 10);
  }, [presentationMode]);

  const finishEditBody = useCallback(() => {
    setEditingBody(false);
    const newBody = bodyRef.current?.innerText ?? bodyText;
    setBodyText(newBody);
    updateNodeData(id, { bodyText: newBody } as Record<string, unknown>);
  }, [id, bodyText, updateNodeData]);

  const handleLabelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finishEditLabel(); }
    if (e.key === 'Escape') {
      setEditingLabel(false);
      if (labelRef.current) labelRef.current.innerText = label;
    }
    e.stopPropagation();
  }, [finishEditLabel, label]);

  const handleBodyKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditingBody(false);
      if (bodyRef.current) bodyRef.current.innerText = bodyText;
    }
    e.stopPropagation();
  }, [bodyText]);

  const radius = nodeData.borderRadius ?? 8;

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
        minWidth={100}
        minHeight={70}
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
        className="w-full h-full flex flex-col overflow-hidden select-none"
        style={{
          border: `${nodeData.borderWidth}px ${nodeData.borderStyle} ${nodeData.borderColor}`,
          borderRadius: radius,
          backgroundColor: nodeData.bgColor,
          transform: (nodeData as { __hovered?: boolean }).__hovered ? 'scale(1.3)' : undefined,
          transition: 'transform 0.25s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: nodeData.headerBgColor,
            borderRadius: `${Math.max(0, radius - nodeData.borderWidth)}px ${Math.max(0, radius - nodeData.borderWidth)}px 0 0`,
            padding: '4px 8px',
            minHeight: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onDoubleClick={startEditLabel}
        >
          <div
            ref={labelRef}
            contentEditable={editingLabel}
            suppressContentEditableWarning
            onBlur={finishEditLabel}
            onKeyDown={handleLabelKeyDown}
            style={{
              color: '#ffffff',
              fontSize: nodeData.fontSize,
              fontWeight: 600,
              textAlign: 'center',
              outline: 'none',
              cursor: editingLabel ? 'text' : 'default',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              userSelect: editingLabel ? 'text' : 'none',
              width: '100%',
            }}
          >
            {label}
          </div>
        </div>

        {/* Body */}
        <div
          className="flex-1 flex items-start justify-start overflow-hidden"
          style={{ padding: '6px 8px' }}
          onDoubleClick={startEditBody}
        >
          <div
            ref={bodyRef}
            contentEditable={editingBody}
            suppressContentEditableWarning
            onBlur={finishEditBody}
            onKeyDown={handleBodyKeyDown}
            style={{
              color: nodeData.textColor,
              fontSize: nodeData.bodyFontSize,
              outline: 'none',
              cursor: editingBody ? 'text' : 'default',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              userSelect: editingBody ? 'text' : 'none',
              width: '100%',
              lineHeight: 1.5,
            }}
          >
            {bodyText}
          </div>
        </div>
      </div>

    </>
  );
}
