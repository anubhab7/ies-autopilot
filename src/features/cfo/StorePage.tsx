import { BadgeCheck, CheckCircle2, Clock, SearchX, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { Button, Chip, inputClass, PageHeader, Panel } from '@/components/ui';
import { STORE_AGENTS, type StoreAgent } from '@/data/agents';
import { cn } from '@/lib/cn';
import { useDemo } from '@/store/demoStore';

type TypeFilter = 'all' | StoreAgent['type'];
type PricingFilter = 'all' | StoreAgent['pricingModel'];
type SortKey = 'rating' | 'installs';

export function AssuredBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium text-lane-auto', className)}>
      <BadgeCheck size={14} aria-hidden />
      Intuit Assured
    </span>
  );
}

export function formatPercentBps(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}

function AgentCard({ agent, installed }: { agent: StoreAgent; installed: boolean }) {
  return (
    <li>
      <Link
        to={`/cfo/store/${agent.id}`}
        className="flex h-full flex-col rounded-panel border border-hairline bg-surface p-4 transition-colors hover:border-muted"
        data-testid={`agent-card-${agent.id}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-strong">{agent.name}</h2>
            <p className="text-sm text-muted">{agent.publisher}</p>
          </div>
          {installed ? (
            <Chip className="shrink-0 border-success/50 text-success">
              <CheckCircle2 size={12} aria-hidden />
              Installed
            </Chip>
          ) : null}
        </div>
        <p className="mt-3 flex-1 text-sm">{agent.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Chip>{agent.type}</Chip>
          <Chip>{agent.workflowLabel}</Chip>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-3 text-sm">
          <span className="tnum">{agent.priceLabel}</span>
          {agent.certified ? (
            <AssuredBadge />
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-lane-assist">
              <Clock size={13} aria-hidden />
              In certification
            </span>
          )}
        </div>
        <div className="tnum mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Star size={12} aria-hidden /> {agent.rating.toFixed(1)} ({agent.reviewCount} reviews)
          </span>
          <span>{agent.installs.toLocaleString('en-US')} installs</span>
          <span>{formatPercentBps(agent.accuracyBps)} certified accuracy</span>
        </div>
      </Link>
    </li>
  );
}

export default function StorePage() {
  const installed = useDemo((s) => s.installed);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [pricing, setPricing] = useState<PricingFilter>('all');
  const [workflow, setWorkflow] = useState('all');
  const [sort, setSort] = useState<SortKey>('rating');

  const workflows = useMemo(
    () => Array.from(new Map(STORE_AGENTS.map((a) => [a.workflow, a.workflowLabel])).entries()),
    [],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STORE_AGENTS.filter(
      (a) =>
        (q === '' || `${a.name} ${a.publisher} ${a.description} ${a.workflowLabel}`.toLowerCase().includes(q)) &&
        (type === 'all' || a.type === type) &&
        (pricing === 'all' || a.pricingModel === pricing) &&
        (workflow === 'all' || a.workflow === workflow),
    ).sort((a, b) => (sort === 'rating' ? b.rating - a.rating : b.installs - a.installs));
  }, [query, type, pricing, workflow, sort]);

  const filtersActive = query !== '' || type !== 'all' || pricing !== 'all' || workflow !== 'all';
  const clearFilters = () => {
    setQuery('');
    setType('all');
    setPricing('all');
    setWorkflow('all');
  };

  const selectClass = cn(inputClass, 'mt-1 h-9 py-0');

  return (
    <div>
      <PageHeader
        title="Agent Store"
        description="Certified agents from partners and accounting firms. Every agent drafts only; nothing posts without your guardrails."
      />
      <Panel className="mb-4 p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="col-span-2">
            <label htmlFor="store-search" className="block text-xs text-muted">
              Search agents
            </label>
            <input
              id="store-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Revenue, leases, commissions"
              className={cn(inputClass, 'mt-1 h-9')}
            />
          </div>
          <div>
            <label htmlFor="store-type" className="block text-xs text-muted">
              Type
            </label>
            <select id="store-type" value={type} onChange={(e) => setType(e.target.value as TypeFilter)} className={selectClass}>
              <option value="all">All types</option>
              <option value="ISV">ISV</option>
              <option value="Advisor-built (no-code)">Advisor-built</option>
            </select>
          </div>
          <div>
            <label htmlFor="store-pricing" className="block text-xs text-muted">
              Pricing
            </label>
            <select
              id="store-pricing"
              value={pricing}
              onChange={(e) => setPricing(e.target.value as PricingFilter)}
              className={selectClass}
            >
              <option value="all">All pricing</option>
              <option value="per_outcome">Per outcome</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label htmlFor="store-workflow" className="block text-xs text-muted">
              Workflow
            </label>
            <select id="store-workflow" value={workflow} onChange={(e) => setWorkflow(e.target.value)} className={selectClass}>
              <option value="all">All workflows</option>
              {workflows.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted" data-testid="store-count">
            {results.length} {results.length === 1 ? 'agent' : 'agents'}
          </span>
          <div className="flex items-center gap-2">
            <label htmlFor="store-sort" className="text-muted">
              Sort by
            </label>
            <select id="store-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={cn(inputClass, 'h-8 w-auto py-0')}>
              <option value="rating">Rating</option>
              <option value="installs">Installs</option>
            </select>
          </div>
        </div>
      </Panel>

      {results.length === 0 ? (
        <Panel>
          <EmptyState
            icon={SearchX}
            title="No agents match"
            description={query ? `Nothing matches "${query}" with these filters.` : 'Nothing matches these filters.'}
            action={
              <Button variant="primary" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        </Panel>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((a) => (
            <AgentCard key={a.id} agent={a} installed={a.id in installed} />
          ))}
        </ul>
      )}
      {filtersActive && results.length > 0 ? (
        <button type="button" className="mt-4 text-sm text-action hover:underline" onClick={clearFilters}>
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
