import { useDiagramStore, computeHiddenElements, type RectNodeData, type LabeledBoxNodeData, type ZoneNodeData, type TableNodeData, type TreeNodeData, type BranchToggleNodeData, type EdgeData } from '../../store/diagramStore';

const PRESET_COLORS = [
  '#ffffff', '#f1f5f9', '#fef9c3', '#fef3c7',
  '#fee2e2', '#fce7f3', '#ede9fe', '#dbeafe',
  '#dcfce7', '#d1fae5', '#1e293b', '#000000',
];

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            title={c}
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              background: c,
              border: value === c ? '2px solid #3b82f6' : '1.5px solid #d1d5db',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />
        ))}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          title="Custom color"
          style={{
            width: 22,
            height: 22,
            borderRadius: 4,
            border: '1.5px solid #d1d5db',
            padding: 1,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-gray-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberInput({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-gray-500">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 accent-blue-600"
        />
        <span className="text-xs text-gray-500 w-5 text-right">{value}</span>
      </div>
    </div>
  );
}

export function PropertiesPanel() {
  const { nodes, edges, selectedNodes, selectedEdges, updateNodeData, updateEdgeData, toggleTreeCollapsed, setTreeItems, toggleBranchCollapsed } = useDiagramStore();

  const selectedNode = selectedNodes.length === 1 ? nodes.find((n) => n.id === selectedNodes[0]) : null;
  const selectedEdge = selectedEdges.length === 1 ? edges.find((e) => e.id === selectedEdges[0]) : null;

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            Click a box or arrow to edit its properties
          </p>
        </div>
      </div>
    );
  }

  if (selectedNode) {
    if (selectedNode.type === 'tableNode') {
      const d = selectedNode.data as unknown as TableNodeData;
      const update = (patch: Partial<TableNodeData>) => updateNodeData(selectedNode.id, patch);
      const rows = d.cells?.length ?? 0;
      const cols = d.cells?.[0]?.length ?? 0;

      return (
        <div className="w-64 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Table Properties</h3>
            <p className="text-xs text-gray-400 mt-0.5">ID: {selectedNode.id}</p>
          </div>

          <div className="p-4 space-y-4">
            {/* Structure */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Structure</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Rows × Columns</span>
                <span className="text-xs font-mono text-gray-600">{rows} × {cols}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Use the +/− buttons on the selected table to add or remove rows and columns.</p>
            </div>

            {/* Header row toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Header row</p>
                <p className="text-xs text-gray-400">Style the first row as header</p>
              </div>
              <button
                onClick={() => update({ headerRow: !d.headerRow })}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
                style={{ background: d.headerRow ? '#0d9488' : '#d1d5db' }}
              >
                <span
                  className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5"
                  style={{ transform: d.headerRow ? 'translateX(18px)' : 'translateX(2px)' }}
                />
              </button>
            </div>

            {/* Presentation steps */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: '#7c3aed', color: 'white', fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: '14px' }}>P</span>
                Presentation Steps
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-gray-500 shrink-0">Show at step</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      value={d.showAtStep ?? ''}
                      placeholder="—"
                      onChange={(e) => update({ showAtStep: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="w-16 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 text-center"
                    />
                    {(d.showAtStep ?? 0) > 0 && (
                      <button onClick={() => update({ showAtStep: undefined, hideAtStep: undefined })} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-gray-500 shrink-0">Hide at step</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      value={d.hideAtStep ?? ''}
                      placeholder="never"
                      disabled={!d.showAtStep || d.showAtStep <= 0}
                      onChange={(e) => update({ hideAtStep: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="w-16 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 text-center disabled:opacity-40"
                    />
                    {(d.hideAtStep ?? 0) > 0 && (
                      <button onClick={() => update({ hideAtStep: undefined })} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Colors</p>
              <div className="space-y-2">
                <ColorInput label="Cell background" value={d.bgColor} onChange={(v) => update({ bgColor: v })} />
                <ColorInput label="Header background" value={d.headerBgColor} onChange={(v) => update({ headerBgColor: v })} />
                <ColorInput label="Border" value={d.borderColor} onChange={(v) => update({ borderColor: v })} />
                <ColorInput label="Text" value={d.textColor} onChange={(v) => update({ textColor: v })} />
              </div>
            </div>

            {/* Typography */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Text</p>
              <NumberInput label="Font size" value={d.fontSize} min={8} max={36} onChange={(v) => update({ fontSize: v })} />
            </div>

            {/* Layer */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">On Top</p>
                <p className="text-xs text-gray-400">Always above other elements</p>
              </div>
              <button
                onClick={() => update({ onTop: !d.onTop })}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
                style={{ background: d.onTop ? '#7c3aed' : '#d1d5db' }}
              >
                <span
                  className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5"
                  style={{ transform: d.onTop ? 'translateX(18px)' : 'translateX(2px)' }}
                />
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (selectedNode.type === 'branchToggleNode') {
      const d = selectedNode.data as unknown as BranchToggleNodeData;
      const update = (patch: Partial<BranchToggleNodeData>) => updateNodeData(selectedNode.id, patch);
      const outgoing = edges.filter((e) => e.source === selectedNode.id).length;
      const affected = d.collapsed
        ? computeHiddenElements(nodes, edges).hiddenNodes.size
        : computeHiddenElements(
            nodes.map((n) =>
              n.id === selectedNode.id
                ? { ...n, data: { ...n.data, collapsed: true } as unknown as Record<string, unknown> }
                : n
            ),
            edges
          ).hiddenNodes.size;

      return (
        <div className="w-64 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Toggle Button</h3>
            <p className="text-xs text-gray-400 mt-0.5">ID: {selectedNode.id}</p>
          </div>

          <div className="p-4 space-y-4">
            {/* Label */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Label</label>
              <input
                type="text"
                value={d.label}
                onChange={(e) => update({ label: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>

            {/* Wiring hint */}
            <div className="rounded border border-gray-200 bg-gray-50 p-2.5">
              {outgoing === 0 ? (
                <p className="text-xs text-amber-600 leading-relaxed">
                  Nút này chưa nối tới nhánh nào. Kéo một mũi tên <strong>từ nút này</strong> tới node đầu nhánh để nó có tác dụng.
                </p>
              ) : (
                <p className="text-xs text-gray-500 leading-relaxed">
                  Nối tới <strong>{outgoing}</strong> nhánh · thu gọn sẽ ẩn <strong>{affected}</strong> node phía sau.
                </p>
              )}
            </div>

            {/* Collapsed toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Thu gọn</p>
                <p className="text-xs text-gray-400">Ẩn nhánh phía sau nút</p>
              </div>
              <button
                onClick={() => toggleBranchCollapsed(selectedNode.id)}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
                style={{ background: d.collapsed ? '#0f766e' : '#d1d5db' }}
              >
                <span
                  className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5"
                  style={{ transform: d.collapsed ? 'translateX(18px)' : 'translateX(2px)' }}
                />
              </button>
            </div>

            {/* Presentation steps */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: '#7c3aed', color: 'white', fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: '14px' }}>P</span>
                Presentation Steps
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-gray-500 shrink-0">Show at step</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      value={d.showAtStep ?? ''}
                      placeholder="—"
                      onChange={(e) => update({ showAtStep: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="w-16 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 text-center"
                    />
                    {(d.showAtStep ?? 0) > 0 && (
                      <button onClick={() => update({ showAtStep: undefined, hideAtStep: undefined })} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-gray-500 shrink-0">Hide at step</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      value={d.hideAtStep ?? ''}
                      placeholder="never"
                      disabled={!d.showAtStep || d.showAtStep <= 0}
                      onChange={(e) => update({ hideAtStep: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="w-16 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 text-center disabled:opacity-40"
                    />
                    {(d.hideAtStep ?? 0) > 0 && (
                      <button onClick={() => update({ hideAtStep: undefined })} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Colors</p>
              <div className="space-y-2">
                <ColorInput label="Background (đang mở)" value={d.bgColor} onChange={(v) => update({ bgColor: v })} />
                <ColorInput label="Background (thu gọn)" value={d.collapsedBgColor} onChange={(v) => update({ collapsedBgColor: v })} />
                <ColorInput label="Text" value={d.textColor} onChange={(v) => update({ textColor: v })} />
              </div>
            </div>

            {/* Shape */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Shape</p>
              <div className="space-y-2">
                <NumberInput label="Font size" value={d.fontSize} min={8} max={28} onChange={(v) => update({ fontSize: v })} />
                <NumberInput label="Radius" value={d.borderRadius} min={0} max={30} onChange={(v) => update({ borderRadius: v })} />
              </div>
            </div>

            {/* Layer */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">On Top</p>
                <p className="text-xs text-gray-400">Always above other elements</p>
              </div>
              <button
                onClick={() => update({ onTop: !d.onTop })}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
                style={{ background: d.onTop ? '#7c3aed' : '#d1d5db' }}
              >
                <span
                  className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5"
                  style={{ transform: d.onTop ? 'translateX(18px)' : 'translateX(2px)' }}
                />
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (selectedNode.type === 'treeNode') {
      const d = selectedNode.data as unknown as TreeNodeData;
      const update = (patch: Partial<TreeNodeData>) => updateNodeData(selectedNode.id, patch);
      const items = d.items ?? [];

      return (
        <div className="w-64 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Tree Properties</h3>
            <p className="text-xs text-gray-400 mt-0.5">ID: {selectedNode.id}</p>
          </div>

          <div className="p-4 space-y-4">
            {/* Header label */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Title (header)</label>
              <input
                type="text"
                value={d.label}
                onChange={(e) => update({ label: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>

            {/* Branches */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Nhánh ({items.length})</p>
              <div className="space-y-1.5">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const next = [...items];
                        next[i] = e.target.value;
                        update({ items: next });
                      }}
                      className="flex-1 min-w-0 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <button
                      onClick={() => setTreeItems(selectedNode.id, items.filter((_, j) => j !== i))}
                      disabled={items.length <= 1}
                      title="Xóa nhánh"
                      className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed px-1"
                    >✕</button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setTreeItems(selectedNode.id, [...items, `Nhánh ${items.length + 1}`])}
                className="mt-2 w-full text-xs font-medium text-indigo-600 border border-indigo-200 rounded py-1 hover:bg-indigo-50 transition-colors"
              >+ Thêm nhánh</button>
            </div>

            {/* Collapsed state */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Thu gọn</p>
                <p className="text-xs text-gray-400">Ẩn các nhánh bên trong</p>
              </div>
              <button
                onClick={() => toggleTreeCollapsed(selectedNode.id)}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
                style={{ background: d.collapsed ? '#4f46e5' : '#d1d5db' }}
              >
                <span
                  className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5"
                  style={{ transform: d.collapsed ? 'translateX(18px)' : 'translateX(2px)' }}
                />
              </button>
            </div>

            {/* Presentation steps */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: '#7c3aed', color: 'white', fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: '14px' }}>P</span>
                Presentation Steps
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-gray-500 shrink-0">Show at step</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      value={d.showAtStep ?? ''}
                      placeholder="—"
                      onChange={(e) => update({ showAtStep: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="w-16 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 text-center"
                    />
                    {(d.showAtStep ?? 0) > 0 && (
                      <button onClick={() => update({ showAtStep: undefined, hideAtStep: undefined })} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-gray-500 shrink-0">Hide at step</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      value={d.hideAtStep ?? ''}
                      placeholder="never"
                      disabled={!d.showAtStep || d.showAtStep <= 0}
                      onChange={(e) => update({ hideAtStep: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="w-16 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 text-center disabled:opacity-40"
                    />
                    {(d.hideAtStep ?? 0) > 0 && (
                      <button onClick={() => update({ hideAtStep: undefined })} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Colors</p>
              <div className="space-y-2">
                <ColorInput label="Header background" value={d.headerBgColor} onChange={(v) => update({ headerBgColor: v })} />
                <ColorInput label="Body background" value={d.bgColor} onChange={(v) => update({ bgColor: v })} />
                <ColorInput label="Border" value={d.borderColor} onChange={(v) => update({ borderColor: v })} />
                <ColorInput label="Branch text" value={d.textColor} onChange={(v) => update({ textColor: v })} />
              </div>
            </div>

            {/* Typography */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Text</p>
              <div className="space-y-2">
                <NumberInput label="Header font size" value={d.fontSize} min={8} max={36} onChange={(v) => update({ fontSize: v })} />
                <NumberInput label="Branch font size" value={d.itemFontSize} min={8} max={36} onChange={(v) => update({ itemFontSize: v })} />
              </div>
            </div>

            {/* Border */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Border</p>
              <div className="space-y-2">
                <NumberInput label="Radius" value={d.borderRadius ?? 8} min={0} max={60} onChange={(v) => update({ borderRadius: v })} />
                <NumberInput label="Width" value={d.borderWidth} min={0} max={8} onChange={(v) => update({ borderWidth: v })} />
                <SelectInput
                  label="Style"
                  value={d.borderStyle}
                  options={[
                    { value: 'solid', label: 'Solid' },
                    { value: 'dashed', label: 'Dashed' },
                    { value: 'dotted', label: 'Dotted' },
                  ]}
                  onChange={(v) => update({ borderStyle: v as TreeNodeData['borderStyle'] })}
                />
              </div>
            </div>

            {/* Layer */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">On Top</p>
                <p className="text-xs text-gray-400">Always above other elements</p>
              </div>
              <button
                onClick={() => update({ onTop: !d.onTop })}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
                style={{ background: d.onTop ? '#7c3aed' : '#d1d5db' }}
              >
                <span
                  className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5"
                  style={{ transform: d.onTop ? 'translateX(18px)' : 'translateX(2px)' }}
                />
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (selectedNode.type === 'zoneNode') {
      const d = selectedNode.data as unknown as ZoneNodeData;
      const update = (patch: Partial<ZoneNodeData>) => updateNodeData(selectedNode.id, patch);

      return (
        <div className="w-64 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Zone Properties</h3>
            <p className="text-xs text-gray-400 mt-0.5">ID: {selectedNode.id}</p>
          </div>

          <div className="p-4 space-y-4">
            {/* Label */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Label</label>
              <input
                type="text"
                value={d.label}
                onChange={(e) => update({ label: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>

            {/* Presentation steps */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: '#7c3aed', color: 'white', fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: '14px' }}>P</span>
                Presentation Steps
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-gray-500 shrink-0">Show at step</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      value={d.showAtStep ?? ''}
                      placeholder="—"
                      onChange={(e) => update({ showAtStep: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="w-16 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 text-center"
                    />
                    {(d.showAtStep ?? 0) > 0 && (
                      <button onClick={() => update({ showAtStep: undefined, hideAtStep: undefined })} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-gray-500 shrink-0">Hide at step</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      value={d.hideAtStep ?? ''}
                      placeholder="never"
                      disabled={!d.showAtStep || d.showAtStep <= 0}
                      onChange={(e) => update({ hideAtStep: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="w-16 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 text-center disabled:opacity-40"
                    />
                    {(d.hideAtStep ?? 0) > 0 && (
                      <button onClick={() => update({ hideAtStep: undefined })} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Colors</p>
              <div className="space-y-2">
                <ColorInput label="Border" value={d.borderColor} onChange={(v) => update({ borderColor: v })} />
                <ColorInput label="Fill" value={d.bgColor} onChange={(v) => update({ bgColor: v })} />
                <ColorInput label="Label background" value={d.labelBgColor} onChange={(v) => update({ labelBgColor: v })} />
                <ColorInput label="Label text" value={d.textColor} onChange={(v) => update({ textColor: v })} />
              </div>
            </div>

            {/* Typography */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Text</p>
              <NumberInput label="Font size" value={d.fontSize} min={8} max={36} onChange={(v) => update({ fontSize: v })} />
            </div>

            {/* Border */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Border</p>
              <div className="space-y-2">
                <NumberInput label="Radius" value={d.borderRadius ?? 8} min={0} max={60} onChange={(v) => update({ borderRadius: v })} />
                <NumberInput label="Width" value={d.borderWidth} min={1} max={8} onChange={(v) => update({ borderWidth: v })} />
                <SelectInput
                  label="Style"
                  value={d.borderStyle}
                  options={[
                    { value: 'dashed', label: 'Dashed' },
                    { value: 'dotted', label: 'Dotted' },
                    { value: 'solid', label: 'Solid' },
                  ]}
                  onChange={(v) => update({ borderStyle: v as ZoneNodeData['borderStyle'] })}
                />
              </div>
            </div>

            {/* Layer */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">On Top</p>
                <p className="text-xs text-gray-400">Always above other elements</p>
              </div>
              <button
                onClick={() => update({ onTop: !d.onTop })}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
                style={{ background: d.onTop ? '#7c3aed' : '#d1d5db' }}
              >
                <span
                  className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5"
                  style={{ transform: d.onTop ? 'translateX(18px)' : 'translateX(2px)' }}
                />
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (selectedNode.type === 'labeledBoxNode') {
      const d = selectedNode.data as unknown as LabeledBoxNodeData;
      const update = (patch: Partial<LabeledBoxNodeData>) => updateNodeData(selectedNode.id, patch);

      return (
        <div className="w-64 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Labeled Box Properties</h3>
            <p className="text-xs text-gray-400 mt-0.5">ID: {selectedNode.id}</p>
          </div>

          <div className="p-4 space-y-4">
            {/* Label / Title */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Title (header)</label>
              <input
                type="text"
                value={d.label}
                onChange={(e) => update({ label: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>

            {/* Body text */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Body text</label>
              <textarea
                value={d.bodyText}
                onChange={(e) => update({ bodyText: e.target.value })}
                rows={3}
                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
              />
            </div>

            {/* Presentation steps */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: '#7c3aed', color: 'white', fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: '14px' }}>P</span>
                Presentation Steps
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-gray-500 shrink-0">Show at step</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      value={d.showAtStep ?? ''}
                      placeholder="—"
                      onChange={(e) => update({ showAtStep: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="w-16 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 text-center"
                    />
                    {(d.showAtStep ?? 0) > 0 && (
                      <button onClick={() => update({ showAtStep: undefined, hideAtStep: undefined })} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-gray-500 shrink-0">Hide at step</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      value={d.hideAtStep ?? ''}
                      placeholder="never"
                      disabled={!d.showAtStep || d.showAtStep <= 0}
                      onChange={(e) => update({ hideAtStep: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="w-16 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 text-center disabled:opacity-40"
                    />
                    {(d.hideAtStep ?? 0) > 0 && (
                      <button onClick={() => update({ hideAtStep: undefined })} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Colors</p>
              <div className="space-y-2">
                <ColorInput label="Header background" value={d.headerBgColor} onChange={(v) => update({ headerBgColor: v })} />
                <ColorInput label="Body background" value={d.bgColor} onChange={(v) => update({ bgColor: v })} />
                <ColorInput label="Border" value={d.borderColor} onChange={(v) => update({ borderColor: v })} />
                <ColorInput label="Body text" value={d.textColor} onChange={(v) => update({ textColor: v })} />
              </div>
            </div>

            {/* Typography */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Text</p>
              <div className="space-y-2">
                <NumberInput label="Header font size" value={d.fontSize} min={8} max={36} onChange={(v) => update({ fontSize: v })} />
                <NumberInput label="Body font size" value={d.bodyFontSize} min={8} max={36} onChange={(v) => update({ bodyFontSize: v })} />
              </div>
            </div>

            {/* Border */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Border</p>
              <div className="space-y-2">
                <NumberInput label="Radius" value={d.borderRadius ?? 8} min={0} max={60} onChange={(v) => update({ borderRadius: v })} />
                <NumberInput label="Width" value={d.borderWidth} min={0} max={8} onChange={(v) => update({ borderWidth: v })} />
                <SelectInput
                  label="Style"
                  value={d.borderStyle}
                  options={[
                    { value: 'solid', label: 'Solid' },
                    { value: 'dashed', label: 'Dashed' },
                    { value: 'dotted', label: 'Dotted' },
                  ]}
                  onChange={(v) => update({ borderStyle: v as LabeledBoxNodeData['borderStyle'] })}
                />
              </div>
            </div>

            {/* Layer */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">On Top</p>
                <p className="text-xs text-gray-400">Always above other elements</p>
              </div>
              <button
                onClick={() => update({ onTop: !d.onTop })}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
                style={{ background: d.onTop ? '#7c3aed' : '#d1d5db' }}
              >
                <span
                  className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5"
                  style={{ transform: d.onTop ? 'translateX(18px)' : 'translateX(2px)' }}
                />
              </button>
            </div>
          </div>
        </div>
      );
    }

    const d = selectedNode.data as unknown as RectNodeData;
    const update = (patch: Partial<RectNodeData>) => updateNodeData(selectedNode.id, patch);

    return (
      <div className="w-64 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Box Properties</h3>
          <p className="text-xs text-gray-400 mt-0.5">ID: {selectedNode.id}</p>
        </div>

        <div className="p-4 space-y-4">
          {/* Label */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Label</label>
            <input
              type="text"
              value={d.label}
              onChange={(e) => update({ label: e.target.value })}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* Presentation steps */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
              <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: '#7c3aed', color: 'white', fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: '14px' }}>P</span>
              Presentation Steps
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs text-gray-500 shrink-0">Show at step</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    value={d.showAtStep ?? ''}
                    placeholder="—"
                    onChange={(e) => update({ showAtStep: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="w-16 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 text-center"
                  />
                  {(d.showAtStep ?? 0) > 0 && (
                    <button
                      onClick={() => update({ showAtStep: undefined, hideAtStep: undefined })}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove from presentation"
                    >✕</button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs text-gray-500 shrink-0">Hide at step</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    value={d.hideAtStep ?? ''}
                    placeholder="never"
                    disabled={!d.showAtStep || d.showAtStep <= 0}
                    onChange={(e) => update({ hideAtStep: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="w-16 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 text-center disabled:opacity-40"
                  />
                  {(d.hideAtStep ?? 0) > 0 && (
                    <button
                      onClick={() => update({ hideAtStep: undefined })}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      title="Never hide"
                    >✕</button>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">Empty = not in presentation / never hide</p>
          </div>

          {/* Colors */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Colors</p>
            <div className="space-y-2">
              <ColorInput label="Background" value={d.bgColor} onChange={(v) => update({ bgColor: v })} />
              <ColorInput label="Border" value={d.borderColor} onChange={(v) => update({ borderColor: v })} />
              <ColorInput label="Text" value={d.textColor} onChange={(v) => update({ textColor: v })} />
            </div>
          </div>

          {/* Layer */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">On Top</p>
              <p className="text-xs text-gray-400">Always above other elements</p>
            </div>
            <button
              onClick={() => update({ onTop: !d.onTop })}
              className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
              style={{ background: d.onTop ? '#7c3aed' : '#d1d5db' }}
            >
              <span
                className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5"
                style={{ transform: d.onTop ? 'translateX(18px)' : 'translateX(2px)' }}
              />
            </button>
          </div>

          {/* Typography */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Text</p>
            <NumberInput label="Font size" value={d.fontSize} min={8} max={72} onChange={(v) => update({ fontSize: v })} />
          </div>

          {/* Border */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Border</p>
            <div className="space-y-2">
              <NumberInput label="Radius" value={d.borderRadius ?? 8} min={0} max={60} onChange={(v) => update({ borderRadius: v })} />
              <NumberInput label="Width" value={d.borderWidth} min={0} max={8} onChange={(v) => update({ borderWidth: v })} />
              <SelectInput
                label="Style"
                value={d.borderStyle}
                options={[
                  { value: 'solid', label: 'Solid' },
                  { value: 'dashed', label: 'Dashed' },
                  { value: 'dotted', label: 'Dotted' },
                ]}
                onChange={(v) => update({ borderStyle: v as RectNodeData['borderStyle'] })}
              />
            </div>
          </div>

          {/* Size info */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Size</p>
            <div className="text-xs text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Width</span>
                <span className="font-mono">{Math.round(selectedNode.measured?.width ?? selectedNode.width ?? 140)}px</span>
              </div>
              <div className="flex justify-between">
                <span>Height</span>
                <span className="font-mono">{Math.round(selectedNode.measured?.height ?? selectedNode.height ?? 60)}px</span>
              </div>
              <div className="flex justify-between">
                <span>X</span>
                <span className="font-mono">{Math.round(selectedNode.position.x)}px</span>
              </div>
              <div className="flex justify-between">
                <span>Y</span>
                <span className="font-mono">{Math.round(selectedNode.position.y)}px</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedEdge) {
    const d = selectedEdge.data as unknown as EdgeData;
    const update = (patch: Partial<EdgeData>) => updateEdgeData(selectedEdge.id, patch);

    return (
      <div className="w-64 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Arrow Properties</h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Label */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-500">Label</label>
              {((d.labelOffsetX ?? 0) !== 0 || (d.labelOffsetY ?? 0) !== 0) && (
                <button
                  onClick={() => update({ labelOffsetX: 0, labelOffsetY: 0 })}
                  className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                  title="Reset label position to center"
                >
                  Reset vị trí
                </button>
              )}
            </div>
            <input
              type="text"
              value={d.label ?? ''}
              onChange={(e) => update({ label: e.target.value })}
              placeholder="Optional label..."
              className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* Presentation steps */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
              <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: '#7c3aed', color: 'white', fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: '14px' }}>P</span>
              Presentation Steps
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs text-gray-500 shrink-0">Show at step</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    value={d.showAtStep ?? ''}
                    placeholder="—"
                    onChange={(e) => update({ showAtStep: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="w-16 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 text-center"
                  />
                  {(d.showAtStep ?? 0) > 0 && (
                    <button
                      onClick={() => update({ showAtStep: undefined, hideAtStep: undefined })}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove from presentation"
                    >✕</button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs text-gray-500 shrink-0">Hide at step</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    value={d.hideAtStep ?? ''}
                    placeholder="never"
                    disabled={!d.showAtStep || d.showAtStep <= 0}
                    onChange={(e) => update({ hideAtStep: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="w-16 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 text-center disabled:opacity-40"
                  />
                  {(d.hideAtStep ?? 0) > 0 && (
                    <button
                      onClick={() => update({ hideAtStep: undefined })}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      title="Never hide"
                    >✕</button>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">Empty = not in presentation / never hide</p>
          </div>

          {/* Animation */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Presentation Effect</p>
            <SelectInput
              label="Animation"
              value={d.animationEffect ?? 'none'}
              options={[
                { value: 'arrow', label: 'Moving arrow (default)' },
                { value: 'dot', label: 'Traveling dot' },
                { value: 'none', label: 'None' },
              ]}
              onChange={(v) => update({ animationEffect: v as EdgeData['animationEffect'] })}
            />
            <p className="text-xs text-gray-400 mt-1">Plays when revealed in presentation</p>
          </div>

          {/* Path style */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Path Style</p>
            <div className="space-y-2">
              <SelectInput
                label="Route"
                value={d.edgeType}
                options={[
                  { value: 'smoothstep', label: 'Smooth Step (L-shape)' },
                  { value: 'bezier', label: 'Bezier (curve)' },
                  { value: 'straight', label: 'Straight' },
                ]}
                onChange={(v) => update({ edgeType: v as EdgeData['edgeType'] })}
              />
              <SelectInput
                label="Line"
                value={d.lineStyle}
                options={[
                  { value: 'solid', label: 'Solid' },
                  { value: 'dashed', label: 'Dashed' },
                ]}
                onChange={(v) => update({ lineStyle: v as EdgeData['lineStyle'] })}
              />
            </div>
          </div>

          {/* Arrow */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Arrow</p>
            <div className="space-y-2">
              <SelectInput
                label="Type"
                value={d.arrowType}
                options={[
                  { value: 'arrowclosed', label: 'Filled arrow' },
                  { value: 'arrow', label: 'Open arrow' },
                  { value: 'none', label: 'None' },
                ]}
                onChange={(v) => update({ arrowType: v as EdgeData['arrowType'] })}
              />
              <NumberInput
                label="Line width"
                value={d.strokeWidth ?? 1}
                min={1}
                max={10}
                onChange={(v) => update({ strokeWidth: v })}
              />
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-500">Bidirectional</label>
                <input
                  type="checkbox"
                  checked={d.bidirectional}
                  onChange={(e) => update({ bidirectional: e.target.checked })}
                  className="accent-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Color */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Color</p>
            <ColorInput label="Arrow color" value={d.color} onChange={(v) => update({ color: v })} />
          </div>

          {/* Layer */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">On Top</p>
              <p className="text-xs text-gray-400">Always above other elements</p>
            </div>
            <button
              onClick={() => update({ onTop: !d.onTop })}
              className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
              style={{ background: d.onTop ? '#7c3aed' : '#d1d5db' }}
            >
              <span
                className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5"
                style={{ transform: d.onTop ? 'translateX(18px)' : 'translateX(2px)' }}
              />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
