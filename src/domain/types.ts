export type Currency = 'USD' | 'CAD' | 'GBP';
export type EntityId = 'US' | 'CA' | 'UK';
export type EntityFilter = 'ALL' | EntityId;

export const WORKFLOWS = [
  'bank',
  'accruals',
  'intercompany',
  'fx',
  'payroll',
  'fixed_assets',
  'ap',
  'tax',
  'revenue',
] as const;
export type Workflow = (typeof WORKFLOWS)[number];

export const LEVELS = ['L0', 'L1', 'L2', 'L3'] as const;
export type Level = (typeof LEVELS)[number];
export type Levels = Record<Workflow, Level>;

export type Lane = 'AUTONOMOUS' | 'ASSISTED' | 'EXPERT' | 'MANUAL';

export type Category =
  | 'standard'
  | 'transfer_pricing'
  | 'tax_position'
  | 'audit_adjustment'
  | 'new_entity';

export type TaskKey =
  | 'bank'
  | 'cutoff'
  | 'accruals'
  | 'payroll'
  | 'fx'
  | 'intercompany'
  | 'consolidation'
  | 'review';

export interface Evidence {
  kind: 'bank line' | 'invoice' | 'prior-month pattern' | 'policy' | 'contract' | 'schedule' | 'email';
  title: string;
  detail: string;
}

export interface EntryLine {
  account: string;
  entity: EntityId;
  debitCents: number;
  creditCents: number;
}

export interface CloseItem {
  id: string;
  entities: EntityId[];
  workflow: Workflow;
  description: string;
  amountCents: number;
  currency: Currency;
  confidenceBps: number;
  reversible: boolean;
  category: Category;
  agent: string;
  evidence: Evidence[];
  proposedEntry: EntryLine[];
  reasoning: string;
  taskIds: string[];
  /** Present only for items created by an installed partner agent. */
  partnerAgentId?: string;
  /** Short note for the non-reversible case, shown in the UI. */
  irreversibleNote?: string;
}

export interface Policy {
  revenueCents: number;
  materialityBps: number;
  confidenceMinBps: number;
  lowConfidenceFloorBps: number;
  expertCategories: Category[];
}

export interface RouteCheck {
  label: string;
  passed: boolean;
}

export interface RouteResult {
  lane: Lane;
  reasons: string[];
  checks: RouteCheck[];
  effectiveThresholdCents: number;
  effectiveConfidenceMinBps: number;
  usdCents: number;
  noDraft: boolean;
  invalid: boolean;
}

export type ResolutionState = 'approved' | 'rejected' | 'expert_reviewed' | 'reversed';

export interface Resolution {
  state: ResolutionState;
  at: string;
  by: string;
  note?: string;
  entry?: EntryLine[];
}

export type ActorType = 'agent' | 'human' | 'expert';
export type LogStatus = 'posted' | 'expert_reviewed' | 'rejected' | 'reversed' | 'reversal';

export interface LogEntry {
  id: string;
  at: string;
  actor: string;
  actorType: ActorType;
  action: string;
  itemId: string;
  entities: EntityId[];
  usdCents: number;
  lane: Lane;
  confidenceBps: number | null;
  status: LogStatus;
  linkedEntryId?: string;
  note?: string;
  /** True for auto-post rows derived from the live routing plan (not yet stored). */
  derived?: boolean;
}

export interface CloseTask {
  id: string;
  entity: EntityId;
  key: TaskKey;
  name: string;
  seedDone: boolean;
}
