import { useEffect, useCallback } from 'react';
import { useDiagramStore } from '../../store/diagramStore';

export function PresentationOverlay() {
  const {
    presentationMode,
    presentationStep,
    presentationSteps,
    exitPresentation,
    nextStep,
    prevStep,
  } = useDiagramStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!presentationMode) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        nextStep();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevStep();
      }
      if (e.key === 'Escape') {
        exitPresentation();
      }
    },
    [presentationMode, nextStep, prevStep, exitPresentation]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!presentationMode) return null;

  const total = presentationSteps.length;
  const isStart = presentationStep < 0;
  const isEnd = presentationStep >= total - 1;
  const displayStep = isStart ? 0 : presentationStep + 1;

  return (
    <>
      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-3"
        style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-white text-sm font-semibold tracking-wide">Presentation Mode</span>
        </div>

        {/* Step indicator dots */}
        <div className="flex items-center gap-1.5">
          {presentationSteps.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === presentationStep ? 20 : 8,
                height: 8,
                background: i <= presentationStep ? '#60a5fa' : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>

        <button
          onClick={exitPresentation}
          className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Exit (Esc)
        </button>
      </div>

      {/* Bottom controls */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-4 py-5"
        style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)' }}
      >
        <button
          onClick={prevStep}
          disabled={isStart}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
          onMouseEnter={(e) => { if (!isStart) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Prev
        </button>

        {/* Counter */}
        <div className="text-white/60 text-sm min-w-[80px] text-center">
          {isStart ? (
            <span className="text-white/40 italic">Press Next</span>
          ) : (
            <span>
              <span className="text-white font-semibold">{displayStep}</span>
              <span className="text-white/40"> / {total}</span>
            </span>
          )}
        </div>

        <button
          onClick={nextStep}
          disabled={isEnd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: isEnd ? 'rgba(255,255,255,0.1)' : '#2563eb', color: 'white' }}
          onMouseEnter={(e) => { if (!isEnd) (e.currentTarget as HTMLElement).style.background = '#1d4ed8'; }}
          onMouseLeave={(e) => { if (!isEnd) (e.currentTarget as HTMLElement).style.background = '#2563eb'; }}
        >
          Next
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </>
  );
}

