import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ConnectionMode,
  PanOnScrollMode,
  type NodeTypes,
  type EdgeTypes,
  type Connection,
  ConnectionLineType,
} from '@xyflow/react';
import { useDiagramStore, computeHiddenElements } from '../../store/diagramStore';
import { RectNode } from './nodes/RectNode';
import { LabeledBoxNode } from './nodes/LabeledBoxNode';
import { ZoneNode } from './nodes/ZoneNode';
import { TableNode } from './nodes/TableNode';
import { TextBoxNode } from './nodes/TextBoxNode';
import { TreeNode } from './nodes/TreeNode';
import { BranchToggleNode } from './nodes/BranchToggleNode';
import { CustomEdge } from './edges/CustomEdge';
import { PresentationOverlay } from './PresentationOverlay';
import { AlignmentGuides } from './AlignmentGuides';
import { PanControls } from './PanControls';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useAlignmentGuides } from '../../hooks/useAlignmentGuides';

const nodeTypes: NodeTypes = {
  rectNode: RectNode,
  labeledBoxNode: LabeledBoxNode,
  zoneNode: ZoneNode,
  tableNode: TableNode,
  textBoxNode: TextBoxNode,
  treeNode: TreeNode,
  branchToggleNode: BranchToggleNode,
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
    hoveredElementId,
    setHoveredElement,
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

  const hidden = useMemo(() => computeHiddenElements(nodes, edges), [nodes, edges]);

  // Edges render at zIndex 1000, and their 20px-wide hit area would otherwise
  // swallow clicks on the collapse controls of any node an arrow crosses.
  const CLICKABLE_Z = 1001;
  const isClickableNode = (type?: string) =>
    type === 'branchToggleNode' || type === 'treeNode';

  // Zones are backdrops: they must stay behind every other node even while
  // selected. elevateNodesOnSelect adds SELECTED_NODE_Z (1000) to a selected
  // node's zIndex, which would lift a zone from -1 to 999 and let its fill
  // cover the nodes inside it. Pre-subtracting that offset keeps the sum
  // negative, so a selected zone still renders (and hit-tests) underneath.
  const SELECTED_NODE_Z = 1000;
  const ZONE_Z = -1;
  const zoneZ = (n: { selected?: boolean }) =>
    n.selected ? ZONE_Z - SELECTED_NODE_Z : ZONE_Z;

  const presentationNodes = useMemo(() => {
    if (!presentationMode) {
      return nodes.map((n) => {
        const d = n.data as Record<string, unknown>;
        const onTop = d.onTop as boolean | undefined;
        const isHidden = hidden.hiddenNodes.has(n.id);
        const z = isClickableNode(n.type)
          ? CLICKABLE_Z
          : n.type === 'zoneNode'
          ? zoneZ(n)
          : onTop
          ? 1000
          : undefined;
        const base =
          z !== undefined
            ? { ...n, zIndex: z, style: { ...n.style, zIndex: z } }
            : n;
        return isHidden ? { ...base, hidden: true } : base;
      });
    }
    return nodes.map((n) => {
      const d = n.data as Record<string, unknown>;
      const show = d.showAtStep as number | undefined;
      const hide = d.hideAtStep as number | undefined;
      const hasConfig = show && show > 0;
      const visible = hasConfig ? getElementVisible(n.id, show, hide) : getElementVisible(n.id, undefined, undefined);
      const isCurrent = currentGroupIds.has(n.id);
      const isHovered = hoveredElementId === n.id;
      const onTop = d.onTop as boolean | undefined;
      const isZone = n.type === 'zoneNode';
      const presentZ = isClickableNode(n.type)
        ? CLICKABLE_Z
        : isZone
        ? ZONE_Z
        : isHovered
        ? 20
        : isCurrent
        ? 10
        : onTop
        ? 1000
        : undefined;
      return {
        ...n,
        ...(presentZ !== undefined ? { zIndex: presentZ } : {}),
        hidden: hidden.hiddenNodes.has(n.id),
        style: {
          ...n.style,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s, filter 0.4s',
          filter: isHovered
            ? 'drop-shadow(0 0 18px rgba(59,130,246,0.55)) drop-shadow(0 0 8px rgba(37,99,235,0.7))'
            : isCurrent
            ? 'drop-shadow(0 0 14px rgba(59,130,246,0.4)) drop-shadow(0 0 6px rgba(37,99,235,0.55))'
            : undefined,
          zIndex: presentZ,
        },
        data: { ...(n.data as Record<string, unknown>), __hovered: isHovered },
        draggable: false,
        selectable: false,
        connectable: false,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, presentationMode, currentTrigger, currentGroupIds, hoveredElementId, hidden]);

  const presentationEdges = useMemo(() => {
    if (!presentationMode) {
      return edges.map((e) => ({ ...e, zIndex: 1000, hidden: hidden.hiddenEdges.has(e.id) }));
    }
    return edges.map((e) => {
      return { ...e, animated: false, selectable: false, zIndex: 1000, hidden: hidden.hiddenEdges.has(e.id) };
    });
  }, [edges, presentationMode, hidden]);

  return (
    <div
      className={`flex-1 relative${presentationMode ? ' presentation-mode' : ''}`}
      style={presentationMode ? { background: '#f8fafc' } : undefined}
    >
      <ReactFlow
        nodes={presentationNodes}
        edges={presentationEdges}
        onNodesChange={presentationMode ? undefined : onNodesChange}
        onEdgesChange={presentationMode ? undefined : onEdgesChange}
        onConnect={presentationMode ? undefined : handleConnect}
        onNodeDrag={presentationMode ? undefined : onNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        onNodeMouseEnter={presentationMode ? (_, node) => setHoveredElement(node.id) : undefined}
        onNodeMouseLeave={presentationMode ? () => setHoveredElement(null) : undefined}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '6,3' }}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode={null}
        multiSelectionKeyCode={['Shift', 'Control', 'Meta']}
        selectionOnDrag={!presentationMode}
        panOnDrag={presentationMode ? [1] : [1, 2]}
        zoomOnScroll={false}
        panOnScroll={!presentationMode}
        panOnScrollMode={PanOnScrollMode.Free}
        minZoom={0.1}
        maxZoom={4}
        elevateNodesOnSelect
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color={presentationMode ? '#cbd5e1' : '#94a3b8'}
          style={presentationMode ? { background: '#f8fafc' } : undefined}
        />
        {!presentationMode && (
          <>
            <Controls
              position="bottom-left"
              showInteractive={false}
              style={{ marginBottom: 8, marginLeft: 8 }}
            />
            <PanControls />
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
