import { Check, ExternalLink, Minus, X } from 'lucide-react';
import { Chip, PageHeader, Panel, PanelHeader } from '@/components/ui';
import { COMPARISON, COMPETITORS, EXTRA_SOURCES, INSIGHTS, VOC_THEMES, type Support } from '@/data/research';
import { cn } from '@/lib/cn';

const SUPPORT: Record<Support, { icon: typeof Check; label: string; className: string }> = {
  yes: { icon: Check, label: 'Strong', className: 'text-success' },
  partial: { icon: Minus, label: 'Partial', className: 'text-lane-assist' },
  no: { icon: X, label: 'Missing', className: 'text-muted' },
};

export default function ResearchPage() {
  return (
    <div>
      <PageHeader
        title="Research"
        description="What already exists in September 2026, where the gaps are, and what customers say. Every claim links to its source."
      />

      <section aria-labelledby="insights-heading">
        <h2 id="insights-heading" className="text-xl font-strong">
          Insights
        </h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {INSIGHTS.map((i) => (
            <li key={i.title}>
              <Panel className="flex h-full flex-col p-5">
                <h3 className="text-base font-strong">{i.title}</h3>
                <p className="mt-2 text-sm">{i.finding}</p>
                <p className="mt-2 flex-1 text-sm text-muted">So what: {i.implication}</p>
                <a
                  href={i.source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-action hover:underline"
                >
                  {i.source.label}
                  <ExternalLink size={13} aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </Panel>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">
          More sources:{' '}
          {EXTRA_SOURCES.map((s, idx) => (
            <span key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" className="text-action hover:underline">
                {s.label}
              </a>
              {idx < EXTRA_SOURCES.length - 1 ? ', ' : '.'}
            </span>
          ))}
        </p>
      </section>

      <section className="mt-10" aria-labelledby="compare-heading">
        <h2 id="compare-heading" className="text-xl font-strong">
          Competitive comparison
        </h2>
        <p className="mt-1 text-sm text-muted">Based on public announcements. A judgment call, not a feature audit.</p>
        <Panel className="mt-4">
          <div className="overflow-x-auto" role="region" aria-label="Competitive comparison table" tabIndex={0}>
            <table className="w-full min-w-[820px] text-sm">
              <caption className="sr-only">IES Autopilot compared with NetSuite, Workday, and AI-native ERPs</caption>
              <thead>
                <tr className="border-b border-hairline text-left text-xs text-muted">
                  <th scope="col" className="px-5 py-2.5 font-medium">Capability</th>
                  {COMPETITORS.map((c) => (
                    <th key={c} scope="col" className={cn('px-3 py-2.5 font-medium', c === 'IES Autopilot' && 'text-text')}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.capability} className="border-b border-hairline/60 align-top last:border-0">
                    <th scope="row" className="px-5 py-3 text-left font-medium">
                      {row.capability}
                    </th>
                    {row.values.map((v, i) => {
                      const meta = SUPPORT[v.level];
                      return (
                        <td key={i} className={cn('px-3 py-3', i === 0 && 'bg-raised/40')}>
                          <span className={cn('inline-flex items-center gap-1 text-xs font-medium', meta.className)}>
                            <meta.icon size={13} aria-hidden />
                            {meta.label}
                          </span>
                          <div className="mt-0.5 text-muted">{v.note}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      <section className="mt-10" aria-labelledby="voc-heading">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="voc-heading" className="text-xl font-strong">
            Voice of the customer
          </h2>
          <Chip className="border-lane-assist/50 text-lane-assist">Illustrative, synthesized from public review themes</Chip>
        </div>
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {VOC_THEMES.map((v) => (
            <li key={v.theme}>
              <Panel className="h-full">
                <PanelHeader level={3} title={v.theme} />
                <blockquote className="px-5 py-4 text-sm">
                  <p>"{v.quote}"</p>
                  <footer className="mt-2 text-xs text-muted">
                    {v.who}. Illustrative, synthesized from public review themes, not a real quote.
                  </footer>
                </blockquote>
              </Panel>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
