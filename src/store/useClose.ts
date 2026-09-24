import { useMemo } from 'react';
import { computeCloseState, type CloseState } from './closeState';
import { useDemo } from './demoStore';

/** Memoized routing, board, tasks, and progress for the current settings. */
export function useCloseState(): CloseState {
  const policy = useDemo((s) => s.policy);
  const levels = useDemo((s) => s.levels);
  const resolutions = useDemo((s) => s.resolutions);
  const installed = useDemo((s) => s.installed);
  return useMemo(
    () => computeCloseState(policy, levels, resolutions, installed),
    [policy, levels, resolutions, installed],
  );
}

/** Stored plus derived Flight Log entries, newest first. */
export function useFlightLog() {
  const log = useDemo((s) => s.log);
  const { derivedLog } = useCloseState();
  return useMemo(
    () => [...log, ...derivedLog].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : b.id.localeCompare(a.id))),
    [log, derivedLog],
  );
}
