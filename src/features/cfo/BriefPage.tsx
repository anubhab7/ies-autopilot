import { Headset, MessageSquare, Plane } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MiniCashChart } from '@/components/charts/CashChart';
import { CloseTimeline } from '@/components/CloseTimeline';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { LaneBadge } from '@/components/LaneBadge';
import { ProgressRing } from '@/components/ProgressRing';
import { ButtonLink, Panel, PanelHeader } from '@/components/ui';
import { COMPANY, PEOPLE } from '@/data/company';
import { EXPERTS } from '@/data/experts';
import { formatCompact, formatMoney, formatMoneyWhole } from '@/domain/money';
import { baselineProjection, SUGGESTED_QUESTIONS } from '@/domain/scenarioEngine';
import { projectionMonthLabel } from '@/lib/time';
import { useDemo } from '@/store/demoStore';
import { useCloseState } from '@/store/useClose';
import { statusText } from './ClosePage';

const CASH_DATA = baselineProjection().map((cash, i) => ({ month: projectionMonthLabel(i), cash }));

export default function BriefPage() {
  const close = useCloseState();
  const sessions = useDemo((s) => s.expertSessions);
  const autoPosted = close.board.filter((b) => b.autoPosted);
  const autoTotal = autoPosted.reduce((s, b) => s + Math.abs(b.route.usdCents), 0);
  const needsYou = close.board
    .filter((b) => b.lane === 'ASSISTED' && (!b.resolution || b.resolution.state === 'reversed'))
    .sort((a, b) => Math.abs(b.route.usdCents) - Math.abs(a.route.usdCents));
  const withExperts = close.board.filter((b) => b.lane === 'EXPERT' && !b.resolution);

  return (
    <div>
      <header className="mb-6">
        <p className="text-sm text-muted">Friday, October 2, 2026. September close, business day 2 of 3.</p>
        <h1 className="mt-1 text-2xl font-strong sm:text-3xl">Good morning, {PEOPLE.user.firstName}</h1>
        <p className="mt-2 max-w-2xl text-base text-muted">
          Autopilot worked overnight. {needsYou.length} {needsYou.length === 1 ? 'item needs' : 'items need'} your
          decision and {withExperts.length} {withExperts.length === 1 ? 'is' : 'are'} with experts. You are on track
          for a 3-day close.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="p-4 sm:p-5" data-tour="brief-progress">
          <h2 className="mb-4 text-base font-strong">Close progress</h2>
          <ProgressRing
            percent={close.progress.percent}
            label="Close progress"
            sublabel={`${close.progress.done} of ${close.progress.total} tasks done`}
          />
          <div className="mt-5">
            <CloseTimeline compact />
          </div>
        </Panel>

        <Panel className="p-4 sm:p-5" data-testid="overnight">
          <h2 className="flex items-center gap-2 text-base font-strong">
            <Plane size={16} className="text-lane-auto" aria-hidden />
            What Autopilot did overnight
          </h2>
          <div className="mt-4 flex items-baseline gap-6">
            <div>
              <div className="tnum text-3xl font-medium" data-testid="overnight-count">
                {autoPosted.length}
              </div>
              <div className="text-sm text-muted">entries auto-posted</div>
            </div>
            <div>
              <div className="tnum text-3xl font-medium">{formatCompact(autoTotal)}</div>
              <div className="text-sm text-muted">{formatMoney(autoTotal)} total</div>
            </div>
          </div>
          <ul className="mt-4 space-y-1.5 text-sm">
            {autoPosted.map((b) => (
              <li key={b.item.id} className="flex justify-between gap-3">
                <Link to={`/cfo/close/${b.item.id}`} className="min-w-0 truncate hover:underline">
                  <span className="text-muted">{b.item.id}</span> {b.item.description}
                </Link>
                <span className="tnum shrink-0 text-muted">{formatMoneyWhole(b.route.usdCents)}</span>
              </li>
            ))}
          </ul>
          <Link to="/cfo/flight-log" className="mt-3 inline-block text-sm text-action hover:underline">
            Review in the Flight Log
          </Link>
        </Panel>

        <Panel className="p-4 sm:p-5">
          <h2 className="text-base font-strong">Cash snapshot</h2>
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <div>
              <div className="tnum text-3xl font-medium">{formatCompact(COMPANY.cashOnHandCents)}</div>
              <div className="text-sm text-muted">cash on hand today</div>
            </div>
            <div className="text-right">
              <div className="tnum text-base font-medium">+{formatCompact(COMPANY.monthlyRevenueCents - COMPANY.monthlyCostsCents)}</div>
              <div className="text-xs text-muted">net per month</div>
            </div>
          </div>
          <div className="mt-3">
            <MiniCashChart data={CASH_DATA} />
          </div>
          <p className="text-xs text-muted">12-month projection, demo ledger</p>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel data-testid="needs-you">
          <PanelHeader
            title="Needs you"
            description="Assisted items, largest first"
            actions={
              <ButtonLink to="/cfo/close" size="sm" variant="secondary">
                Open Close Autopilot
              </ButtonLink>
            }
          />
          {needsYou.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">Nothing needs you right now. Check the Flight Log for what posted.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {needsYou.map((b) => (
                <li key={b.item.id}>
                  <Link
                    to={`/cfo/close/${b.item.id}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-raised/50 sm:px-5"
                  >
                    <span className="min-w-0">
                      <span className="text-xs text-muted">{b.item.id}, {b.item.entities.join(' and ')}</span>
                      <span className="block truncate text-sm">{b.item.description}</span>
                    </span>
                    <span className="tnum text-right text-sm font-medium">{formatMoney(Math.abs(b.route.usdCents))}</span>
                    <span className="truncate text-xs text-muted">{b.route.reasons[0]}</span>
                    <ConfidenceMeter bps={b.item.confidenceBps} minBps={b.route.effectiveConfidenceMinBps} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHeader title="With experts" description="Categories a CPA always reviews" />
            {withExperts.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">No items are waiting on an expert.</p>
            ) : (
              <ul className="divide-y divide-hairline">
                {withExperts.map((b) => {
                  const session = Object.values(sessions).find((s) => s.itemId === b.item.id);
                  const expert = session ? EXPERTS.find((e) => e.id === session.expertId) : undefined;
                  return (
                    <li key={b.item.id}>
                      <Link to={`/cfo/close/${b.item.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-raised/50 sm:px-5">
                        <span className="min-w-0">
                          <span className="block truncate text-sm">{b.item.description}</span>
                          <span className="text-xs text-muted">
                            {session && expert
                              ? `${expert.name} ${session.status === 'replied' ? 'replied' : 'is reviewing'}`
                              : statusText(b)}
                          </span>
                        </span>
                        <LaneBadge lane="EXPERT" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Ask Autopilot" description="Scenarios grounded in your ledger" />
            <ul className="space-y-1 p-2">
              {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                <li key={q.intent}>
                  <Link
                    to="/cfo/ask"
                    state={{ ask: q.text }}
                    className="flex items-center gap-2 rounded-chip px-3 py-2 text-sm hover:bg-raised"
                  >
                    <MessageSquare size={15} className="shrink-0 text-action" aria-hidden />
                    {q.text}
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
          <p className="flex items-center gap-2 px-1 text-xs text-muted">
            <Headset size={14} aria-hidden /> Experts on call today: Priya Raman, Daniel Osei, Hannah Weiss
          </p>
        </div>
      </div>
    </div>
  );
}
