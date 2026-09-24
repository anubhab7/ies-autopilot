import * as Tabs from '@radix-ui/react-tabs';
import { Loader2, Play, Send } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Chip, inputClass, PageHeader, Panel, PanelHeader } from '@/components/ui';
import {
  DEFAULT_DRAFT_BODY,
  ENDPOINTS,
  MCP_SERVER_URL,
  MCP_TOOLS,
  simulateApi,
  type ApiResponse,
  type EndpointId,
} from '@/domain/apiSimulator';
import { cn } from '@/lib/cn';
import { simulatedDelay } from '@/lib/fastMode';
import { useDemo } from '@/store/demoStore';
import { FirstCallTimer } from './HangarPage';

function statusClass(status: number) {
  if (status < 300) return 'border-success/50 text-success';
  if (status < 500) return 'border-danger/50 text-danger';
  return 'border-lane-assist/50 text-lane-assist';
}

function ResponseView({ response }: { response: ApiResponse | null }) {
  if (!response) {
    return <p className="px-4 py-8 text-center text-sm text-muted sm:px-5">Send a request to see the response here.</p>;
  }
  return (
    <div data-testid="api-response">
      <div className="flex flex-wrap items-center gap-2 px-4 pt-3 sm:px-5">
        <Chip className={statusClass(response.status)} data-testid="response-status">
          {response.status} {response.statusText}
        </Chip>
        <span className="tnum text-xs text-muted">{response.latencyMs} ms</span>
        {response.helpLink ? (
          <Link to={response.helpLink.to} className="text-sm text-action hover:underline">
            {response.helpLink.label}
          </Link>
        ) : null}
      </div>
      <pre className="m-4 max-h-96 overflow-auto rounded-chip border border-hairline bg-bg p-3 text-xs leading-relaxed sm:mx-5" tabIndex={0}>
        {JSON.stringify(response.body, null, 2)}
      </pre>
    </div>
  );
}

function RestExplorer() {
  const apiKey = useDemo((s) => s.dev.apiKey);
  const apiCalls = useDemo((s) => s.dev.apiCalls);
  const recordApiCall = useDemo((s) => s.recordApiCall);
  const [endpoint, setEndpoint] = useState<EndpointId>('exceptions');
  const [period, setPeriod] = useState('2026-09');
  const [entity, setEntity] = useState('ALL');
  const [body, setBody] = useState(DEFAULT_DRAFT_BODY);
  const [pending, setPending] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const current = ENDPOINTS.find((e) => e.id === endpoint) ?? ENDPOINTS[0];

  const send = () => {
    setPending(true);
    const result = simulateApi({ endpoint, apiKey, period, entity, body, callNumber: apiCalls + 1 });
    window.setTimeout(() => {
      recordApiCall(result.status < 300);
      setResponse(result);
      setPending(false);
    }, simulatedDelay(result.latencyMs * 4));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <Panel>
        <PanelHeader title="Endpoints" description="IES API v1, sandbox" />
        <ul className="p-2" aria-label="Endpoints">
          {ENDPOINTS.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                aria-pressed={endpoint === e.id}
                onClick={() => {
                  setEndpoint(e.id);
                  setResponse(null);
                }}
                className={cn('w-full rounded-chip px-3 py-2 text-left', endpoint === e.id ? 'bg-raised' : 'hover:bg-raised/50')}
              >
                <span className="flex items-center gap-2 text-sm">
                  <span className={cn('w-10 text-xs font-strong', e.method === 'GET' ? 'text-lane-auto' : 'text-lane-assist')}>{e.method}</span>
                  <code className="min-w-0 truncate text-xs">{e.path}</code>
                </span>
                <span className="mt-0.5 block pl-12 text-xs text-muted">{e.summary}</span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel>
        <PanelHeader
          title={
            <span className="flex min-w-0 items-center gap-2">
              <span className={current.method === 'GET' ? 'text-lane-auto' : 'text-lane-assist'}>{current.method}</span>
              <code className="truncate text-sm font-normal">{current.path}</code>
            </span>
          }
          description={apiKey ? 'Authorization: Bearer sandbox key' : 'No API key yet. Requests will be rejected.'}
        />
        <div className="space-y-3 border-b border-hairline p-4 sm:p-5">
          {endpoint === 'exceptions' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="param-period" className="block text-xs text-muted">
                  period (path, YYYY-MM)
                </label>
                <input id="param-period" value={period} onChange={(e) => setPeriod(e.target.value)} className={cn(inputClass, 'mt-1 font-mono')} />
              </div>
              <div>
                <label htmlFor="param-entity" className="block text-xs text-muted">
                  entity (query)
                </label>
                <select id="param-entity" value={entity} onChange={(e) => setEntity(e.target.value)} className={cn(inputClass, 'mt-1')}>
                  <option value="ALL">All</option>
                  <option value="US">US</option>
                  <option value="CA">CA</option>
                  <option value="UK">UK</option>
                </select>
              </div>
            </div>
          ) : null}
          {endpoint === 'drafts' ? (
            <div>
              <label htmlFor="param-body" className="block text-xs text-muted">
                Request body (JSON)
              </label>
              <textarea
                id="param-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                spellCheck={false}
                className={cn(inputClass, 'mt-1 min-h-48 font-mono text-xs')}
              />
            </div>
          ) : null}
          {endpoint === 'entities' || endpoint === 'events' ? (
            <p className="text-sm text-muted">This endpoint takes no parameters.</p>
          ) : null}
          <Button variant="primary" onClick={send} disabled={pending} data-testid="send-request">
            {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Send size={16} aria-hidden />}
            Send request
          </Button>
        </div>
        <div aria-live="polite">
          <ResponseView response={response} />
        </div>
      </Panel>
    </div>
  );
}

function McpExplorer() {
  const apiKey = useDemo((s) => s.dev.apiKey);
  const recordApiCall = useDemo((s) => s.recordApiCall);
  const [results, setResults] = useState<Record<string, string>>({});

  return (
    <div className="space-y-4">
      <Panel className="p-4 sm:p-5">
        <div className="text-sm text-muted">Hosted MCP server (fictional)</div>
        <code className="mt-1 block break-all text-sm" data-testid="mcp-url">
          {MCP_SERVER_URL}
        </code>
        <p className="mt-2 text-sm text-muted">
          Point Claude or any MCP client at this URL with your sandbox key. Tools respect the same scopes and guardrails as
          the REST API: they can read and draft, never post.
        </p>
      </Panel>
      <ul className="grid gap-4 lg:grid-cols-2">
        {MCP_TOOLS.map((tool) => (
          <li key={tool.name}>
            <Panel className="flex h-full flex-col">
              <PanelHeader
                level={3}
                title={<code className="text-sm">{tool.name}</code>}
                description={tool.description}
                actions={
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label={`Try tool ${tool.name}`}
                    onClick={() => {
                      recordApiCall(apiKey !== null);
                      setResults((r) => ({
                        ...r,
                        [tool.name]: apiKey
                          ? JSON.stringify({ ok: true, result: tool.sample }, null, 2)
                          : JSON.stringify({ ok: false, error: 'missing_api_key', message: 'Generate a sandbox key in the Hangar first.' }, null, 2),
                      }));
                    }}
                  >
                    <Play size={14} aria-hidden />
                    Try tool
                  </Button>
                }
              />
              <details className="px-4 py-3 text-sm sm:px-5">
                <summary className="cursor-pointer text-muted">Input schema</summary>
                <pre className="mt-2 overflow-auto rounded-chip border border-hairline bg-bg p-3 text-xs" tabIndex={0}>
                  {JSON.stringify(tool.schema, null, 2)}
                </pre>
              </details>
              {results[tool.name] ? (
                <pre className="mx-4 mb-4 overflow-auto rounded-chip border border-hairline bg-bg p-3 text-xs sm:mx-5" data-testid={`mcp-result-${tool.name}`} tabIndex={0}>
                  {results[tool.name]}
                </pre>
              ) : null}
            </Panel>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ExplorerPage() {
  return (
    <div>
      <PageHeader
        title="API and MCP explorer"
        description="Try AI-ready endpoints and the hosted MCP server against the Northwind sandbox."
      />
      <div className="mb-4 max-w-md">
        <FirstCallTimer />
      </div>
      <Tabs.Root defaultValue="rest">
        <Tabs.List className="mb-4 inline-flex rounded-chip border border-hairline bg-surface p-1" aria-label="Explorer mode">
          {[
            ['rest', 'REST API'],
            ['mcp', 'MCP server'],
          ].map(([value, label]) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className="h-8 rounded-[4px] px-3 text-sm text-muted data-[state=active]:bg-raised data-[state=active]:text-text"
            >
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="rest">
          <RestExplorer />
        </Tabs.Content>
        <Tabs.Content value="mcp">
          <McpExplorer />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
