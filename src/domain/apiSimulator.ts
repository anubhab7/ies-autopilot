import { CLOSE_ITEMS } from '@/data/closeItems';
import { ENTITIES } from '@/data/company';
import { createPrng, seededInt } from '@/lib/prng';
import { toUsdCents } from './fx';

export type EndpointId = 'entities' | 'exceptions' | 'drafts' | 'events';

export interface Endpoint {
  id: EndpointId;
  method: 'GET' | 'POST';
  path: string;
  summary: string;
}

export const ENDPOINTS: Endpoint[] = [
  { id: 'entities', method: 'GET', path: '/v1/context/entities', summary: 'Entities, currencies, and parent structure' },
  { id: 'exceptions', method: 'GET', path: '/v1/close/{period}/exceptions', summary: 'Open close exceptions with routing and evidence' },
  { id: 'drafts', method: 'POST', path: '/v1/journal-entries/drafts', summary: 'Create a draft entry for human or guardrail approval' },
  { id: 'events', method: 'GET', path: '/v1/events', summary: 'Webhook event sample: close.exception.created' },
];

export const DEFAULT_DRAFT_BODY = JSON.stringify(
  {
    entity: 'US',
    memo: 'September rebate accrual, Summit Trails Retail',
    lines: [
      { account: '4900 Sales rebates', debit: 2450.0, credit: 0 },
      { account: '2150 Accrued rebates', debit: 0, credit: 2450.0 },
    ],
  },
  null,
  2,
);

export interface ApiRequest {
  endpoint: EndpointId;
  apiKey: string | null;
  period?: string;
  entity?: string;
  body?: string;
  callNumber: number;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  latencyMs: number;
  body: unknown;
  helpLink?: { to: string; label: string };
}

const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  400: 'Bad Request',
  401: 'Unauthorized',
  422: 'Unprocessable Entity',
};

export function isValidPeriod(period: string): boolean {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return false;
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}

function toCents(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  const cents = Math.round(value * 100);
  return Math.abs(cents - value * 100) < 1e-6 ? cents : null;
}

function respond(status: number, body: unknown, callNumber: number, helpLink?: ApiResponse['helpLink']): ApiResponse {
  const next = createPrng(9001 + callNumber * 31);
  return { status, statusText: STATUS_TEXT[status] ?? '', latencyMs: seededInt(next, 38, 140), body, helpLink };
}

/** Mock IES API. Deterministic for a given request and call number. */
export function simulateApi(req: ApiRequest): ApiResponse {
  if (!req.apiKey) {
    return respond(
      401,
      {
        error: 'missing_api_key',
        message: 'No API key was sent. Generate a sandbox key in the Hangar, then send the request again.',
      },
      req.callNumber,
      { to: '/dev', label: 'Generate an API key' },
    );
  }

  switch (req.endpoint) {
    case 'entities':
      return respond(
        200,
        {
          data: ENTITIES.map((e) => ({
            id: e.id,
            legal_name: e.name,
            functional_currency: e.currency,
            parent: e.parent ? null : 'US',
          })),
          sandbox: true,
        },
        req.callNumber,
      );

    case 'exceptions': {
      const period = (req.period ?? '').trim();
      if (!isValidPeriod(period)) {
        return respond(
          400,
          {
            error: 'invalid_period',
            message: `Period "${period}" is not valid. Use YYYY-MM with a month from 01 to 12, for example 2026-09.`,
          },
          req.callNumber,
        );
      }
      const entity = req.entity && req.entity !== 'ALL' ? req.entity : null;
      const items = period === '2026-09' ? CLOSE_ITEMS : [];
      return respond(
        200,
        {
          period,
          data: items
            .filter((i) => !entity || i.entities.includes(entity as never))
            .map((i) => ({
              id: i.id,
              entities: i.entities,
              workflow: i.workflow,
              description: i.description,
              amount: { value: i.amountCents / 100, currency: i.currency, usd: toUsdCents(i.amountCents, i.currency) / 100 },
              confidence: i.confidenceBps / 10_000,
              category: i.category,
              evidence_count: i.evidence.length,
            })),
          has_more: false,
        },
        req.callNumber,
      );
    }

    case 'drafts': {
      let parsed: unknown;
      try {
        parsed = JSON.parse(req.body ?? '');
      } catch {
        return respond(400, { error: 'invalid_json', message: 'The body is not valid JSON. Check for trailing commas and quotes.' }, req.callNumber);
      }
      const lines = (parsed as { lines?: unknown }).lines;
      if (!Array.isArray(lines) || lines.length < 2) {
        return respond(400, { error: 'invalid_lines', message: 'Send at least two lines, each with account, debit, and credit.' }, req.callNumber);
      }
      let debit = 0;
      let credit = 0;
      for (const line of lines as Array<{ debit?: unknown; credit?: unknown }>) {
        const d = toCents(line.debit ?? 0);
        const c = toCents(line.credit ?? 0);
        if (d === null || c === null) {
          return respond(400, { error: 'invalid_amount', message: 'Amounts must be non-negative numbers with at most 2 decimals.' }, req.callNumber);
        }
        debit += d;
        credit += c;
      }
      if (debit !== credit) {
        return respond(
          422,
          {
            error: 'unbalanced_entry',
            message: `Debits (${(debit / 100).toFixed(2)}) and credits (${(credit / 100).toFixed(2)}) must be equal. Adjust a line and send again.`,
          },
          req.callNumber,
        );
      }
      return respond(
        201,
        {
          id: `DRAFT-${String(4100 + req.callNumber).padStart(5, '0')}`,
          status: 'pending_approval',
          lane: 'ASSISTED',
          note: 'Drafts never post directly. The customer guardrails decide the lane.',
          total: debit / 100,
        },
        req.callNumber,
      );
    }

    case 'events':
      return respond(
        200,
        {
          data: [
            {
              id: 'evt_01',
              type: 'close.exception.created',
              created: '2026-10-02T06:12:00Z',
              data: { exception_id: 'IC-310', entities: ['US', 'UK'], amount_usd: 120000, lane: 'ASSISTED' },
            },
          ],
        },
        req.callNumber,
      );
  }
}

export const MCP_SERVER_URL = 'https://mcp.ies-autopilot.example/v1/sandbox';

export interface McpTool {
  name: string;
  description: string;
  schema: Record<string, unknown>;
  sample: unknown;
}

export const MCP_TOOLS: McpTool[] = [
  {
    name: 'ies.get_trial_balance',
    description: 'Trial balance for an entity and period, in functional currency and USD.',
    schema: {
      type: 'object',
      properties: { entity: { type: 'string', enum: ['US', 'CA', 'UK'] }, period: { type: 'string', pattern: '^\\d{4}-(0[1-9]|1[0-2])$' } },
      required: ['entity', 'period'],
    },
    sample: { entity: 'UK', period: '2026-09', accounts: 184, total_debits_usd: 14820355.4, balanced: true },
  },
  {
    name: 'ies.list_close_exceptions',
    description: 'Open close exceptions with lane, confidence, and evidence references.',
    schema: {
      type: 'object',
      properties: { period: { type: 'string' }, lane: { type: 'string', enum: ['AUTONOMOUS', 'ASSISTED', 'EXPERT', 'MANUAL'] } },
      required: ['period'],
    },
    sample: { period: '2026-09', count: 12, first: { id: 'IC-310', lane: 'ASSISTED', confidence: 0.9 } },
  },
  {
    name: 'ies.draft_journal_entry',
    description: 'Create a draft entry. Drafts never post; the customer guardrails route them.',
    schema: {
      type: 'object',
      properties: {
        entity: { type: 'string' },
        memo: { type: 'string', maxLength: 200 },
        lines: {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            properties: { account: { type: 'string' }, debit: { type: 'number' }, credit: { type: 'number' } },
            required: ['account', 'debit', 'credit'],
          },
        },
      },
      required: ['entity', 'lines'],
    },
    sample: { id: 'DRAFT-04101', status: 'pending_approval', lane: 'ASSISTED' },
  },
  {
    name: 'ies.request_expert_review',
    description: 'Hand an exception to a vetted CPA with an auto-assembled context packet.',
    schema: {
      type: 'object',
      properties: { exception_id: { type: 'string' }, question: { type: 'string', maxLength: 500 } },
      required: ['exception_id', 'question'],
    },
    sample: { session_id: 'XS-9', expert: 'Priya Raman, CPA', eta_minutes: 15 },
  },
];
