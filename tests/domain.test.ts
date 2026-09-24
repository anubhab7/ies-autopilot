import { describe, expect, it } from 'vitest';
import { CLOSE_ITEMS, NO_DRAFT_TEMPLATES, PARTNER_ITEMS } from '@/data/closeItems';
import { CLOSE_TASKS } from '@/data/tasks';
import { DEFAULT_LEVELS, DEFAULT_POLICY } from '@/domain/autonomyEngine';
import {
  buildBoard,
  closeProgress,
  computeTasks,
  entryBalanceCents,
  isEntryBalanced,
  progressPercent,
} from '@/domain/closeProgress';
import { escapeCsvCell, toCsv } from '@/domain/csv';
import { runEvaluations } from '@/domain/evalSimulator';
import { toUsdCents } from '@/domain/fx';
import { formatCompact, formatMoney, parseMoneyInput } from '@/domain/money';
import { developerEarnings, intuitShare, RevenueShareError } from '@/domain/revenueShare';
import {
  answerIntent,
  answerQuestion,
  detectIntent,
  receivablesReleaseCents,
  revenueDropScenario,
  ukHiresMonthlySavingCents,
  ukHiresTotalSavingCents,
  validateQuestion,
} from '@/domain/scenarioEngine';
import { validateListing, type ListingInput } from '@/domain/validators';

describe('FX conversion', () => {
  it.each([
    ['BR-1043', 905_200],
    ['FX-77', 3_810_000],
    ['FX-78', 4_380_000],
    ['PAY-19', 1_244_600],
    ['TAX-3', 365_000],
    ['BR-1050', 273_050],
  ])('%s converts to %i USD cents', (id, expected) => {
    const item = CLOSE_ITEMS.find((i) => i.id === id)!;
    expect(toUsdCents(item.amountCents, item.currency)).toBe(expected);
  });

  it('keeps USD unchanged and rounds negatives symmetrically', () => {
    expect(toUsdCents(320_000, 'USD')).toBe(320_000);
    expect(toUsdCents(-215_000, 'GBP')).toBe(-273_050);
    expect(toUsdCents(1, 'CAD')).toBe(1);
  });
});

describe('money formatting', () => {
  it.each([
    [123_456, '$1,234.56'],
    [-123_456, '-$1,234.56'],
    [0, '$0.00'],
    [5, '$0.05'],
    [900_719_925_474_099, '$9,007,199,254,740.99'],
  ])('formatMoney(%i) is %s', (cents, text) => {
    expect(formatMoney(cents)).toBe(text);
  });

  it('formats other currencies and compact values', () => {
    expect(formatMoney(1_240_000, 'CAD')).toBe('CA$12,400.00');
    expect(formatMoney(215_000, 'GBP')).toBe('£2,150.00');
    expect(formatCompact(640_000_000)).toBe('$6.4M');
    expect(formatCompact(85_000_000)).toBe('$850K');
    expect(formatCompact(-120_000_000)).toBe('-$1.2M');
    expect(formatMoney(Number.NaN)).toBe('Not available');
  });

  it('parses money input into cents', () => {
    expect(parseMoneyInput('1,234.5')).toBe(123_450);
    expect(parseMoneyInput('-10')).toBe(-1_000);
    expect(parseMoneyInput('12.345')).toBeNull();
    expect(parseMoneyInput('abc')).toBeNull();
  });
});

describe('seed entries', () => {
  it.each([...CLOSE_ITEMS, ...PARTNER_ITEMS].map((i) => [i.id, i] as const))(
    '%s proposed entry balances to zero',
    (_id, item) => {
      expect(entryBalanceCents(item.proposedEntry)).toBe(0);
    },
  );

  it('no-draft templates balance and only BR-1050 has an empty draft', () => {
    for (const lines of Object.values(NO_DRAFT_TEMPLATES)) expect(isEntryBalanced(lines)).toBe(true);
    expect(CLOSE_ITEMS.filter((i) => i.proposedEntry.length === 0).map((i) => i.id)).toEqual(['BR-1050']);
  });

  it('every item has 2 to 4 evidence items and 2 to 3 sentences of reasoning', () => {
    for (const item of [...CLOSE_ITEMS, ...PARTNER_ITEMS]) {
      expect(item.evidence.length).toBeGreaterThanOrEqual(2);
      expect(item.evidence.length).toBeLessThanOrEqual(4);
      const sentences = item.reasoning.split(/(?<=\.)\s+/).length;
      expect(sentences).toBeGreaterThanOrEqual(2);
      expect(sentences).toBeLessThanOrEqual(3);
    }
  });
});

describe('scenario engine', () => {
  it('delay UK hires saves $38,100 a month and $114,300 total', () => {
    expect(ukHiresMonthlySavingCents()).toBe(3_810_000);
    expect(ukHiresTotalSavingCents()).toBe(11_430_000);
    expect(answerIntent('delay_uk_hires').answer).toContain('$114,300.00');
  });

  it('revenue drop of 15% gives 8 months of runway, reaching zero in May 2027', () => {
    const s = revenueDropScenario();
    expect(s.revenueCents).toBe(680_000_000);
    expect(s.netCents).toBe(-80_000_000);
    expect(s.runwayMonths).toBe(8);
    const answer = answerIntent('revenue_drop');
    expect(answer.chart?.[7].scenario).toBe(0);
    expect(answer.answer).toContain('May 2027');
  });

  it('collecting receivables faster releases $1,841,095.89', () => {
    expect(receivablesReleaseCents()).toBe(184_109_589);
    expect(answerIntent('collect_faster').answer).toContain('$1,841,095.89');
  });

  it('opening an entity in Germany needs an expert', () => {
    const a = answerQuestion('Should we open an entity in Germany?');
    expect(a.intent).toBe('germany_entity');
    expect(a.needsExpert).toBe(true);
    expect(a.checklist?.length).toBeGreaterThan(2);
  });

  it('matches intents case-insensitively', () => {
    expect(detectIntent('WHAT IF WE DELAY UK HIRES')).toBe('delay_uk_hires');
    expect(detectIntent('what if Revenue Drops 15%')).toBe('revenue_drop');
    expect(detectIntent('collect receivables faster')).toBe('collect_faster');
  });

  it('falls back for unknown questions', () => {
    expect(answerQuestion('asdf qwerty').intent).toBe('fallback');
  });

  it('rejects empty, whitespace, and 501-character input', () => {
    expect(validateQuestion('').ok).toBe(false);
    expect(validateQuestion('   ').ok).toBe(false);
    const long = validateQuestion('a'.repeat(501));
    expect(long.ok).toBe(false);
    expect(long.ok ? '' : long.reason).toBe('too_long');
    expect(validateQuestion('a'.repeat(500)).ok).toBe(true);
  });
});

describe('revenue share', () => {
  it('pays 80% below the boundary', () => {
    expect(developerEarnings(10_000_000, 0)).toBe(8_000_000);
  });
  it('pays 80% when landing exactly on the boundary', () => {
    expect(developerEarnings(100_000_000, 0)).toBe(80_000_000);
  });
  it('splits a period that crosses the boundary', () => {
    expect(developerEarnings(20_000_000, 90_000_000)).toBe(16_500_000);
    expect(intuitShare(20_000_000, 90_000_000)).toBe(3_500_000);
  });
  it('pays 85% above the boundary', () => {
    expect(developerEarnings(10_000_000, 100_000_000)).toBe(8_500_000);
    expect(developerEarnings(10_000_000, 250_000_000)).toBe(8_500_000);
  });
  it('returns zero for zero gross', () => {
    expect(developerEarnings(0, 0)).toBe(0);
  });
  it.each([
    [-1, 0],
    [0, -1],
    [Number.NaN, 0],
    [0, Number.POSITIVE_INFINITY],
  ])('throws a typed error for (%s, %s)', (gross, prior) => {
    expect(() => developerEarnings(gross, prior)).toThrow(RevenueShareError);
  });
});

describe('evaluation simulator', () => {
  it('v1 passes 44 of 50 (88%) and is not certifiable', () => {
    const run = runEvaluations(1);
    expect(run.passed).toBe(44);
    expect(run.total).toBe(50);
    expect(run.scoreBps).toBe(8_800);
    expect(run.certifiable).toBe(false);
    expect(run.byCategory.find((c) => c.category === 'Multi-currency')).toMatchObject({ total: 12, passed: 8 });
    expect(run.byCategory.find((c) => c.category === 'Partial periods')).toMatchObject({ total: 10, passed: 8 });
  });
  it('v2 passes 49 of 50 (98%) and is certifiable', () => {
    const run = runEvaluations(2);
    expect(run.passed).toBe(49);
    expect(run.scoreBps).toBe(9_800);
    expect(run.certifiable).toBe(true);
  });
  it('is deterministic across runs', () => {
    expect(runEvaluations(1)).toEqual(runEvaluations(1));
    expect(runEvaluations(2)).toEqual(runEvaluations(2));
  });
});

describe('listing validators', () => {
  const valid: ListingInput = {
    name: 'Rebatewise Accruals',
    description: 'Drafts monthly rebate accruals from contracts and sales data.',
    pricingModel: 'per_outcome',
    price: '0.50',
    scopes: ['read:ledger', 'write:drafts'],
  };
  const existing = ['LedgerLoop RevRec (ASC 606)', 'Commission Calc'];

  it('accepts a valid listing', () => {
    expect(validateListing(valid, existing)).toEqual({});
  });
  it.each([
    ['empty name', { name: '' }, 'name'],
    ['whitespace-only name', { name: '     ' }, 'name'],
    ['2-character name', { name: 'ab' }, 'name'],
    ['61-character name', { name: 'a'.repeat(61) }, 'name'],
    ['duplicate name in different case', { name: 'commission CALC' }, 'name'],
    ['short description', { description: 'Too short' }, 'description'],
    ['long description', { description: 'a'.repeat(501) }, 'description'],
    ['3 decimal places', { price: '1.234' }, 'price'],
    ['negative price', { price: '-5' }, 'price'],
    ['$0 with non-free model', { price: '0' }, 'price'],
    ['price above max', { price: '10000.01' }, 'price'],
    ['free with a price', { pricingModel: 'free', price: '5' }, 'price'],
    ['unknown pricing model', { pricingModel: 'barter' }, 'pricingModel'],
    ['no scopes', { scopes: [] }, 'scopes'],
    ['post entries scope', { scopes: ['write:post_entries'] }, 'scopes'],
  ])('rejects %s', (_label, patch, field) => {
    const errors = validateListing({ ...valid, ...patch } as ListingInput, existing);
    expect(errors).toHaveProperty(field as string);
  });
  it.each([
    ['3-character name', { name: 'abc' }],
    ['trimmed name', { name: '  Rebatewise  ' }],
    ['min price', { price: '0.01' }],
    ['max price', { price: '10000.00' }],
    ['free at $0', { pricingModel: 'free', price: '0' }],
    ['one decimal', { price: '2.5' }],
  ])('accepts %s', (_label, patch) => {
    expect(validateListing({ ...valid, ...patch } as ListingInput, existing)).toEqual({});
  });
});

describe('CSV export', () => {
  it('escapes commas, quotes, and newlines', () => {
    expect(escapeCsvCell('plain')).toBe('plain');
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"');
    expect(escapeCsvCell(42)).toBe('42');
  });
  it('builds a header and rows', () => {
    const csv = toCsv([{ a: 'x,y', b: 1 }], [
      { header: 'A', value: (r) => r.a },
      { header: 'B', value: (r) => r.b },
    ]);
    expect(csv).toBe('A,B\r\n"x,y",1');
  });
});

describe('close progress', () => {
  it('starts at 10 of 24 tasks done (42%)', () => {
    const board = buildBoard(CLOSE_ITEMS, DEFAULT_POLICY, DEFAULT_LEVELS, {});
    const progress = closeProgress(computeTasks(CLOSE_TASKS, board));
    expect(progress).toEqual({ done: 10, total: 24, percent: 42 });
  });

  it('marks a task done when all its items are resolved', () => {
    const at = '2026-10-02T09:01:00';
    let tasks = computeTasks(CLOSE_TASKS, buildBoard(CLOSE_ITEMS, DEFAULT_POLICY, DEFAULT_LEVELS, {}));
    expect(tasks.find((t) => t.id === 'US-intercompany')?.done).toBe(false);
    const one = { 'IC-310': { state: 'approved' as const, at, by: 'Maya' } };
    tasks = computeTasks(CLOSE_TASKS, buildBoard(CLOSE_ITEMS, DEFAULT_POLICY, DEFAULT_LEVELS, one));
    expect(tasks.find((t) => t.id === 'US-intercompany')?.done).toBe(true);
    expect(tasks.find((t) => t.id === 'UK-intercompany')?.done).toBe(false);
    const both = { ...one, 'TP-12': { state: 'expert_reviewed' as const, at, by: 'Priya' } };
    tasks = computeTasks(CLOSE_TASKS, buildBoard(CLOSE_ITEMS, DEFAULT_POLICY, DEFAULT_LEVELS, both));
    expect(tasks.find((t) => t.id === 'UK-intercompany')?.done).toBe(true);
    expect(closeProgress(tasks).percent).toBe(50);
  });

  it('approving ACR-221 finishes US accruals (11 of 24, 46%)', () => {
    const resolutions = { 'ACR-221': { state: 'approved' as const, at: '2026-10-02T09:01:00', by: 'Maya' } };
    const tasks = computeTasks(CLOSE_TASKS, buildBoard(CLOSE_ITEMS, DEFAULT_POLICY, DEFAULT_LEVELS, resolutions));
    expect(tasks.find((t) => t.id === 'US-accruals')?.done).toBe(true);
    expect(closeProgress(tasks)).toEqual({ done: 11, total: 24, percent: 46 });
  });

  it('a reversed auto-post reopens its task', () => {
    const resolutions = { 'FX-77': { state: 'reversed' as const, at: '2026-10-02T09:01:00', by: 'Maya' } };
    const board = buildBoard(CLOSE_ITEMS, DEFAULT_POLICY, DEFAULT_LEVELS, resolutions);
    expect(board.find((b) => b.item.id === 'FX-77')?.lane).toBe('ASSISTED');
    expect(computeTasks(CLOSE_TASKS, board).find((t) => t.id === 'UK-fx')?.done).toBe(false);
  });

  it.each([
    [10, 24, 42],
    [11, 24, 46],
    [1, 3, 33],
    [2, 3, 67],
    [1, 8, 13],
    [0, 0, 0],
  ])('progressPercent(%i, %i) is %i', (done, total, pct) => {
    expect(progressPercent(done, total)).toBe(pct);
  });
});
