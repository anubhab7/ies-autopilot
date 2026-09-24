export function ProgressRing({
  percent,
  size = 96,
  label,
  sublabel,
}: {
  percent: number;
  size?: number;
  label: string;
  sublabel?: string;
}) {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(100, percent)) / 100);
  return (
    <div className="flex items-center gap-4">
      <div
        className="relative shrink-0"
        style={{ width: size, height: size }}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        data-testid="close-progress"
      >
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--hairline)" strokeWidth="7" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="var(--lane-auto)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 500ms ease-out' }}
          />
        </svg>
        <span className="tnum absolute inset-0 flex items-center justify-center text-xl font-medium" data-testid="close-progress-value">
          {percent}%
        </span>
      </div>
      {sublabel ? (
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          <div className="tnum text-sm text-muted">{sublabel}</div>
        </div>
      ) : null}
    </div>
  );
}
