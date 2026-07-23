import { useState, useRef, useCallback, useEffect } from 'react';
import { Handle, Position, NodeResizer, useReactFlow, type NodeProps } from '@xyflow/react';
import type { TextBoxNodeData } from '../../../store/diagramStore';
import { useDiagramStore } from '../../../store/diagramStore';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

export function TextBoxNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as TextBoxNodeData;
  const { presentationMode } = useDiagramStore();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(nodeData.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { updateNodeData } = useReactFlow();

  useEffect(() => {
    setText(nodeData.text);
  }, [nodeData.text]);

  const highlightedLines: number[] = (nodeData.highlightedLines as number[] | undefined) ?? [];
  const highlightColor = nodeData.highlightColor ?? '#fef08a';

  const startEdit = useCallback(() => {
    setEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    }, 10);
  }, []);

  const finishEdit = useCallback(() => {
    setEditing(false);
    const newText = textareaRef.current?.value ?? text;
    setText(newText);
    updateNodeData(id, { text: newText } as Record<string, unknown>);
  }, [id, text, updateNodeData]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditing(false);
        if (textareaRef.current) textareaRef.current.value = text;
      }
      e.stopPropagation();
    },
    [text]
  );

  const handleLineClick = useCallback(
    (lineIndex: number) => {
      const next = highlightedLines.includes(lineIndex)
        ? highlightedLines.filter((i) => i !== lineIndex)
        : [...highlightedLines, lineIndex];
      updateNodeData(id, { highlightedLines: next } as Record<string, unknown>);
    },
    [id, highlightedLines, updateNodeData]
  );

  const containerStyle = {
    backgroundColor: nodeData.bgColor,
    border: nodeData.borderColor === 'transparent'
      ? '1px dashed #cbd5e1'
      : `${nodeData.borderWidth}px ${nodeData.borderStyle} ${nodeData.borderColor}`,
    color: nodeData.textColor,
    fontSize: `${nodeData.fontSize}px`,
    borderRadius: `${nodeData.borderRadius ?? 4}px`,
  };

  const lines = text.split('\n');

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
        minWidth={80}
        minHeight={40}
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
        className="w-full h-full overflow-hidden"
        style={containerStyle}
        onDoubleClick={!presentationMode ? startEdit : undefined}
      >
        {editing ? (
          <textarea
            ref={textareaRef}
            defaultValue={text}
            onBlur={finishEdit}
            onKeyDown={handleKeyDown}
            className="w-full h-full resize-none outline-none p-1.5 bg-transparent"
            style={{
              fontFamily: MONO,
              fontSize: `${nodeData.fontSize}px`,
              color: nodeData.textColor,
              lineHeight: '1.5',
            }}
          />
        ) : (
          <div
            className="w-full h-full overflow-auto"
            style={{ fontFamily: MONO, fontSize: `${nodeData.fontSize}px`, lineHeight: '1.5' }}
          >
            {lines.map((line, i) => (
              <div
                key={i}
                onClick={!presentationMode ? () => handleLineClick(i) : undefined}
                style={{
                  backgroundColor: highlightedLines.includes(i) ? highlightColor : 'transparent',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  cursor: presentationMode ? 'default' : 'pointer',
                  paddingLeft: 6,
                  paddingRight: 6,
                  minHeight: '1.5em',
                  userSelect: 'none',
                }}
              >
                {line || ' '}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
