import * as Tabs from '@radix-ui/react-tabs';
import { CheckCircle2, FlaskConical, Wand2, XCircle } from 'lucide-react';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from '@/components/toast';
import { Button, ButtonLink, Chip, inputClass, PageHeader, Panel, PanelHeader } from '@/components/ui';
import {
  CERTIFICATION_THRESHOLD_BPS,
  EVAL_AGENT_NAME,
  runEvaluations,
} from '@/domain/evalSimulator';
import { cn } from '@/lib/cn';
import { isFastMode } from '@/lib/fastMode';
import { useDemo } from '@/store/demoStore';

const SDK_SAMPLE = `import { defineAgent } from '@ies/agents';

// Accrues customer rebates at month end. Drafts only; guardrails decide the lane.
export default defineAgent({
  name: 'Northwind Rebate Accrual Agent',
  triggers: [{ event: 'close.period.opened' }],
  tools: ['ies.list_close_exceptions', 'ies.draft_journal_entry'],
  guardrails: { maxAmountUsd: 25000, minConfidence: 0.9, reversible: true },
  async handler({ period, ledger, draft }) {
    const contracts = await ledger.rebateContracts({ period });
    for (const c of contracts) {
      const rate = c.tierRate(c.volumeToDate);
      const amount = c.salesInPeriod * rate; // v2: convert at month-end FX
      await draft({
        entity: c.entity,
        memo: \`Rebate accrual \${c.customer}\`,
        lines: [
          { account: '4900 Sales rebates', debit: amount, credit: 0 },
          { account: '2150 Accrued rebates', debit: 0, credit: amount },
        ],
        evidence: [c.contractId],
      });
    }
  },
});`;

const KEYWORDS = /\b(import|from|export|default|const|for|of|await|async|return)\b/;

/** Tiny highlighter for the read-only sample: strings, comments, keywords, numbers. */
function highlight(code: string): ReactNode[] {
  const pattern = /(\/\/.*$)|('(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b(?:import|from|export|default|const|for|of|await|async|return)\b)|(\b\d+(?:\.\d+)?\b)/gm;
  const out: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(code)) !== null) {
    if (match.index > last) out.push(code.slice(last, match.index));
    const [text, comment, str, kw] = match;
    const cls = comment ? 'text-muted italic' : str ? 'text-lane-auto' : kw && KEYWORDS.test(kw) ? 'text-lane-expert' : 'text-lane-assist';
    out.push(
      <span key={key++} className={cls}>
        {text}
      </span>,
    );
    last = match.index + text.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

const TOOL_OPTIONS = ['ies.get_trial_balance', 'ies.list_close_exceptions', 'ies.draft_journal_entry', 'ies.request_expert_review'];

function NoCodeBuilder() {
  const [trigger, setTrigger] = useState('close.period.opened');
  const [instructions, setInstructions] = useState(
    'For each customer rebate contract, accrue the rebate earned this period using the tier rate. Convert to the entity currency at the month-end rate. If the rate or tier is missing, do not draft; flag it for a person.',
  );
  const [tools, setTools] = useState<string[]>(['ies.list_close_exceptions', 'ies.draft_journal_entry']);
  const [maxAmount, setMaxAmount] = useState('25000');
  return (
    <form className="space-y-4 p-4 sm:p-5" onSubmit={(e) => e.preventDefault()} aria-label="No-code agent builder">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nc-trigger" className="block text-sm font-medium">
            Trigger
          </label>
          <select id="nc-trigger" value={trigger} onChange={(e) => setTrigger(e.target.value)} className={cn(inputClass, 'mt-1.5')}>
            <option value="close.period.opened">When a close period opens</option>
            <option value="close.exception.created">When a close exception is created</option>
            <option value="schedule.monthly">On the last business day each month</option>
          </select>
        </div>
        <div>
          <label htmlFor="nc-max" className="block text-sm font-medium">
            Guardrail: largest draft (USD)
          </label>
          <input id="nc-max" inputMode="numeric" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} className={cn(inputClass, 'mt-1.5')} />
        </div>
      </div>
      <div>
        <label htmlFor="nc-instructions" className="block text-sm font-medium">
          Instructions in plain words
        </label>
        <textarea id="nc-instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} className={cn(inputClass, 'mt-1.5 min-h-28')} />
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Allowed tools</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {TOOL_OPTIONS.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={tools.includes(t)}
                onChange={(e) => setTools((cur) => (e.target.checked ? [...cur, t] : cur.filter((x) => x !== t)))}
                className="accent-[var(--action)]"
              />
              <code className="text-xs">{t}</code>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-xs text-muted">
        Built for accountants and advisors: firms like Okafor and Rao CPAs publish agents this way without writing code.
      </p>
    </form>
  );
}

export default function StudioPage() {
  const dev = useDemo((s) => s.dev);
  const setStudioVersion = useDemo((s) => s.setStudioVersion);
  const recordEvalRun = useDemo((s) => s.recordEvalRun);
  const submitForCertification = useDemo((s) => s.submitForCertification);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | null>(null);

  const result = dev.evalVersionRun ? runEvaluations(dev.evalVersionRun) : null;
  const stale = result !== null && result.version !== dev.studioVersion;
  const canSubmit = result !== null && !stale && result.certifiable && !dev.submittedForCertification;

  useEffect(
    () => () => {
      if (timer.current) window.clearInterval(timer.current);
    },
    [],
  );

  const run = () => {
    const version = dev.studioVersion;
    if (isFastMode()) {
      recordEvalRun(version);
      toast('Evaluations finished', `v${version} passed ${runEvaluations(version).passed} of 50 cases.`);
      return;
    }
    setRunning(true);
    setProgress(0);
    const started = Date.now();
    timer.current = window.setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - started) / 3000) * 100));
      setProgress(pct);
      if (pct >= 100) {
        if (timer.current) window.clearInterval(timer.current);
        timer.current = null;
        setRunning(false);
        recordEvalRun(version);
        toast('Evaluations finished', `v${version} passed ${runEvaluations(version).passed} of 50 cases.`);
      }
    }, 100);
  };

  const cancel = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
    setProgress(0);
    toast('Evaluation run cancelled', result ? 'Your previous results are unchanged.' : undefined, 'info');
  };

  const submitReason = !result
    ? 'Run evaluations first. Certification needs at least 95%.'
    : stale
      ? `You changed the agent to v${dev.studioVersion}. Run evaluations again to test it.`
      : !result.certifiable
        ? `Reach 95% to submit. The last run scored ${(result.scoreBps / 100).toFixed(0)}%.`
        : dev.submittedForCertification
          ? 'Submitted. Automated checks are done; next is the security scan.'
          : 'Ready to submit.';

  return (
    <div>
      <PageHeader
        title="Agent Studio"
        description="Build an agent in code or without code, then prove it works with automated evaluations before anyone installs it."
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip>{EVAL_AGENT_NAME}</Chip>
          <Chip data-testid="agent-version">v{dev.studioVersion}</Chip>
        </div>
      </PageHeader>

      <Panel className="mb-4">
        <Tabs.Root defaultValue="code">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3 sm:px-5">
            <h2 className="text-base font-strong">Build</h2>
            <Tabs.List className="inline-flex rounded-chip border border-hairline bg-bg p-1" aria-label="Build mode">
              {[
                ['code', 'Code (TypeScript SDK)'],
                ['nocode', 'No-code'],
              ].map(([value, label]) => (
                <Tabs.Trigger
                  key={value}
                  value={value}
                  className="h-8 rounded-[4px] px-3 text-sm text-muted data-[state=active]:bg-raised data-[state=active]:text-text"
                >
                  {label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </div>
          <Tabs.Content value="code">
            <pre className="overflow-x-auto p-4 text-xs leading-relaxed sm:p-5" tabIndex={0} aria-label="TypeScript SDK sample, read only">
              <code>{highlight(SDK_SAMPLE)}</code>
            </pre>
          </Tabs.Content>
          <Tabs.Content value="nocode">
            <NoCodeBuilder />
          </Tabs.Content>
        </Tabs.Root>
      </Panel>

      <Panel data-tour="run-evals">
        <PanelHeader
          title="Evaluations"
          description="50 cases across 5 categories, including prompt injection in memo fields. Certification needs 95%."
          actions={
            running ? (
              <Button variant="secondary" onClick={cancel}>
                Cancel run
              </Button>
            ) : (
              <Button variant="primary" onClick={run} data-testid="run-evals">
                <FlaskConical size={16} aria-hidden />
                Run evaluations
              </Button>
            )
          }
        />
        {running ? (
          <div className="px-4 py-4 sm:px-5" role="status">
            <div className="flex justify-between text-sm">
              <span>Running 50 cases against v{dev.studioVersion}</span>
              <span className="tnum text-muted">{progress}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-hairline">
              <div className="h-full bg-action transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : null}
        {result ? (
          <div className="p-4 sm:p-5" data-testid="eval-results">
            <div className="flex flex-wrap items-end gap-6">
              <div>
                <div className="text-sm text-muted">Score for v{result.version}</div>
                <div className={cn('tnum text-3xl font-medium', result.certifiable ? 'text-success' : 'text-lane-assist')} data-testid="eval-score">
                  {(result.scoreBps / 100).toFixed(0)}%
                </div>
                <div className="tnum text-sm text-muted">
                  {result.passed} of {result.total} passed, threshold {CERTIFICATION_THRESHOLD_BPS / 100}%
                </div>
              </div>
              {stale ? (
                <p className="text-sm text-lane-assist">These results are for v{result.version}. Run evaluations again for v{dev.studioVersion}.</p>
              ) : null}
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <caption className="sr-only">Results by category</caption>
                <thead>
                  <tr className="border-b border-hairline text-left text-xs text-muted">
                    <th scope="col" className="py-2 pr-3 font-medium">Category</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Passed</th>
                    <th scope="col" className="py-2 pl-3 font-medium">Failed cases</th>
                  </tr>
                </thead>
                <tbody>
                  {result.byCategory.map((c) => {
                    const failed = result.cases.filter((x) => x.category === c.category && !x.passed);
                    return (
                      <tr key={c.category} className="border-b border-hairline/60 align-top">
                        <th scope="row" className="py-2.5 pr-3 font-normal">
                          <span className="flex items-center gap-2">
                            {failed.length === 0 ? (
                              <CheckCircle2 size={15} className="text-success" aria-hidden />
                            ) : (
                              <XCircle size={15} className="text-lane-assist" aria-hidden />
                            )}
                            {c.category}
                          </span>
                        </th>
                        <td className="tnum px-3 py-2.5 text-right">
                          {c.passed} of {c.total}
                        </td>
                        <td className="py-2.5 pl-3">
                          {failed.length === 0 ? (
                            <span className="text-muted">None</span>
                          ) : (
                            failed.map((f) => (
                              <Fragment key={f.id}>
                                <details className="mb-1">
                                  <summary className="cursor-pointer">
                                    {f.id}: {f.name}
                                  </summary>
                                  <dl className="mt-1 grid gap-1 rounded-chip border border-hairline bg-bg p-2 text-xs">
                                    <div>
                                      <dt className="inline text-muted">Expected: </dt>
                                      <dd className="inline">{f.expected}</dd>
                                    </div>
                                    <div>
                                      <dt className="inline text-muted">Actual: </dt>
                                      <dd className="inline">{f.actual}</dd>
                                    </div>
                                  </dl>
                                </details>
                              </Fragment>
                            ))
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!stale && result.version === 1 ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-chip border border-hairline bg-bg p-3">
                <p className="text-sm">
                  <Wand2 size={15} className="mr-1.5 inline text-action" aria-hidden />
                  Suggested fix: convert amounts at the month-end rate in the entity currency, and prorate partial
                  periods by calendar days.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStudioVersion(2);
                    toast('Suggested fix applied', 'The agent is now v2. Run evaluations again.');
                  }}
                >
                  Apply suggested fix
                </Button>
              </div>
            ) : null}
          </div>
        ) : !running ? (
          <p className="px-4 py-6 text-sm text-muted sm:px-5">No results yet. Run evaluations to see how v{dev.studioVersion} performs.</p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-4 py-3 sm:px-5">
          <p className="text-sm text-muted" data-testid="submit-reason">
            {submitReason}
          </p>
          {dev.submittedForCertification ? (
            <ButtonLink to="/dev/publish" variant="primary">
              Continue to Publish
            </ButtonLink>
          ) : (
            <Button
              variant="primary"
              disabled={!canSubmit}
              onClick={() => {
                const r = submitForCertification();
                if (r.ok) toast('Submitted for certification', 'Automated evaluations passed. Next: security scan.');
              }}
              data-testid="submit-certification"
            >
              Submit for certification
            </Button>
          )}
        </div>
      </Panel>
    </div>
  );
}
