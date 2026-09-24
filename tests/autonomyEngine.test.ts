import { describe, expect, it } from 'vitest';
import { CLOSE_ITEMS, PARTNER_ITEMS } from '@/data/closeItems';
import {
  countLanes,
  DATA_REASON,
  DEFAULT_LEVELS,
  DEFAULT_POLICY,
  L1_REASON,
  materialityThresholdCents,
  routeItem,
} from '@/domain/autonomyEngine';
import type { CloseItem, Lane, Levels, Workflow } from '@/domain/types';

const EXPECTED: Record<string, Lane> = {
  'BR-1042': 'AUTONOMOUS',
  'BR-1043': 'AUTONOMOUS',
  'ACR-221': 'ASSISTED',
  'IC-310': 'ASSISTED',
  'TP-12': 'EXPERT',
  'FX-77': 'AUTONOMOUS',
  'FX-78': 'ASSISTED',
  'PAY-19': 'AUTONOMOUS',
  'DEP-5': 'ASSISTED',
  'VEN-88': 'ASSISTED',
  'TAX-3': 'EXPERT',
  'BR-1050': 'ASSISTED',
};

const base: CloseItem = {
  ...CLOSE_ITEMS[0],
  amountCents: 100_000,
  currency: 'USD',
  confidenceBps: 9_800,
  reversible: true,
  category: 'standard',
  workflow: 'bank',
};

function allLevels(level: Levels[Workflow]): Levels {
  return Object.fromEntries(Object.keys(DEFAULT_LEVELS).map((w) => [w, level])) as Levels;
}

describe('routeItem at default settings', () => {
  it.each(CLOSE_ITEMS.map((i) => [i.id, i] as const))('%s routes to its expected lane', (id, item) => {
    expect(routeItem(item, DEFAULT_POLICY, DEFAULT_LEVELS).lane).toBe(EXPECTED[id]);
  });

  it('gives 4 autonomous, 6 assisted, 2 expert across 12 items', () => {
    const counts = countLanes(CLOSE_ITEMS.map((i) => routeItem(i, DEFAULT_POLICY, DEFAULT_LEVELS)));
    expect(counts).toEqual({ AUTONOMOUS: 4, ASSISTED: 6, EXPERT: 2, MANUAL: 0 });
    expect(CLOSE_ITEMS).toHaveLength(12);
  });

  it('computes the materiality threshold exactly as 4,000,000 cents', () => {
    expect(materialityThresholdCents(DEFAULT_POLICY)).toBe(4_000_000);
    expect(routeItem(base, DEFAULT_POLICY, DEFAULT_LEVELS).effectiveThresholdCents).toBe(4_000_000);
  });

  it('marks BR-1050 as no draft below the low-confidence floor', () => {
    const item = CLOSE_ITEMS.find((i) => i.id === 'BR-1050')!;
    const result = routeItem(item, DEFAULT_POLICY, DEFAULT_LEVELS);
    expect(result.lane).toBe('ASSISTED');
    expect(result.noDraft).toBe(true);
  });

  it('lists the failed amount check for FX-78', () => {
    const item = CLOSE_ITEMS.find((i) => i.id === 'FX-78')!;
    const result = routeItem(item, DEFAULT_POLICY, DEFAULT_LEVELS);
    expect(result.reasons.join(' ')).toContain('Amount $43,800 is above your $40,000 limit');
  });
});

describe('routeItem boundaries', () => {
  it('amount exactly equal to the threshold is not autonomous', () => {
    expect(routeItem({ ...base, amountCents: 4_000_000 }, DEFAULT_POLICY, DEFAULT_LEVELS).lane).toBe('ASSISTED');
  });

  it('one cent below the threshold is autonomous', () => {
    expect(routeItem({ ...base, amountCents: 3_999_999 }, DEFAULT_POLICY, DEFAULT_LEVELS).lane).toBe('AUTONOMOUS');
  });

  it('confidence exactly at the minimum is autonomous', () => {
    expect(routeItem({ ...base, confidenceBps: 9_500 }, DEFAULT_POLICY, DEFAULT_LEVELS).lane).toBe('AUTONOMOUS');
  });

  it('one bp below the minimum is not autonomous', () => {
    expect(routeItem({ ...base, confidenceBps: 9_499 }, DEFAULT_POLICY, DEFAULT_LEVELS).lane).toBe('ASSISTED');
  });

  it('uses the absolute value of negative amounts', () => {
    expect(routeItem({ ...base, amountCents: -3_999_999 }, DEFAULT_POLICY, DEFAULT_LEVELS).lane).toBe('AUTONOMOUS');
    expect(routeItem({ ...base, amountCents: -4_000_000 }, DEFAULT_POLICY, DEFAULT_LEVELS).lane).toBe('ASSISTED');
  });

  it('treats a zero amount as valid', () => {
    const result = routeItem({ ...base, amountCents: 0 }, DEFAULT_POLICY, DEFAULT_LEVELS);
    expect(result.lane).toBe('AUTONOMOUS');
    expect(result.invalid).toBe(false);
  });

  it('never sends a non-reversible item to autonomous', () => {
    const result = routeItem({ ...base, reversible: false }, DEFAULT_POLICY, allLevels('L3'));
    expect(result.lane).toBe('ASSISTED');
  });

  it('lets expert categories win over autonomy', () => {
    const result = routeItem({ ...base, category: 'audit_adjustment' }, DEFAULT_POLICY, allLevels('L3'));
    expect(result.lane).toBe('EXPERT');
  });
});

describe('routeItem invalid input', () => {
  const cases: Array<[string, Partial<CloseItem> | Record<string, unknown>]> = [
    ['NaN amount', { amountCents: Number.NaN }],
    ['Infinity amount', { amountCents: Number.POSITIVE_INFINITY }],
    ['missing amount', { amountCents: undefined }],
    ['unknown currency', { currency: 'EUR' }],
    ['confidence 10001', { confidenceBps: 10_001 }],
    ['confidence -1', { confidenceBps: -1 }],
    ['unknown workflow', { workflow: 'treasury' }],
  ];
  it.each(cases)('%s returns ASSISTED with the data reason', (_label, patch) => {
    const item = { ...base, ...patch } as CloseItem;
    const result = routeItem(item, DEFAULT_POLICY, DEFAULT_LEVELS);
    expect(result.lane).toBe('ASSISTED');
    expect(result.reasons).toEqual([DATA_REASON]);
    expect(result.invalid).toBe(true);
  });
});

describe('routeItem autonomy levels', () => {
  it('L0 returns MANUAL', () => {
    expect(routeItem(base, DEFAULT_POLICY, { ...DEFAULT_LEVELS, bank: 'L0' }).lane).toBe('MANUAL');
  });

  it('L0 wins over expert categories', () => {
    expect(
      routeItem({ ...base, category: 'tax_position' }, DEFAULT_POLICY, { ...DEFAULT_LEVELS, bank: 'L0' }).lane,
    ).toBe('MANUAL');
  });

  it('L1 turns every autonomous-eligible item into ASSISTED with the L2 reason', () => {
    const results = CLOSE_ITEMS.map((i) => routeItem(i, DEFAULT_POLICY, allLevels('L1')));
    expect(countLanes(results).AUTONOMOUS).toBe(0);
    const eligible = CLOSE_ITEMS.filter((i) => EXPECTED[i.id] === 'AUTONOMOUS');
    for (const item of eligible) {
      const r = routeItem(item, DEFAULT_POLICY, allLevels('L1'));
      expect(r.lane).toBe('ASSISTED');
      expect(r.reasons).toEqual([L1_REASON]);
    }
  });

  it('L3 lowers the confidence minimum by 500 bps', () => {
    const r = routeItem({ ...base, confidenceBps: 9_000 }, DEFAULT_POLICY, allLevels('L3'));
    expect(r.effectiveConfidenceMinBps).toBe(9_000);
    expect(r.lane).toBe('AUTONOMOUS');
    expect(routeItem({ ...base, confidenceBps: 8_999 }, DEFAULT_POLICY, allLevels('L3')).lane).toBe('ASSISTED');
  });

  it('L3 never lowers the minimum below 5000 bps', () => {
    const policy = { ...DEFAULT_POLICY, confidenceMinBps: 5_200 };
    const r = routeItem({ ...base, confidenceBps: 5_000 }, policy, allLevels('L3'));
    expect(r.effectiveConfidenceMinBps).toBe(5_000);
    expect(r.lane).toBe('AUTONOMOUS');
  });

  it('REV-606 is assisted at L1 and autonomous at L3', () => {
    const rev = PARTNER_ITEMS[0];
    expect(routeItem(rev, DEFAULT_POLICY, DEFAULT_LEVELS).lane).toBe('ASSISTED');
    expect(routeItem(rev, DEFAULT_POLICY, { ...DEFAULT_LEVELS, revenue: 'L3' }).lane).toBe('AUTONOMOUS');
  });
});

describe('routeItem guardrail changes', () => {
  it('materiality 40 bps moves FX-77 to ASSISTED (3 autonomous)', () => {
    const policy = { ...DEFAULT_POLICY, materialityBps: 40 };
    const fx77 = CLOSE_ITEMS.find((i) => i.id === 'FX-77')!;
    expect(routeItem(fx77, policy, DEFAULT_LEVELS).lane).toBe('ASSISTED');
    const counts = countLanes(CLOSE_ITEMS.map((i) => routeItem(i, policy, DEFAULT_LEVELS)));
    expect(counts.AUTONOMOUS).toBe(3);
  });
});
