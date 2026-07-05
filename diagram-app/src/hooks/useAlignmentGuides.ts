import { useState, useCallback, useRef } from 'react';
import type { Node, NodeDragHandler } from '@xyflow/react';
import { useReactFlow } from '@xyflow/react';

const EDGE_SNAP_THRESHOLD = 12;
const CENTER_SNAP_THRESHOLD = 20; // center snaps activate from further away

export type Guides = {
  hLines: number[];
  vLines: number[];
  hCenterLines: number[];
  vCenterLines: number[];
};

function getNodeEdges(n: Node) {
  const w = n.measured?.width ?? (n.width as number) ?? 140;
  const h = n.measured?.height ?? (n.height as number) ?? 60;
  return {
    left: n.position.x,
    right: n.position.x + w,
    centerX: n.position.x + w / 2,
    top: n.position.y,
    bottom: n.position.y + h,
    centerY: n.position.y + h / 2,
  };
}

export function useAlignmentGuides(nodes: Node[]) {
  const [guides, setGuides] = useState<Guides>({ hLines: [], vLines: [], hCenterLines: [], vCenterLines: [] });
  const { updateNode } = useReactFlow();
  const snappedPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  const onNodeDrag: NodeDragHandler = useCallback((_event, _draggedNode, draggedNodes) => {
    const draggedIds = new Set(draggedNodes.map((n) => n.id));
    const others = nodes.filter((n) => !draggedIds.has(n.id));

    const hLines = new Set<number>();
    const vLines = new Set<number>();
    const hCenterLines = new Set<number>();
    const vCenterLines = new Set<number>();

    for (const dragged of draggedNodes) {
      const d = getNodeEdges(dragged);

      let bestSnapX: number | null = null;
      let bestSnapY: number | null = null;
      let minDx = CENTER_SNAP_THRESHOLD;
      let minDy = CENTER_SNAP_THRESHOLD;

      for (const other of others) {
        const o = getNodeEdges(other);

        // Y axis — [fromCoord, toCoord, isCenter]
        // isCenter = true when either coordinate is a centerY (shows orange guide)
        const yChecks: [number, number, boolean][] = [
          [d.top, o.top, false],    [d.top, o.centerY, true],  [d.top, o.bottom, false],
          [d.centerY, o.top, true], [d.centerY, o.centerY, true], [d.centerY, o.bottom, true],
          [d.bottom, o.top, false], [d.bottom, o.centerY, true], [d.bottom, o.bottom, false],
        ];
        for (const [from, to, isCenter] of yChecks) {
          const diff = Math.abs(from - to);
          const threshold = isCenter ? CENTER_SNAP_THRESHOLD : EDGE_SNAP_THRESHOLD;
          if (diff >= threshold) continue;
          if (diff < minDy) {
            minDy = diff;
            bestSnapY = dragged.position.y + (to - from);
            hLines.clear();
            hCenterLines.clear();
            (isCenter ? hCenterLines : hLines).add(to);
          } else if (diff === minDy) {
            (isCenter ? hCenterLines : hLines).add(to);
          }
        }

        // X axis — [fromCoord, toCoord, isCenter]
        const xChecks: [number, number, boolean][] = [
          [d.left, o.left, false],    [d.left, o.centerX, true],  [d.left, o.right, false],
          [d.centerX, o.left, true],  [d.centerX, o.centerX, true], [d.centerX, o.right, true],
          [d.right, o.left, false],   [d.right, o.centerX, true], [d.right, o.right, false],
        ];
        for (const [from, to, isCenter] of xChecks) {
          const diff = Math.abs(from - to);
          const threshold = isCenter ? CENTER_SNAP_THRESHOLD : EDGE_SNAP_THRESHOLD;
          if (diff >= threshold) continue;
          if (diff < minDx) {
            minDx = diff;
            bestSnapX = dragged.position.x + (to - from);
            vLines.clear();
            vCenterLines.clear();
            (isCenter ? vCenterLines : vLines).add(to);
          } else if (diff === minDx) {
            (isCenter ? vCenterLines : vLines).add(to);
          }
        }
      }

      if (bestSnapX !== null || bestSnapY !== null) {
        const newPos = {
          x: bestSnapX ?? dragged.position.x,
          y: bestSnapY ?? dragged.position.y,
        };
        snappedPositions.current.set(dragged.id, newPos);
        updateNode(dragged.id, { position: newPos });
      } else {
        snappedPositions.current.delete(dragged.id);
      }
    }

    setGuides({ hLines: [...hLines], vLines: [...vLines], hCenterLines: [...hCenterLines], vCenterLines: [...vCenterLines] });
  }, [nodes, updateNode]);

  const onNodeDragStop: NodeDragHandler = useCallback((_event, _node, draggedNodes) => {
    for (const dragged of draggedNodes) {
      const snapped = snappedPositions.current.get(dragged.id);
      if (snapped) {
        updateNode(dragged.id, { position: snapped });
      }
    }
    snappedPositions.current.clear();
    setGuides({ hLines: [], vLines: [], hCenterLines: [], vCenterLines: [] });
  }, [updateNode]);

  return { guides, onNodeDrag, onNodeDragStop };
}
