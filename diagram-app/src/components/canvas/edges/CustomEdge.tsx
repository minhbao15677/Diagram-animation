import { useEffect, useRef, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  getBezierPath,
  getStraightPath,
  useStore,
  type EdgeProps,
} from '@xyflow/react';
import type { EdgeData } from '../../../store/diagramStore';
import { useDiagramStore } from '../../../store/diagramStore';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  label,
}: EdgeProps) {
  const edgeData = (data as unknown as EdgeData) ?? {
    edgeType: 'smoothstep',
    arrowType: 'arrowclosed',
    color: '#64748b',
    lineStyle: 'solid',
    bidirectional: false,
    label: '',
    animationEffect: 'arrow',
  };

  const { presentationMode, presentationStep, presentationSteps, presentationTriggers, updateEdgeData, pushHistory } = useDiagramStore();
  const zoom = useStore((s) => s.transform[2]);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [pathDrag, setPathDrag] = useState<{ x: number; y: number } | null>(null);

  // Offset that shifts the whole edge up/down/left/right
  const pathOffX = pathDrag?.x ?? edgeData.pathOffsetX ?? 0;
  const pathOffY = pathDrag?.y ?? edgeData.pathOffsetY ?? 0;

  const pathParams = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX: targetX,
    targetY: targetY,
    targetPosition,
  };

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (edgeData.edgeType === 'bezier') {
    [edgePath, labelX, labelY] = getBezierPath(pathParams);
  } else if (edgeData.edgeType === 'straight') {
    [edgePath, labelX, labelY] = getStraightPath(pathParams);
  } else {
    [edgePath, labelX, labelY] = getSmoothStepPath({ ...pathParams, borderRadius: 8 });
  }

  // Shift the middle of the path by the offset while keeping endpoints anchored
  if (pathOffX !== 0 || pathOffY !== 0) {
    const midX = (sourceX + targetX) / 2 + pathOffX;
    const midY = (sourceY + targetY) / 2 + pathOffY;
    edgePath = `M ${sourceX},${sourceY} Q ${midX},${midY} ${targetX},${targetY}`;
    labelX = 0.25 * sourceX + 0.5 * midX + 0.25 * targetX;
    labelY = 0.25 * sourceY + 0.5 * midY + 0.25 * targetY;
  }

  const color = selected ? '#3b82f6' : (edgeData.color ?? '#64748b');
  const strokeDash = edgeData.lineStyle === 'dashed' ? '6,4' : undefined;
  const baseWidth = edgeData.strokeWidth ?? 1;

  const markerEnd =
    edgeData.arrowType !== 'none'
      ? `url(#${edgeData.arrowType === 'arrowclosed' ? 'arrow-closed' : 'arrow-open'}-${id})`
      : undefined;

  const markerStart =
    edgeData.bidirectional && edgeData.arrowType !== 'none'
      ? `url(#${edgeData.arrowType === 'arrowclosed' ? 'arrow-closed-start' : 'arrow-open-start'}-${id})`
      : undefined;

  // Compute final label position including any drag or saved offset
  const offX = dragOffset?.x ?? edgeData.labelOffsetX ?? 0;
  const offY = dragOffset?.y ?? edgeData.labelOffsetY ?? 0;
  const finalLabelX = labelX + offX;
  const finalLabelY = labelY + offY;

  const handleLabelPointerDown = (e: React.PointerEvent) => {
    if (presentationMode) return;
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startOffX = edgeData.labelOffsetX ?? 0;
    const startOffY = edgeData.labelOffsetY ?? 0;
    let moved = false;

    const onMove = (ev: PointerEvent) => {
      if (!moved) {
        pushHistory();
        moved = true;
      }
      const newOffX = startOffX + (ev.clientX - startX) / zoom;
      const newOffY = startOffY + (ev.clientY - startY) / zoom;
      setDragOffset({ x: newOffX, y: newOffY });
    };

    const onUp = (ev: PointerEvent) => {
      const newOffX = startOffX + (ev.clientX - startX) / zoom;
      const newOffY = startOffY + (ev.clientY - startY) / zoom;
      updateEdgeData(id, { labelOffsetX: newOffX, labelOffsetY: newOffY });
      setDragOffset(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Drag the whole edge up/down/left/right via a mid handle
  const handlePathPointerDown = (e: React.PointerEvent) => {
    if (presentationMode) return;
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startOffX = edgeData.pathOffsetX ?? 0;
    const startOffY = edgeData.pathOffsetY ?? 0;
    let moved = false;

    const onMove = (ev: PointerEvent) => {
      if (!moved) {
        pushHistory();
        moved = true;
      }
      const nx = startOffX + (ev.clientX - startX) / zoom;
      const ny = startOffY + (ev.clientY - startY) / zoom;
      setPathDrag({ x: nx, y: ny });
    };
    const onUp = (ev: PointerEvent) => {
      const nx = startOffX + (ev.clientX - startX) / zoom;
      const ny = startOffY + (ev.clientY - startY) / zoom;
      updateEdgeData(id, { pathOffsetX: nx, pathOffsetY: ny });
      setPathDrag(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Double-click the handle to reset the edge back to its default path
  const handlePathDoubleClick = (e: React.MouseEvent) => {
    if (presentationMode) return;
    e.stopPropagation();
    pushHistory();
    updateEdgeData(id, { pathOffsetX: 0, pathOffsetY: 0 });
  };

  const displayLabel = edgeData.label || label;

  const currentTrigger = presentationMode && presentationStep >= 0
    ? (presentationTriggers[presentationStep] ?? -1)
    : -1;

  const showAtStep = edgeData.showAtStep;
  const hideAtStep = edgeData.hideAtStep;

  const isVisible = presentationMode ? (() => {
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
  })() : true;

  const isCurrent = presentationMode && presentationStep >= 0 &&
    (presentationSteps[presentationStep] ?? []).some((item) => item.id === id);

  const animationEffect = edgeData.animationEffect ?? 'arrow';
  const showDotAnimation = isVisible && animationEffect === 'dot';
  const showArrowAnimation = isVisible && isCurrent && animationEffect === 'arrow';

  const dotRef = useRef<SVGCircleElement>(null);
  const arrowRef = useRef<SVGPolygonElement>(null);
  const rafRef = useRef<number | null>(null);

  // Dot animation (continuous loop)
  useEffect(() => {
    if (!showDotAnimation) {
      if (dotRef.current) dotRef.current.style.display = 'none';
      return;
    }

    const duration = 1200;
    const startTime = performance.now();
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', edgePath);
    document.body.appendChild(pathEl);
    const totalLength = pathEl.getTotalLength();

    const animate = (now: number) => {
      const t = ((now - startTime) % duration) / duration;
      const pt = pathEl.getPointAtLength(t * totalLength);
      if (dotRef.current) {
        dotRef.current.setAttribute('cx', String(pt.x));
        dotRef.current.setAttribute('cy', String(pt.y));
        dotRef.current.style.display = 'block';
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (pathEl.parentNode) document.body.removeChild(pathEl);
    };
  }, [showDotAnimation, edgePath]);

  // Arrow animation (run once)
  useEffect(() => {
    if (!showArrowAnimation) {
      if (arrowRef.current) arrowRef.current.style.display = 'none';
      return;
    }

    const duration = 1000;
    const startTime = performance.now();
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', edgePath);
    document.body.appendChild(pathEl);
    const totalLength = pathEl.getTotalLength();

    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const pt = pathEl.getPointAtLength(t * totalLength);
      const ptBehind = pathEl.getPointAtLength(Math.max(0, t * totalLength - 2));
      const angle = Math.atan2(pt.y - ptBehind.y, pt.x - ptBehind.x) * (180 / Math.PI);

      if (arrowRef.current) {
        arrowRef.current.setAttribute('transform', `translate(${pt.x}, ${pt.y}) rotate(${angle})`);
        arrowRef.current.style.display = 'block';
      }
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        document.body.removeChild(pathEl);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (pathEl.parentNode) document.body.removeChild(pathEl);
    };
  }, [showArrowAnimation, edgePath, presentationStep]);

  const edgeOpacity = presentationMode ? (isVisible ? 1 : 0) : 1;

  return (
    <g opacity={edgeOpacity} style={{ transition: 'opacity 0.4s' }}>
      <defs>
        <marker
          id={`arrow-closed-${id}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5.1"
          markerHeight="5.1"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
        <marker
          id={`arrow-open-${id}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5.1"
          markerHeight="5.1"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke={color} strokeWidth="1.5" />
        </marker>
        {edgeData.bidirectional && (
          <>
            <marker
              id={`arrow-closed-start-${id}`}
              viewBox="0 0 10 10"
              refX="1"
              refY="5"
              markerWidth="5.1"
              markerHeight="5.1"
              orient="auto-start-reverse"
            >
              <path d="M 10 0 L 0 5 L 10 10 z" fill={color} />
            </marker>
            <marker
              id={`arrow-open-start-${id}`}
              viewBox="0 0 10 10"
              refX="1"
              refY="5"
              markerWidth="5.1"
              markerHeight="5.1"
              orient="auto-start-reverse"
            >
              <path d="M 10 0 L 0 5 L 10 10" fill="none" stroke={color} strokeWidth="1.5" />
            </marker>
          </>
        )}
      </defs>

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{
          stroke: color,
          strokeWidth: selected ? baseWidth + 0.25 : baseWidth,
          strokeDasharray: strokeDash,
          filter: isCurrent ? 'drop-shadow(0 0 6px rgba(139,92,246,0.9))' : undefined,
          transition: 'filter 0.4s',
        }}
      />

      {/* Mid-handle: drag to shift the whole edge, double-click to reset (editor only) */}
      {!presentationMode && selected && (
        <circle
          cx={labelX}
          cy={labelY}
          r={5}
          fill="#ffffff"
          stroke="#3b82f6"
          strokeWidth={2}
          style={{ cursor: 'move', pointerEvents: 'all' }}
          onPointerDown={handlePathPointerDown}
          onDoubleClick={handlePathDoubleClick}
        />
      )}

      {showDotAnimation && (
        <circle
          ref={dotRef}
          r="6"
          fill={color}
          style={{ display: 'none', filter: 'drop-shadow(0 0 4px rgba(37,99,235,0.7))' }}
        />
      )}

      {showArrowAnimation && (
        // points: tip at (8,0), base corners at (-4,-5) and (-4,5)
        <polygon
          ref={arrowRef}
          points="5.6,0 -2.8,-3.5 -2.8,3.5"
          fill={color}
          style={{ display: 'none', filter: 'drop-shadow(0 0 4px rgba(37,99,235,0.7))' }}
        />
      )}

      {displayLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${finalLabelX}px,${finalLabelY}px)`,
              pointerEvents: 'all',
              opacity: edgeOpacity,
              transition: 'opacity 0.4s',
              zIndex: edgeData.onTop ? 1000 : undefined,
            }}
            className="nodrag nopan"
          >
            <span
              className="px-1.5 py-0.5 rounded text-xs font-medium"
              onPointerDown={handleLabelPointerDown}
              style={{
                background: 'white',
                border: `1px solid ${color}`,
                color: '#374151',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                cursor: presentationMode ? 'default' : 'move',
                userSelect: 'none',
              }}
            >
              {displayLabel}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}

    </g>
  );
}
