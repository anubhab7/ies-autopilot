import { CheckCircle2, Circle, Inbox } from 'lucide-react';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CloseTimeline } from '@/components/CloseTimeline';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { ConfirmDialog } from '@/components/Dialog';
import { EmptyState } from '@/components/EmptyState';
import { LANE_META, LANE_ORDER, LaneBadge } from '@/components/LaneBadge';
import { ProgressRing } from '@/components/ProgressRing';
import { toast } from '@/components/toast';
import { Button, Chip, PageHeader, Panel, PanelHeader, Tooltip } from '@/components/ui';
import { ENTITIES } from '@/data/company';
import type { BoardItem } from '@/domain/closeProgress';
import { isResolved } from '@/domain/closeProgress';
import { materialityThresholdCents } from '@/domain/autonomyEngine';
import { formatConfidence, formatMoney, formatMoneyWhole } from '@/domain/money';
import type { EntityFilter, Lane } from '@/domain/types';
import { cn } from '@/lib/cn';
import { useDemo } from '@/store/demoStore';
import { useCloseState } from '@/store/useClose';

export const BULK_MAX_CENTS = 1_000_000;
export const BULK_MIN_CONFIDENCE_BPS = 9_000;

let introPlayed = false;

export function statusText(b: BoardItem): string {
  if (b.resolution?.state === 'approved') return 'Approved';
  if (b.resolution?.state === 'rejected') return 'Rejected';
  if (b.resolution?.state === 'expert_reviewed') return 'Expert-reviewed';
  if (b.resolution?.state === 'reversed') return 'Reversed, needs review';
  if (b.autoPosted) return 'Auto-posted';
  if (b.lane === 'EXPERT') return 'Needs an expert';
  if (b.lane === 'MANUAL') return 'Manual';
  if (b.route.noDraft) return 'No draft, needs you';
  return 'Needs you';
}

function BoardRow({ b, index, intro }: { b: BoardItem; index: number; intro: boolean }) {
  const posting = intro && b.lane === 'AUTONOMOUS';
  return (
    <motion.li
      layout
      layoutId={b.item.id}
      initial={intro ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: intro ? 0.1 + index * 0.08 : 0, duration: 0.25 }}
      data-testid={`board-row-${b.item.id}`}
      data-lane={b.lane}
    >
      <Link
        to={`/cfo/close/${b.item.id}`}
        className="block rounded-chip border border-hairline bg-bg px-3 py-2.5 transition-colors hover:border-muted"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted">{b.item.id}</span>
          <span className="tnum text-sm font-medium">{formatMoney(Math.abs(b.route.usdCents))}</span>
        </div>
        <div className="mt-1 text-sm leading-snug">{b.item.description}</div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <span className="text-xs text-muted">
            {b.item.agent}, {b.item.entities.join(' and ')}
          </span>
          <ConfidenceMeter bps={b.item.confidenceBps} minBps={b.route.effectiveConfidenceMinBps} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <LaneBadge lane={b.lane} />
          <span className={cn('text-xs', posting ? 'text-lane-auto' : 'text-muted')}>
            {posting ? 'Posting with evidence' : statusText(b)}
          </span>
        </div>
      </Link>
    </motion.li>
  );
}

function LaneColumn({ lane, items, intro, offset }: { lane: Lane; items: BoardItem[]; intro: boolean; offset: number }) {
  const meta = LANE_META[lane];
  const Icon = meta.icon;
  return (
    <section
      className="flex min-w-0 flex-col rounded-panel border border-hairline bg-surface"
      aria-labelledby={`lane-${lane}`}
      data-testid={`lane-${lane}`}
    >
      <div className={cn('border-b border-hairline px-3 py-2.5', 'border-t-2 rounded-t-panel', meta.border)}>
        <div className="flex items-center justify-between gap-2">
          <h2 id={`lane-${lane}`} className={cn('flex items-center gap-1.5 text-sm font-strong', meta.text)}>
            <Icon size={15} aria-hidden />
            {meta.label}
          </h2>
          <span className="tnum text-sm text-muted" data-testid={`lane-count-${lane}`}>
            {items.length}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted">{meta.description}</p>
      </div>
      {items.length === 0 ? (
        <p className="px-3 py-6 text-center text-xs text-muted">Nothing here right now.</p>
      ) : (
        <ul className="flex flex-col gap-2 p-2">
          {items.map((b, i) => (
            <BoardRow key={b.item.id} b={b} index={offset + i} intro={intro} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ClosePage() {
  const close = useCloseState();
  const entityFilter = useDemo((s) => s.entityFilter);
  const setEntityFilter = useDemo((s) => s.setEntityFilter);
  const bulkApprove = useDemo((s) => s.bulkApprove);
  const reduceMotion = useReducedMotion();
  const [intro, setIntro] = useState(() => !introPlayed && !reduceMotion);
  const [bulkOpen, setBulkOpen] = useState(false);

  useEffect(() => {
    if (!intro) return;
    const timer = window.setTimeout(() => setIntro(false), 1500);
    return () => {
      window.clearTimeout(timer);
      introPlayed = true;
    };
  }, [intro]);

  const visible = useMemo(
    () =>
      close.board.filter((b) => entityFilter === 'ALL' || b.item.entities.includes(entityFilter)),
    [close.board, entityFilter],
  );
  const open = visible.filter((b) => !b.resolution || b.resolution.state === 'reversed');
  const resolved = visible.filter((b) => isResolved(b.resolution));
  const byLane = (lane: Lane) =>
    open.filter((b) => b.lane === lane).sort((a, b) => Math.abs(b.route.usdCents) - Math.abs(a.route.usdCents));
  const lanes = LANE_ORDER.filter((l) => l !== 'MANUAL' || byLane('MANUAL').length > 0);

  const bulkEligible = open.filter(
    (b) =>
      b.lane === 'ASSISTED' &&
      !b.route.noDraft &&
      b.item.proposedEntry.length > 0 &&
      Math.abs(b.route.usdCents) < BULK_MAX_CENTS &&
      b.item.confidenceBps >= BULK_MIN_CONFIDENCE_BPS,
  );

  const tasks = close.tasks.filter((t) => entityFilter === 'ALL' || t.entity === entityFilter);
  const entities = ENTITIES.filter((e) => entityFilter === 'ALL' || e.id === entityFilter);

  const bulkButton = (
    <Button
      variant="secondary"
      disabled={bulkEligible.length === 0}
      onClick={() => setBulkOpen(true)}
      data-testid="bulk-approve"
      className="h-auto! min-h-10 whitespace-normal! py-2! text-left"
    >
      Approve all under $10,000 with confidence 0.90 or higher
    </Button>
  );

  let laneOffset = 0;

  return (
    <div>
      <PageHeader
        title="Close Autopilot"
        description="Agents work the September close across all three entities. You handle what they route to you."
      >
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Chip>Business day 2 of target 3</Chip>
          <Chip>Materiality limit {formatMoneyWhole(materialityThresholdCents(close.policy))}</Chip>
          <Chip>Confidence minimum {formatConfidence(close.policy.confidenceMinBps)}</Chip>
        </div>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Panel className="flex items-center p-4 sm:p-5">
          <ProgressRing
            percent={close.progress.percent}
            label="Close progress"
            sublabel={`${close.progress.done} of ${close.progress.total} tasks done across 3 entities`}
          />
        </Panel>
        <Panel className="p-4 sm:p-5">
          <CloseTimeline currentDay={2} />
        </Panel>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filter by entity" className="flex flex-wrap gap-1">
          {(['ALL', 'US', 'CA', 'UK'] as EntityFilter[]).map((e) => (
            <button
              key={e}
              type="button"
              aria-pressed={entityFilter === e}
              onClick={() => setEntityFilter(e)}
              className={cn(
                'h-8 rounded-chip border px-3 text-sm',
                entityFilter === e ? 'border-action bg-raised text-text' : 'border-hairline text-muted hover:text-text',
              )}
            >
              {e === 'ALL' ? 'All entities' : e === 'CA' ? 'Canada' : e}
            </button>
          ))}
        </div>
        {bulkEligible.length === 0 ? (
          <Tooltip content="No Assisted item is under $10,000 with confidence 0.90 or higher and a balanced draft. Lower an autonomy level to L1 to see some qualify.">
            <span tabIndex={0} className="inline-flex rounded-chip" data-testid="bulk-approve-wrapper">
              {bulkButton}
            </span>
          </Tooltip>
        ) : (
          bulkButton
        )}
      </div>

      {intro ? (
        <div
          className="mt-4 flex items-center justify-between gap-3 rounded-panel border border-lane-auto/40 bg-lane-auto/5 px-4 py-2.5"
          role="status"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative h-1.5 w-24 overflow-hidden rounded-full bg-hairline" aria-hidden>
              <motion.span
                className="absolute inset-y-0 left-0 bg-lane-auto"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
            </span>
            <span className="truncate text-sm">Agents are working through {open.length} items</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIntro(false)}>
            Skip
          </Button>
        </div>
      ) : null}

      <LayoutGroup>
        <div
          className={cn('mt-4 grid gap-3 md:grid-cols-2', lanes.length === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3')}
          data-tour="lane-board"
          data-testid="lane-board"
        >
          {lanes.map((lane) => {
            const items = byLane(lane);
            const col = <LaneColumn key={lane} lane={lane} items={items} intro={intro} offset={laneOffset} />;
            laneOffset += items.length;
            return col;
          })}
        </div>
      </LayoutGroup>

      {open.length === 0 ? (
        <Panel className="mt-3">
          <EmptyState
            icon={Inbox}
            title="Nothing open for this entity"
            description="Every item is posted or resolved. Pick another entity or check the Flight Log for the full trail."
            action={
              <Button variant="secondary" onClick={() => setEntityFilter('ALL')}>
                Show all entities
              </Button>
            }
          />
        </Panel>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader title="Close checklist" description="Tasks finish when every linked item is posted or resolved." />
          <div className={cn('grid gap-px bg-hairline', entities.length > 1 && 'md:grid-cols-3')}>
            {entities.map((entity) => {
              const list = tasks.filter((t) => t.entity === entity.id);
              const done = list.filter((t) => t.done).length;
              return (
                <div key={entity.id} className="bg-surface p-4" data-testid={`tasks-${entity.id}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-strong">{entity.name}</h3>
                    <span className="tnum text-xs text-muted">
                      {done} of {list.length}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {list.map((t) => (
                      <li key={t.id} className="flex items-center gap-2 text-sm">
                        {t.done ? (
                          <CheckCircle2 size={15} className="shrink-0 text-success" aria-hidden />
                        ) : (
                          <Circle size={15} className="shrink-0 text-muted" aria-hidden />
                        )}
                        <span className={t.done ? 'text-muted' : undefined}>{t.name}</span>
                        <span className="sr-only">{t.done ? 'done' : 'open'}</span>
                        {!t.done && t.openItemIds.length > 0 ? (
                          <span className="ml-auto whitespace-nowrap text-xs text-muted">{t.openItemIds.join(', ')}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Resolved today" description="Approved, rejected, or expert-reviewed by a person." />
          {resolved.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">
              Nothing resolved yet. Open an Assisted item to approve it.
            </p>
          ) : (
            <ul className="divide-y divide-hairline" data-testid="resolved-list">
              {resolved.map((b) => (
                <li key={b.item.id}>
                  <Link to={`/cfo/close/${b.item.id}`} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm hover:bg-raised/50">
                    <span className="min-w-0 truncate">
                      <span className="text-muted">{b.item.id}</span> {b.item.description}
                    </span>
                    <span className="shrink-0 text-xs text-muted">{statusText(b)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <ConfirmDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title={`Approve ${bulkEligible.length} ${bulkEligible.length === 1 ? 'entry' : 'entries'}?`}
        description="Each drafted entry below posts as proposed and is written to the Flight Log under your name."
        confirmLabel={`Approve ${bulkEligible.length} ${bulkEligible.length === 1 ? 'entry' : 'entries'}`}
        onConfirm={() => {
          const count = bulkApprove(bulkEligible.map((b) => b.item.id));
          toast(`${count} ${count === 1 ? 'entry' : 'entries'} approved`, 'Each one is in the Flight Log.');
        }}
      >
        <ul className="divide-y divide-hairline rounded-chip border border-hairline" data-testid="bulk-list">
          {bulkEligible.map((b) => (
            <li key={b.item.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="min-w-0 truncate">
                <span className="text-muted">{b.item.id}</span> {b.item.description}
              </span>
              <span className="tnum shrink-0">{formatMoney(b.route.usdCents)}</span>
            </li>
          ))}
        </ul>
      </ConfirmDialog>
    </div>
  );
}
