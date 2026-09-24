import { CheckSquare, Headset, MessageSquare, Send, Sparkles, Trash2 } from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from '@/components/toast';
import { Button, Chip, inputClass, PageHeader, Panel } from '@/components/ui';
import {
  answerIntent,
  fallbackAnswer,
  MAX_QUESTION_LENGTH,
  SUGGESTED_QUESTIONS,
  validateQuestion,
  type ScenarioAnswer,
} from '@/domain/scenarioEngine';
import { cn } from '@/lib/cn';
import { useDemo, type AskMessage } from '@/store/demoStore';

const ScenarioChart = lazy(() =>
  import('@/components/charts/CashChart').then((m) => ({ default: m.ScenarioChart })),
);

const LIVE_TIMEOUT_MS = 8_000;

async function checkLiveHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/ask?health=1', { headers: { accept: 'application/json' } });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return false;
    const body: unknown = await res.json();
    return typeof body === 'object' && body !== null && (body as { ok?: unknown }).ok === true;
  } catch {
    return false;
  }
}

async function askLive(question: string): Promise<string> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), LIVE_TIMEOUT_MS);
  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Live mode returned ${res.status}`);
    const body = (await res.json()) as { answer?: unknown };
    if (typeof body.answer !== 'string' || body.answer.trim() === '') throw new Error('Empty answer');
    return body.answer;
  } finally {
    window.clearTimeout(timer);
  }
}

function SuggestionChips({ onAsk, label }: { onAsk: (text: string) => void; label: string }) {
  return (
    <div>
      <p className="mb-2 text-sm text-muted">{label}</p>
      <ul className="flex flex-wrap gap-2" data-testid="suggestion-chips">
        {SUGGESTED_QUESTIONS.map((q) => (
          <li key={q.intent}>
            <button
              type="button"
              onClick={() => onAsk(q.text)}
              className="rounded-chip border border-hairline bg-surface px-3 py-1.5 text-left text-sm hover:border-action"
              data-tour={q.intent === 'revenue_drop' ? 'ask-revenue' : undefined}
            >
              {q.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnswerCard({ answer, onAsk }: { answer: ScenarioAnswer; onAsk: (text: string) => void }) {
  if (answer.intent === 'fallback') {
    return (
      <div className="space-y-3" data-testid="fallback-answer">
        <p className="text-sm">{answer.answer}</p>
        <SuggestionChips onAsk={onAsk} label="Supported questions" />
      </div>
    );
  }
  return (
    <div className="space-y-4" data-testid={`answer-${answer.intent}`}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-strong">{answer.title}</h3>
        {answer.confidence ? (
          <Chip className={answer.needsExpert ? 'border-lane-expert/50 text-lane-expert' : undefined}>
            Confidence: {answer.confidence}
          </Chip>
        ) : null}
      </div>
      <p className="prose-measure text-sm leading-relaxed">{answer.answer}</p>
      {answer.keyFigures.length > 0 ? (
        <dl className="grid gap-3 sm:grid-cols-3">
          {answer.keyFigures.map((f) => (
            <div key={f.label} className="rounded-chip border border-hairline bg-bg px-3 py-2">
              <dt className="text-xs text-muted">{f.label}</dt>
              <dd className="tnum mt-0.5 text-base font-medium">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {answer.chart ? (
        <Suspense fallback={<div className="h-56" aria-hidden />}>
          <ScenarioChart data={answer.chart} title={`${answer.title}: baseline vs scenario cash`} />
        </Suspense>
      ) : null}
      {answer.checklist ? (
        <div>
          <h4 className="text-sm font-strong">Readiness checklist</h4>
          <ul className="mt-1.5 space-y-1 text-sm">
            {answer.checklist.map((c) => (
              <li key={c} className="flex gap-2">
                <CheckSquare size={15} className="mt-0.5 shrink-0 text-muted" aria-hidden />
                {c}
              </li>
            ))}
          </ul>
          <Button
            variant="primary"
            className="mt-3"
            onClick={() => toast('Asked Daniel Osei, CPA', 'He typically replies within 20 minutes with next steps.')}
          >
            <Headset size={16} aria-hidden />
            Ask an expert
          </Button>
        </div>
      ) : null}
      <div className="border-t border-hairline pt-3 text-xs text-muted">
        {answer.assumptions.length > 0 ? (
          <div>
            <span className="font-medium text-text">Assumptions: </span>
            {answer.assumptions.join('; ')}.
          </div>
        ) : null}
        <div className="mt-1">{answer.sources}</div>
      </div>
    </div>
  );
}

function Exchange({ message, onAsk }: { message: AskMessage; onAsk: (text: string) => void }) {
  const answer = message.intent ? answerIntent(message.intent) : fallbackAnswer();
  return (
    <li className="space-y-3">
      <div className="ml-auto w-fit max-w-[85%] rounded-panel border border-hairline bg-raised px-3 py-2 text-sm">
        {message.text}
      </div>
      <Panel as="div" className="p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-1.5 text-xs text-muted">
          <Sparkles size={13} className="text-lane-auto" aria-hidden />
          Autopilot
        </div>
        {message.notice ? (
          <p className="mb-3 rounded-chip border border-lane-assist/40 bg-lane-assist/5 px-3 py-2 text-xs">{message.notice}</p>
        ) : null}
        {message.liveAnswer ? (
          <div className="space-y-2">
            <p className="whitespace-pre-line text-sm leading-relaxed">{message.liveAnswer}</p>
            <p className="text-xs text-muted">Live answer grounded in the Northwind demo summary. Sources: Northwind ledger (demo data)</p>
          </div>
        ) : (
          <AnswerCard answer={answer} onAsk={onAsk} />
        )}
      </Panel>
    </li>
  );
}

export default function AskPage() {
  const messages = useDemo((s) => s.askMessages);
  const askQuestion = useDemo((s) => s.askQuestion);
  const clearConversation = useDemo((s) => s.clearConversation);
  const [draft, setDraft] = useState('');
  const [liveAvailable, setLiveAvailable] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [pending, setPending] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const handledState = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void checkLiveHealth().then((ok) => {
      if (!cancelled) setLiveAvailable(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const send = async (text: string) => {
    const check = validateQuestion(text);
    if (!check.ok || pending) return;
    if (liveMode && liveAvailable) {
      setPending(true);
      try {
        const answer = await askLive(check.text);
        askQuestion(check.text, { liveAnswer: answer });
      } catch {
        askQuestion(check.text, {
          notice: 'Live mode did not answer within 8 seconds, so this answer comes from the scripted engine.',
        });
      } finally {
        setPending(false);
      }
    } else {
      askQuestion(check.text);
    }
    setDraft('');
  };

  useEffect(() => {
    const state = location.state as { ask?: string } | null;
    if (state?.ask && !handledState.current) {
      handledState.current = true;
      askQuestion(state.ask);
      navigate('.', { replace: true, state: null });
    }
  }, [location.state, askQuestion, navigate]);

  useEffect(() => {
    if (messages.length > 0) endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  const check = validateQuestion(draft);
  const tooLong = draft.length > MAX_QUESTION_LENGTH;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(draft);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Ask Autopilot"
        description="Ask what-if questions about Northwind. Answers are computed from the ledger, with every assumption shown."
        actions={
          <Button
            variant="secondary"
            disabled={messages.length === 0}
            onClick={() => {
              clearConversation();
              toast('Conversation cleared');
            }}
          >
            <Trash2 size={16} aria-hidden />
            Clear conversation
          </Button>
        }
      />

      {messages.length === 0 ? (
        <Panel className="mb-4 p-4 sm:p-5">
          <div className="mb-4 flex items-start gap-3">
            <MessageSquare size={20} className="mt-0.5 shrink-0 text-action" aria-hidden />
            <p className="text-sm text-muted">
              Autopilot models cash, runway, and hiring scenarios on your ledger. Start with one of these, or type your
              own question.
            </p>
          </div>
          <SuggestionChips onAsk={(t) => void send(t)} label="Try a scenario" />
        </Panel>
      ) : (
        <ol className="mb-4 space-y-6" aria-label="Conversation" data-testid="conversation">
          {messages.map((m) => (
            <Exchange key={m.id} message={m} onAsk={(t) => void send(t)} />
          ))}
        </ol>
      )}
      <div ref={endRef} />

      <form onSubmit={onSubmit} className="sticky bottom-3 z-10 rounded-panel border border-hairline bg-surface p-3">
        {messages.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q.intent}
                type="button"
                onClick={() => void send(q.text)}
                className="rounded-chip border border-hairline px-2 py-0.5 text-xs text-muted hover:border-action hover:text-text"
                data-tour={q.intent === 'revenue_drop' ? 'ask-revenue' : undefined}
              >
                {q.text}
              </button>
            ))}
          </div>
        ) : null}
        <label htmlFor="ask-input" className="sr-only">
          Your question
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id="ask-input"
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send(draft);
              }
            }}
            placeholder="What if revenue drops 15%?"
            aria-invalid={tooLong}
            aria-describedby="ask-input-help"
            className={cn(inputClass, 'min-h-10 resize-none')}
          />
          <Button type="submit" variant="primary" disabled={!check.ok || pending} aria-label="Send question" data-testid="ask-send">
            <Send size={16} aria-hidden />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span id="ask-input-help" className={tooLong ? 'text-danger' : 'text-muted'} role={tooLong ? 'alert' : undefined}>
            {tooLong
              ? `Questions can be up to ${MAX_QUESTION_LENGTH} characters. Remove ${draft.length - MAX_QUESTION_LENGTH} to send.`
              : pending
                ? 'Asking live mode'
                : 'Press Enter to send, Shift and Enter for a new line.'}
          </span>
          <span className="flex items-center gap-3">
            {liveAvailable ? (
              <label className="flex items-center gap-1.5 text-muted">
                <input
                  type="checkbox"
                  checked={liveMode}
                  onChange={(e) => setLiveMode(e.target.checked)}
                  className="accent-[var(--action)]"
                />
                Live AI mode
              </label>
            ) : null}
            <span className={cn('tnum', tooLong ? 'text-danger' : 'text-muted')} data-testid="ask-counter">
              {draft.length} / {MAX_QUESTION_LENGTH}
            </span>
          </span>
        </div>
      </form>
    </div>
  );
}
