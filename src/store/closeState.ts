import { CLOSE_ITEMS, PARTNER_ITEMS } from '@/data/closeItems';
import { CLOSE_TASKS } from '@/data/tasks';
import { DEFAULT_POLICY } from '@/domain/autonomyEngine';
import { buildBoard, closeProgress, computeTasks, type BoardItem } from '@/domain/closeProgress';
import type { CloseItem, Lane, Levels, LogEntry, Policy, Resolution } from '@/domain/types';
import { demoTimestamp } from '@/lib/time';

export interface PolicySettings {
  materialityBps: number;
  confidenceMinBps: number;
}

export function fullPolicy(settings: PolicySettings): Policy {
  return { ...DEFAULT_POLICY, ...settings };
}

export function activeItems(installed: Record<string, unknown>): CloseItem[] {
  return [
    ...CLOSE_ITEMS,
    ...PARTNER_ITEMS.filter((i) => i.partnerAgentId !== undefined && i.partnerAgentId in installed),
  ];
}

export function derivedAutoPostEntries(board: BoardItem[]): LogEntry[] {
  return board
    .filter((b) => b.autoPosted)
    .map((b, index) => ({
      id: `AUTO-${b.item.id}`,
      at: demoTimestamp(-170 + index * 7),
      actor: b.item.agent,
      actorType: 'agent' as const,
      action: 'Auto-posted entry',
      itemId: b.item.id,
      entities: b.item.entities,
      usdCents: b.route.usdCents,
      lane: 'AUTONOMOUS' as const,
      confidenceBps: b.item.confidenceBps,
      status: 'posted' as const,
      derived: true,
    }));
}

export interface CloseState {
  items: CloseItem[];
  board: BoardItem[];
  tasks: ReturnType<typeof computeTasks>;
  progress: ReturnType<typeof closeProgress>;
  counts: Record<Lane, number>;
  openCounts: Record<Lane, number>;
  derivedLog: LogEntry[];
  policy: Policy;
}

export function computeCloseState(
  settings: PolicySettings,
  levels: Levels,
  resolutions: Record<string, Resolution>,
  installed: Record<string, unknown>,
): CloseState {
  const policy = fullPolicy(settings);
  const items = activeItems(installed);
  const board = buildBoard(items, policy, levels, resolutions);
  const tasks = computeTasks(CLOSE_TASKS, board);
  const counts: Record<Lane, number> = { AUTONOMOUS: 0, ASSISTED: 0, EXPERT: 0, MANUAL: 0 };
  const openCounts: Record<Lane, number> = { AUTONOMOUS: 0, ASSISTED: 0, EXPERT: 0, MANUAL: 0 };
  for (const b of board) {
    counts[b.route.lane] += 1;
    if (!b.resolution || b.resolution.state === 'reversed') openCounts[b.lane] += 1;
  }
  return {
    items,
    board,
    tasks,
    progress: closeProgress(tasks),
    counts,
    openCounts,
    derivedLog: derivedAutoPostEntries(board),
    policy,
  };
}
