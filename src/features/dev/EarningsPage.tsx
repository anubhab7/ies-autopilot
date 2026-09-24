import { Wallet } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '@/components/EmptyState';
import { ButtonLink, Chip, PageHeader, Panel, PanelHeader, Stat } from '@/components/ui';
import { formatCompact, formatMoneyWhole } from '@/domain/money';
import { developerEarnings, USAGE_PER_INSTALL } from '@/domain/revenueShare';
import { createPrng, seededInt } from '@/lib/prng';
import { useDemo, type PublishedListing } from '@/store/demoStore';

const MONTHS = ['Nov 26', 'Dec 26', 'Jan 27', 'Feb 27', 'Mar 27', 'Apr 27'];

export function earningsSeries(listing: PublishedListing) {
  const next = createPrng(606);
  const usage = USAGE_PER_INSTALL[listing.pricingModel];
  let installs = 0;
  let lifetime = 0;
  return MONTHS.map((month) => {
    installs += seededInt(next, 60, 140);
    const gross = installs * listing.priceCents * usage;
    const developer = developerEarnings(gross, lifetime);
    lifetime += gross;
    return { month, installs, gross, developer, intuit: gross - developer };
  });
}

export default function EarningsPage() {
  const published = useDemo((s) => s.dev.published);

  if (!published) {
    return (
      <div>
        <PageHeader title="Earnings" description="Revenue, installs, and payouts for your published agents." />
        <Panel>
          <EmptyState
            icon={Wallet}
            title="No earnings yet"
            description="Publish an agent to the Agent Store to start earning. You keep 80% of revenue, 85% after your first $1,000,000."
            action={
              <ButtonLink to="/dev/publish" variant="primary">
                Publish an agent
              </ButtonLink>
            }
          />
        </Panel>
      </div>
    );
  }

  const series = earningsSeries(published);
  const last = series[series.length - 1];
  const activeCustomers = Math.round(last.installs * 0.92);
  const topWorkflows = [
    { name: 'Rebate accruals', share: 64 },
    { name: 'Rebate true-ups', share: 23 },
    { name: 'Customer credit memos', share: 13 },
  ];

  return (
    <div>
      <PageHeader title="Earnings" description={`${published.name}. Illustrative 6-month projection from launch, seeded demo data.`}>
        <div className="mt-3">
          <Chip>Illustrative projection</Chip>
        </div>
      </PageHeader>
      <Panel className="mb-4 grid grid-cols-2 gap-6 p-4 sm:p-5 lg:grid-cols-4" data-testid="earnings-stats">
        <Stat label={`Monthly gross, ${last.month}`} value={formatMoneyWhole(last.gross)} />
        <Stat label="Your share" value={formatMoneyWhole(last.developer)} hint={`Intuit share ${formatMoneyWhole(last.intuit)}`} />
        <Stat label="Installs" value={last.installs.toLocaleString('en-US')} />
        <Stat label="Active customers" value={activeCustomers.toLocaleString('en-US')} hint="Used the agent in the last 30 days" />
      </Panel>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader title="Revenue by month" description="Your share and Intuit share of gross" />
          <div className="h-72 p-4" role="img" aria-label={`Monthly gross rising to ${formatMoneyWhole(last.gross)} by ${last.month}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="var(--hairline)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--muted)', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'var(--hairline)' }} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => formatCompact(v)} />
                <Tooltip
                  cursor={{ fill: 'var(--raised)' }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="tnum rounded-chip border border-hairline bg-raised px-3 py-2 text-xs">
                        <div className="text-muted">{label}</div>
                        {payload.map((p) => (
                          <div key={String(p.dataKey)}>
                            {p.name}: {formatMoneyWhole(Number(p.value))}
                          </div>
                        ))}
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="developer" name="Your share" stackId="a" fill="var(--lane-auto)" isAnimationActive={false} />
                <Bar dataKey="intuit" name="Intuit share" stackId="a" fill="var(--lane-manual)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 px-5 pb-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-lane-auto" aria-hidden /> Your share
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-lane-manual" aria-hidden /> Intuit share
            </span>
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel>
            <PanelHeader title="Top workflows" description="Share of outcomes" />
            <ul className="space-y-3 p-4 sm:p-5">
              {topWorkflows.map((w) => (
                <li key={w.name}>
                  <div className="flex justify-between text-sm">
                    <span>{w.name}</span>
                    <span className="tnum text-muted">{w.share}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-hairline">
                    <div className="h-full rounded-full bg-action" style={{ width: `${w.share}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel>
            <PanelHeader title="Payout schedule" />
            <dl className="divide-y divide-hairline text-sm">
              {[
                ['Frequency', 'Monthly, on the 15th'],
                ['Next payout', `${formatMoneyWhole(series[0].developer)} on Dec 15, 2026`],
                ['Method', 'Bank transfer (ACH)'],
                ['Minimum payout', '$100'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 px-4 py-2.5 sm:px-5">
                  <dt className="text-muted">{k}</dt>
                  <dd className="tnum text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
