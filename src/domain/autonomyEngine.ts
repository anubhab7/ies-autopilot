import { FX_RATES_E4, isCurrency, toUsdCents } from './fx';
import { formatConfidence, formatMoneyShort as formatMoney, formatMoneyWhole } from './money';
import {
  WORKFLOWS,
  type Category,
  type CloseItem,
  type Lane,
  type Level,
  type Levels,
  type Policy,
  type RouteCheck,
  type RouteResult,
  type Workflow,
} from './types';

export const DATA_REASON = 'Data needs checking before an agent can act';
export const L1_REASON = 'Would auto-post at L2';
export const L3_REDUCTION_BPS = 500;
export const CONFIDENCE_HARD_FLOOR_BPS = 5_000;

export const DEFAULT_POLICY: Policy = {
  revenueCents: 800_000_000,
  materialityBps: 50,
  confidenceMinBps: 9_500,
  lowConfidenceFloorBps: 5_000,
  expertCategories: ['transfer_pricing', 'tax_position', 'audit_adjustment', 'new_entity'],
};

export const DEFAULT_LEVELS: Levels = {
  bank: 'L2',
  accruals: 'L2',
  intercompany: 'L2',
  fx: 'L2',
  payroll: 'L2',
  fixed_assets: 'L2',
  ap: 'L2',
  tax: 'L2',
  revenue: 'L1',
};

export const LEVEL_INFO: Record<Level, { name: string; summary: string }> = {
  L0: { name: 'Manual', summary: 'Agents are off. Your team does the work.' },
  L1: { name: 'Assist', summary: 'Agents draft entries. You approve every one.' },
  L2: {
    name: 'Autopilot with guardrails',
    summary: 'Agents post entries that pass every guardrail. The rest come to you.',
  },
  L3: {
    name: 'Autopilot plus',
    summary: 'Like L2, with the confidence minimum lowered by 0.05 (never below 0.50).',
  },
};

export const WORKFLOW_LABELS: Record<Workflow, string> = {
  bank: 'Bank reconciliation',
  accruals: 'Accruals',
  intercompany: 'Intercompany',
  fx: 'FX revaluation',
  payroll: 'Payroll',
  fixed_assets: 'Fixed assets',
  ap: 'Accounts payable',
  tax: 'Tax',
  revenue: 'Revenue recognition',
};

/** threshold = revenue * bps / 10000, integers only. */
export function materialityThresholdCents(policy: Pick<Policy, 'revenueCents' | 'materialityBps'>): number {
  return Math.floor((policy.revenueCents * policy.materialityBps) / 10_000);
}

export function effectiveConfidenceMin(policy: Policy, level: Level): number {
  if (level !== 'L3') return policy.confidenceMinBps;
  return Math.max(CONFIDENCE_HARD_FLOOR_BPS, policy.confidenceMinBps - L3_REDUCTION_BPS);
}

function isWorkflow(value: unknown): value is Workflow {
  return typeof value === 'string' && (WORKFLOWS as readonly string[]).includes(value);
}

function isExpertCategory(category: Category, policy: Policy): boolean {
  return policy.expertCategories.includes(category);
}

type RoutableItem = Pick<
  CloseItem,
  'amountCents' | 'currency' | 'confidenceBps' | 'reversible' | 'category' | 'workflow'
>;

/**
 * Routes one close item to a lane. Checks run in a fixed order and every check
 * leaves a plain-language reason so the UI can explain "Why this lane".
 */
export function routeItem(item: RoutableItem, policy: Policy, levels: Levels): RouteResult {
  const thresholdCents = materialityThresholdCents(policy);
  const base = {
    effectiveThresholdCents: thresholdCents,
    effectiveConfidenceMinBps: policy.confidenceMinBps,
    usdCents: 0,
    noDraft: false,
    invalid: false,
  };

  // 1. Invalid input.
  const amountValid = typeof item.amountCents === 'number' && Number.isFinite(item.amountCents);
  const currencyValid = isCurrency(item.currency) && FX_RATES_E4[item.currency] !== undefined;
  const confidenceValid =
    typeof item.confidenceBps === 'number' &&
    Number.isFinite(item.confidenceBps) &&
    item.confidenceBps >= 0 &&
    item.confidenceBps <= 10_000;
  const workflowValid = isWorkflow(item.workflow);
  if (!amountValid || !currencyValid || !confidenceValid || !workflowValid) {
    const checks: RouteCheck[] = [
      { label: 'Amount is a valid number', passed: amountValid },
      { label: 'Currency is USD, CAD, or GBP', passed: currencyValid },
      { label: 'Confidence is between 0.00 and 1.00', passed: confidenceValid },
      { label: 'Workflow is recognized', passed: workflowValid },
    ];
    return { ...base, lane: 'ASSISTED', reasons: [DATA_REASON], checks, invalid: true };
  }

  const level = levels[item.workflow];
  const usdCents = toUsdCents(item.amountCents, item.currency);
  const minBps = effectiveConfidenceMin(policy, level);
  const result = { ...base, usdCents, effectiveConfidenceMinBps: minBps };
  const checks: RouteCheck[] = [{ label: 'Data is complete and valid', passed: true }];

  // 2. Workflow switched off.
  const levelOn = level !== 'L0';
  checks.push({
    label: levelOn
      ? `${WORKFLOW_LABELS[item.workflow]} is set to ${level} (${LEVEL_INFO[level].name})`
      : `${WORKFLOW_LABELS[item.workflow]} is set to L0, agents are off`,
    passed: levelOn,
  });
  if (!levelOn) {
    return {
      ...result,
      lane: 'MANUAL',
      reasons: [`${WORKFLOW_LABELS[item.workflow]} is set to L0, so your team handles it manually`],
      checks,
    };
  }

  // 3. Expert-only category.
  const expertOnly = isExpertCategory(item.category, policy);
  checks.push({
    label: expertOnly
      ? `Category "${item.category.replace('_', ' ')}" always goes to a human expert`
      : 'Category does not require an expert',
    passed: !expertOnly,
  });
  if (expertOnly) {
    return {
      ...result,
      lane: 'EXPERT',
      reasons: [
        `${item.category.replace('_', ' ')} is an expert-only category, so a CPA reviews it`,
      ],
      checks,
    };
  }

  // 4. Below the low-confidence floor: the agent will not draft.
  const aboveFloor = item.confidenceBps >= policy.lowConfidenceFloorBps;
  if (!aboveFloor) {
    checks.push({
      label: `Confidence ${formatConfidence(item.confidenceBps)} is below the ${formatConfidence(
        policy.lowConfidenceFloorBps,
      )} floor, so the agent did not draft an entry`,
      passed: false,
    });
    return {
      ...result,
      lane: 'ASSISTED',
      noDraft: true,
      reasons: [
        `Confidence ${formatConfidence(item.confidenceBps)} is below the ${formatConfidence(
          policy.lowConfidenceFloorBps,
        )} floor, so the agent will not draft an entry`,
      ],
      checks,
    };
  }

  // 5. Autonomy eligibility: every guardrail must pass.
  const failures: string[] = [];
  const confidenceOk = item.confidenceBps >= minBps;
  checks.push({
    label: confidenceOk
      ? `Confidence ${formatConfidence(item.confidenceBps)} meets your ${formatConfidence(minBps)} minimum`
      : `Confidence ${formatConfidence(item.confidenceBps)} is below your ${formatConfidence(minBps)} minimum`,
    passed: confidenceOk,
  });
  if (!confidenceOk) failures.push(checks[checks.length - 1].label);

  const absUsd = Math.abs(usdCents);
  const amountOk = absUsd < thresholdCents;
  checks.push({
    label: amountOk
      ? `Amount ${formatMoney(absUsd)} is below your ${formatMoneyWhole(thresholdCents)} limit`
      : `Amount ${formatMoney(absUsd)} is ${absUsd === thresholdCents ? 'equal to' : 'above'} your ${formatMoneyWhole(
          thresholdCents,
        )} limit (must be strictly below)`,
    passed: amountOk,
  });
  if (!amountOk) failures.push(checks[checks.length - 1].label);

  checks.push({
    label: item.reversible ? 'Entry can be reversed' : 'Entry cannot be reversed',
    passed: item.reversible,
  });
  if (!item.reversible) failures.push('Entry cannot be reversed, so a person must approve it');

  if (failures.length === 0) {
    if (level === 'L1') {
      return { ...result, lane: 'ASSISTED', reasons: [L1_REASON], checks };
    }
    return {
      ...result,
      lane: 'AUTONOMOUS',
      reasons: ['Every guardrail passed, so the agent posts it with evidence attached'],
      checks,
    };
  }

  // 6. Assisted with every failed check listed.
  return { ...result, lane: 'ASSISTED', reasons: failures, checks };
}

export function countLanes(results: RouteResult[]): Record<Lane, number> {
  const counts: Record<Lane, number> = { AUTONOMOUS: 0, ASSISTED: 0, EXPERT: 0, MANUAL: 0 };
  for (const r of results) counts[r.lane] += 1;
  return counts;
}
