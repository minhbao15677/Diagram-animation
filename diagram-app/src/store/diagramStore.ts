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

export type TreeNodeData = {
  label: string;
  items: string[];
  collapsed: boolean;
  expandedHeight?: number;
  bgColor: string;
  headerBgColor: string;
  borderColor: string;
  textColor: string;
  fontSize: number;
  itemFontSize: number;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  borderRadius: number;
  onTop?: boolean;
  showAtStep?: number;
  hideAtStep?: number;
};

export const TREE_HEADER_HEIGHT = 32;
export const TREE_ITEM_HEIGHT = 26;
export const TREE_BODY_PADDING = 10;

export const treeNaturalHeight = (itemCount: number) =>
  TREE_HEADER_HEIGHT + itemCount * TREE_ITEM_HEIGHT + TREE_BODY_PADDING;

export type BranchToggleNodeData = {
  label: string;
  collapsed: boolean;
  bgColor: string;
  collapsedBgColor: string;
  textColor: string;
  fontSize: number;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
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

const nodeBounds = (n: Node) => {
  const w = n.width ?? n.measured?.width ?? 0;
  const h = n.height ?? n.measured?.height ?? 0;
  return { x: n.position.x, y: n.position.y, w, h };
};

/**
 * Which nodes each zone visually contains.
 *
 * Zones have no parentId — a box is "inside" a zone purely by sitting on top of
 * it — so containment is derived from geometry. Only zones can contain, and a
 * node counts as contained when its box is fully within the zone's bounds.
 * Nesting falls out of this naturally: a zone inside a zone is itself contained,
 * so hiding the outer one reaches the inner one's contents through it.
 */
const buildZoneContents = (nodes: Node[]) => {
  const zones = nodes.filter((n) => n.type === 'zoneNode');
  const contents = new Map<string, string[]>();
  if (zones.length === 0) return contents;

  for (const zone of zones) {
    const z = nodeBounds(zone);
    if (z.w <= 0 || z.h <= 0) continue;
    const inside: string[] = [];
    for (const other of nodes) {
      if (other.id === zone.id) continue;
      const o = nodeBounds(other);
      if (o.w <= 0 || o.h <= 0) continue;
      const fits =
        o.x >= z.x && o.y >= z.y &&
        o.x + o.w <= z.x + z.w &&
        o.y + o.h <= z.y + z.h;
      if (fits) inside.push(other.id);
    }
    contents.set(zone.id, inside);
  }
  return contents;
};

/**
 * Nodes/edges hidden by collapsed branch-toggle buttons.
 *
 * The branch is anchored by direction — only edges leaving the button are
 * followed — so a button wired under a parent hides what hangs below it
 * instead of flooding back up into the rest of the diagram. Past that first
 * hop the walk ignores direction, so side-links inside the branch still get
 * hidden. Nested toggles are hidden but not traversed through, keeping what
 * they collapsed as their own business.
 *
 * Reaching a zone also pulls in everything sitting inside it, recursively, so
 * a zone's boxes (and any zone nested within) disappear along with it even
 * though nothing wires them to the button.
 */
export const computeHiddenElements = (nodes: Node[], edges: Edge[]) => {
  const toggleIds = new Set(
    nodes.filter((n) => n.type === 'branchToggleNode').map((n) => n.id)
  );
  const collapsedIds = nodes
    .filter((n) => n.type === 'branchToggleNode' && (n.data as unknown as BranchToggleNodeData)?.collapsed)
    .map((n) => n.id);

  const hiddenNodes = new Set<string>();
  const hiddenEdges = new Set<string>();
  if (collapsedIds.length === 0) return { hiddenNodes, hiddenEdges };

  const adjacency = new Map<string, { edgeId: string; other: string }[]>();
  for (const e of edges) {
    if (!adjacency.has(e.source)) adjacency.set(e.source, []);
    if (!adjacency.has(e.target)) adjacency.set(e.target, []);
    adjacency.get(e.source)!.push({ edgeId: e.id, other: e.target });
    adjacency.get(e.target)!.push({ edgeId: e.id, other: e.source });
  }

  const zoneContents = buildZoneContents(nodes);

  // Tracked per root so a button is only spared from its OWN branch — a nested
  // button collapsed inside another's branch still disappears with its parent.
  const ownBranch = new Map<string, Set<string>>();

  for (const rootId of collapsedIds) {
    const visited = new Set<string>([rootId]);
    const reached = new Set<string>();
    const queue: string[] = [];

    const reach = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      reached.add(id);
      hiddenNodes.add(id);
      // Nested toggles are hidden but not traversed through.
      if (!toggleIds.has(id)) queue.push(id);
    };

    for (const e of edges) {
      if (e.source !== rootId) continue;
      hiddenEdges.add(e.id);
      reach(e.target);
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const { edgeId, other } of adjacency.get(current) ?? []) {
        if (other === rootId) continue;
        hiddenEdges.add(edgeId);
        reach(other);
      }
      // Anything sitting inside this zone goes with it.
      for (const child of zoneContents.get(current) ?? []) {
        if (child === rootId) continue;
        reach(child);
      }
    }

    ownBranch.set(rootId, reached);
  }

  // Keep each collapsed button clickable — unless another button's branch owns
  // it. Must settle before the edge sweep below, which reads final node state.
  for (const id of collapsedIds) {
    const hiddenByOther = collapsedIds.some(
      (other) => other !== id && ownBranch.get(other)?.has(id)
    );
    if (!hiddenByOther) hiddenNodes.delete(id);
  }

  // An edge is only visible if both of its endpoints are — otherwise it would
  // dangle from a hidden zone's contents into empty space.
  for (const e of edges) {
    if (hiddenNodes.has(e.source) || hiddenNodes.has(e.target)) hiddenEdges.add(e.id);
  }

  return { hiddenNodes, hiddenEdges };
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
  addTreeNode: (position?: { x: number; y: number }) => void;
  toggleTreeCollapsed: (nodeId: string) => void;
  setTreeItems: (nodeId: string, items: string[]) => void;
  addBranchToggleNode: (position?: { x: number; y: number }) => void;
  toggleBranchCollapsed: (nodeId: string) => void;
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

const defaultTreeNodeData: TreeNodeData = {
  label: 'Nhóm',
  items: ['Nhánh 1', 'Nhánh 2', 'Nhánh 3'],
  collapsed: false,
  bgColor: '#ffffff',
  headerBgColor: '#4f46e5',
  borderColor: '#4f46e5',
  textColor: '#1e293b',
  fontSize: 13,
  itemFontSize: 12,
  borderWidth: 1.4,
  borderStyle: 'solid',
  borderRadius: 8,
};

const defaultBranchToggleNodeData: BranchToggleNodeData = {
  label: 'Chi tiết',
  collapsed: false,
  bgColor: '#0f766e',
  collapsedBgColor: '#64748b',
  textColor: '#ffffff',
  fontSize: 13,
  borderColor: 'transparent',
  borderWidth: 0,
  borderRadius: 16,
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

  addTreeNode: (position = { x: 150 + Math.random() * 300, y: 150 + Math.random() * 200 }) => {
    get().pushHistory();
    const newNode: Node = {
      id: `node-${++nodeIdCounter}`,
      type: 'treeNode',
      position,
      data: { ...defaultTreeNodeData, items: [...defaultTreeNodeData.items] } as unknown as Record<string, unknown>,
      width: 220,
      height: treeNaturalHeight(defaultTreeNodeData.items.length),
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  toggleTreeCollapsed: (nodeId) => {
    set({
      nodes: get().nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const d = n.data as unknown as TreeNodeData;
        const currentHeight = n.height ?? n.measured?.height ?? treeNaturalHeight(d.items?.length ?? 0);
        if (d.collapsed) {
          const restored = d.expandedHeight ?? treeNaturalHeight(d.items?.length ?? 0);
          return {
            ...n,
            height: restored,
            data: { ...n.data, collapsed: false, expandedHeight: undefined } as unknown as Record<string, unknown>,
          };
        }
        return {
          ...n,
          height: TREE_HEADER_HEIGHT,
          data: { ...n.data, collapsed: true, expandedHeight: currentHeight } as unknown as Record<string, unknown>,
        };
      }),
    });
  },

  setTreeItems: (nodeId, items) => {
    set({
      nodes: get().nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const d = n.data as unknown as TreeNodeData;
        const needed = treeNaturalHeight(items.length);
        const nextData = { ...n.data, items } as unknown as Record<string, unknown>;
        if (d.collapsed) {
          const stored = d.expandedHeight ?? needed;
          return {
            ...n,
            data: { ...nextData, expandedHeight: Math.max(stored, needed) } as unknown as Record<string, unknown>,
          };
        }
        const current = n.height ?? n.measured?.height ?? needed;
        return { ...n, height: Math.max(current, needed), data: nextData };
      }),
    });
  },

  addBranchToggleNode: (position = { x: 150 + Math.random() * 300, y: 150 + Math.random() * 200 }) => {
    get().pushHistory();
    const newNode: Node = {
      id: `node-${++nodeIdCounter}`,
      type: 'branchToggleNode',
      position,
      data: { ...defaultBranchToggleNodeData } as unknown as Record<string, unknown>,
      width: 150,
      height: 34,
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  toggleBranchCollapsed: (nodeId) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                collapsed: !(n.data as unknown as BranchToggleNodeData).collapsed,
              } as unknown as Record<string, unknown>,
            }
          : n
      ),
    });
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
