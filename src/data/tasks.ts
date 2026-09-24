import type { CloseTask, EntityId, TaskKey } from '@/domain/types';

export const TASK_NAMES: Record<TaskKey, string> = {
  bank: 'Bank reconciliations',
  cutoff: 'AP and AR cutoff',
  accruals: 'Accruals',
  payroll: 'Payroll',
  fx: 'FX revaluation',
  intercompany: 'Intercompany eliminations',
  consolidation: 'Consolidation',
  review: 'Review and sign-off',
};

const ORDER: TaskKey[] = ['bank', 'cutoff', 'accruals', 'payroll', 'fx', 'intercompany', 'consolidation', 'review'];

/** Tasks with no open items that were finished on business day 1. */
const SEED_DONE = new Set(['US-payroll', 'US-fx', 'UK-accruals', 'UK-cutoff', 'CA-payroll', 'CA-intercompany']);

export const CLOSE_TASKS: CloseTask[] = (['US', 'CA', 'UK'] as EntityId[]).flatMap((entity) =>
  ORDER.map((key) => ({
    id: `${entity}-${key}`,
    entity,
    key,
    name: TASK_NAMES[key],
    seedDone: SEED_DONE.has(`${entity}-${key}`),
  })),
);
