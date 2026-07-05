import { ReactFlowProvider } from '@xyflow/react';
import { Toolbar } from './components/toolbar/Toolbar';
import { DiagramCanvas } from './components/canvas/DiagramCanvas';
import { PropertiesPanel } from './components/toolbar/PropertiesPanel';
import { WorkspaceSidebar } from './components/workspace/WorkspaceSidebar';
import { useDiagramStore } from './store/diagramStore';

function AppInner() {
  const presentationMode = useDiagramStore((s) => s.presentationMode);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!presentationMode && <Toolbar />}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {!presentationMode && <WorkspaceSidebar />}
        <DiagramCanvas />
        {!presentationMode && <PropertiesPanel />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppInner />
    </ReactFlowProvider>
  );
}
