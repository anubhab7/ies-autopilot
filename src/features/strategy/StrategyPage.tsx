import { Handshake, Layers, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { LaneBadge } from '@/components/LaneBadge';
import { Chip, PageHeader, Panel, PanelHeader } from '@/components/ui';
import { formatMoneyWhole } from '@/domain/money';

const GMV = { customers: 8_000, adoptionBps: 2_500, agents: 2, priceCents: 25_000, takeRateBps: 2_000 };
const gmvCents = (GMV.customers * GMV.adoptionBps * GMV.agents * GMV.priceCents * 12) / 10_000;
const intuitCents = (gmvCents * GMV.takeRateBps) / 10_000;

function Assumption({ children }: { children: ReactNode }) {
  return <Chip className="border-lane-assist/50 text-lane-assist">Assumption: {children}</Chip>;
}

const PILLARS = [
  {
    icon: Layers,
    title: 'Outcome Autopilots, not feature agents',
    text: 'CFOs think in outcomes ("close 3 entities in 3 days"). Autopilot orchestrates the existing IES agents plus partner agents around one outcome, with a single progress view.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust by design',
    text: 'Evidence on every entry, guardrails set per workflow, a Flight Log with one-click reversal, and a human expert on call for judgment calls. Autonomy is earned, not assumed.',
  },
  {
    icon: Handshake,
    title: 'An ecosystem where builders earn',
    text: 'AI-ready APIs, a hosted MCP server, a synthetic sandbox, automated certification in days, outcome pricing, and a revenue share that pays developers and advisors 80% to 85%.',
  },
];

const OPERATING_MODEL = [
  {
    lane: 'AUTONOMOUS' as const,
    who: 'Agent posts, human can reverse',
    when: 'Confident, under the materiality limit, and reversible',
    example: 'BR-1042: $3,200 payout matched to invoice INV-8831 at 0.98 confidence',
  },
  {
    lane: 'ASSISTED' as const,
    who: 'Agent drafts, human decides',
    when: 'Any guardrail fails: amount, confidence, or reversibility',
    example: 'FX-78: $43,800 CAD revaluation is above the $40,000 limit',
  },
  {
    lane: 'EXPERT' as const,
    who: 'Vetted CPA reviews, human accepts',
    when: 'Judgment categories: transfer pricing, tax positions, audit adjustments, new entities',
    example: 'TP-12: transfer pricing markup on the US to UK recharge',
  },
];

const ROADMAP = [
  {
    phase: 'Now',
    horizon: '0 to 6 months',
    items: [
      'Close Autopilot for multi-entity customers, built on the 7 existing agents',
      'Autonomy Dial, guardrails, and Flight Log',
      'Expert on call pilot with 50 vetted CPAs',
      'Hangar sandbox and hosted MCP server (read and draft only)',
    ],
  },
  {
    phase: 'Next',
    horizon: '6 to 18 months',
    items: [
      'Agent Store with automated certification and revenue share',
      'No-code Agent Studio for accounting firms',
      'Intuit Assured for certified agents',
      'More Autopilots: cash forecasting, AP, revenue recognition',
    ],
  },
  {
    phase: 'Later',
    horizon: '18 to 36 months',
    items: [
      'Cross-customer benchmarks for guardrail recommendations',
      'Outcome-based pricing for Autopilots',
      'Agent-to-agent commerce with partners and banks',
    ],
  },
];

const KPIS = [
  { name: 'Verified agent hours (North Star)', why: 'Hours of finance work done by agents and accepted without edits. Grows only when agents are both useful and trusted.' },
  { name: 'Days to close', why: 'Median business days for Autopilot customers, target 3 (from 6 to 9).' },
  { name: 'Approve-without-edit rate', why: 'Share of Assisted drafts approved as proposed. The signal to raise autonomy.' },
  { name: 'Reversal rate', why: 'Share of auto-posted entries reversed. Guardrail health; target under 1%.' },
  { name: 'Certified agents and developer earnings', why: 'Ecosystem health: agents live, installs, and payouts to builders.' },
];

const RISKS = [
  { risk: 'An auto-posted error damages trust', mitigation: 'Strict guardrails, reversible-only autonomy, L1 start for new agents, Intuit Assured coverage.' },
  { risk: 'Accountants see AI as a threat', mitigation: 'Advisors become expert reviewers and no-code builders who earn from the store.' },
  { risk: 'Low-quality partner agents', mitigation: 'Automated evals, security scan, human spot review, and continuous re-certification.' },
  { risk: 'Data privacy with third parties', mitigation: 'Scoped consent, draft-only writes, data residency controls, and a full Flight Log.' },
  { risk: 'Expert network cannot scale', mitigation: 'Route only judgment categories; context packets cut review time; add firms as a supply side.' },
];

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section className="mt-10" aria-labelledby={id}>
      <h2 id={id} className="text-xl font-strong">
        {title}
      </h2>
      {description ? <p className="prose-measure mt-1 text-sm text-muted">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function StrategyPage() {
  return (
    <div>
      <PageHeader
        title="Strategy"
        description="How IES evolves from an integrated suite into an AI-native business platform for the mid-market."
      />
      <Panel className="p-5 sm:p-6">
        <h2 className="text-base font-strong">Vision</h2>
        <p className="prose-measure mt-2 text-xl leading-relaxed">
          Every mid-market finance team gets an AI crew that runs its outcomes end to end, a human expert on call for the
          judgment calls, and an ecosystem of certified agents built by developers and advisors who earn when customers
          succeed.
        </p>
      </Panel>

      <Section id="pillars" title="Three strategic pillars">
        <ul className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <li key={p.title}>
              <Panel className="h-full p-5">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <p.icon size={16} className="text-action" aria-hidden /> Pillar {i + 1}
                </div>
                <h3 className="mt-2 text-base font-strong">{p.title}</h3>
                <p className="mt-2 text-sm text-muted">{p.text}</p>
              </Panel>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="operating-model"
        title="The human plus AI operating model"
        description="The routing rule in plain words: an agent posts on its own only when it is confident enough, the amount is strictly under your materiality limit, and the entry can be undone. Judgment categories always go to an expert. Everything else is drafted for a person."
      >
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <caption className="sr-only">Operating model by lane</caption>
              <thead>
                <tr className="border-b border-hairline text-left text-xs text-muted">
                  <th scope="col" className="px-5 py-2.5 font-medium">Lane</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Who acts</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">When</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Example from the Northwind close</th>
                </tr>
              </thead>
              <tbody>
                {OPERATING_MODEL.map((r) => (
                  <tr key={r.lane} className="border-b border-hairline/60 align-top last:border-0">
                    <td className="px-5 py-3">
                      <LaneBadge lane={r.lane} />
                    </td>
                    <td className="px-3 py-3">{r.who}</td>
                    <td className="px-3 py-3 text-muted">{r.when}</td>
                    <td className="px-5 py-3 text-muted">{r.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </Section>

      <Section id="roadmap" title="Phased roadmap" description="Sequenced so trust is proven on the close before third-party agents can act.">
        <ol className="grid gap-4 md:grid-cols-3">
          {ROADMAP.map((r) => (
            <li key={r.phase}>
              <Panel className="h-full p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-base font-strong">{r.phase}</h3>
                  <span className="text-xs text-muted">{r.horizon}</span>
                </div>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
                  {r.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </Panel>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="business" title="Business and ecosystem model">
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="Revenue streams" />
            <ul className="space-y-2 p-5 text-sm">
              <li>
                <span className="font-medium">Autopilot tier:</span> <span className="text-muted">premium IES plan priced on outcomes (entities closed).</span>
              </li>
              <li>
                <span className="font-medium">Expert on call:</span> <span className="text-muted">per-session fees with a platform take rate.</span>
              </li>
              <li>
                <span className="font-medium">Agent Store:</span> <span className="text-muted">20% take rate, falling to 15% above $1M lifetime gross per developer.</span>
              </li>
              <li>
                <span className="font-medium">Incentives:</span>{' '}
                <span className="text-muted">
                  developers keep 80% to 85%; advisors earn as no-code builders and as expert reviewers; free sandbox and read
                  calls replace paid read tiers.
                </span>
              </li>
            </ul>
          </Panel>
          <Panel>
            <PanelHeader title="Illustrative Agent Store GMV" description="All inputs are assumptions" />
            <div className="p-5">
              <p className="tnum text-base">
                GMV = N x a x k x p x 12
              </p>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <dt className="w-8 font-medium">N</dt>
                  <dd className="flex flex-wrap items-center gap-2">8,000 IES customers <Assumption>customer count</Assumption></dd>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <dt className="w-8 font-medium">a</dt>
                  <dd className="flex flex-wrap items-center gap-2">25% install at least one agent <Assumption>adoption</Assumption></dd>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <dt className="w-8 font-medium">k</dt>
                  <dd className="flex flex-wrap items-center gap-2">2 agents each <Assumption>attach</Assumption></dd>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <dt className="w-8 font-medium">p</dt>
                  <dd className="flex flex-wrap items-center gap-2">$250 per agent per month <Assumption>price</Assumption></dd>
                </div>
              </dl>
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-hairline pt-4">
                <div>
                  <div className="text-sm text-muted">Annual GMV</div>
                  <div className="tnum text-2xl font-medium" data-testid="gmv">
                    {formatMoneyWhole(gmvCents)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted">Intuit revenue at 20%</div>
                  <div className="tnum text-2xl font-medium" data-testid="intuit-revenue">
                    {formatMoneyWhole(intuitCents)}
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </Section>

      <Section id="kpis" title="KPIs">
        <Panel>
          <ul className="divide-y divide-hairline">
            {KPIS.map((k, i) => (
              <li key={k.name} className="px-5 py-3">
                <div className="text-sm font-medium">
                  {k.name}
                  {i === 0 ? <Chip className="ml-2 border-action/60 text-action">North Star</Chip> : null}
                </div>
                <div className="text-sm text-muted">{k.why}</div>
              </li>
            ))}
          </ul>
        </Panel>
      </Section>

      <Section id="risks" title="Risks and mitigations">
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <caption className="sr-only">Risks and mitigations</caption>
              <thead>
                <tr className="border-b border-hairline text-left text-xs text-muted">
                  <th scope="col" className="px-5 py-2.5 font-medium">Risk</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Mitigation</th>
                </tr>
              </thead>
              <tbody>
                {RISKS.map((r) => (
                  <tr key={r.risk} className="border-b border-hairline/60 align-top last:border-0">
                    <td className="px-5 py-3">{r.risk}</td>
                    <td className="px-5 py-3 text-muted">{r.mitigation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </Section>
    </div>
  );
}
