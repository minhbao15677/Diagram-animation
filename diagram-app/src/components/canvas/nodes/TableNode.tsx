import { useCallback } from 'react';
import { Handle, Position, NodeResizer, useReactFlow, type NodeProps } from '@xyflow/react';
import type { TableNodeData } from '../../../store/diagramStore';
import { useDiagramStore } from '../../../store/diagramStore';

export function TableNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as TableNodeData;
  const { presentationMode } = useDiagramStore();
  const { updateNodeData } = useReactFlow();

  const cells = nodeData.cells ?? [['']];
  const numCols = cells[0]?.length ?? 1;

  const commitCells = useCallback(
    (next: string[][]) => {
      updateNodeData(id, { cells: next } as Record<string, unknown>);
    },
    [id, updateNodeData]
  );

  const handleCellBlur = useCallback(
    (r: number, c: number, value: string) => {
      if (cells[r]?.[c] === value) return;
      const next = cells.map((row) => [...row]);
      next[r][c] = value;
      commitCells(next);
    },
    [cells, commitCells]
  );

  const addRow = useCallback(() => {
    const next = [...cells.map((row) => [...row]), Array.from({ length: numCols }, () => '')];
    commitCells(next);
  }, [cells, numCols, commitCells]);

  const addColumn = useCallback(() => {
    const next = cells.map((row) => [...row, '']);
    commitCells(next);
  }, [cells, commitCells]);

  const removeRow = useCallback(() => {
    if (cells.length <= 1) return;
    commitCells(cells.slice(0, -1).map((row) => [...row]));
  }, [cells, commitCells]);

  const removeColumn = useCallback(() => {
    if (numCols <= 1) return;
    commitCells(cells.map((row) => row.slice(0, -1)));
  }, [cells, numCols, commitCells]);

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
        minWidth={120}
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

      <table
        className="w-full h-full border-collapse select-none"
        style={{
          backgroundColor: nodeData.bgColor,
          border: `1px solid ${nodeData.borderColor}`,
          color: nodeData.textColor,
          fontSize: `${nodeData.fontSize}px`,
          borderRadius: 6,
          overflow: 'hidden',
          tableLayout: 'fixed',
          transform: (nodeData as { __hovered?: boolean }).__hovered ? 'scale(1.3)' : undefined,
          transition: 'transform 0.25s ease',
        }}
      >
        <tbody>
          {cells.map((row, r) => {
            const isHeader = nodeData.headerRow && r === 0;
            return (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td
                    key={c}
                    contentEditable={!presentationMode}
                    suppressContentEditableWarning
                    onBlur={(e) => handleCellBlur(r, c, e.currentTarget.innerText)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        (e.currentTarget as HTMLElement).blur();
                      }
                      e.stopPropagation();
                    }}
                    className="outline-none align-middle"
                    style={{
                      border: `1px solid ${nodeData.borderColor}`,
                      background: isHeader ? nodeData.headerBgColor : 'transparent',
                      fontWeight: isHeader ? 600 : 400,
                      padding: '4px 8px',
                      wordBreak: 'break-word',
                      cursor: presentationMode ? 'default' : 'text',
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Add/remove row & column controls (editor only) */}
      {!presentationMode && selected && (
        <>
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
            <TableCtrlBtn label="+ hàng" onClick={addRow} />
            <TableCtrlBtn label="− hàng" onClick={removeRow} disabled={cells.length <= 1} />
          </div>
          <div
            className="nodrag"
            style={{
              position: 'absolute',
              top: '50%',
              right: -14,
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              zIndex: 20,
            }}
          >
            <TableCtrlBtn label="+ cột" onClick={addColumn} />
            <TableCtrlBtn label="− cột" onClick={removeColumn} disabled={numCols <= 1} />
          </div>
        </>
      )}

    </>
  );
}

function TableCtrlBtn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
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
