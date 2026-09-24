import { ChevronDown, ChevronUp, Compass, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useDemo } from '@/store/demoStore';
import { TOUR_STEPS, type TourStep } from '@/data/tour';
import { Button } from './ui';

export { TOUR_STEPS };

function stepMatches(step: TourStep, path: string) {
  return step.matches ? step.matches(path) : path === step.route;
}

function useTargetRect(target: string | null) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!target) {
      setRect(null);
      return;
    }
    let frame = 0;
    const measure = () => {
      const el = document.querySelector(`[data-tour="${target}"]`);
      const next = el ? el.getBoundingClientRect() : null;
      setRect((prev) =>
        prev && next && prev.top === next.top && prev.left === next.left && prev.width === next.width && prev.height === next.height
          ? prev
          : next,
      );
    };
    const loop = () => {
      measure();
      frame = window.requestAnimationFrame(loop);
    };
    loop();
    return () => window.cancelAnimationFrame(frame);
  }, [target]);
  return rect;
}

export function TourPanel() {
  const tour = useDemo((s) => s.tour);
  const setTourStep = useDemo((s) => s.setTourStep);
  const exitTour = useDemo((s) => s.exitTour);
  const location = useLocation();
  const navigate = useNavigate();
  const [minimized, setMinimized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const step = tour.active ? TOUR_STEPS[Math.min(tour.step, TOUR_STEPS.length - 1)] : null;
  const onRoute = step ? stepMatches(step, location.pathname) : false;
  const rect = useTargetRect(step && onRoute ? step.target : null);

  const goTo = useCallback(
    (index: number) => {
      const next = TOUR_STEPS[index];
      setTourStep(index);
      navigate(next.route);
    },
    [navigate, setTourStep],
  );

  // Reserve space at the bottom of the page so the panel never hides content.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!tour.active || !panelRef.current) {
      root.style.removeProperty('--tour-space');
      return;
    }
    const el = panelRef.current;
    const update = () => root.style.setProperty('--tour-space', `${el.offsetHeight + 24}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--tour-space');
    };
  }, [tour.active, minimized]);

  useEffect(() => {
    if (!tour.active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (document.querySelector('[role="dialog"]')) return;
      exitTour();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tour.active, exitTour]);

  useEffect(() => {
    if (!step || !onRoute) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = window.setTimeout(() => {
      document
        .querySelector(`[data-tour="${step.target}"]`)
        ?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    }, 150);
    return () => window.clearTimeout(id);
  }, [step, onRoute]);

  if (!tour.active || !step) return null;
  const index = Math.min(tour.step, TOUR_STEPS.length - 1);
  const last = index === TOUR_STEPS.length - 1;

  return (
    <>
      {rect && rect.width > 0 ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-40 rounded-panel ring-2 ring-action ring-offset-4 ring-offset-bg transition-all duration-200"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          data-testid="tour-spotlight"
        />
      ) : null}
      <div
        ref={panelRef}
        role="region"
        aria-label="Guided tour"
        className={cn(
          'fixed bottom-3 right-3 z-40 w-[min(22rem,calc(100vw-1.5rem))] rounded-panel border border-action/60 bg-surface',
        )}
        data-testid="tour-panel"
      >
        <div className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-2">
          <span className="flex items-center gap-2 text-xs text-muted" data-testid="tour-step-count">
            <Compass size={14} className="text-action" aria-hidden />
            Step {index + 1} of {TOUR_STEPS.length}
          </span>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              aria-label={minimized ? 'Expand tour panel' : 'Minimize tour panel'}
              aria-expanded={!minimized}
              onClick={() => setMinimized((m) => !m)}
            >
              {minimized ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
            </Button>
            <Button variant="ghost" size="sm" className="px-2" aria-label="Exit tour" onClick={exitTour}>
              <X size={16} aria-hidden />
            </Button>
          </div>
        </div>
        {minimized ? null : (
          <div className="px-4 py-3">
            <h2 className="text-sm font-strong" data-testid="tour-title">
              {step.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{step.body}</p>
            {!onRoute ? (
              <p className="mt-2 text-xs text-lane-assist">You moved away from this step.</p>
            ) : null}
          </div>
        )}
        <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-1">
          <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => goTo(index - 1)}>
            Back
          </Button>
          <div className="flex gap-2">
            {!onRoute ? (
              <Button variant="secondary" size="sm" onClick={() => goTo(index)}>
                Return to step
              </Button>
            ) : null}
            {last ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  exitTour();
                  navigate('/');
                }}
              >
                Finish tour
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={() => goTo(index + 1)} data-testid="tour-next">
                Next
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-0.5 px-4 pb-3" aria-hidden>
          {TOUR_STEPS.map((_, i) => (
            <span key={i} className={cn('h-1 flex-1 rounded-full', i <= index ? 'bg-action' : 'bg-hairline')} />
          ))}
        </div>
      </div>
    </>
  );
}
