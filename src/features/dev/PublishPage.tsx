import * as Slider from '@radix-ui/react-slider';
import { CheckCircle2, CircleDot, Rocket } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from '@/components/toast';
import { Button, ButtonLink, Field, inputClass, PageHeader, Panel, PanelHeader, Stat } from '@/components/ui';
import { STORE_AGENTS } from '@/data/agents';
import { formatMoney, formatMoneyWhole } from '@/domain/money';
import { estimateEarnings, USAGE_PER_INSTALL } from '@/domain/revenueShare';
import { DATA_SCOPES, type ScopeId } from '@/domain/scopes';
import {
  isPricingModel,
  parsePriceCents,
  PRICING_MODEL_LABELS,
  validateListing,
  type ListingInput,
  type PricingModel,
} from '@/domain/validators';
import { cn } from '@/lib/cn';
import { useDemo } from '@/store/demoStore';

const EXISTING_NAMES = STORE_AGENTS.map((a) => a.name);

const TIMELINE = [
  { step: 'Automated evaluations', time: 'Minutes', detail: '50 cases, 95% to pass' },
  { step: 'Security scan', time: '1 business day', detail: 'Scopes, data handling, prompt injection' },
  { step: 'Human spot review', time: '2 business days', detail: 'A certified reviewer samples outputs' },
];

export default function PublishPage() {
  const dev = useDemo((s) => s.dev);
  const publishListing = useDemo((s) => s.publishListing);
  const [form, setForm] = useState<ListingInput>({
    name: 'Rebatewise Rebate Accruals',
    description:
      'Accrues customer volume rebates at month end from contracts and sales, in each entity currency, and drafts balanced entries for approval.',
    pricingModel: 'per_outcome',
    price: '0.50',
    scopes: ['read:ledger', 'read:customers', 'write:drafts'],
  });
  const [touched, setTouched] = useState<Partial<Record<keyof ListingInput, boolean>>>({});
  const [installs, setInstalls] = useState(400);

  const errors = validateListing(form, EXISTING_NAMES);
  const valid = Object.keys(errors).length === 0;
  const showError = (key: keyof ListingInput) => (touched[key] ? errors[key] : undefined);
  const set = <K extends keyof ListingInput>(key: K, value: ListingInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setTouched((t) => ({ ...t, [key]: true }));
  };

  const model: PricingModel = isPricingModel(form.pricingModel) ? form.pricingModel : 'per_outcome';
  const priceCents = parsePriceCents(form.price) ?? 0;
  const estimate = useMemo(() => estimateEarnings(installs, priceCents, model), [installs, priceCents, model]);
  const certified = dev.submittedForCertification;

  if (dev.published) {
    return (
      <div className="max-w-3xl">
        <PageHeader title="Listing submitted" description="Your agent is in certification. Earnings start when it goes live." />
        <Panel className="p-5 sm:p-6" data-testid="publish-success">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-success" aria-hidden />
            <div>
              <h2 className="text-xl font-strong">{dev.published.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {PRICING_MODEL_LABELS[dev.published.pricingModel]}
                {dev.published.pricingModel === 'free' ? '' : `, ${formatMoney(dev.published.priceCents)}`}. Live in about 3
                business days, backed by Intuit Assured once certified.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink to="/dev/earnings" variant="primary">
                  View earnings
                </ButtonLink>
                <ButtonLink to="/cfo/store" variant="secondary">
                  See the Agent Store
                </ButtonLink>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Publish to the Agent Store"
        description="List your agent, set a price, and see what you would earn. Developers keep 80% of revenue, 85% after the first $1,000,000."
      />
      {!certified ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-panel border border-lane-assist/40 bg-lane-assist/5 px-4 py-3" data-testid="publish-blocked">
          <p className="text-sm">Publishing needs passing evaluations. Reach 95% in Agent Studio and submit for certification first.</p>
          <ButtonLink to="/dev/studio" variant="secondary" size="sm">
            Open Agent Studio
          </ButtonLink>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Panel data-tour="publish-form">
          <PanelHeader title="Listing" description="Shown to finance teams in the Agent Store" />
          <form
            className="space-y-4 p-4 sm:p-5"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              setTouched({ name: true, description: true, pricingModel: true, price: true, scopes: true });
              if (!valid || !certified) return;
              const result = publishListing({
                name: form.name.trim(),
                description: form.description.trim(),
                pricingModel: model,
                priceCents: model === 'free' ? 0 : priceCents,
                scopes: form.scopes as ScopeId[],
              });
              if (result.ok) toast('Listing published', 'Certification finishes in about 3 business days.');
            }}
          >
            <Field label="Agent name" htmlFor="pub-name" hint="3 to 60 characters, unique in the store" error={showError('name')}>
              <input
                id="pub-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                aria-invalid={Boolean(showError('name'))}
                aria-describedby={showError('name') ? 'pub-name-error' : 'pub-name-hint'}
                className={inputClass}
              />
            </Field>
            <Field label="Description" htmlFor="pub-description" hint={`${form.description.trim().length} of 500 characters, at least 20`} error={showError('description')}>
              <textarea
                id="pub-description"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                aria-invalid={Boolean(showError('description'))}
                aria-describedby={showError('description') ? 'pub-description-error' : 'pub-description-hint'}
                className={cn(inputClass, 'min-h-24')}
              />
            </Field>
            <fieldset>
              <legend className="text-sm font-medium">Pricing model</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(PRICING_MODEL_LABELS) as PricingModel[]).map((m) => (
                  <label
                    key={m}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-chip border px-3 py-2 text-sm',
                      form.pricingModel === m ? 'border-action bg-raised' : 'border-hairline',
                    )}
                  >
                    <input
                      type="radio"
                      name="pricing"
                      checked={form.pricingModel === m}
                      onChange={() => {
                        setForm((f) => ({ ...f, pricingModel: m, price: m === 'free' ? '0' : f.price === '0' ? '' : f.price }));
                        setTouched((t) => ({ ...t, pricingModel: true }));
                      }}
                      className="accent-[var(--action)]"
                    />
                    {PRICING_MODEL_LABELS[m]}
                  </label>
                ))}
              </div>
            </fieldset>
            {form.pricingModel !== 'free' ? (
              <Field
                label={form.pricingModel === 'monthly' ? 'Price per customer per month (USD)' : 'Price per outcome (USD)'}
                htmlFor="pub-price"
                hint="$0.01 to $10,000.00, at most 2 decimals"
                error={showError('price')}
              >
                <input
                  id="pub-price"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  aria-invalid={Boolean(showError('price'))}
                  aria-describedby={showError('price') ? 'pub-price-error' : 'pub-price-hint'}
                  className={cn(inputClass, 'tnum max-w-48')}
                />
              </Field>
            ) : null}
            <fieldset aria-describedby={showError('scopes') ? 'pub-scopes-error' : undefined}>
              <legend className="text-sm font-medium">Data scopes</legend>
              <p className="text-xs text-muted">Agents can read and draft. Posting is never a scope; customer guardrails decide.</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {DATA_SCOPES.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.scopes.includes(s.id)}
                      onChange={(e) =>
                        set('scopes', e.target.checked ? [...form.scopes, s.id] : form.scopes.filter((x) => x !== s.id))
                      }
                      className="accent-[var(--action)]"
                    />
                    {s.label}
                  </label>
                ))}
              </div>
              {showError('scopes') ? (
                <p id="pub-scopes-error" className="mt-1 text-xs text-danger" role="alert">
                  {showError('scopes')}
                </p>
              ) : null}
            </fieldset>
            <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
              <Button type="submit" variant="primary" disabled={!valid || !certified} data-testid="publish-submit">
                <Rocket size={16} aria-hidden />
                Publish listing
              </Button>
              <span className="text-xs text-muted">
                {!certified ? 'Pass evaluations first.' : valid ? 'Ready to publish.' : 'Fix the highlighted fields to publish.'}
              </span>
            </div>
          </form>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHeader title="Earnings estimator" description="Illustrative, before payment processing" />
            <div className="space-y-4 p-4 sm:p-5">
              <div>
                <div className="flex items-baseline justify-between">
                  <span id="installs-label" className="text-sm font-medium">
                    Installs
                  </span>
                  <span className="tnum text-sm" data-testid="installs-value">
                    {installs.toLocaleString('en-US')}
                  </span>
                </div>
                <Slider.Root
                  className="relative mt-3 flex h-5 w-full touch-none select-none items-center"
                  min={0}
                  max={5000}
                  step={50}
                  value={[installs]}
                  onValueChange={([v]) => setInstalls(v)}
                  aria-labelledby="installs-label"
                >
                  <Slider.Track className="relative h-1 grow rounded-full bg-hairline">
                    <Slider.Range className="absolute h-full rounded-full bg-action" />
                  </Slider.Track>
                  <Slider.Thumb className="block h-5 w-5 rounded-full border-2 border-action bg-bg" aria-label="Installs" />
                </Slider.Root>
                <p className="mt-2 text-xs text-muted">
                  Usage assumption: {USAGE_PER_INSTALL[model]} {model === 'per_outcome' ? 'outcomes' : 'billing unit'} per install per
                  month.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Stat label="Monthly gross" value={formatMoneyWhole(estimate.monthlyGrossCents)} />
                <Stat label="You keep, month 1" value={<span data-testid="dev-share">{formatMoneyWhole(estimate.firstMonthDeveloperCents)}</span>} hint="80% share" />
                <Stat label="Intuit share, month 1" value={formatMoneyWhole(estimate.firstMonthIntuitCents)} />
                <Stat label="You keep, 12 months" value={formatMoneyWhole(estimate.yearDeveloperCents)} hint="85% on lifetime gross above $1M" />
              </div>
            </div>
          </Panel>
          <Panel>
            <PanelHeader title="Certification timeline" description="Live in about 3 business days" />
            <ol className="space-y-3 p-4 sm:p-5">
              {TIMELINE.map((t, i) => {
                const done = i === 0 && certified;
                return (
                  <li key={t.step} className="flex gap-3 text-sm">
                    {done ? (
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" aria-hidden />
                    ) : (
                      <CircleDot size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
                    )}
                    <div>
                      <div className="font-medium">
                        {t.step} <span className="font-normal text-muted">({t.time})</span>
                      </div>
                      <div className="text-xs text-muted">{done ? 'Passed at 98%' : t.detail}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="border-t border-hairline px-4 py-3 text-xs text-muted sm:px-5">
              Compared with up to 30 business days for a traditional security review.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
