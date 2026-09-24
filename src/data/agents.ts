import type { ScopeId } from '@/domain/scopes';
import type { Workflow } from '@/domain/types';

export type AgentType = 'ISV' | 'Advisor-built (no-code)';
export type AgentPricingModel = 'per_outcome' | 'monthly';

export interface AgentScope {
  id: ScopeId;
  required: boolean;
}

export interface StoreAgent {
  id: string;
  name: string;
  publisher: string;
  type: AgentType;
  pricingModel: AgentPricingModel;
  priceLabel: string;
  accuracyBps: number;
  evalCases: number;
  evalCasesPassed: number;
  certified: boolean;
  workflow: Workflow;
  workflowLabel: string;
  description: string;
  rating: number;
  reviewCount: number;
  installs: number;
  scopes: AgentScope[];
  securityReview: string;
  dataResidency: string;
  lastCertified: string;
  reviews: Array<{ author: string; role: string; rating: number; text: string }>;
}

export const STORE_AGENTS: StoreAgent[] = [
  {
    id: 'ledgerloop-revrec',
    name: 'LedgerLoop RevRec (ASC 606)',
    publisher: 'LedgerLoop Inc.',
    type: 'ISV',
    pricingModel: 'per_outcome',
    priceLabel: '$0.60 per contract processed',
    accuracyBps: 9_840,
    evalCases: 1_200,
    evalCasesPassed: 1_181,
    certified: true,
    workflow: 'revenue',
    workflowLabel: 'Revenue recognition',
    description:
      'Reads multi-year contracts, builds ASC 606 schedules, and drafts deferred revenue releases for your approval.',
    rating: 4.8,
    reviewCount: 212,
    installs: 3_140,
    scopes: [
      { id: 'read:contracts', required: true },
      { id: 'read:customers', required: true },
      { id: 'read:ledger', required: false },
      { id: 'write:drafts', required: true },
    ],
    securityReview: 'Passed, Aug 14, 2026',
    dataResidency: 'US and EU regions',
    lastCertified: 'Sep 3, 2026',
    reviews: [
      { author: 'Controller, apparel brand', role: 'Illustrative review', rating: 5, text: 'Our deferred revenue roll-forward went from two days to an hour.' },
      { author: 'CFO, software reseller', role: 'Illustrative review', rating: 4, text: 'Schedules are right. I wish it handled usage-based contracts too.' },
    ],
  },
  {
    id: 'leaselens',
    name: 'LeaseLens (ASC 842)',
    publisher: 'Brightside Labs',
    type: 'ISV',
    pricingModel: 'monthly',
    priceLabel: '$199 per month',
    accuracyBps: 9_710,
    evalCases: 800,
    evalCasesPassed: 777,
    certified: true,
    workflow: 'fixed_assets',
    workflowLabel: 'Fixed assets',
    description:
      'Abstracts lease terms from PDFs, keeps right-of-use schedules current, and drafts monthly lease entries.',
    rating: 4.6,
    reviewCount: 148,
    installs: 2_210,
    scopes: [
      { id: 'read:contracts', required: true },
      { id: 'read:ledger', required: true },
      { id: 'write:drafts', required: true },
    ],
    securityReview: 'Passed, Jul 30, 2026',
    dataResidency: 'US region',
    lastCertified: 'Aug 20, 2026',
    reviews: [
      { author: 'Controller, restaurant group', role: 'Illustrative review', rating: 5, text: 'Forty store leases, zero spreadsheets.' },
    ],
  },
  {
    id: 'landed-cost',
    name: 'Landed Cost Agent',
    publisher: 'Freightwise',
    type: 'ISV',
    pricingModel: 'per_outcome',
    priceLabel: '$0.25 per shipment',
    accuracyBps: 9_630,
    evalCases: 950,
    evalCasesPassed: 915,
    certified: true,
    workflow: 'ap',
    workflowLabel: 'Accounts payable',
    description:
      'Allocates freight, duty, and brokerage to inventory so margins reflect true landed cost.',
    rating: 4.5,
    reviewCount: 97,
    installs: 1_480,
    scopes: [
      { id: 'read:inventory', required: true },
      { id: 'read:vendors', required: true },
      { id: 'write:drafts', required: true },
    ],
    securityReview: 'Passed, Jun 12, 2026',
    dataResidency: 'US and Canada regions',
    lastCertified: 'Sep 1, 2026',
    reviews: [
      { author: 'Finance lead, outdoor retailer', role: 'Illustrative review', rating: 4, text: 'Finally see margin by SKU after freight.' },
    ],
  },
  {
    id: 'grant-guardian',
    name: 'Grant Guardian',
    publisher: 'Okafor and Rao CPAs',
    type: 'Advisor-built (no-code)',
    pricingModel: 'monthly',
    priceLabel: '$149 per month',
    accuracyBps: 9_580,
    evalCases: 400,
    evalCasesPassed: 383,
    certified: true,
    workflow: 'accruals',
    workflowLabel: 'Accruals',
    description:
      'Built by a CPA firm without code. Tracks restricted grants, flags unallowable costs, and drafts release entries.',
    rating: 4.7,
    reviewCount: 64,
    installs: 610,
    scopes: [
      { id: 'read:ledger', required: true },
      { id: 'read:contracts', required: false },
      { id: 'write:drafts', required: true },
    ],
    securityReview: 'Passed, Aug 2, 2026',
    dataResidency: 'US region',
    lastCertified: 'Aug 28, 2026',
    reviews: [
      { author: 'Controller, nonprofit health network', role: 'Illustrative review', rating: 5, text: 'Our auditors asked fewer questions this year.' },
    ],
  },
  {
    id: 'commission-calc',
    name: 'Commission Calc',
    publisher: 'Quota Labs',
    type: 'ISV',
    pricingModel: 'monthly',
    priceLabel: '$3 per sales rep per month',
    accuracyBps: 9_790,
    evalCases: 600,
    evalCasesPassed: 587,
    certified: true,
    workflow: 'payroll',
    workflowLabel: 'Payroll',
    description:
      'Calculates tiered commissions from closed invoices and drafts the commission accrual each month.',
    rating: 4.4,
    reviewCount: 131,
    installs: 1_920,
    scopes: [
      { id: 'read:customers', required: true },
      { id: 'read:payroll', required: false },
      { id: 'write:drafts', required: true },
    ],
    securityReview: 'Passed, Jul 18, 2026',
    dataResidency: 'US and EU regions',
    lastCertified: 'Sep 10, 2026',
    reviews: [
      { author: 'VP Finance, distributor', role: 'Illustrative review', rating: 4, text: 'Disputes with reps dropped because every number has a trail.' },
    ],
  },
  {
    id: 'vendor-contract-reader',
    name: 'Vendor Contract Reader',
    publisher: 'ClauseCraft',
    type: 'ISV',
    pricingModel: 'per_outcome',
    priceLabel: '$0.40 per contract',
    accuracyBps: 9_120,
    evalCases: 300,
    evalCasesPassed: 274,
    certified: false,
    workflow: 'ap',
    workflowLabel: 'Accounts payable',
    description:
      'Extracts payment terms, renewal dates, and price escalators from vendor contracts.',
    rating: 4.1,
    reviewCount: 22,
    installs: 180,
    scopes: [
      { id: 'read:contracts', required: true },
      { id: 'read:vendors', required: true },
    ],
    securityReview: 'In progress, started Sep 15, 2026',
    dataResidency: 'US region',
    lastCertified: 'Not yet certified',
    reviews: [],
  },
];

export function findAgent(id: string): StoreAgent | undefined {
  return STORE_AGENTS.find((a) => a.id === id);
}
