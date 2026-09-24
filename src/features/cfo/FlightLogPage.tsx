import { AlertTriangle, Download, RotateCcw, SearchX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '@/components/Dialog';
import { EmptyState } from '@/components/EmptyState';
import { LaneBadge, LANE_META, LANE_ORDER } from '@/components/LaneBadge';
import { LOG_STATUS_META, LogStatusBadge } from '@/components/LogStatusBadge';
import { toast } from '@/components/toast';
import { Button, inputClass, PageHeader, Panel } from '@/components/ui';
import { toCsv, type CsvColumn } from '@/domain/csv';
import { formatConfidence, formatMoney } from '@/domain/money';
import type { ActorType, EntityId, Lane, LogEntry, LogStatus } from '@/domain/types';
import { formatTimestamp } from '@/lib/time';
import { cn } from '@/lib/cn';
import { useDemo } from '@/store/demoStore';
import { useCloseState, useFlightLog } from '@/store/useClose';

type Filter<T extends string> = 'all' | T;

export const LOG_CSV_COLUMNS: CsvColumn<LogEntry>[] = [
  { header: 'Entry id', value: (e) => (e.derived ? `${e.id} (pending id)` : e.id) },
  { header: 'Time', value: (e) => e.at },
  { header: 'Actor', value: (e) => e.actor },
  { header: 'Actor type', value: (e) => e.actorType },
  { header: 'Action', value: (e) => e.action },
  { header: 'Item', value: (e) => e.itemId },
  { header: 'Entity', value: (e) => e.entities.join(' and ') },
  { header: 'Amount USD', value: (e) => (e.usdCents / 100).toFixed(2) },
  { header: 'Lane', value: (e) => LANE_META[e.lane].label },
  { header: 'Confidence', value: (e) => (e.confidenceBps === null ? '' : formatConfidence(e.confidenceBps)) },
  { header: 'Status', value: (e) => LOG_STATUS_META[e.status].label },
  { header: 'Linked entry', value: (e) => e.linkedEntryId ?? '' },
  { header: 'Note', value: (e) => e.note ?? '' },
];

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Select<T extends string>({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-xs text-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={cn(inputClass, 'mt-1 h-9 py-0')}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function FlightLogPage() {
  const entries = useFlightLog();
  const close = useCloseState();
  const reverseEntry = useDemo((s) => s.reverseEntry);
  const [actor, setActor] = useState<Filter<ActorType>>('all');
  const [lane, setLane] = useState<Filter<Lane>>('all');
  const [entity, setEntity] = useState<Filter<EntityId>>('all');
  const [status, setStatus] = useState<Filter<LogStatus>>('all');
  const [query, setQuery] = useState('');
  const [reverseTarget, setReverseTarget] = useState<LogEntry | null>(null);

  const boardIds = useMemo(() => new Set(close.items.map((i) => i.id)), [close.items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (actor === 'all' || e.actorType === actor) &&
        (lane === 'all' || e.lane === lane) &&
        (entity === 'all' || e.entities.includes(entity)) &&
        (status === 'all' || e.status === status) &&
        (q === '' ||
          `${e.id} ${e.actor} ${e.action} ${e.itemId} ${e.note ?? ''}`.toLowerCase().includes(q)),
    );
  }, [entries, actor, lane, entity, status, query]);

  const clearFilters = () => {
    setActor('all');
    setLane('all');
    setEntity('all');
    setStatus('all');
    setQuery('');
  };

  return (
    <div>
      <PageHeader
        title="Flight Log"
        description="Every agent, human, and expert action in the close, with evidence and reversal. Nothing is ever deleted."
        actions={
          <Button
            variant="secondary"
            disabled={filtered.length === 0}
            onClick={() => {
              downloadCsv('flight-log-september-2026.csv', toCsv(filtered, LOG_CSV_COLUMNS));
              toast('CSV exported', `${filtered.length} rows downloaded.`);
            }}
          >
            <Download size={16} aria-hidden />
            Export CSV
          </Button>
        }
      />

      <Panel className="mb-4 p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <div className="col-span-2 md:col-span-3 xl:col-span-1">
            <label htmlFor="log-search" className="block text-xs text-muted">
              Search
            </label>
            <input
              id="log-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Item, actor, or note"
              className={cn(inputClass, 'mt-1 h-9')}
            />
          </div>
          <Select
            id="log-actor"
            label="Actor"
            value={actor}
            onChange={setActor}
            options={[
              { value: 'all', label: 'All actors' },
              { value: 'agent', label: 'Agent' },
              { value: 'human', label: 'Human' },
              { value: 'expert', label: 'Expert' },
            ]}
          />
          <Select
            id="log-lane"
            label="Lane"
            value={lane}
            onChange={setLane}
            options={[{ value: 'all', label: 'All lanes' }, ...LANE_ORDER.map((l) => ({ value: l, label: LANE_META[l].label }))]}
          />
          <Select
            id="log-entity"
            label="Entity"
            value={entity}
            onChange={setEntity}
            options={[
              { value: 'all', label: 'All entities' },
              { value: 'US', label: 'US' },
              { value: 'CA', label: 'Canada' },
              { value: 'UK', label: 'UK' },
            ]}
          />
          <Select
            id="log-status"
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All statuses' },
              ...(Object.keys(LOG_STATUS_META) as LogStatus[]).map((s) => ({ value: s, label: LOG_STATUS_META[s].label })),
            ]}
          />
        </div>
      </Panel>

      <Panel data-tour="flight-log-table">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5 text-sm text-muted sm:px-5">
          <span data-testid="log-count">
            {filtered.length} of {entries.length} entries
          </span>
          {filtered.length !== entries.length ? (
            <button type="button" className="text-action hover:underline" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No entries match these filters"
            description="Try a different item id or clear the filters to see the full trail."
            action={
              <Button variant="primary" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto" tabIndex={0} aria-label="Flight Log table, scrolls horizontally" role="region">
            <table className="w-full min-w-[980px] text-sm" data-testid="flight-log-table">
              <caption className="sr-only">Flight Log entries, newest first</caption>
              <thead>
                <tr className="border-b border-hairline text-left text-xs text-muted">
                  <th scope="col" className="px-4 py-2 font-medium sm:px-5">Time</th>
                  <th scope="col" className="px-2 py-2 font-medium">Actor</th>
                  <th scope="col" className="px-2 py-2 font-medium">Action</th>
                  <th scope="col" className="px-2 py-2 font-medium">Item</th>
                  <th scope="col" className="px-2 py-2 font-medium">Entity</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Amount</th>
                  <th scope="col" className="px-2 py-2 font-medium">Lane</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Confidence</th>
                  <th scope="col" className="px-2 py-2 font-medium">Status</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium sm:px-5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const reversible = e.status === 'posted' || e.status === 'expert_reviewed';
                  return (
                    <tr key={e.id} className="border-b border-hairline/60 last:border-0" data-testid={`log-row-${e.itemId}`} data-status={e.status}>
                      <td className="tnum whitespace-nowrap px-4 py-2.5 text-muted sm:px-5">{formatTimestamp(e.at)}</td>
                      <td className="px-2 py-2.5">{e.actor}</td>
                      <td className="px-2 py-2.5">
                        {e.action}
                        {e.note ? <div className="text-xs text-muted">{e.note}</div> : null}
                        {e.linkedEntryId ? <div className="text-xs text-muted">Linked to {e.linkedEntryId}</div> : null}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2.5">
                        {boardIds.has(e.itemId) ? (
                          <Link to={`/cfo/close/${e.itemId}`} className="text-action hover:underline">
                            {e.itemId}
                          </Link>
                        ) : (
                          e.itemId
                        )}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-muted">{e.entities.join(' and ')}</td>
                      <td className="tnum whitespace-nowrap px-2 py-2.5 text-right">{formatMoney(e.usdCents)}</td>
                      <td className="px-2 py-2.5">
                        <LaneBadge lane={e.lane} />
                      </td>
                      <td className="tnum px-2 py-2.5 text-right text-muted">
                        {e.confidenceBps === null ? '' : formatConfidence(e.confidenceBps)}
                      </td>
                      <td className="px-2 py-2.5">
                        <LogStatusBadge status={e.status} />
                      </td>
                      <td className="px-4 py-2.5 text-right sm:px-5">
                        {reversible ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setReverseTarget(e)}
                            aria-label={`Reverse ${e.itemId}`}
                          >
                            <RotateCcw size={14} aria-hidden />
                            Reverse
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <ConfirmDialog
        open={reverseTarget !== null}
        onOpenChange={(o) => {
          if (!o) setReverseTarget(null);
        }}
        title={reverseTarget ? `Reverse ${reverseTarget.itemId}?` : 'Reverse entry?'}
        description="A new reversal entry is posted and linked to the original, which is marked Reversed. You cannot reverse it twice."
        confirmLabel="Reverse entry"
        danger
        onConfirm={() => {
          if (!reverseTarget) return;
          const result = reverseEntry(reverseTarget.id);
          if (result.ok) toast('Entry reversed', `${reverseTarget.itemId} now has a linked reversal.`);
          else toast('Entry not reversed', result.message, 'error');
        }}
      >
        {reverseTarget?.status === 'expert_reviewed' ? (
          <p className="flex gap-2 rounded-chip border border-lane-expert/40 bg-lane-expert/5 p-3 text-sm" data-testid="expert-reverse-warning">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-lane-expert" aria-hidden />
            An expert reviewed this entry. Reversing it overrides their recommendation, so tell them why.
          </p>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
