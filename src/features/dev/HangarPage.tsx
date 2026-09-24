import { Check, Copy, KeyRound, Loader2, RefreshCw, Server, Timer } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { ConfirmDialog } from '@/components/Dialog';
import { toast } from '@/components/toast';
import { Button, ButtonLink, PageHeader, Panel } from '@/components/ui';
import { cn } from '@/lib/cn';
import { simulatedDelay } from '@/lib/fastMode';
import { useDemo } from '@/store/demoStore';

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
}

export function maskKey(key: string): string {
  return `${key.slice(0, 12)}${'•'.repeat(12)}${key.slice(-4)}`;
}

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

export function FirstCallTimer() {
  const dev = useDemo((s) => s.dev);
  const running = dev.timerStartedAt !== null && dev.firstCallMs === null;
  const now = useNow(running);
  const elapsed =
    dev.firstCallMs ?? (dev.timerStartedAt !== null ? Math.max(0, now - dev.timerStartedAt) : 0);
  return (
    <div
      className="flex items-center gap-3 rounded-panel border border-hairline bg-surface px-4 py-3"
      data-testid="first-call-timer"
      data-frozen={dev.firstCallMs !== null}
    >
      <Timer size={18} className={dev.firstCallMs !== null ? 'text-success' : 'text-action'} aria-hidden />
      <div>
        <div className="text-xs text-muted">Time to first call</div>
        <div className="tnum text-xl font-medium" aria-live="off">
          {dev.timerStartedAt === null ? 'Not started' : formatDuration(elapsed)}
        </div>
      </div>
      <span className="ml-2 text-xs text-muted">
        {dev.firstCallMs !== null ? 'Stopped at your first successful call' : dev.timerStartedAt ? 'Running' : 'Starts when you create a workspace'}
      </span>
    </div>
  );
}

function Step({
  n,
  title,
  done,
  active,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <li className="relative flex gap-4 pb-8 last:pb-0" data-testid={`hangar-step-${n}`} data-done={done}>
      <div className="flex flex-col items-center">
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium',
            done ? 'border-success bg-success/10 text-success' : active ? 'border-action text-text' : 'border-hairline text-muted',
          )}
        >
          {done ? <Check size={16} aria-label="Done" /> : n}
        </span>
        <span className="mt-2 w-px flex-1 bg-hairline" aria-hidden />
      </div>
      <div className={cn('min-w-0 flex-1 pt-1', !active && !done && 'opacity-60')}>
        <h2 className="text-base font-strong">{title}</h2>
        <div className="mt-2">{children}</div>
      </div>
    </li>
  );
}

export default function HangarPage() {
  const dev = useDemo((s) => s.dev);
  const createWorkspace = useDemo((s) => s.createWorkspace);
  const launchSandbox = useDemo((s) => s.launchSandbox);
  const generateApiKey = useDemo((s) => s.generateApiKey);
  const [launching, setLaunching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  const copyKey = async () => {
    if (!dev.apiKey) return;
    try {
      await navigator.clipboard.writeText(dev.apiKey);
    } catch {
      // Clipboard can be blocked; the copied state still confirms the action in the demo.
    }
    setCopied(true);
    toast('Key copied', 'Paste it into the Authorization header as a Bearer token.');
  };

  const firstCallDone = dev.firstCallMs !== null;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Welcome to the Hangar, Sam"
        description="Build AI agents on IES data. Go from zero to a real API call against a synthetic Northwind sandbox in minutes."
      />
      <div className="mb-6">
        <FirstCallTimer />
      </div>
      <Panel className="p-4 sm:p-6" data-tour="hangar-stepper">
        <ol aria-label="Onboarding steps">
          <Step n={1} title="Create workspace" done={dev.workspaceCreated} active={!dev.workspaceCreated}>
            {dev.workspaceCreated ? (
              <p className="text-sm text-muted">Workspace "Rebatewise" is ready for Sam Okafor.</p>
            ) : (
              <>
                <p className="mb-3 text-sm text-muted">A workspace holds your agents, keys, and listings.</p>
                <Button
                  variant="primary"
                  onClick={() => {
                    createWorkspace();
                    toast('Workspace created', 'The time to first call timer is running.');
                  }}
                >
                  Create workspace
                </Button>
              </>
            )}
          </Step>

          <Step
            n={2}
            title="Launch sandbox"
            done={dev.sandboxReady}
            active={dev.workspaceCreated && !dev.sandboxReady}
          >
            {dev.sandboxReady ? (
              <p className="flex items-start gap-2 text-sm text-muted" data-testid="sandbox-ready">
                <Server size={15} className="mt-0.5 shrink-0" aria-hidden />
                Sandbox ready: a synthetic copy of Northwind Outdoor Co. with 3 entities (US, CA, UK), 12 open close
                exceptions, and 15 months of history. No real customer data.
              </p>
            ) : (
              <>
                <p className="mb-3 text-sm text-muted">A synthetic company to build and test against.</p>
                <Button
                  variant="primary"
                  disabled={!dev.workspaceCreated || launching}
                  onClick={() => {
                    setLaunching(true);
                    window.setTimeout(() => {
                      launchSandbox();
                      setLaunching(false);
                      toast('Sandbox launched', 'Northwind Outdoor Co. (synthetic) is ready.');
                    }, simulatedDelay(1000));
                  }}
                >
                  {launching ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
                  {launching ? 'Launching sandbox' : 'Launch sandbox'}
                </Button>
              </>
            )}
          </Step>

          <Step n={3} title="Generate API key" done={dev.apiKey !== null} active={dev.sandboxReady && !dev.apiKey}>
            {dev.apiKey ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="tnum rounded-chip border border-hairline bg-bg px-3 py-2 text-sm" data-testid="api-key">
                    {maskKey(dev.apiKey)}
                  </code>
                  <Button variant="secondary" size="sm" onClick={() => void copyKey()}>
                    {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                    {copied ? 'Copied' : 'Copy key'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmRegen(true)}>
                    <RefreshCw size={14} aria-hidden />
                    Regenerate key
                  </Button>
                </div>
                <p className="text-xs text-muted">Sandbox keys only reach synthetic data. Keep production keys on your server.</p>
              </div>
            ) : (
              <>
                <p className="mb-3 text-sm text-muted">Keys are scoped to the sandbox.</p>
                <Button
                  variant="primary"
                  disabled={!dev.sandboxReady}
                  onClick={() => {
                    generateApiKey();
                    toast('API key generated', 'Copy it now, then make your first call.');
                  }}
                >
                  <KeyRound size={16} aria-hidden />
                  Generate API key
                </Button>
              </>
            )}
          </Step>

          <Step n={4} title="Make your first call" done={firstCallDone} active={dev.apiKey !== null && !firstCallDone}>
            <p className="mb-3 text-sm text-muted">
              {firstCallDone
                ? `First successful call in ${formatDuration(dev.firstCallMs ?? 0)}. Next, build an agent in Agent Studio.`
                : 'Send a request from the explorer. REST and MCP both count.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <ButtonLink to="/dev/explorer" variant={firstCallDone ? 'secondary' : 'primary'}>
                Open the explorer
              </ButtonLink>
              {firstCallDone ? (
                <ButtonLink to="/dev/studio" variant="primary">
                  Open Agent Studio
                </ButtonLink>
              ) : null}
            </div>
          </Step>
        </ol>
      </Panel>
      <ConfirmDialog
        open={confirmRegen}
        onOpenChange={setConfirmRegen}
        title="Regenerate the API key?"
        description="The current key stops working right away. Anything using it needs the new key."
        confirmLabel="Regenerate key"
        danger
        onConfirm={() => {
          generateApiKey();
          toast('Key regenerated', 'The old key no longer works.');
        }}
      />
    </div>
  );
}
