import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Headset,
  Landmark,
  Mail,
  Receipt,
  RotateCcw,
  ScrollText,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { ConfirmDialog, Dialog } from '@/components/Dialog';
import { LaneBadge } from '@/components/LaneBadge';
import { MoneyText } from '@/components/MoneyText';
import { NotFoundInline } from '@/components/NotFoundInline';
import { toast } from '@/components/toast';
import { Button, ButtonLink, Chip, inputClass, Panel, PanelHeader } from '@/components/ui';
import { NO_DRAFT_TEMPLATES } from '@/data/closeItems';
import { recommendExpert } from '@/data/experts';
import type { BoardItem } from '@/domain/closeProgress';
import { entryBalanceCents } from '@/domain/closeProgress';
import { formatMoney, parseMoneyInput } from '@/domain/money';
import type { Currency, EntryLine, Evidence } from '@/domain/types';
import { formatTimestamp } from '@/lib/time';
import { cn } from '@/lib/cn';
import { useDemo } from '@/store/demoStore';
import { useCloseState } from '@/store/useClose';
import { statusText } from './ClosePage';

const EVIDENCE_ICONS: Record<Evidence['kind'], typeof FileText> = {
  'bank line': Landmark,
  invoice: Receipt,
  'prior-month pattern': TrendingUp,
  policy: ScrollText,
  contract: FileText,
  schedule: FileText,
  email: Mail,
};

function centsToInput(cents: number): string {
  return cents === 0 ? '' : (cents / 100).toFixed(2);
}

export function EntryTable({ lines, currency, caption }: { lines: EntryLine[]; currency: Currency; caption: string }) {
  const debit = lines.reduce((s, l) => s + l.debitCents, 0);
  const credit = lines.reduce((s, l) => s + l.creditCents, 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-hairline text-left text-xs text-muted">
            <th scope="col" className="px-4 py-2 font-medium sm:px-5">Account</th>
            <th scope="col" className="px-2 py-2 font-medium">Entity</th>
            <th scope="col" className="px-2 py-2 text-right font-medium">Debit</th>
            <th scope="col" className="px-4 py-2 text-right font-medium sm:px-5">Credit</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="border-b border-hairline/60">
              <td className="px-4 py-2 sm:px-5">{l.account}</td>
              <td className="px-2 py-2 text-muted">{l.entity}</td>
              <td className="tnum px-2 py-2 text-right">{l.debitCents ? formatMoney(l.debitCents, currency) : ''}</td>
              <td className="tnum px-4 py-2 text-right sm:px-5">{l.creditCents ? formatMoney(l.creditCents, currency) : ''}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="text-xs text-muted">
            <td className="px-4 py-2 sm:px-5" colSpan={2}>
              {debit === credit ? 'Balanced' : 'Not balanced'}
            </td>
            <td className="tnum px-2 py-2 text-right">{formatMoney(debit, currency)}</td>
            <td className="tnum px-4 py-2 text-right sm:px-5">{formatMoney(credit, currency)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function EntryEditor({
  initial,
  currency,
  onCancel,
  onSave,
}: {
  initial: EntryLine[];
  currency: Currency;
  onCancel: () => void;
  onSave: (lines: EntryLine[]) => void;
}) {
  const [values, setValues] = useState(() =>
    initial.map((l) => ({ debit: centsToInput(l.debitCents), credit: centsToInput(l.creditCents) })),
  );
  const parsed = values.map((v) => ({
    debit: v.debit.trim() === '' ? 0 : parseMoneyInput(v.debit),
    credit: v.credit.trim() === '' ? 0 : parseMoneyInput(v.credit),
  }));
  const invalid = parsed.some((p) => p.debit === null || p.credit === null || (p.debit ?? 0) < 0 || (p.credit ?? 0) < 0);
  const lines: EntryLine[] = initial.map((l, i) => ({
    ...l,
    debitCents: parsed[i].debit ?? 0,
    creditCents: parsed[i].credit ?? 0,
  }));
  const diff = entryBalanceCents(lines);
  const total = lines.reduce((s, l) => s + l.debitCents, 0);
  const canSave = !invalid && diff === 0 && total > 0;

  const update = (i: number, key: 'debit' | 'credit', value: string) =>
    setValues((vs) => vs.map((v, j) => (j === i ? { ...v, [key]: value } : v)));

  return (
    <div data-testid="entry-editor">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <caption className="sr-only">Edit entry lines</caption>
          <thead>
            <tr className="border-b border-hairline text-left text-xs text-muted">
              <th scope="col" className="px-4 py-2 font-medium sm:px-5">Account</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">Debit ({currency})</th>
              <th scope="col" className="px-4 py-2 text-right font-medium sm:px-5">Credit ({currency})</th>
            </tr>
          </thead>
          <tbody>
            {initial.map((l, i) => (
              <tr key={i} className="border-b border-hairline/60">
                <td className="px-4 py-2 sm:px-5">
                  {l.account}
                  <span className="ml-1 text-xs text-muted">{l.entity}</span>
                </td>
                <td className="px-2 py-2">
                  <input
                    className={cn(inputClass, 'tnum w-32 text-right')}
                    inputMode="decimal"
                    aria-label={`Debit for ${l.account}`}
                    value={values[i].debit}
                    aria-invalid={parsed[i].debit === null}
                    onChange={(e) => update(i, 'debit', e.target.value)}
                  />
                </td>
                <td className="px-4 py-2 sm:px-5">
                  <input
                    className={cn(inputClass, 'tnum w-32 text-right')}
                    inputMode="decimal"
                    aria-label={`Credit for ${l.account}`}
                    value={values[i].credit}
                    aria-invalid={parsed[i].credit === null}
                    onChange={(e) => update(i, 'credit', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <p
          className={cn('text-sm', canSave ? 'text-success' : 'text-lane-assist')}
          role="status"
          data-testid="balance-status"
        >
          {invalid
            ? 'Enter amounts like 1250.00, with at most 2 decimals and no minus sign.'
            : diff !== 0
              ? `Debits and credits differ by ${formatMoney(Math.abs(diff), currency)}. Adjust a line so they match.`
              : total === 0
                ? 'Enter at least one amount.'
                : 'Balanced. Ready to approve.'}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel edit
          </Button>
          <Button variant="primary" disabled={!canSave} onClick={() => onSave(lines)}>
            Approve edited entry
          </Button>
        </div>
      </div>
    </div>
  );
}

function ResolvedBanner({ b }: { b: BoardItem }) {
  const r = b.resolution;
  if (!r || r.state === 'reversed') return null;
  const Icon = r.state === 'rejected' ? XCircle : r.state === 'expert_reviewed' ? Headset : CheckCircle2;
  const verb = r.state === 'rejected' ? 'Rejected' : r.state === 'expert_reviewed' ? 'Expert-reviewed' : 'Approved';
  return (
    <div className="flex items-start gap-3 rounded-chip border border-hairline bg-bg p-3" data-testid="resolved-state">
      <Icon size={18} className={r.state === 'rejected' ? 'text-danger' : 'text-success'} aria-hidden />
      <div className="text-sm">
        <div className="font-medium">
          {verb} by {r.by}
        </div>
        <div className="text-muted">{formatTimestamp(r.at)}</div>
        {r.note ? <div className="mt-1 text-muted">Reason: {r.note}</div> : null}
      </div>
    </div>
  );
}

export default function ExceptionDetailPage() {
  const { itemId = '' } = useParams();
  const close = useCloseState();
  const navigate = useNavigate();
  const approveItem = useDemo((s) => s.approveItem);
  const rejectItem = useDemo((s) => s.rejectItem);
  const reverseItem = useDemo((s) => s.reverseItem);
  const sessions = useDemo((s) => s.expertSessions);
  const [editing, setEditing] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonTouched, setReasonTouched] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);

  const b = close.board.find((x) => x.item.id === itemId);
  if (!b) {
    return <NotFoundInline what="Close item" id={itemId} backTo="/cfo/close" backLabel="Back to Close Autopilot" />;
  }
  const { item, route } = b;
  const open = !b.resolution || b.resolution.state === 'reversed';
  const canDecide = open && !b.autoPosted && b.lane !== 'EXPERT';
  const hasDraft = item.proposedEntry.length > 0;
  const session = Object.values(sessions).find((s) => s.itemId === item.id);
  const expert = recommendExpert(item.category, item.workflow);
  const canReverse =
    b.autoPosted || b.resolution?.state === 'approved' || b.resolution?.state === 'expert_reviewed';
  const reasonLength = reason.trim().length;
  const reasonValid = reasonLength >= 5 && reasonLength <= 200;

  const approve = () => {
    const result = approveItem(item.id);
    if (result.ok) toast('Entry approved', `${item.id} posted and logged in the Flight Log.`);
  };

  return (
    <div>
      <Link to="/cfo/close" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <ArrowLeft size={15} aria-hidden />
        Back to Close Autopilot
      </Link>

      <header className="mb-6 mt-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip>{item.id}</Chip>
          <LaneBadge lane={b.lane} />
          <Chip>{item.entities.join(' and ')}</Chip>
          <span className="text-sm text-muted" data-testid="item-status">
            {statusText(b)}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-strong sm:text-3xl">{item.description}</h1>
        <p className="mt-1 text-base text-muted">
          <MoneyText cents={item.amountCents} currency={item.currency} /> proposed by {item.agent}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          <Panel>
            <PanelHeader title="Evidence" description={`${item.evidence.length} documents the agent used`} />
            <ul className="divide-y divide-hairline">
              {item.evidence.map((e) => {
                const Icon = EVIDENCE_ICONS[e.kind];
                return (
                  <li key={e.title} className="flex gap-3 px-4 py-3 sm:px-5">
                    <Icon size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
                    <div className="min-w-0 text-sm">
                      <div className="font-medium">{e.title}</div>
                      <div className="text-muted">{e.detail}</div>
                      <div className="mt-0.5 text-xs text-muted">{e.kind.charAt(0).toUpperCase() + e.kind.slice(1)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel>
            <PanelHeader title="Agent reasoning" description={item.agent} />
            <p className="prose-measure px-4 py-4 text-sm leading-relaxed sm:px-5">{item.reasoning}</p>
          </Panel>

          <Panel data-testid="proposed-entry">
            <PanelHeader
              title={editing ? 'Edit entry' : b.resolution?.entry ? 'Posted entry' : 'Proposed entry'}
              description={
                hasDraft
                  ? `Amounts in ${item.currency}. Debits must equal credits.`
                  : 'The agent did not draft an entry because confidence is below the 0.50 floor.'
              }
            />
            {editing ? (
              <EntryEditor
                initial={hasDraft ? item.proposedEntry : (NO_DRAFT_TEMPLATES[item.id] ?? [])}
                currency={item.currency}
                onCancel={() => setEditing(false)}
                onSave={(lines) => {
                  const result = approveItem(item.id, lines);
                  if (result.ok) {
                    setEditing(false);
                    toast('Edited entry approved', `${item.id} posted with your changes.`);
                  } else {
                    toast('Entry not approved', result.message, 'error');
                  }
                }}
              />
            ) : hasDraft || b.resolution?.entry ? (
              <EntryTable
                lines={b.resolution?.entry ?? item.proposedEntry}
                currency={item.currency}
                caption={`Entry lines for ${item.id}`}
              />
            ) : (
              <p className="px-4 py-4 text-sm text-muted sm:px-5">
                Choose Edit and approve to start from a suspense-account template and book it yourself.
              </p>
            )}
          </Panel>
        </div>

        <div className="min-w-0 space-y-4">
          <Panel data-testid="actions-panel">
            <PanelHeader title="Decision" />
            <div className="space-y-3 p-4 sm:p-5">
              <ResolvedBanner b={b} />
              {b.autoPosted ? (
                <div className="flex items-start gap-3 rounded-chip border border-lane-auto/40 bg-lane-auto/5 p-3 text-sm">
                  <CheckCircle2 size={18} className="shrink-0 text-lane-auto" aria-hidden />
                  <div>
                    <div className="font-medium">Auto-posted by {item.agent}</div>
                    <div className="text-muted">Every guardrail passed. Reverse it if anything looks wrong.</div>
                  </div>
                </div>
              ) : null}
              {b.resolution?.state === 'reversed' ? (
                <p className="rounded-chip border border-lane-assist/40 bg-lane-assist/5 p-3 text-sm">
                  You reversed the posted entry. Approve, edit, or reject it again.
                </p>
              ) : null}
              {!item.reversible && open ? (
                <p className="flex gap-2 rounded-chip border border-lane-assist/40 bg-lane-assist/5 p-3 text-sm">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-lane-assist" aria-hidden />
                  {item.irreversibleNote ?? 'This action cannot be undone once it runs.'}
                </p>
              ) : null}

              {canDecide && !editing ? (
                <div className="flex flex-col gap-2">
                  <Button variant="primary" disabled={!hasDraft} onClick={approve} data-testid="approve-entry">
                    Approve entry
                  </Button>
                  <Button variant="secondary" onClick={() => setEditing(true)}>
                    Edit and approve
                  </Button>
                  <Button variant="danger" onClick={() => setRejectOpen(true)}>
                    Reject
                  </Button>
                  {!hasDraft ? (
                    <p className="text-xs text-muted">
                      Approve entry is off because there is no draft. Use Edit and approve to book it.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {open && b.lane === 'EXPERT' ? (
                <p className="text-sm text-muted">
                  This category always goes to a human expert. {expert.name} is recommended.
                </p>
              ) : null}

              {open && !b.autoPosted ? (
                session && session.status !== 'accepted' ? (
                  <ButtonLink to={`/cfo/experts/${session.id}`} variant={b.lane === 'EXPERT' ? 'primary' : 'secondary'} className="w-full">
                    <Headset size={16} aria-hidden />
                    View expert session
                  </ButtonLink>
                ) : (
                  <Button
                    variant={b.lane === 'EXPERT' ? 'primary' : 'secondary'}
                    className="w-full"
                    onClick={() => navigate(`/cfo/experts/new-${item.id}`)}
                    data-testid="ask-expert"
                  >
                    <Headset size={16} aria-hidden />
                    Ask an expert
                  </Button>
                )
              ) : null}

              {canReverse ? (
                <Button variant="secondary" className="w-full" onClick={() => setReverseOpen(true)} data-testid="reverse-entry">
                  <RotateCcw size={16} aria-hidden />
                  Reverse entry
                </Button>
              ) : null}
              {!open ? (
                <Link to="/cfo/flight-log" className="block text-sm text-action hover:underline">
                  See it in the Flight Log
                </Link>
              ) : null}
            </div>
          </Panel>

          <Panel data-tour="why-lane" data-testid="why-lane">
            <PanelHeader title="Why this lane" description="The routing rule, checked in order" />
            <div className="space-y-3 p-4 sm:p-5">
              <ul className="space-y-1.5">
                {route.reasons.map((r) => (
                  <li key={r} className="text-sm font-medium">
                    {r}
                  </li>
                ))}
              </ul>
              <ul className="space-y-1.5 border-t border-hairline pt-3">
                {route.checks.map((c) => (
                  <li key={c.label} className="flex items-start gap-2 text-sm">
                    {c.passed ? (
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-success" aria-hidden />
                    ) : (
                      <XCircle size={15} className="mt-0.5 shrink-0 text-lane-assist" aria-hidden />
                    )}
                    <span className={c.passed ? 'text-muted' : undefined}>
                      <span className="sr-only">{c.passed ? 'Passed: ' : 'Failed: '}</span>
                      {c.label}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-hairline pt-3 text-sm">
                <span className="text-muted">Confidence</span>
                <ConfidenceMeter bps={item.confidenceBps} minBps={route.effectiveConfidenceMinBps} />
              </div>
              <Link to="/cfo/autonomy" className="block text-sm text-action hover:underline">
                Adjust guardrails in Control Tower
              </Link>
            </div>
          </Panel>
        </div>
      </div>

      <Dialog
        open={rejectOpen}
        onOpenChange={(o) => {
          setRejectOpen(o);
          if (!o) {
            setReason('');
            setReasonTouched(false);
          }
        }}
        title={`Reject ${item.id}?`}
        description="The agent learns from your reason. Nothing posts."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!reasonValid}
              onClick={() => {
                const result = rejectItem(item.id, reason);
                if (result.ok) {
                  setRejectOpen(false);
                  setReason('');
                  toast('Entry rejected', `${item.id} is closed with your reason.`);
                }
              }}
            >
              Reject entry
            </Button>
          </>
        }
      >
        <label htmlFor="reject-reason" className="block text-sm font-medium">
          Reason
        </label>
        <textarea
          id="reject-reason"
          className={cn(inputClass, 'mt-1.5 min-h-24')}
          value={reason}
          maxLength={220}
          aria-invalid={reasonTouched && !reasonValid}
          aria-describedby="reject-reason-help"
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setReasonTouched(true)}
        />
        <p
          id="reject-reason-help"
          className={cn('mt-1 text-xs', reasonTouched && !reasonValid ? 'text-danger' : 'text-muted')}
        >
          {reasonTouched && !reasonValid
            ? `A reason needs 5 to 200 characters (now ${reasonLength}).`
            : `5 to 200 characters. ${reasonLength} of 200.`}
        </p>
      </Dialog>

      <ConfirmDialog
        open={reverseOpen}
        onOpenChange={setReverseOpen}
        title={`Reverse ${item.id}?`}
        description="A linked reversal entry is posted and the original is marked Reversed in the Flight Log. The item comes back to you for review."
        confirmLabel="Reverse entry"
        danger
        onConfirm={() => {
          const result = reverseItem(item.id);
          if (result.ok) toast('Entry reversed', `${item.id} is back in the Assisted lane.`);
          else toast('Entry not reversed', result.message, 'error');
        }}
      >
        {b.resolution?.state === 'expert_reviewed' ? (
          <p className="flex gap-2 rounded-chip border border-lane-expert/40 bg-lane-expert/5 p-3 text-sm">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-lane-expert" aria-hidden />
            An expert reviewed this entry. Reversing it overrides their recommendation.
          </p>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}

