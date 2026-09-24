import { projectionMonthLabel } from '@/lib/time';
import { toUsdCents } from './fx';
import { formatMoney, formatMoneyWhole, roundDiv } from './money';

export const MAX_QUESTION_LENGTH = 500;

export const BASELINE = {
  startCashCents: 640_000_000,
  monthlyRevenueCents: 800_000_000,
  monthlyCostsCents: 760_000_000,
  months: 12,
} as const;

export type IntentId = 'delay_uk_hires' | 'revenue_drop' | 'collect_faster' | 'germany_entity';

export const SUGGESTED_QUESTIONS: Array<{ intent: IntentId; text: string }> = [
  { intent: 'delay_uk_hires', text: 'What if we delay UK hires by 3 months?' },
  { intent: 'revenue_drop', text: 'What if revenue drops 15%?' },
  { intent: 'collect_faster', text: 'What if we collect receivables faster?' },
  { intent: 'germany_entity', text: 'What if we open an entity in Germany?' },
];

export interface ProjectionPoint {
  month: string;
  baseline: number;
  scenario: number;
}

export interface ScenarioAnswer {
  intent: IntentId | 'fallback';
  title: string;
  answer: string;
  assumptions: string[];
  chart: ProjectionPoint[] | null;
  confidence: 'High' | 'Medium' | 'Needs an expert' | null;
  keyFigures: Array<{ label: string; value: string }>;
  checklist?: string[];
  needsExpert?: boolean;
  sources: string;
}

export type QuestionCheck =
  | { ok: true; text: string }
  | { ok: false; reason: 'empty' | 'too_long'; message: string };

export function validateQuestion(raw: string): QuestionCheck {
  const text = raw.trim();
  if (text.length === 0) {
    return { ok: false, reason: 'empty', message: 'Type a question to ask Autopilot.' };
  }
  if (raw.length > MAX_QUESTION_LENGTH) {
    return {
      ok: false,
      reason: 'too_long',
      message: `Questions can be up to ${MAX_QUESTION_LENGTH} characters. Shorten it by ${
        raw.length - MAX_QUESTION_LENGTH
      } to send.`,
    };
  }
  return { ok: true, text };
}

export function detectIntent(raw: string): IntentId | null {
  const q = raw.toLowerCase();
  if (/(germany|german|new entity|open an entity)/.test(q)) return 'germany_entity';
  if (/hire|hiring|headcount/.test(q) && /(uk|delay|postpone|push)/.test(q)) return 'delay_uk_hires';
  if (/revenue|sales/.test(q) && /(drop|fall|decline|down|decrease|lose|shrink)/.test(q)) {
    return 'revenue_drop';
  }
  if (/(receivable|dso|collect)/.test(q)) return 'collect_faster';
  return null;
}

export function baselineMonthlyNetCents(): number {
  return BASELINE.monthlyRevenueCents - BASELINE.monthlyCostsCents;
}

/** Month-end cash for months 1 to 12 starting October 2026. */
export function baselineProjection(): number[] {
  const net = baselineMonthlyNetCents();
  return Array.from({ length: BASELINE.months }, (_, i) => BASELINE.startCashCents + net * (i + 1));
}

// Delay UK hires
export const UK_HIRES = { count: 5, monthlyCostPence: 600_000, delayMonths: 3 } as const;

export function ukHiresMonthlySavingCents(): number {
  return UK_HIRES.count * toUsdCents(UK_HIRES.monthlyCostPence, 'GBP');
}

export function ukHiresTotalSavingCents(): number {
  return ukHiresMonthlySavingCents() * UK_HIRES.delayMonths;
}

// Revenue drop
export const REVENUE_DROP_BPS = 1_500;

export function revenueDropScenario() {
  const revenue = BASELINE.monthlyRevenueCents - roundDiv(BASELINE.monthlyRevenueCents * REVENUE_DROP_BPS, 10_000);
  const net = revenue - BASELINE.monthlyCostsCents;
  const runwayMonths = net < 0 ? Math.floor(BASELINE.startCashCents / -net) : Infinity;
  return { revenueCents: revenue, netCents: net, runwayMonths };
}

// Collect receivables faster
export const DSO = { from: 52, to: 45 } as const;

export function receivablesReleaseCents(): number {
  const annualRevenueCents = BASELINE.monthlyRevenueCents * 12;
  return roundDiv(annualRevenueCents * (DSO.from - DSO.to), 365);
}

const SOURCES = 'Sources: Northwind ledger (demo data)';

function chart(scenario: (i: number, base: number) => number): ProjectionPoint[] {
  return baselineProjection().map((base, i) => ({
    month: projectionMonthLabel(i),
    baseline: base,
    scenario: scenario(i, base),
  }));
}

export function answerIntent(intent: IntentId): ScenarioAnswer {
  switch (intent) {
    case 'delay_uk_hires': {
      const monthly = ukHiresMonthlySavingCents();
      const total = ukHiresTotalSavingCents();
      return {
        intent,
        title: 'Delay 5 UK hires by 3 months',
        answer: `Delaying the 5 planned UK hires by 3 months saves ${formatMoney(
          monthly,
        )} a month and ${formatMoney(total)} in total. Cash at the end of September 2027 would be ${formatMoneyWhole(
          baselineProjection()[11] + total,
        )} instead of ${formatMoneyWhole(baselineProjection()[11])}.`,
        assumptions: [
          '5 UK hires planned from October 2026',
          'Loaded cost GBP 6,000 per hire per month',
          'Fictional rate 1 GBP = 1.27 USD',
          'Hires start in January 2027 instead of October 2026',
        ],
        chart: chart((i, base) => base + monthly * Math.min(i + 1, UK_HIRES.delayMonths)),
        confidence: 'High',
        keyFigures: [
          { label: 'Monthly saving', value: formatMoney(monthly) },
          { label: 'Total saving', value: formatMoney(total) },
        ],
        sources: SOURCES,
      };
    }
    case 'revenue_drop': {
      const s = revenueDropScenario();
      const zeroMonth = projectionMonthLabel(s.runwayMonths - 1, true);
      return {
        intent,
        title: 'Revenue drops 15%',
        answer: `If revenue drops 15% to ${formatMoneyWhole(s.revenueCents)} a month, Northwind burns ${formatMoneyWhole(
          -s.netCents,
        )} a month. Cash on hand of ${formatMoneyWhole(BASELINE.startCashCents)} lasts ${
          s.runwayMonths
        } months and reaches zero at the end of ${zeroMonth}.`,
        assumptions: [
          'Revenue falls from $8,000,000 to $6,800,000 a month starting October 2026',
          'Operating costs stay at $7,600,000 a month',
          'No new financing or cost cuts',
        ],
        chart: chart((i) => BASELINE.startCashCents + s.netCents * (i + 1)),
        confidence: 'High',
        keyFigures: [
          { label: 'Net cash flow', value: `${formatMoneyWhole(s.netCents)} a month` },
          { label: 'Runway', value: `${s.runwayMonths} months` },
          { label: 'Cash reaches zero', value: zeroMonth },
        ],
        sources: SOURCES,
      };
    }
    case 'collect_faster': {
      const release = receivablesReleaseCents();
      return {
        intent,
        title: 'Collect receivables faster',
        answer: `Cutting days sales outstanding from ${DSO.from} to ${DSO.to} days releases ${formatMoney(
          release,
        )} of cash once, in the month the change takes hold.`,
        assumptions: [
          'Annual revenue $96,000,000',
          `DSO improves from ${DSO.from} to ${DSO.to} days in October 2026`,
          'Release = annual revenue / 365 x 7 days, rounded half up to the cent',
        ],
        chart: chart((_, base) => base + release),
        confidence: 'Medium',
        keyFigures: [
          { label: 'One-time cash release', value: formatMoney(release) },
          { label: 'DSO', value: `${DSO.from} to ${DSO.to} days` },
        ],
        sources: SOURCES,
      };
    }
    case 'germany_entity':
      return {
        intent,
        title: 'Open an entity in Germany',
        answer:
          'Opening a new entity is an expert-only decision, so Autopilot will not model it on its own. A CPA can review structure, tax registration, and transfer pricing with you. Here is what to have ready.',
        assumptions: ['New entities are in the expert-only category "new entity"'],
        chart: null,
        confidence: 'Needs an expert',
        keyFigures: [],
        checklist: [
          'Choose a legal form (GmbH is typical) and a registered address',
          'Plan share capital (at least EUR 25,000 for a GmbH)',
          'Register for German VAT and trade tax',
          'Agree a transfer pricing policy with the US parent',
          'Set up a EUR bank account and add it to the chart of accounts',
        ],
        needsExpert: true,
        sources: SOURCES,
      };
  }
}

export function fallbackAnswer(): ScenarioAnswer {
  return {
    intent: 'fallback',
    title: 'I can model these questions today',
    answer:
      'I could not match that question to a scenario I can model with the Northwind ledger yet. Pick one of these to see how it works.',
    assumptions: [],
    chart: null,
    confidence: null,
    keyFigures: [],
    sources: SOURCES,
  };
}

export function answerQuestion(raw: string): ScenarioAnswer {
  const intent = detectIntent(raw);
  return intent ? answerIntent(intent) : fallbackAnswer();
}
