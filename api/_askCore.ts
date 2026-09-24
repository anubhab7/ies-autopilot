import Anthropic from '@anthropic-ai/sdk';

export interface AskRequest {
  method: string;
  url: string;
  body: string;
}

export interface AskResult {
  status: number;
  body: Record<string, unknown>;
}

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const TIMEOUT_MS = 8_000;
const MAX_QUESTION = 500;

/** Grounding for live answers: the same fictional seed data the demo uses. */
export const SYSTEM_PROMPT = `You are IES Autopilot, a finance copilot inside a concept prototype. All data is fictional demo data.
Company: Northwind Outdoor Co., outdoor gear maker and retailer, 420 employees, entities US (USD, parent), CA (CAD), UK (GBP).
Fixed fictional FX: 1 CAD = 0.73 USD, 1 GBP = 1.27 USD.
Monthly revenue $8,000,000, monthly operating costs $7,600,000, cash on hand $6,400,000 on October 2, 2026.
September 2026 close is on business day 2 of a 3-day target (last close took 9 days). Progress 10 of 24 tasks.
Guardrails: materiality 0.5% of monthly revenue ($40,000, strictly below to auto-post), confidence minimum 0.95, expert-only categories: transfer pricing, tax positions, audit adjustments, new entities.
Open items include IC-310 (US vs UK intercompany mismatch, $120,000), TP-12 (transfer pricing markup, expert), FX-78 (CAD receivables revaluation, $43,800), ACR-221 (unbilled consulting accrual, $18,000).
Answer in plain sentences, under 150 words, and show the arithmetic you used. If a question needs data you do not have, say so. Never claim to post entries; you can only explain and draft. End with "Sources: Northwind ledger (demo data)".`;

export async function handleAsk(req: AskRequest, env: Record<string, string | undefined>): Promise<AskResult> {
  const apiKey = env.ANTHROPIC_API_KEY;
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET') {
    return { status: 200, body: { ok: Boolean(apiKey) } };
  }
  if (req.method !== 'POST') {
    return { status: 405, body: { error: 'Use GET for health or POST with a question.' } };
  }
  if (!apiKey) {
    return { status: 503, body: { error: 'Live mode is off because ANTHROPIC_API_KEY is not set.' } };
  }

  let question: string;
  try {
    const parsed: unknown = JSON.parse(req.body || '{}');
    question = typeof (parsed as { question?: unknown }).question === 'string' ? (parsed as { question: string }).question.trim() : '';
  } catch {
    return { status: 400, body: { error: 'Send JSON like {"question": "..."}.' } };
  }
  if (!question || question.length > MAX_QUESTION || url.searchParams.has('health')) {
    return { status: 400, body: { error: `Ask a question of 1 to ${MAX_QUESTION} characters.` } };
  }

  const client = new Anthropic({ apiKey, timeout: TIMEOUT_MS, maxRetries: 0 });
  try {
    const response = await client.messages.create({
      model: env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: question }],
    });
    if (response.stop_reason === 'refusal') {
      return { status: 502, body: { error: 'The model declined this question.' } };
    }
    const answer = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    if (!answer) return { status: 502, body: { error: 'The model returned no text.' } };
    return { status: 200, body: { answer } };
  } catch (error) {
    if (error instanceof Anthropic.APIConnectionTimeoutError) {
      return { status: 504, body: { error: 'Live mode timed out after 8 seconds.' } };
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { status: 429, body: { error: 'Live mode is rate limited. Try again shortly.' } };
    }
    if (error instanceof Anthropic.APIError) {
      return { status: 502, body: { error: `Live mode failed with status ${error.status ?? 'unknown'}.` } };
    }
    return { status: 502, body: { error: 'Live mode failed unexpectedly.' } };
  }
}
