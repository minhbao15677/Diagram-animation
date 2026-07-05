import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ConnectionMode,
  type NodeTypes,
  type EdgeTypes,
  type Connection,
  ConnectionLineType,
} from '@xyflow/react';
import { useDiagramStore } from '../../store/diagramStore';
import { RectNode } from './nodes/RectNode';
import { LabeledBoxNode } from './nodes/LabeledBoxNode';
import { CustomEdge } from './edges/CustomEdge';
import { PresentationOverlay } from './PresentationOverlay';
import { AlignmentGuides } from './AlignmentGuides';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useAlignmentGuides } from '../../hooks/useAlignmentGuides';

const nodeTypes: NodeTypes = {
  rectNode: RectNode,
  labeledBoxNode: LabeledBoxNode,
};

const edgeTypes: EdgeTypes = {
  customEdge: CustomEdge,
};

export function DiagramCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    pushHistory,
    presentationMode,
    presentationStep,
    presentationSteps,
    presentationTriggers,
  } = useDiagramStore();

  useKeyboard();

  const { guides, onNodeDrag, onNodeDragStop: onAlignStop } = useAlignmentGuides(nodes);

  const handleConnect = useCallback(
    (connection: Connection) => {
      onConnect(connection);
    },
    [onConnect]
  );

  const handleNodeDragStop = useCallback<import('@xyflow/react').NodeDragHandler>((event, node, nodes) => {
    onAlignStop(event, node, nodes);
    pushHistory();
  }, [pushHistory, onAlignStop]);

  const defaultEdgeOptions = useMemo(
    () => ({ type: 'customEdge' }),
    []
  );

  const currentTrigger = presentationMode && presentationStep >= 0
    ? (presentationTriggers[presentationStep] ?? -1)
    : -1;

  const currentGroupIds = useMemo(() => {
    if (!presentationMode || presentationStep < 0) return new Set<string>();
    const group = presentationSteps[presentationStep] ?? [];
    return new Set<string>(group.map((item) => item.id));
  }, [presentationMode, presentationStep, presentationSteps]);

  const getElementVisible = (id: string, showAtStep: number | undefined, hideAtStep: number | undefined): boolean => {
    if (currentTrigger < 0) return false;
    if (showAtStep && showAtStep > 0) {
      if (showAtStep > currentTrigger) return false;
      if (hideAtStep && hideAtStep > 0 && hideAtStep <= currentTrigger) return false;
      return true;
    }
    const stepIdx = presentationSteps.findIndex((group) => group.some((item) => item.id === id));
    if (stepIdx < 0) return false;
    const effectiveTrigger = presentationTriggers[stepIdx];
    return effectiveTrigger !== undefined && effectiveTrigger <= currentTrigger;
  };

  const presentationNodes = useMemo(() => {
    if (!presentationMode) {
      return nodes.map((n) => {
        const d = n.data as Record<string, unknown>;
        const onTop = d.onTop as boolean | undefined;
        return onTop ? { ...n, style: { ...n.style, zIndex: 1000 } } : n;
      });
    }
    return nodes.map((n) => {
      const d = n.data as Record<string, unknown>;
      const show = d.showAtStep as number | undefined;
      const hide = d.hideAtStep as number | undefined;
      const hasConfig = show && show > 0;
      const visible = hasConfig ? getElementVisible(n.id, show, hide) : getElementVisible(n.id, undefined, undefined);
      const isCurrent = currentGroupIds.has(n.id);
      const onTop = d.onTop as boolean | undefined;
      return {
        ...n,
        style: {
          ...n.style,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s, filter 0.4s',
          filter: isCurrent
            ? 'drop-shadow(0 0 16px rgba(255,255,255,0.6)) drop-shadow(0 0 8px rgba(59,130,246,0.8))'
            : undefined,
          zIndex: isCurrent ? 10 : (onTop ? 1000 : undefined),
        },
        draggable: false,
        selectable: false,
        connectable: false,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, presentationMode, currentTrigger, currentGroupIds]);

  const presentationEdges = useMemo(() => {
    if (!presentationMode) {
      return edges.map((e) => {
        const d = (e.data ?? {}) as Record<string, unknown>;
        const onTop = d.onTop as boolean | undefined;
        return onTop ? { ...e, zIndex: 1000 } : e;
      });
    }
    return edges.map((e) => {
      const d = (e.data ?? {}) as Record<string, unknown>;
      const onTop = d.onTop as boolean | undefined;
      return { ...e, animated: false, selectable: false, ...(onTop ? { zIndex: 1000 } : {}) };
    });
  }, [edges, presentationMode]);

  return (
    <div
      className="flex-1 relative"
      style={presentationMode ? { background: '#0f1117' } : undefined}
    >
      <ReactFlow
        nodes={presentationNodes}
        edges={presentationEdges}
        onNodesChange={presentationMode ? undefined : onNodesChange}
        onEdgesChange={presentationMode ? undefined : onEdgesChange}
        onConnect={presentationMode ? undefined : handleConnect}
        onNodeDrag={presentationMode ? undefined : onNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '6,3' }}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode={null}
        multiSelectionKeyCode="Shift"
        selectionOnDrag={!presentationMode}
        panOnDrag={presentationMode ? false : [1, 2]}
        zoomOnScroll={!presentationMode}
        minZoom={0.1}
        maxZoom={4}
        elevateNodesOnSelect
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color={presentationMode ? '#1e2330' : '#94a3b8'}
          style={presentationMode ? { background: '#0f1117' } : undefined}
        />
        {!presentationMode && (
          <>
            <Controls
              position="bottom-left"
              showInteractive={false}
              style={{ marginBottom: 8, marginLeft: 8 }}
            />
            <MiniMap
              position="bottom-right"
              nodeColor={(n) => {
                const d = n.data as { bgColor?: string };
                return d.bgColor ?? '#ffffff';
              }}
              nodeStrokeColor="#94a3b8"
              maskColor="rgba(240,242,245,0.6)"
              style={{ border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 8, marginRight: 8 }}
            />
          </>
        )}
      </ReactFlow>

      {!presentationMode && (
        <AlignmentGuides hLines={guides.hLines} vLines={guides.vLines} hCenterLines={guides.hCenterLines} vCenterLines={guides.vCenterLines} />
      )}

      <PresentationOverlay />
    </div>
  );
}
