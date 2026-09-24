import { ArrowLeft, Clock, Lock, ShieldCheck, Star } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ConfirmDialog, Dialog } from '@/components/Dialog';
import { NotFoundInline } from '@/components/NotFoundInline';
import { toast } from '@/components/toast';
import { Button, ButtonLink, Chip, Panel, PanelHeader } from '@/components/ui';
import { findAgent, type StoreAgent } from '@/data/agents';
import { scopeLabel, type ScopeId } from '@/domain/scopes';
import { useDemo } from '@/store/demoStore';
import { AssuredBadge, formatPercentBps } from './StorePage';

export function ConsentDialog({
  agent,
  open,
  onOpenChange,
  onInstall,
}: {
  agent: StoreAgent;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onInstall: (optionalScopes: ScopeId[]) => void;
}) {
  const optional = agent.scopes.filter((s) => !s.required).map((s) => s.id);
  const [enabled, setEnabled] = useState<ScopeId[]>(optional);
  const [understood, setUnderstood] = useState(false);

  const reset = () => {
    setEnabled(optional);
    setUnderstood(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
      title={`Install ${agent.name}?`}
      description={`${agent.publisher} will get the access below for Northwind Outdoor Co.`}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!understood}
            onClick={() => {
              onInstall(enabled);
              onOpenChange(false);
              reset();
            }}
            data-testid="confirm-install"
          >
            Install agent
          </Button>
        </>
      }
    >
      <fieldset>
        <legend className="text-sm font-strong">Data access</legend>
        <ul className="mt-2 space-y-2">
          {agent.scopes.map((s) => {
            const id = `scope-${s.id}`;
            const checked = s.required || enabled.includes(s.id);
            return (
              <li key={s.id} className="flex items-center gap-3 rounded-chip border border-hairline px-3 py-2 text-sm">
                <input
                  id={id}
                  type="checkbox"
                  checked={checked}
                  disabled={s.required}
                  onChange={(e) =>
                    setEnabled((cur) => (e.target.checked ? [...cur, s.id] : cur.filter((x) => x !== s.id)))
                  }
                  className="accent-[var(--action)]"
                />
                <label htmlFor={id} className="flex-1">
                  {scopeLabel(s.id)}
                </label>
                {s.required ? (
                  <span className="inline-flex items-center gap-1 text-xs text-muted">
                    <Lock size={12} aria-hidden /> Required
                  </span>
                ) : (
                  <span className="text-xs text-muted">Optional</span>
                )}
              </li>
            );
          })}
        </ul>
      </fieldset>
      <div className="mt-4 rounded-chip border border-hairline bg-bg p-3 text-sm">
        <div className="font-medium">Starts at L1: Assist</div>
        <p className="mt-0.5 text-muted">
          New agents draft entries and you approve every one. Raise its autonomy later in Control Tower once it earns
          your trust. No agent can post entries directly.
        </p>
      </div>
      <label className="mt-4 flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={understood}
          onChange={(e) => setUnderstood(e.target.checked)}
          className="mt-1 accent-[var(--action)]"
          data-testid="consent-checkbox"
        />
        <span>I understand this agent can read the data above and draft entries for approval</span>
      </label>
    </Dialog>
  );
}

export default function AgentDetailPage() {
  const { agentId = '' } = useParams();
  const agent = findAgent(agentId);
  const installed = useDemo((s) => (agentId ? s.installed[agentId] : undefined));
  const installAgent = useDemo((s) => s.installAgent);
  const uninstallAgent = useDemo((s) => s.uninstallAgent);
  const [consentOpen, setConsentOpen] = useState(false);
  const [uninstallOpen, setUninstallOpen] = useState(false);

  if (!agent) return <NotFoundInline what="Agent" id={agentId} backTo="/cfo/store" backLabel="Back to Agent Store" />;

  const scorecard = [
    { label: 'Certified accuracy', value: formatPercentBps(agent.accuracyBps) },
    {
      label: 'Evaluation cases passed',
      value: `${agent.evalCasesPassed.toLocaleString('en-US')} of ${agent.evalCases.toLocaleString('en-US')}`,
    },
    { label: 'Security review', value: agent.securityReview },
    { label: 'Data residency', value: agent.dataResidency },
    { label: 'Last re-certified', value: agent.lastCertified },
  ];

  return (
    <div>
      <Link to="/cfo/store" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <ArrowLeft size={15} aria-hidden />
        Back to Agent Store
      </Link>
      <header className="mb-6 mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Chip>{agent.type}</Chip>
            <Chip>{agent.workflowLabel}</Chip>
            {agent.certified ? <AssuredBadge /> : null}
          </div>
          <h1 className="mt-3 text-2xl font-strong sm:text-3xl">{agent.name}</h1>
          <p className="mt-1 text-base text-muted">by {agent.publisher}</p>
          <p className="mt-3 text-base">{agent.description}</p>
          <p className="tnum mt-2 flex flex-wrap gap-x-4 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <Star size={14} aria-hidden /> {agent.rating.toFixed(1)} from {agent.reviewCount} reviews
            </span>
            <span>{agent.installs.toLocaleString('en-US')} installs</span>
          </p>
        </div>
        <Panel className="w-full p-4 sm:w-72" data-tour="install-agent">
          <div className="tnum text-xl font-medium">{agent.priceLabel}</div>
          <p className="mt-1 text-xs text-muted">Billed through your IES subscription.</p>
          <div className="mt-4">
            {!agent.certified ? (
              <>
                <Button variant="primary" disabled className="w-full" data-testid="install-agent">
                  Install agent
                </Button>
                <p className="mt-2 flex gap-1.5 text-xs text-lane-assist" data-testid="not-installable">
                  <Clock size={14} className="mt-px shrink-0" aria-hidden />
                  In certification. Its accuracy is below the 95% bar and the security review is still running, so it
                  cannot be installed yet.
                </p>
              </>
            ) : installed ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-success" data-testid="installed-state">
                  Installed
                </p>
                {agent.id === 'ledgerloop-revrec' ? (
                  <ButtonLink to="/cfo/close" variant="secondary" className="w-full">
                    See REV-606 on the Close board
                  </ButtonLink>
                ) : null}
                <Button variant="danger" className="w-full" onClick={() => setUninstallOpen(true)}>
                  Uninstall
                </Button>
              </div>
            ) : (
              <Button variant="primary" className="w-full" onClick={() => setConsentOpen(true)} data-testid="install-agent">
                Install agent
              </Button>
            )}
          </div>
        </Panel>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Certification scorecard"
            description={agent.certified ? 'Backed by the Intuit Assured accuracy guarantee' : 'Certification in progress'}
          />
          <dl className="divide-y divide-hairline">
            {scorecard.map((row) => (
              <div key={row.label} className="flex justify-between gap-4 px-4 py-2.5 text-sm sm:px-5">
                <dt className="text-muted">{row.label}</dt>
                <dd className="tnum text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
          <p className="px-4 pb-4 pt-2 text-xs text-muted sm:px-5">
            Intuit Assured (concept): if a certified agent's error costs you money, Intuit covers the correction, like a
            tax-filing accuracy guarantee.
          </p>
        </Panel>
        <Panel>
          <PanelHeader title="Data access it asks for" description="Read access plus drafts. Posting always goes through your guardrails." />
          <ul className="divide-y divide-hairline">
            {agent.scopes.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm sm:px-5">
                <span className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-muted" aria-hidden />
                  {scopeLabel(s.id)}
                </span>
                <span className="text-xs text-muted">{s.required ? 'Required' : 'Optional'}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="lg:col-span-2">
          <PanelHeader title="Reviews" description="Illustrative, synthesized from public review themes" />
          {agent.reviews.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">No reviews yet. Reviews open once the agent is certified.</p>
          ) : (
            <ul className="grid gap-px bg-hairline md:grid-cols-2">
              {agent.reviews.map((r) => (
                <li key={r.text} className="bg-surface p-4 sm:p-5">
                  <div className="tnum text-sm text-lane-assist" aria-label={`${r.rating} out of 5 stars`}>
                    {'★'.repeat(r.rating)}
                    <span className="text-hairline">{'★'.repeat(5 - r.rating)}</span>
                  </div>
                  <p className="mt-2 text-sm">"{r.text}"</p>
                  <p className="mt-2 text-xs text-muted">
                    {r.author}. {r.role}.
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {agent.certified ? (
        <ConsentDialog
          agent={agent}
          open={consentOpen}
          onOpenChange={setConsentOpen}
          onInstall={(scopes) => {
            installAgent(agent.id, scopes);
            toast(
              'Agent installed',
              agent.id === 'ledgerloop-revrec'
                ? 'LedgerLoop drafted REV-606. Find it in the Assisted lane.'
                : `${agent.name} starts at L1: Assist.`,
            );
          }}
        />
      ) : null}
      <ConfirmDialog
        open={uninstallOpen}
        onOpenChange={setUninstallOpen}
        title={`Uninstall ${agent.name}?`}
        description="Its open drafts are removed from the Close board. Anything already resolved stays in the Flight Log."
        confirmLabel="Uninstall agent"
        danger
        onConfirm={() => {
          uninstallAgent(agent.id);
          toast('Agent uninstalled', 'Its open drafts were removed.');
        }}
      />
    </div>
  );
}
