import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompact, formatMoneyWhole } from '@/domain/money';
import type { ProjectionPoint } from '@/domain/scenarioEngine';

const AXIS = { fill: 'var(--muted)', fontSize: 12 };

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-chip border border-hairline bg-raised px-3 py-2 text-xs">
      <div className="mb-1 text-muted">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="tnum flex items-center gap-2">
          <span className="inline-block h-0.5 w-3" style={{ background: p.color }} aria-hidden />
          {p.name}: {formatMoneyWhole(p.value ?? 0)}
        </div>
      ))}
    </div>
  );
}

/** Baseline vs scenario month-end cash. */
export function ScenarioChart({ data, title }: { data: ProjectionPoint[]; title: string }) {
  const hasNegative = data.some((d) => d.scenario < 0);
  return (
    <figure className="w-full" aria-label={title}>
      <div className="h-56 w-full" data-testid="scenario-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--hairline)" vertical={false} />
            <XAxis dataKey="month" tick={AXIS} tickLine={false} axisLine={{ stroke: 'var(--hairline)' }} interval="preserveStartEnd" />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => formatCompact(v)} />
            <Tooltip content={<ChartTooltip />} />
            {hasNegative ? <ReferenceLine y={0} stroke="var(--danger)" strokeDasharray="4 4" /> : null}
            <Line type="monotone" dataKey="baseline" name="Baseline" stroke="var(--lane-manual)" strokeDasharray="5 4" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="scenario" name="Scenario" stroke="var(--lane-auto)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 border-t-2 border-dashed border-lane-manual" aria-hidden /> Baseline
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 border-t-2 border-lane-auto" aria-hidden /> Scenario
        </span>
        <span>Month-end cash, October 2026 to September 2027</span>
      </figcaption>
    </figure>
  );
}

/** Small area chart for the morning brief cash snapshot. */
export function MiniCashChart({ data }: { data: Array<{ month: string; cash: number }> }) {
  return (
    <div className="h-28 w-full" role="img" aria-label="Projected month-end cash rising from $6.8M to $11.2M over 12 months">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--lane-auto)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--lane-auto)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" hide />
          <YAxis hide domain={['dataMin - 50000000', 'dataMax']} />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="tnum rounded-chip border border-hairline bg-raised px-2 py-1 text-xs">
                  {label}: {formatMoneyWhole(Number(payload[0].value))}
                </div>
              ) : null
            }
          />
          <Area type="monotone" dataKey="cash" stroke="var(--lane-auto)" strokeWidth={2} fill="url(#cashFill)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
