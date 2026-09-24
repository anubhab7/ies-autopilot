import type { Category, EntryLine, Workflow } from '@/domain/types';

export interface Expert {
  id: string;
  name: string;
  firstName: string;
  credential: string;
  focus: string;
  responseMinutes: number;
  rateCentsPer30: number;
  categories: Category[];
  workflows: Workflow[];
}

export const EXPERTS: Expert[] = [
  {
    id: 'priya-raman',
    name: 'Priya Raman',
    firstName: 'Priya',
    credential: 'CPA',
    focus: 'Transfer pricing and intercompany',
    responseMinutes: 15,
    rateCentsPer30: 18_000,
    categories: ['transfer_pricing'],
    workflows: ['intercompany'],
  },
  {
    id: 'daniel-osei',
    name: 'Daniel Osei',
    firstName: 'Daniel',
    credential: 'CPA',
    focus: 'Multi-entity close and consolidation',
    responseMinutes: 20,
    rateCentsPer30: 15_000,
    categories: ['audit_adjustment', 'new_entity', 'tax_position'],
    workflows: ['accruals', 'fx', 'fixed_assets', 'bank', 'ap', 'revenue', 'tax'],
  },
  {
    id: 'hannah-weiss',
    name: 'Hannah Weiss',
    firstName: 'Hannah',
    credential: 'Chartered Accountant (ICAEW)',
    focus: 'UK VAT and payroll',
    responseMinutes: 30,
    rateCentsPer30: 16_000,
    categories: [],
    workflows: ['payroll'],
  },
];

export function recommendExpert(category: Category, workflow: Workflow): Expert {
  return (
    EXPERTS.find((e) => e.categories.includes(category)) ??
    EXPERTS.find((e) => e.workflows.includes(workflow)) ??
    EXPERTS[1]
  );
}

export interface ScriptedReply {
  message: string;
  rationale: string[];
  entry: EntryLine[] | null;
}

/** Scripted expert replies; items without a script get a generic confirmation. */
export const EXPERT_REPLIES: Record<string, ScriptedReply> = {
  'TP-12': {
    message:
      'I reviewed the recharge and your policy. A 5% markup is defensible for routine shared services and matches your benchmarking study. Book it now and document the rationale in the quarterly transfer pricing file.',
    rationale: [
      'Services are routine back-office support, so the low end of the 5% to 10% range fits.',
      'The markup of $6,000 is charged by the US to the UK, so the UK books the expense.',
      'Keep the benchmarking study with the September close file.',
    ],
    entry: [
      { account: '6900 Shared services expense', entity: 'UK', debitCents: 600_000, creditCents: 0 },
      { account: '2300 Intercompany payable, US', entity: 'UK', debitCents: 0, creditCents: 600_000 },
    ],
  },
  'TAX-3': {
    message:
      'The design work is consumed by the Canadian entity for taxable supplies, so self-assessment applies but the tax is fully recoverable. The net effect is zero, and the drafted entry is correct.',
    rationale: [
      'Imported taxable supply used in commercial activity.',
      'Self-assess and claim the input tax credit in the same return.',
    ],
    entry: [
      { account: '1450 GST/HST recoverable', entity: 'CA', debitCents: 500_000, creditCents: 0 },
      { account: '2250 GST/HST self-assessed', entity: 'CA', debitCents: 0, creditCents: 500_000 },
    ],
  },
};
