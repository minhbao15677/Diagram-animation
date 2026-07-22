import { useCallback, useRef } from 'react';
import { useReactFlow, Panel } from '@xyflow/react';

const PAN_STEP = 80;
const REPEAT_INTERVAL = 60;

type Direction = 'up' | 'down' | 'left' | 'right';

function dirToVector(dir: Direction): { x: number; y: number } {
  switch (dir) {
    case 'up':    return { x: 0,         y: PAN_STEP  };
    case 'down':  return { x: 0,         y: -PAN_STEP };
    case 'left':  return { x: PAN_STEP,  y: 0         };
    case 'right': return { x: -PAN_STEP, y: 0         };
  }
}

function PanButton({ dir, label, icon }: { dir: Direction; label: string; icon: string }) {
  const { panBy } = useReactFlow();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pan = useCallback(() => {
    panBy(dirToVector(dir));
  }, [panBy, dir]);

  const startHold = useCallback(() => {
    pan();
    intervalRef.current = setInterval(pan, REPEAT_INTERVAL);
  }, [pan]);

  const stopHold = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return (
    <button
      title={label}
      onMouseDown={startHold}
      onMouseUp={stopHold}
      onMouseLeave={stopHold}
      onTouchStart={startHold}
      onTouchEnd={stopHold}
      style={{
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: 14,
        color: '#374151',
        userSelect: 'none',
        lineHeight: 1,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6';
      }}
      onMouseOut={(e) => {
        stopHold();
        (e.currentTarget as HTMLButtonElement).style.background = 'white';
      }}
    >
      {icon}
    </button>
  );
}

export function PanControls() {
  return (
    <Panel
      position="bottom-left"
      style={{ marginBottom: 116, marginLeft: 0 }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '28px 28px 28px',
          gridTemplateRows: '28px 28px',
          gap: 2,
        }}
      >
        {/* Row 1: [empty] [up] [empty] */}
        <div />
        <PanButton dir="up" label="Cuộn lên" icon="↑" />
        <div />
        {/* Row 2: [left] [down] [right] */}
        <PanButton dir="left" label="Cuộn trái" icon="←" />
        <PanButton dir="down" label="Cuộn xuống" icon="↓" />
        <PanButton dir="right" label="Cuộn phải" icon="→" />
      </div>
    </Panel>
  );
}
