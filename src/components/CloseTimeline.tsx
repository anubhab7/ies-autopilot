import { cn } from '@/lib/cn';

/** "9 days before, 3 days with Autopilot", with today's business day marked. */
export function CloseTimeline({ currentDay = 2, compact = false }: { currentDay?: number; compact?: boolean }) {
  const before = 9;
  const after = 3;
  const cells = (count: number, tone: 'before' | 'after') =>
    Array.from({ length: before }, (_, i) => {
      const active = i < count;
      const today = tone === 'after' && i === currentDay - 1;
      return (
        <div
          key={i}
          className={cn(
            'h-2.5 flex-1 rounded-[3px]',
            !active && 'bg-transparent',
            active && tone === 'before' && 'bg-lane-manual/35',
            active && tone === 'after' && (i < currentDay ? 'bg-lane-auto' : 'bg-lane-auto/35'),
            today && 'ring-2 ring-text ring-offset-2 ring-offset-surface',
          )}
        />
      );
    });
  return (
    <figure className={cn('w-full', compact ? 'space-y-2' : 'space-y-3')} aria-label="Close timeline: 9 business days before, 3 with Autopilot">
      <div className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3">
        <span className="text-xs text-muted">Last close</span>
        <div className="flex gap-1">{cells(before, 'before')}</div>
        <span className="tnum text-xs text-muted">9 days</span>
      </div>
      <div className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3">
        <span className="text-xs text-text">With Autopilot</span>
        <div className="flex gap-1">{cells(after, 'after')}</div>
        <span className="tnum text-xs text-text">3 days</span>
      </div>
      {!compact ? (
        <figcaption className="text-xs text-muted">Today is business day {currentDay} of the target 3 (outlined).</figcaption>
      ) : null}
    </figure>
  );
}
