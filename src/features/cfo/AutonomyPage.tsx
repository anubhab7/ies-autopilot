import * as Slider from '@radix-ui/react-slider';
import { RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AutonomyDial } from '@/components/AutonomyDial';
import { LaneBadge } from '@/components/LaneBadge';
import { toast } from '@/components/toast';
import { Button, PageHeader, Panel, PanelHeader } from '@/components/ui';
import {
  DEFAULT_LEVELS,
  DEFAULT_POLICY,
  LEVEL_INFO,
  materialityThresholdCents,
  routeItem,
  WORKFLOW_LABELS,
} from '@/domain/autonomyEngine';
import { formatBpsPercent, formatConfidence, formatMoneyWhole } from '@/domain/money';
import { WORKFLOWS, type Workflow } from '@/domain/types';
import { cn } from '@/lib/cn';
import { useDemo } from '@/store/demoStore';
import { useCloseState } from '@/store/useClose';

function GuardrailSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
  hint,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
  hint: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span id={`${id}-label`} className="text-sm font-medium">
          {label}
        </span>
        <span className="tnum text-sm" data-testid={`${id}-value`}>
          {display}
        </span>
      </div>
      <Slider.Root
        className="relative mt-3 flex h-5 w-full touch-none select-none items-center"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        aria-labelledby={`${id}-label`}
      >
        <Slider.Track className="relative h-1 grow rounded-full bg-hairline">
          <Slider.Range className="absolute h-full rounded-full bg-action" />
        </Slider.Track>
        <Slider.Thumb
          className="block h-5 w-5 rounded-full border-2 border-action bg-bg"
          aria-label={label}
          aria-valuetext={display}
          data-testid={`${id}-slider`}
        />
      </Slider.Root>
      <p className="mt-2 text-xs text-muted">{hint}</p>
    </div>
  );
}

export default function AutonomyPage() {
  const levels = useDemo((s) => s.levels);
  const policy = useDemo((s) => s.policy);
  const installed = useDemo((s) => s.installed);
  const setLevel = useDemo((s) => s.setLevel);
  const setAllLevels = useDemo((s) => s.setAllLevels);
  const setMateriality = useDemo((s) => s.setMateriality);
  const setConfidenceMin = useDemo((s) => s.setConfidenceMin);
  const restoreRecommended = useDemo((s) => s.restoreRecommended);
  const close = useCloseState();
  const [selected, setSelected] = useState<Workflow>('accruals');

  const visibleWorkflows = WORKFLOWS.filter((w) => w !== 'revenue' || 'ledgerloop-revrec' in installed);
  const threshold = materialityThresholdCents(close.policy);

  const preview = useMemo(() => {
    const recommendedLevels = { ...DEFAULT_LEVELS };
    const results = close.items.map((item) => ({
      item,
      now: routeItem(item, close.policy, levels),
      recommended: routeItem(item, DEFAULT_POLICY, recommendedLevels),
    }));
    return {
      auto: results.filter((r) => r.now.lane === 'AUTONOMOUS').length,
      total: results.length,
      changed: results.filter((r) => r.now.lane !== r.recommended.lane),
    };
  }, [close.items, close.policy, levels]);

  const isRecommended =
    policy.materialityBps === DEFAULT_POLICY.materialityBps &&
    policy.confidenceMinBps === DEFAULT_POLICY.confidenceMinBps &&
    visibleWorkflows.every((w) => levels[w] === DEFAULT_LEVELS[w]);

  return (
    <div>
      <PageHeader
        title="Control Tower"
        description="Decide how much each workflow flies itself. Changes apply to the Close board immediately."
        actions={
          <Button
            variant="secondary"
            disabled={isRecommended}
            onClick={() => {
              restoreRecommended();
              toast('Recommended settings restored', 'L2 with a 0.5% materiality limit and 0.95 confidence minimum.');
            }}
          >
            <RotateCcw size={16} aria-hidden />
            Restore recommended settings
          </Button>
        }
      />

      <div
        className="mb-4 rounded-panel border border-hairline bg-surface px-4 py-3 sm:px-5"
        role="status"
        aria-live="polite"
        data-testid="autonomy-preview"
      >
        <p className="text-base">
          With these settings,{' '}
          <strong className="tnum font-strong" data-testid="preview-auto-count">
            {preview.auto}
          </strong>{' '}
          of <span className="tnum">{preview.total}</span> items would auto-post this month.
        </p>
        {preview.changed.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted" data-testid="preview-changes">
            {preview.changed.map((r) => (
              <li key={r.item.id} className="flex flex-wrap items-center gap-1.5">
                <span className="text-text">{r.item.id}</span> moves from <LaneBadge lane={r.recommended.lane} /> to{' '}
                <LaneBadge lane={r.now.lane} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted">Every item is in its recommended lane.</p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader
            title="Autonomy Dial"
            description="Drag the needle, click a level, or focus the dial and use the arrow keys."
          />
          <div className="grid gap-6 p-4 sm:p-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
            <div className="flex flex-col items-center gap-3" data-tour="autonomy-dial">
              <AutonomyDial
                value={levels[selected]}
                onChange={(level) => setLevel(selected, level)}
                label={`Autonomy level for ${WORKFLOW_LABELS[selected]}`}
                size={230}
              />
              <div className="text-center">
                <div className="text-sm font-medium">{WORKFLOW_LABELS[selected]}</div>
                <div className="text-xs text-muted" data-testid="dial-level-name">
                  {levels[selected]}: {LEVEL_INFO[levels[selected]].name}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm">{LEVEL_INFO[levels[selected]].summary}</p>
              <dl className="space-y-1.5 text-xs text-muted">
                {(['L0', 'L1', 'L2', 'L3'] as const).map((l) => (
                  <div key={l} className={cn('flex gap-2', l === levels[selected] && 'text-text')}>
                    <dt className="w-6 shrink-0 font-medium">{l}</dt>
                    <dd>{LEVEL_INFO[l].summary}</dd>
                  </div>
                ))}
              </dl>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setAllLevels(levels[selected]);
                  toast(`All workflows set to ${levels[selected]}`, LEVEL_INFO[levels[selected]].name);
                }}
                data-testid="apply-all"
              >
                Set all workflows to {levels[selected]}
              </Button>
            </div>
          </div>
          <div className="border-t border-hairline">
            <h3 className="px-4 pt-3 text-sm font-strong sm:px-5">Workflows</h3>
            <ul className="grid gap-1 p-2 sm:grid-cols-2" aria-label="Workflow autonomy levels">
              {visibleWorkflows.map((w) => (
                <li key={w}>
                  <button
                    type="button"
                    onClick={() => setSelected(w)}
                    aria-pressed={selected === w}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-chip px-3 py-2 text-left text-sm',
                      selected === w ? 'bg-raised' : 'hover:bg-raised/50',
                    )}
                    data-testid={`workflow-${w}`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <AutonomyDial value={levels[w]} label={`${WORKFLOW_LABELS[w]} level`} size={22} compact interactive={false} />
                      <span className="truncate">{WORKFLOW_LABELS[w]}</span>
                    </span>
                    <span className="tnum shrink-0 text-xs text-muted" data-testid={`workflow-level-${w}`}>
                      {levels[w]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHeader title="Guardrails" description="Agents only auto-post when every guardrail passes." />
            <div className="space-y-6 p-4 sm:p-5">
              <GuardrailSlider
                id="materiality"
                label="Materiality limit"
                value={policy.materialityBps}
                min={10}
                max={200}
                step={10}
                onChange={setMateriality}
                display={`${formatBpsPercent(policy.materialityBps)} of revenue = ${formatMoneyWhole(threshold)}`}
                hint="Items must be strictly below this amount (in USD) to auto-post. Based on $8,000,000 monthly revenue."
              />
              <GuardrailSlider
                id="confidence"
                label="Confidence minimum"
                value={policy.confidenceMinBps}
                min={8_000}
                max={9_900}
                step={100}
                onChange={setConfidenceMin}
                display={formatConfidence(policy.confidenceMinBps)}
                hint="Agents must be at least this confident. L3 lowers it by 0.05, never below 0.50."
              />
              <div className="rounded-chip border border-hairline bg-bg p-3 text-sm">
                <div className="font-medium">Always on</div>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted">
                  <li>Entries that cannot be reversed always need a person.</li>
                  <li>Below 0.50 confidence, agents do not draft at all.</li>
                  <li>Transfer pricing, tax positions, audit adjustments, and new entities go to an expert.</li>
                </ul>
              </div>
            </div>
          </Panel>
          <Panel className="p-4 text-sm sm:p-5">
            <p className="text-muted">
              The rule in plain words: an agent posts on its own only when it is confident enough, the amount is under
              your limit, and the entry can be undone. Everything else comes to you or an expert, with the reason
              shown.
            </p>
            <Link to="/cfo/close" className="mt-2 inline-block text-action hover:underline">
              See the effect on the Close board
            </Link>
          </Panel>
        </div>
      </div>
    </div>
  );
}
