import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useDiagramStore } from '../../store/diagramStore';
import { DiagramCanvas } from '../canvas/DiagramCanvas';

export function PresentationPage() {
  const { loadState, enterPresentation } = useDiagramStore();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('presentation_state');
      if (!raw) return;
      const { nodes, edges } = JSON.parse(raw);
      loadState(nodes, edges);
      // Enter after state is loaded
      setTimeout(() => enterPresentation(), 50);
    } catch {
      // malformed data — just enter with whatever is in store
      enterPresentation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ReactFlowProvider>
      <div style={{ width: '100vw', height: '100vh' }}>
        <DiagramCanvas />
      </div>
    </ReactFlowProvider>
  );
}
