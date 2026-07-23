import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';

export type LabeledBoxNodeData = {
  label: string;
  bodyText: string;
  bgColor: string;
  headerBgColor: string;
  borderColor: string;
  textColor: string;
  fontSize: number;
  bodyFontSize: number;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  borderRadius: number;
  onTop?: boolean;
  showAtStep?: number;
  hideAtStep?: number;
};

export type RectNodeData = {
  label: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  fontSize: number;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  borderRadius: number;
  onTop?: boolean;
  showAtStep?: number;
  hideAtStep?: number;
};

export type ZoneNodeData = {
  label: string;
  bgColor: string;
  labelBgColor: string;
  borderColor: string;
  textColor: string;
  fontSize: number;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  borderRadius: number;
  onTop?: boolean;
  showAtStep?: number;
  hideAtStep?: number;
};

export type TableNodeData = {
  cells: string[][]; // rows of columns
  headerRow: boolean;
  bgColor: string;
  headerBgColor: string;
  borderColor: string;
  textColor: string;
  fontSize: number;
  onTop?: boolean;
  showAtStep?: number;
  hideAtStep?: number;
};

export type TextBoxNodeData = {
  text: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  fontSize: number;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  borderRadius: number;
  highlightedLines?: number[];
  highlightColor?: string;
  onTop?: boolean;
  showAtStep?: number;
  hideAtStep?: number;
};

export type EdgeData = {
  label?: string;
  edgeType: 'bezier' | 'smoothstep' | 'straight';
  arrowType: 'arrow' | 'arrowclosed' | 'none';
  color: string;
  lineStyle: 'solid' | 'dashed';
  strokeWidth?: number;
  bidirectional: boolean;
  onTop?: boolean;
  showAtStep?: number;
  hideAtStep?: number;
  animationEffect?: 'none' | 'dot' | 'arrow';
  labelOffsetX?: number;
  labelOffsetY?: number;
  pathOffsetX?: number;
  pathOffsetY?: number;
};

type HistoryEntry = {
  nodes: Node[];
  edges: Edge[];
};

export type PresentationItem = { type: 'node' | 'edge'; id: string; label: string };

// Each step is a group of items revealed simultaneously
export type PresentationStep = PresentationItem[];

// Runtime visibility map computed per-step
export type VisibilityMap = Map<string, boolean>; // id -> visible

type DiagramState = {
  nodes: Node[];
  edges: Edge[];
  history: HistoryEntry[];
  historyIndex: number;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (position?: { x: number; y: number }) => void;
  addLabeledBoxNode: (position?: { x: number; y: number }) => void;
  addZoneNode: (position?: { x: number; y: number }) => void;
  addTableNode: (position?: { x: number; y: number }) => void;
  addTextBoxNode: (position?: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<RectNodeData>) => void;
  updateEdgeData: (edgeId: string, data: Partial<EdgeData>) => void;
  clearAllSteps: () => void;
  deleteSelected: () => void;
  copySelected: () => void;
  copyToClipboard: () => void;
  pasteFromClipboard: () => void;
  selectAll: () => void;

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  selectedNodes: string[];
  selectedEdges: string[];

  presentationMode: boolean;
  presentationStep: number;
  presentationSteps: PresentationStep[];
  presentationTriggers: number[]; // sorted unique trigger numbers (showAtStep + hideAtStep)
  hoveredElementId: string | null;
  setHoveredElement: (id: string | null) => void;
  enterPresentation: () => void;
  exitPresentation: () => void;
  nextStep: () => void;
  prevStep: () => void;
  loadState: (nodes: Node[], edges: Edge[]) => void;
};

const defaultLabeledBoxNodeData: LabeledBoxNodeData = {
  label: 'Title',
  bodyText: 'Content goes here...',
  bgColor: '#ffffff',
  headerBgColor: '#3b82f6',
  borderColor: '#000000',
  textColor: '#1e293b',
  fontSize: 13,
  bodyFontSize: 13,
  borderWidth: 1.4,
  borderStyle: 'solid',
  borderRadius: 8,
};

const defaultNodeData: RectNodeData = {
  label: 'Node',
  bgColor: '#ffffff',
  borderColor: '#000000',
  textColor: '#1e293b',
  fontSize: 14,
  borderWidth: 1.4,
  borderStyle: 'solid',
  borderRadius: 8,
};

const defaultZoneNodeData: ZoneNodeData = {
  label: 'Zone',
  bgColor: 'rgba(59,130,246,0.04)',
  labelBgColor: '#e0edff',
  borderColor: '#3b82f6',
  textColor: '#1e40af',
  fontSize: 13,
  borderWidth: 2,
  borderStyle: 'dashed',
  borderRadius: 8,
};

const defaultTableNodeData: TableNodeData = {
  cells: [['Cột 1', 'Cột 2']],
  headerRow: true,
  bgColor: '#ffffff',
  headerBgColor: '#f1f5f9',
  borderColor: '#94a3b8',
  textColor: '#1e293b',
  fontSize: 13,
};

const defaultTextBoxNodeData: TextBoxNodeData = {
  text: 'Text here...',
  bgColor: 'transparent',
  borderColor: 'transparent',
  textColor: '#1e293b',
  fontSize: 13,
  borderWidth: 1,
  borderStyle: 'solid',
  borderRadius: 4,
};

const defaultEdgeData: EdgeData = {
  label: '',
  edgeType: 'smoothstep',
  arrowType: 'arrowclosed',
  color: '#64748b',
  lineStyle: 'solid',
  strokeWidth: 1,
  bidirectional: false,
  animationEffect: 'arrow',
};

let nodeIdCounter = 3;
let edgeIdCounter = 2;

export const useDiagramStore = create<DiagramState>((set, get) => ({
  nodes: [
    {
      id: 'node-1',
      type: 'rectNode',
      position: { x: 200, y: 200 },
      data: { ...defaultNodeData, label: 'Start' } as unknown as Record<string, unknown>,
      width: 140,
      height: 60,
    },
    {
      id: 'node-2',
      type: 'rectNode',
      position: { x: 500, y: 200 },
      data: { ...defaultNodeData, label: 'Process' } as unknown as Record<string, unknown>,
      width: 140,
      height: 60,
    },
    {
      id: 'node-3',
      type: 'rectNode',
      position: { x: 500, y: 350 },
      data: { ...defaultNodeData, label: 'End', bgColor: '#fef9c3', borderColor: '#ca8a04' } as unknown as Record<string, unknown>,
      width: 140,
      height: 60,
    },
  ],
  edges: [
    {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      type: 'customEdge',
      data: { ...defaultEdgeData } as unknown as Record<string, unknown>,
    },
    {
      id: 'edge-2',
      source: 'node-2',
      target: 'node-3',
      type: 'customEdge',
      data: { ...defaultEdgeData } as unknown as Record<string, unknown>,
    },
  ],
  history: [],
  historyIndex: -1,
  selectedNodes: [],
  selectedEdges: [],

  presentationMode: false,
  presentationStep: -1,
  presentationSteps: [],
  presentationTriggers: [],
  hoveredElementId: null,

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
    const selectionChanges = changes.filter((c) => c.type === 'select');
    if (selectionChanges.length > 0) {
      const selected = get().nodes
        .filter((n) => n.selected)
        .map((n) => n.id);
      set({ selectedNodes: selected });
    }
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
    const selectionChanges = changes.filter((c) => c.type === 'select');
    if (selectionChanges.length > 0) {
      const selected = get().edges
        .filter((e) => e.selected)
        .map((e) => e.id);
      set({ selectedEdges: selected });
    }
  },

  onConnect: (connection) => {
    get().pushHistory();
    set({
      edges: addEdge(
        {
          ...connection,
          type: 'customEdge',
          data: { ...defaultEdgeData } as unknown as Record<string, unknown>,
          id: `edge-${++edgeIdCounter}`,
        },
        get().edges
      ),
    });
  },

  addNode: (position = { x: 150 + Math.random() * 300, y: 150 + Math.random() * 200 }) => {
    get().pushHistory();
    const newNode: Node = {
      id: `node-${++nodeIdCounter}`,
      type: 'rectNode',
      position,
      data: { ...defaultNodeData, label: 'Node' } as unknown as Record<string, unknown>,
      width: 140,
      height: 60,
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  addLabeledBoxNode: (position = { x: 150 + Math.random() * 300, y: 150 + Math.random() * 200 }) => {
    get().pushHistory();
    const newNode: Node = {
      id: `node-${++nodeIdCounter}`,
      type: 'labeledBoxNode',
      position,
      data: { ...defaultLabeledBoxNodeData } as unknown as Record<string, unknown>,
      width: 160,
      height: 100,
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  addZoneNode: (position = { x: 150 + Math.random() * 300, y: 150 + Math.random() * 200 }) => {
    get().pushHistory();
    const newNode: Node = {
      id: `node-${++nodeIdCounter}`,
      type: 'zoneNode',
      position,
      data: { ...defaultZoneNodeData } as unknown as Record<string, unknown>,
      width: 280,
      height: 200,
      zIndex: -1,
      dragHandle: '.zone-drag-handle',
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  addTableNode: (position = { x: 150 + Math.random() * 300, y: 150 + Math.random() * 200 }) => {
    get().pushHistory();
    const newNode: Node = {
      id: `node-${++nodeIdCounter}`,
      type: 'tableNode',
      position,
      data: { ...defaultTableNodeData, cells: defaultTableNodeData.cells.map((r) => [...r]) } as unknown as Record<string, unknown>,
      width: 240,
      height: 80,
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  addTextBoxNode: (position = { x: 150 + Math.random() * 300, y: 150 + Math.random() * 200 }) => {
    get().pushHistory();
    const newNode: Node = {
      id: `node-${++nodeIdCounter}`,
      type: 'textBoxNode',
      position,
      data: { ...defaultTextBoxNodeData } as unknown as Record<string, unknown>,
      width: 220,
      height: 120,
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } as unknown as Record<string, unknown> } : n
      ),
    });
  },

  updateEdgeData: (edgeId, data) => {
    set({
      edges: get().edges.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, ...data } as unknown as Record<string, unknown> } : e
      ),
    });
  },

  clearAllSteps: () => {
    get().pushHistory();
    const strip = (d: Record<string, unknown>) => {
      const { showAtStep: _s, hideAtStep: _h, ...rest } = d;
      void _s; void _h;
      return rest;
    };
    set({
      nodes: get().nodes.map((n) => ({ ...n, data: strip(n.data as Record<string, unknown>) as unknown as Record<string, unknown> })),
      edges: get().edges.map((e) => ({ ...e, data: strip((e.data ?? {}) as Record<string, unknown>) as unknown as Record<string, unknown> })),
    });
  },

  deleteSelected: () => {
    get().pushHistory();
    set({
      nodes: get().nodes.filter((n) => !n.selected),
      edges: get().edges.filter((e) => !e.selected),
      selectedNodes: [],
      selectedEdges: [],
    });
  },

  copySelected: () => {
    const { nodes, selectedNodes } = get();
    const toCopy = nodes.filter((n) => selectedNodes.includes(n.id));
    if (toCopy.length === 0) return;

    get().pushHistory();

    // Build old->new id map so edges between copied nodes can be re-mapped
    const idMap: Record<string, string> = {};
    const newNodes: Node[] = toCopy.map((n) => {
      const newId = `node-${++nodeIdCounter}`;
      idMap[n.id] = newId;
      return {
        ...JSON.parse(JSON.stringify(n)),
        id: newId,
        position: { x: n.position.x + 24, y: n.position.y + 24 },
        selected: true,
      };
    });

    // Deselect originals, select copies
    const updatedOriginals = get().nodes.map((n) => ({ ...n, selected: false }));

    set({
      nodes: [...updatedOriginals, ...newNodes],
      selectedNodes: newNodes.map((n) => n.id),
    });
  },

  copyToClipboard: () => {
    const { nodes, edges, selectedNodes, selectedEdges } = get();
    const copiedNodes = nodes.filter((n) => selectedNodes.includes(n.id));
    const copiedEdges = edges.filter((e) => selectedEdges.includes(e.id));
    if (copiedNodes.length === 0 && copiedEdges.length === 0) return;
    const payload = JSON.stringify({ nodes: copiedNodes, edges: copiedEdges });
    localStorage.setItem('diagram_clipboard', payload);
  },

  pasteFromClipboard: () => {
    const raw = localStorage.getItem('diagram_clipboard');
    if (!raw) return;
    try {
      const { nodes: copiedNodes, edges: copiedEdges } = JSON.parse(raw) as { nodes: Node[]; edges: Edge[] };
      if (!copiedNodes?.length && !copiedEdges?.length) return;
      get().pushHistory();

      // Remap IDs to avoid collision
      const idMap: Record<string, string> = {};
      const newNodes: Node[] = copiedNodes.map((n) => {
        const newId = `node-${++nodeIdCounter}`;
        idMap[n.id] = newId;
        return {
          ...JSON.parse(JSON.stringify(n)),
          id: newId,
          position: { x: n.position.x + 32, y: n.position.y + 32 },
          selected: true,
        };
      });

      const newEdges: Edge[] = copiedEdges
        .filter((e) => idMap[e.source] && idMap[e.target])
        .map((e) => ({
          ...JSON.parse(JSON.stringify(e)),
          id: `edge-${++edgeIdCounter}`,
          source: idMap[e.source],
          target: idMap[e.target],
          selected: true,
        }));

      const updatedExisting = get().nodes.map((n) => ({ ...n, selected: false }));
      const updatedEdges = get().edges.map((e) => ({ ...e, selected: false }));

      set({
        nodes: [...updatedExisting, ...newNodes],
        edges: [...updatedEdges, ...newEdges],
        selectedNodes: newNodes.map((n) => n.id),
        selectedEdges: newEdges.map((e) => e.id),
      });
    } catch {
      // invalid clipboard data
    }
  },

  selectAll: () => {
    const { nodes, edges } = get();
    set({
      nodes: nodes.map((n) => ({ ...n, selected: true })),
      edges: edges.map((e) => ({ ...e, selected: true })),
      selectedNodes: nodes.map((n) => n.id),
      selectedEdges: edges.map((e) => e.id),
    });
  },

  pushHistory: () => {
    const { nodes, edges, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
    set({ history: newHistory.slice(-50), historyIndex: Math.min(newHistory.length - 1, 49) });
  },

  undo: () => {
    const { history, historyIndex, nodes, edges } = get();
    if (historyIndex < 0) return;
    const newIndex = historyIndex - 1;
    if (newIndex < 0) {
      if (history.length > 0) {
        const entry = history[0];
        set({ nodes: entry.nodes, edges: entry.edges, historyIndex: -1 });
      }
    } else {
      const entry = history[newIndex];
      set({ nodes: entry.nodes, edges: entry.edges, historyIndex: newIndex });
    }
    void nodes; void edges;
  },

  redo: () => {
    const { history, historyIndex } = get();
    const newIndex = historyIndex + 1;
    if (newIndex >= history.length) return;
    const entry = history[newIndex];
    set({ nodes: entry.nodes, edges: entry.edges, historyIndex: newIndex });
  },

  enterPresentation: () => {
    const { nodes, edges } = get();

    type ItemRecord = { type: 'node' | 'edge'; id: string; label: string; showAtStep: number; hideAtStep?: number };
    const allItems: ItemRecord[] = [];

    nodes.forEach((n) => {
      const d = n.data as Record<string, unknown>;
      const show = d.showAtStep as number | undefined;
      if (show !== undefined && show > 0) {
        allItems.push({
          type: 'node', id: n.id,
          label: (d.label as string) ?? n.id,
          showAtStep: show,
          hideAtStep: d.hideAtStep as number | undefined,
        });
      }
    });
    edges.forEach((e) => {
      const d = (e.data ?? {}) as Record<string, unknown>;
      const show = d.showAtStep as number | undefined;
      if (show !== undefined && show > 0) {
        allItems.push({
          type: 'edge', id: e.id,
          label: (d.label as string) || `${e.source} → ${e.target}`,
          showAtStep: show,
          hideAtStep: d.hideAtStep as number | undefined,
        });
      }
    });

    if (allItems.length === 0) {
      const orderedNodes = [...nodes].sort((a, b) => {
        const dy = a.position.y - b.position.y;
        return Math.abs(dy) > 30 ? dy : a.position.x - b.position.x;
      });
      const fallbackSteps: PresentationStep[] = [
        ...orderedNodes.map((n) => ([{
          type: 'node' as const,
          id: n.id,
          label: (n.data as Record<string, unknown>).label as string ?? n.id,
        }])),
        ...edges.map((e) => ([{
          type: 'edge' as const,
          id: e.id,
          label: (e.data as Record<string, unknown>)?.label as string || `${e.source} → ${e.target}`,
        }])),
      ];
      const fallbackTriggers = fallbackSteps.map((_, i) => i + 1);
      set({ presentationMode: true, presentationStep: -1, presentationSteps: fallbackSteps, presentationTriggers: fallbackTriggers });
      return;
    }

    // Collect all unique trigger numbers from both show and hide
    const triggerSet = new Set<number>();
    allItems.forEach((item) => {
      triggerSet.add(item.showAtStep);
      if (item.hideAtStep && item.hideAtStep > 0) triggerSet.add(item.hideAtStep);
    });
    const triggers = [...triggerSet].sort((a, b) => a - b);

    // Each trigger step shows items newly appearing at that trigger number
    const steps: PresentationStep[] = triggers.map((t) =>
      allItems
        .filter((item) => item.showAtStep === t)
        .map(({ type, id, label }) => ({ type, id, label }))
    );

    set({ presentationMode: true, presentationStep: -1, presentationSteps: steps, presentationTriggers: triggers });
  },

  exitPresentation: () => {
    set({ presentationMode: false, presentationStep: -1, presentationSteps: [], presentationTriggers: [], hoveredElementId: null });
  },

  setHoveredElement: (id) => {
    set({ hoveredElementId: id });
  },

  loadState: (nodes, edges) => {
    // Reset ID counters based on loaded data to prevent ID collisions
    const maxNodeId = nodes.reduce((max, n) => {
      const match = n.id.match(/^node-(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const maxEdgeId = edges.reduce((max, e) => {
      const match = e.id.match(/^edge-(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    nodeIdCounter = maxNodeId;
    edgeIdCounter = maxEdgeId;

    set({ nodes, edges, history: [], historyIndex: -1, selectedNodes: [], selectedEdges: [] });
  },

  nextStep: () => {
    const { presentationStep, presentationSteps } = get();
    const next = Math.min(presentationStep + 1, presentationSteps.length - 1);
    set({ presentationStep: next });
  },

  prevStep: () => {
    const { presentationStep } = get();
    const prev = Math.max(presentationStep - 1, -1);
    set({ presentationStep: prev });
  },
}));
