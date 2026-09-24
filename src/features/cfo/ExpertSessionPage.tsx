import { ArrowLeft, CheckCircle2, FileText, Headset, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { LaneBadge } from '@/components/LaneBadge';
import { MoneyText } from '@/components/MoneyText';
import { NotFoundInline } from '@/components/NotFoundInline';
import { toast } from '@/components/toast';
import { Button, ButtonLink, Chip, inputClass, PageHeader, Panel, PanelHeader } from '@/components/ui';
import { EXPERT_REPLIES, EXPERTS, recommendExpert, type Expert } from '@/data/experts';
import { formatMoney } from '@/domain/money';
import { cn } from '@/lib/cn';
import { simulatedDelay } from '@/lib/fastMode';
import { formatTimestamp } from '@/lib/time';
import { useDemo, type ExpertSession } from '@/store/demoStore';
import { useCloseState } from '@/store/useClose';
import { EntryTable } from './ExceptionDetailPage';

function defaultQuestion(itemId: string, description: string): string {
  if (itemId === 'TP-12') {
    return 'Is a 5% cost-plus markup on the September shared services recharge defensible, and is the drafted entry right?';
  }
  return `Can you confirm the treatment for ${itemId} (${description}) and the drafted entry?`;
}

function ExpertOption({
  expert,
  selected,
  recommended,
  onSelect,
}: {
  expert: Expert;
  selected: boolean;
  recommended: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-chip border p-3 transition-colors',
        selected ? 'border-action bg-raised' : 'border-hairline hover:border-muted',
      )}
    >
      <input type="radio" name="expert" checked={selected} onChange={onSelect} className="mt-1 accent-[var(--action)]" />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">
            {expert.name}, {expert.credential}
          </span>
          {recommended ? <Chip className="border-lane-expert/50 text-lane-expert">Recommended</Chip> : null}
        </span>
        <span className="block text-sm text-muted">{expert.focus}</span>
        <span className="tnum mt-1 block text-xs text-muted">
          Typically replies in {expert.responseMinutes} minutes. {formatMoney(expert.rateCentsPer30).replace('.00', '')} per 30 minutes.
        </span>
      </span>
    </label>
  );
}

function DraftView({ itemId }: { itemId: string }) {
  const close = useCloseState();
  const sessions = useDemo((s) => s.expertSessions);
  const sendToExpert = useDemo((s) => s.sendToExpert);
  const navigate = useNavigate();
  const b = close.board.find((x) => x.item.id === itemId);
  const recommended = b ? recommendExpert(b.item.category, b.item.workflow) : EXPERTS[0];
  const [expertId, setExpertId] = useState(recommended.id);
  const [question, setQuestion] = useState(() => (b ? defaultQuestion(b.item.id, b.item.description) : ''));

  if (!b) return <NotFoundInline what="Close item" id={itemId} backTo="/cfo/close" backLabel="Back to Close Autopilot" />;
  const existing = Object.values(sessions).find((s) => s.itemId === itemId && s.status !== 'accepted');
  if (existing) return <Navigate to={`/cfo/experts/${existing.id}`} replace />;
  if (b.resolution && b.resolution.state !== 'reversed') {
    return (
      <div>
        <PageHeader title={`${itemId} is already resolved`} description="There is nothing to send to an expert." />
        <ButtonLink to={`/cfo/close/${itemId}`} variant="primary">
          Back to {itemId}
        </ButtonLink>
      </div>
    );
  }
  const { item } = b;
  const expert = EXPERTS.find((e) => e.id === expertId) ?? recommended;
  const related = close.board.filter(
    (x) => x.item.id !== item.id && (x.item.taskIds.some((t) => item.taskIds.includes(t)) || (item.id === 'TP-12' && x.item.id === 'IC-310')),
  );
  const questionValid = question.trim().length >= 10 && question.length <= 500;

  return (
    <div>
      <Link to={`/cfo/close/${item.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <ArrowLeft size={15} aria-hidden />
        Back to {item.id}
      </Link>
      <PageHeader
        title="Ask an expert"
        description="Autopilot assembled everything the expert needs, so they can answer without a call."
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel data-tour="expert-packet" data-testid="context-packet">
          <PanelHeader title="Context packet" description="Sent to the expert with your question" />
          <div className="space-y-4 p-4 sm:p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Chip>{item.id}</Chip>
                <LaneBadge lane={b.lane} />
                <Chip>{item.entities.join(' and ')}</Chip>
              </div>
              <p className="mt-2 text-base font-medium">{item.description}</p>
              <p className="text-sm text-muted">
                <MoneyText cents={item.amountCents} currency={item.currency} />, confidence{' '}
                {(item.confidenceBps / 10_000).toFixed(2)}, proposed by {item.agent}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-strong">Evidence</h3>
              <ul className="mt-1.5 space-y-1 text-sm">
                {item.evidence.map((e) => (
                  <li key={e.title} className="flex gap-2">
                    <FileText size={14} className="mt-0.5 shrink-0 text-muted" aria-hidden />
                    <span>
                      {e.title} <span className="text-muted">({e.detail})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-strong">Related entries</h3>
              {related.length === 0 ? (
                <p className="mt-1 text-sm text-muted">None in this close.</p>
              ) : (
                <ul className="mt-1.5 space-y-1 text-sm">
                  {related.map((r) => (
                    <li key={r.item.id}>
                      <span className="text-muted">{r.item.id}</span> {r.item.description},{' '}
                      <span className="tnum">{formatMoney(r.route.usdCents)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="text-sm font-strong">Policy and routing</h3>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-muted">
                {b.route.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-strong">Draft entry</h3>
              {item.proposedEntry.length > 0 ? (
                <div className="-mx-4 mt-1 sm:-mx-5">
                  <EntryTable lines={item.proposedEntry} currency={item.currency} caption="Draft entry in the packet" />
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted">No draft; the agent was not confident enough.</p>
              )}
            </div>
            <div>
              <label htmlFor="expert-question" className="text-sm font-strong">
                Your question
              </label>
              <textarea
                id="expert-question"
                className={cn(inputClass, 'mt-1.5 min-h-20')}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                aria-invalid={!questionValid}
                aria-describedby="expert-question-help"
              />
              <p id="expert-question-help" className={cn('mt-1 text-xs', questionValid ? 'text-muted' : 'text-danger')}>
                {questionValid ? `${question.length} of 500 characters` : 'Write a question of 10 to 500 characters.'}
              </p>
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHeader title="Choose an expert" description="Vetted CPAs on call for Northwind" />
            <fieldset className="space-y-2 p-4 sm:p-5">
              <legend className="sr-only">Expert</legend>
              {EXPERTS.map((e) => (
                <ExpertOption
                  key={e.id}
                  expert={e}
                  selected={e.id === expertId}
                  recommended={e.id === recommended.id}
                  onSelect={() => setExpertId(e.id)}
                />
              ))}
            </fieldset>
          </Panel>
          <Panel className="p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-muted">Estimated cost</span>
              <span className="tnum text-xl font-medium" data-testid="expert-cost">
                {formatMoney(expert.rateCentsPer30)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              One 30-minute block. Typical reply in {expert.responseMinutes} minutes. Nothing posts until you accept.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                variant="primary"
                disabled={!questionValid}
                onClick={() => {
                  const id = sendToExpert(item.id, expert.id, question.trim());
                  toast(`Sent to ${expert.firstName}`, `${expert.name} is reviewing ${item.id}.`);
                  navigate(`/cfo/experts/${id}`, { replace: true });
                }}
              >
                <Send size={16} aria-hidden />
                Send to expert
              </Button>
              <Button variant="ghost" onClick={() => navigate(`/cfo/close/${item.id}`)}>
                Cancel
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function SessionView({ session }: { session: ExpertSession }) {
  const close = useCloseState();
  const markExpertReplied = useDemo((s) => s.markExpertReplied);
  const accept = useDemo((s) => s.acceptExpertRecommendation);
  const expert = EXPERTS.find((e) => e.id === session.expertId) ?? EXPERTS[0];
  const b = close.board.find((x) => x.item.id === session.itemId);
  const reply = EXPERT_REPLIES[session.itemId] ?? {
    message: 'I reviewed the evidence and the draft. The treatment is correct and consistent with your policy, so you can post it as drafted.',
    rationale: ['Evidence supports the amount.', 'The entry follows your policy.'],
    entry: null,
  };

  useEffect(() => {
    if (session.status !== 'sent') return;
    const timer = window.setTimeout(() => markExpertReplied(session.id), simulatedDelay(2000));
    return () => window.clearTimeout(timer);
  }, [session.id, session.status, markExpertReplied]);

  if (!b) return <NotFoundInline what="Close item" id={session.itemId} backTo="/cfo/close" backLabel="Back to Close Autopilot" />;
  const entry = reply.entry ?? b.item.proposedEntry;

  return (
    <div>
      <Link to={`/cfo/close/${b.item.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <ArrowLeft size={15} aria-hidden />
        Back to {b.item.id}
      </Link>
      <PageHeader
        title={`${expert.name}, ${expert.credential}`}
        description={`Expert session ${session.id} on ${b.item.id}: ${b.item.description}`}
      />
      <Panel className="max-w-3xl">
        <ol className="space-y-4 p-4 sm:p-5" aria-label="Conversation">
          <li className="ml-auto max-w-[85%] rounded-panel border border-hairline bg-raised p-3 text-sm">
            <div className="mb-1 text-xs text-muted">You, {formatTimestamp(session.createdAt)}. Context packet attached.</div>
            {session.question}
          </li>
          {session.status === 'sent' ? (
            <li className="flex items-center gap-3 text-sm text-muted" role="status" data-testid="expert-typing">
              <Headset size={16} className="text-lane-expert" aria-hidden />
              {expert.firstName} is reviewing
              <span className="flex gap-1" aria-hidden>
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted [animation-delay:150ms]" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted [animation-delay:300ms]" />
              </span>
            </li>
          ) : (
            <li className="max-w-[92%] rounded-panel border border-lane-expert/40 bg-surface p-3 text-sm" data-testid="expert-reply">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-lane-expert">
                <Headset size={13} aria-hidden /> {expert.name}, {expert.credential}
              </div>
              <p>{reply.message}</p>
              <h3 className="mt-3 text-xs font-strong text-muted">Rationale</h3>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {reply.rationale.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <h3 className="mt-3 text-xs font-strong text-muted">Recommended entry</h3>
              <div className="-mx-3 mt-1">
                <EntryTable lines={entry} currency={b.item.currency} caption="Recommended entry" />
              </div>
            </li>
          )}
        </ol>
        <div className="border-t border-hairline p-4 sm:p-5">
          {session.status === 'accepted' ? (
            <div className="flex flex-wrap items-center justify-between gap-3" data-testid="expert-accepted">
              <p className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={16} className="text-success" aria-hidden />
                Recommendation accepted. {b.item.id} is resolved as Expert-reviewed.
              </p>
              <ButtonLink to="/cfo/flight-log" variant="secondary" size="sm">
                Open the Flight Log
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">Accepting posts the recommended entry and records it as Expert-reviewed.</p>
              <Button
                variant="primary"
                disabled={session.status !== 'replied'}
                onClick={() => {
                  const result = accept(session.id);
                  if (result.ok) toast('Recommendation accepted', `${b.item.id} is resolved as Expert-reviewed.`);
                }}
              >
                Accept recommendation
              </Button>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

export default function ExpertSessionPage() {
  const { sessionId = '' } = useParams();
  const session = useDemo((s) => s.expertSessions[sessionId]);
  if (sessionId.startsWith('new-')) return <DraftView itemId={sessionId.slice(4)} />;
  if (!session) {
    return <NotFoundInline what="Expert session" id={sessionId} backTo="/cfo/close" backLabel="Back to Close Autopilot" />;
  }
  return <SessionView session={session} />;
}
