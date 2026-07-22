import { useEffect, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';

interface StepBadgeProps {
  id: string;
  showAtStep: number | undefined;
  hideAtStep: number | undefined;
  selected: boolean | undefined;
  presentationMode: boolean;
}

export function StepBadge({ id, showAtStep, hideAtStep, selected, presentationMode }: StepBadgeProps) {
  const { updateNodeData } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const hasStep = showAtStep !== undefined && showAtStep > 0;

  if (presentationMode) return null;
  // Show badge if it has a step, or if the node is selected (so user can set one)
  if (!hasStep && !selected) return null;

  const commit = () => {
    const num = value.trim() === '' ? undefined : Number(value);
    updateNodeData(id, {
      showAtStep: num && num > 0 ? num : undefined,
      ...(num && num > 0 ? {} : { hideAtStep: undefined }),
    } as Record<string, unknown>);
    setEditing(false);
  };

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue(hasStep ? String(showAtStep) : '');
    setEditing(true);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={1}
        value={value}
        className="nodrag"
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        style={{
          position: 'absolute',
          top: -12,
          right: -12,
          width: 34,
          height: 22,
          borderRadius: 11,
          border: '1px solid #7c3aed',
          background: 'white',
          color: '#7c3aed',
          fontSize: 11,
          fontWeight: 700,
          textAlign: 'center',
          outline: 'none',
          zIndex: 11,
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }}
      />
    );
  }

  return (
    <div
      className="nodrag"
      title="Click để đặt thứ tự hiển thị"
      onClick={startEdit}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: -10,
        right: -10,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        padding: '0 4px',
        background: hasStep ? '#7c3aed' : '#c4b5fd',
        color: 'white',
        fontSize: 10,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        cursor: 'pointer',
        zIndex: 10,
      }}
    >
      {hasStep ? (
        <>
          <span>{showAtStep}</span>
          {hideAtStep !== undefined && hideAtStep > 0 && (
            <span style={{ opacity: 0.7 }}>→{hideAtStep}</span>
          )}
        </>
      ) : (
        <span style={{ fontSize: 12, lineHeight: 1 }}>#</span>
      )}
    </div>
  );
}
