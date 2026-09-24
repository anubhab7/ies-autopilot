import { formatConfidence } from '@/domain/money';
import { cn } from '@/lib/cn';

export function ConfidenceMeter({
  bps,
  minBps,
  className,
}: {
  bps: number;
  minBps?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, bps / 100));
  const meets = minBps === undefined || bps >= minBps;
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="relative h-1.5 w-16 overflow-hidden rounded-full bg-hairline"
        role="meter"
        aria-label="Agent confidence"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={bps / 10_000}
        aria-valuetext={formatConfidence(bps)}
      >
        <div
          className={cn('h-full rounded-full', meets ? 'bg-text/80' : 'bg-lane-assist')}
          style={{ width: `${pct}%` }}
        />
        {minBps !== undefined ? (
          <div className="absolute top-0 h-full w-px bg-action" style={{ left: `${minBps / 100}%` }} aria-hidden />
        ) : null}
      </div>
      <span className="tnum text-xs text-muted">{formatConfidence(bps)}</span>
    </div>
  );
}
