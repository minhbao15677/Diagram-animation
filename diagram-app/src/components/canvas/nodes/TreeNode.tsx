import { useState, useRef, useCallback, useEffect } from 'react';
import { Handle, Position, NodeResizer, useReactFlow, type NodeProps } from '@xyflow/react';
import type { TreeNodeData } from '../../../store/diagramStore';
import {
  useDiagramStore,
  TREE_HEADER_HEIGHT,
  TREE_ITEM_HEIGHT,
  treeNaturalHeight,
} from '../../../store/diagramStore';

export function TreeNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as TreeNodeData;
  const { presentationMode, toggleTreeCollapsed, setTreeItems } = useDiagramStore();
  const { updateNodeData } = useReactFlow();

  const [editingLabel, setEditingLabel] = useState(false);
  const [label, setLabel] = useState(nodeData.label);
  const labelRef = useRef<HTMLDivElement>(null);
  const downAt = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { setLabel(nodeData.label); }, [nodeData.label]);

  const items = nodeData.items ?? [];
  const collapsed = nodeData.collapsed ?? false;
  const radius = nodeData.borderRadius ?? 8;

  // Header doubles as the drag handle, so a click ending a drag must not toggle.
  const movedSinceDown = (e: React.MouseEvent) => {
    const from = downAt.current;
    downAt.current = null;
    if (!from) return false;
    return Math.abs(e.clientX - from.x) > 3 || Math.abs(e.clientY - from.y) > 3;
  };

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

  const handleLabelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finishEditLabel(); }
    if (e.key === 'Escape') {
      setEditingLabel(false);
      if (labelRef.current) labelRef.current.innerText = label;
    }
    e.stopPropagation();
  }, [finishEditLabel, label]);

  const commitItems = useCallback(
    (next: string[]) => {
      setTreeItems(id, next);
    },
    [id, setTreeItems]
  );

  const handleItemBlur = useCallback(
    (index: number, value: string) => {
      if (items[index] === value) return;
      const next = [...items];
      next[index] = value;
      commitItems(next);
    },
    [items, commitItems]
  );

  const addItem = useCallback(() => {
    commitItems([...items, `Nhánh ${items.length + 1}`]);
  }, [items, commitItems]);

  const removeItem = useCallback(() => {
    if (items.length <= 1) return;
    commitItems(items.slice(0, -1));
  }, [items, commitItems]);

  const handlePositions = [
    { position: Position.Top, id: 'top' },
    { position: Position.Bottom, id: 'bottom' },
    { position: Position.Left, id: 'left' },
    { position: Position.Right, id: 'right' },
  ];

  const headerRadius = Math.max(0, radius - nodeData.borderWidth);

  return (
    <>
      <NodeResizer
        isVisible={selected && !collapsed}
        minWidth={120}
        minHeight={treeNaturalHeight(items.length)}
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
        <div
          onMouseDown={(e) => { downAt.current = { x: e.clientX, y: e.clientY }; }}
          onClick={(e) => {
            if (editingLabel) return;
            if (movedSinceDown(e)) return;
            toggleTreeCollapsed(id);
          }}
          onDoubleClick={startEditLabel}
          style={{
            background: nodeData.headerBgColor,
            borderRadius: collapsed
              ? `${headerRadius}px`
              : `${headerRadius}px ${headerRadius}px 0 0`,
            height: TREE_HEADER_HEIGHT - nodeData.borderWidth * 2,
            minHeight: TREE_HEADER_HEIGHT - nodeData.borderWidth * 2,
            padding: '0 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: editingLabel ? 'text' : 'pointer',
          }}
          title={editingLabel ? undefined : collapsed ? 'Click để mở các nhánh' : 'Click để thu gọn · Double-click để sửa tiêu đề'}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            style={{
              flexShrink: 0,
              transform: collapsed ? 'rotate(-90deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          >
            <path d="M1 3l4 4 4-4" stroke="#ffffff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <div
            ref={labelRef}
            contentEditable={editingLabel}
            suppressContentEditableWarning
            onBlur={finishEditLabel}
            onKeyDown={handleLabelKeyDown}
            className="outline-none flex-1"
            style={{
              color: '#ffffff',
              fontSize: nodeData.fontSize,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: editingLabel ? 'text' : 'pointer',
              userSelect: editingLabel ? 'text' : 'none',
            }}
          >
            {label}
          </div>

          {collapsed && (
            <span
              style={{
                flexShrink: 0,
                fontSize: 10,
                fontWeight: 700,
                color: '#ffffff',
                background: 'rgba(255,255,255,0.25)',
                borderRadius: 8,
                padding: '1px 6px',
              }}
            >
              {items.length}
            </span>
          )}
        </div>

        {!collapsed && (
          <div className="flex-1 overflow-auto" style={{ padding: '4px 0' }}>
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  minHeight: TREE_ITEM_HEIGHT,
                  padding: '2px 10px',
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: nodeData.headerBgColor,
                  }}
                />
                <div
                  contentEditable={!presentationMode}
                  suppressContentEditableWarning
                  onBlur={(e) => handleItemBlur(i, e.currentTarget.innerText)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      (e.currentTarget as HTMLElement).blur();
                    }
                    e.stopPropagation();
                  }}
                  className="outline-none flex-1"
                  style={{
                    color: nodeData.textColor,
                    fontSize: nodeData.itemFontSize,
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                    cursor: presentationMode ? 'default' : 'text',
                    userSelect: presentationMode ? 'none' : 'text',
                  }}
                >
                  {item}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!presentationMode && selected && !collapsed && (
        <div
          className="nodrag"
          style={{
            position: 'absolute',
            bottom: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 4,
            zIndex: 20,
          }}
        >
          <TreeCtrlBtn label="+ nhánh" onClick={addItem} />
          <TreeCtrlBtn label="− nhánh" onClick={removeItem} disabled={items.length <= 1} />
        </div>
      )}
    </>
  );
}

function TreeCtrlBtn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="nodrag"
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: '2px 6px',
        borderRadius: 4,
        border: '1px solid #cbd5e1',
        background: disabled ? '#f1f5f9' : '#ffffff',
        color: disabled ? '#94a3b8' : '#334155',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}
