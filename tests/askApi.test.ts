import { describe, expect, it } from 'vitest';
import { handleAsk } from '../api/_askCore';

describe('live AI handler without a key', () => {
  it('reports unhealthy and refuses questions', async () => {
    const health = await handleAsk({ method: 'GET', url: '/api/ask?health=1', body: '' }, {});
    expect(health).toEqual({ status: 200, body: { ok: false } });
    const post = await handleAsk({ method: 'POST', url: '/api/ask', body: '{"question":"hi"}' }, {});
    expect(post.status).toBe(503);
  });

  it('validates the request before calling the model', async () => {
    const env = { ANTHROPIC_API_KEY: 'test-key' };
    expect((await handleAsk({ method: 'GET', url: '/api/ask?health=1', body: '' }, env)).body).toEqual({ ok: true });
    expect((await handleAsk({ method: 'POST', url: '/api/ask', body: '{bad' }, env)).status).toBe(400);
    expect((await handleAsk({ method: 'POST', url: '/api/ask', body: '{"question":""}' }, env)).status).toBe(400);
    const long = JSON.stringify({ question: 'a'.repeat(501) });
    expect((await handleAsk({ method: 'POST', url: '/api/ask', body: long }, env)).status).toBe(400);
    expect((await handleAsk({ method: 'DELETE', url: '/api/ask', body: '' }, env)).status).toBe(405);
  });
});
