import { describe, expect, it } from 'vitest';
import { DEFAULT_DRAFT_BODY, isValidPeriod, simulateApi } from '@/domain/apiSimulator';

const key = 'ies_sk_test_abc';

describe('API simulator', () => {
  it('returns 401 without a key', () => {
    const res = simulateApi({ endpoint: 'entities', apiKey: null, callNumber: 1 });
    expect(res.status).toBe(401);
    expect(res.helpLink?.to).toBe('/dev');
  });
  it.each([
    ['2026-09', true],
    ['2026-12', true],
    ['2026-13', false],
    ['2026-00', false],
    ['26-09', false],
    ['2026-9', false],
  ])('period %s valid is %s', (period, valid) => {
    expect(isValidPeriod(period)).toBe(valid);
  });
  it('returns 400 for month 13 and 200 for September', () => {
    expect(simulateApi({ endpoint: 'exceptions', apiKey: key, period: '2026-13', callNumber: 1 }).status).toBe(400);
    const ok = simulateApi({ endpoint: 'exceptions', apiKey: key, period: '2026-09', callNumber: 1 });
    expect(ok.status).toBe(200);
    expect((ok.body as { data: unknown[] }).data).toHaveLength(12);
  });
  it('creates a balanced draft and rejects an unbalanced one with 422', () => {
    expect(simulateApi({ endpoint: 'drafts', apiKey: key, body: DEFAULT_DRAFT_BODY, callNumber: 1 }).status).toBe(201);
    const unbalanced = DEFAULT_DRAFT_BODY.replace('"credit": 2450', '"credit": 2400');
    expect(simulateApi({ endpoint: 'drafts', apiKey: key, body: unbalanced, callNumber: 1 }).status).toBe(422);
    expect(simulateApi({ endpoint: 'drafts', apiKey: key, body: '{bad', callNumber: 1 }).status).toBe(400);
  });
  it('is deterministic', () => {
    const a = simulateApi({ endpoint: 'events', apiKey: key, callNumber: 3 });
    const b = simulateApi({ endpoint: 'events', apiKey: key, callNumber: 3 });
    expect(a).toEqual(b);
  });
});
