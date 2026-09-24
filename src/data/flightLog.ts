import type { LogEntry } from '@/domain/types';

/** Fifteen actions from business days 1 and 2 of the September 2026 close. */
export const FLIGHT_LOG_SEED: LogEntry[] = [
  { id: 'FL-0001', at: '2026-10-01T06:02:00', actor: 'Accounting agent', actorType: 'agent', action: 'Auto-posted entry', itemId: 'BR-1031', entities: ['US'], usdCents: 412_000, lane: 'AUTONOMOUS', confidenceBps: 9_900, status: 'posted' },
  { id: 'FL-0002', at: '2026-10-01T06:04:00', actor: 'Accounting agent', actorType: 'agent', action: 'Auto-posted entry', itemId: 'BR-1032', entities: ['US'], usdCents: 1_875_050, lane: 'AUTONOMOUS', confidenceBps: 9_800, status: 'posted' },
  { id: 'FL-0003', at: '2026-10-01T06:09:00', actor: 'Accounting agent', actorType: 'agent', action: 'Auto-posted entry', itemId: 'BR-1033', entities: ['CA'], usdCents: 657_000, lane: 'AUTONOMOUS', confidenceBps: 9_700, status: 'posted' },
  { id: 'FL-0004', at: '2026-10-01T06:15:00', actor: 'Payroll agent', actorType: 'agent', action: 'Auto-posted entry', itemId: 'PAY-17', entities: ['US'], usdCents: 3_120_000, lane: 'AUTONOMOUS', confidenceBps: 9_900, status: 'posted' },
  { id: 'FL-0005', at: '2026-10-01T06:21:00', actor: 'Payroll agent', actorType: 'agent', action: 'Auto-posted entry', itemId: 'PAY-18', entities: ['CA'], usdCents: 1_489_200, lane: 'AUTONOMOUS', confidenceBps: 9_800, status: 'posted' },
  { id: 'FL-0006', at: '2026-10-01T06:40:00', actor: 'FX agent', actorType: 'agent', action: 'Auto-posted entry', itemId: 'FX-75', entities: ['US'], usdCents: 2_210_000, lane: 'AUTONOMOUS', confidenceBps: 9_900, status: 'posted' },
  { id: 'FL-0007', at: '2026-10-01T09:32:00', actor: 'Maya Chen, Controller', actorType: 'human', action: 'Approved entry', itemId: 'ACR-218', entities: ['UK'], usdCents: 5_080_000, lane: 'ASSISTED', confidenceBps: 9_100, status: 'posted' },
  { id: 'FL-0008', at: '2026-10-01T10:05:00', actor: 'Maya Chen, Controller', actorType: 'human', action: 'Approved entry', itemId: 'ACR-219', entities: ['UK'], usdCents: 2_413_000, lane: 'ASSISTED', confidenceBps: 8_700, status: 'posted' },
  { id: 'FL-0009', at: '2026-10-01T11:18:00', actor: 'Maya Chen, Controller', actorType: 'human', action: 'Edited and approved entry', itemId: 'ACR-220', entities: ['UK'], usdCents: 1_016_000, lane: 'ASSISTED', confidenceBps: 8_300, status: 'posted', note: 'Split across two cost centers' },
  { id: 'FL-0010', at: '2026-10-01T13:47:00', actor: 'Daniel Osei, CPA', actorType: 'expert', action: 'Expert-reviewed entry accepted', itemId: 'IC-305', entities: ['CA'], usdCents: 7_300_000, lane: 'EXPERT', confidenceBps: 7_600, status: 'expert_reviewed', note: 'Confirmed elimination of CA management fee' },
  { id: 'FL-0011', at: '2026-10-01T15:26:00', actor: 'Maya Chen, Controller', actorType: 'human', action: 'Rejected entry', itemId: 'VEN-84', entities: ['US'], usdCents: 390_000, lane: 'ASSISTED', confidenceBps: 6_100, status: 'rejected', note: 'Vendor credit already applied in August' },
  { id: 'FL-0012', at: '2026-10-02T05:58:00', actor: 'Accounting agent', actorType: 'agent', action: 'Auto-posted entry', itemId: 'BR-1038', entities: ['UK'], usdCents: 889_000, lane: 'AUTONOMOUS', confidenceBps: 9_800, status: 'posted' },
  { id: 'FL-0013', at: '2026-10-02T06:03:00', actor: 'Accounting agent', actorType: 'agent', action: 'Auto-posted entry', itemId: 'BR-1039', entities: ['CA'], usdCents: 244_550, lane: 'AUTONOMOUS', confidenceBps: 9_900, status: 'posted' },
  { id: 'FL-0014', at: '2026-10-02T06:11:00', actor: 'AP agent', actorType: 'agent', action: 'Auto-posted entry', itemId: 'VEN-86', entities: ['US'], usdCents: 1_265_000, lane: 'AUTONOMOUS', confidenceBps: 9_600, status: 'posted' },
  { id: 'FL-0015', at: '2026-10-02T08:41:00', actor: 'Maya Chen, Controller', actorType: 'human', action: 'Approved entry', itemId: 'ACR-222', entities: ['US'], usdCents: 3_500_000, lane: 'ASSISTED', confidenceBps: 9_200, status: 'posted' },
];
