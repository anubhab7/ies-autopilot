import { routeItem } from './autonomyEngine';
import type {
  CloseItem,
  CloseTask,
  EntryLine,
  Lane,
  Levels,
  Policy,
  Resolution,
  RouteResult,
} from './types';

export interface BoardItem {
  item: CloseItem;
  route: RouteResult;
  /** Lane after applying the resolution (a reversed item comes back to Assisted). */
  lane: Lane;
  resolution: Resolution | undefined;
  /** Approved, rejected, expert-reviewed, or auto-posted by an agent. */
  settled: boolean;
  autoPosted: boolean;
}

export const REVERSED_REASON = 'You reversed the posted entry, so it needs your review again';

export function isResolved(resolution: Resolution | undefined): boolean {
  return (
    resolution !== undefined &&
    (resolution.state === 'approved' ||
      resolution.state === 'rejected' ||
      resolution.state === 'expert_reviewed')
  );
}

export function buildBoard(
  items: CloseItem[],
  policy: Policy,
  levels: Levels,
  resolutions: Record<string, Resolution>,
): BoardItem[] {
  return items.map((item) => {
    const route = routeItem(item, policy, levels);
    const resolution = resolutions[item.id];
    const reversed = resolution?.state === 'reversed';
    const lane: Lane = reversed && route.lane === 'AUTONOMOUS' ? 'ASSISTED' : route.lane;
    const autoPosted = !resolution && route.lane === 'AUTONOMOUS';
    const routeWithReason = reversed ? { ...route, reasons: [REVERSED_REASON, ...route.reasons] } : route;
    return {
      item,
      route: routeWithReason,
      lane,
      resolution,
      settled: isResolved(resolution) || autoPosted,
      autoPosted,
    };
  });
}

export interface TaskStatus extends CloseTask {
  done: boolean;
  itemIds: string[];
  openItemIds: string[];
}

/** A task is done when seeded as done, or when every linked item is settled. */
export function computeTasks(tasks: CloseTask[], board: BoardItem[]): TaskStatus[] {
  return tasks.map((task) => {
    const linked = board.filter((b) => b.item.taskIds.includes(task.id));
    const open = linked.filter((b) => !b.settled);
    const done = task.seedDone || (linked.length > 0 && open.length === 0);
    return {
      ...task,
      done,
      itemIds: linked.map((b) => b.item.id),
      openItemIds: open.map((b) => b.item.id),
    };
  });
}

export function progressPercent(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done * 100) / total);
}

export function closeProgress(tasks: TaskStatus[]) {
  const done = tasks.filter((t) => t.done).length;
  return { done, total: tasks.length, percent: progressPercent(done, tasks.length) };
}

export function entryBalanceCents(lines: EntryLine[]): number {
  return lines.reduce((sum, l) => sum + l.debitCents - l.creditCents, 0);
}

export function isEntryBalanced(lines: EntryLine[]): boolean {
  return entryBalanceCents(lines) === 0;
}
