import { useStore } from '@xyflow/react';
import type { Guides } from '../../hooks/useAlignmentGuides';

export function AlignmentGuides({ hLines, vLines, hCenterLines, vCenterLines }: Guides) {
  const [tx, ty, zoom] = useStore((s) => s.transform);

  const hasAny = hLines.length > 0 || vLines.length > 0 || hCenterLines.length > 0 || vCenterLines.length > 0;
  if (!hasAny) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
      {hLines.map((y, i) => (
        <div
          key={`h-${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: y * zoom + ty,
            height: 1,
            background: '#3b82f6',
            opacity: 0.85,
            boxShadow: '0 0 3px rgba(59,130,246,0.6)',
          }}
        />
      ))}
      {vLines.map((x, i) => (
        <div
          key={`v-${i}`}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: x * zoom + tx,
            width: 1,
            background: '#3b82f6',
            opacity: 0.85,
            boxShadow: '0 0 3px rgba(59,130,246,0.6)',
          }}
        />
      ))}
      {hCenterLines.map((y, i) => (
        <div
          key={`hc-${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: y * zoom + ty,
            height: 1.5,
            background: '#f97316',
            opacity: 0.9,
            boxShadow: '0 0 4px rgba(249,115,22,0.7)',
          }}
        />
      ))}
      {vCenterLines.map((x, i) => (
        <div
          key={`vc-${i}`}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: x * zoom + tx,
            width: 1.5,
            background: '#f97316',
            opacity: 0.9,
            boxShadow: '0 0 4px rgba(249,115,22,0.7)',
          }}
        />
      ))}
    </div>
  );
}
