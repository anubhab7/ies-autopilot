import { beforeEach, describe, expect, it } from 'vitest';
import { computeCloseState } from '@/store/closeState';
import { seedState, useDemo } from '@/store/demoStore';
import {
  createMemoryStorage,
  readPersisted,
  resolveStorage,
  STATE_VERSION,
  writePersisted,
} from '@/store/safeStorage';

describe('safe storage', () => {
  it('returns null for corrupted JSON and clears it', () => {
    const storage = createMemoryStorage();
    storage.setItem('k', '{not json');
    expect(readPersisted(storage, 'k', STATE_VERSION)).toBeNull();
    expect(storage.getItem('k')).toBeNull();
  });

  it('returns null on version mismatch', () => {
    const storage = createMemoryStorage();
    writePersisted(storage, 'k', STATE_VERSION - 1, { a: 1 });
    expect(readPersisted(storage, 'k', STATE_VERSION)).toBeNull();
  });

  it('returns null for valid JSON with the wrong shape', () => {
    const storage = createMemoryStorage();
    storage.setItem('k', '42');
    expect(readPersisted(storage, 'k', STATE_VERSION)).toBeNull();
    storage.setItem('k', JSON.stringify({ version: STATE_VERSION, state: null }));
    expect(readPersisted(storage, 'k', STATE_VERSION)).toBeNull();
  });

  it('round-trips valid state', () => {
    const storage = createMemoryStorage();
    writePersisted(storage, 'k', STATE_VERSION, { a: 1 });
    expect(readPersisted(storage, 'k', STATE_VERSION)).toEqual({ a: 1 });
  });

  it('falls back to memory when localStorage is missing or throws', () => {
    const missing = resolveStorage(() => undefined);
    missing.setItem('x', '1');
    expect(missing.getItem('x')).toBe('1');
    const throwing = resolveStorage(() => {
      throw new Error('SecurityError');
    });
    throwing.setItem('y', '2');
    expect(throwing.getItem('y')).toBe('2');
  });

  it('survives a storage whose getItem throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {},
    };
    expect(readPersisted(broken, 'k', STATE_VERSION)).toBeNull();
    expect(() => writePersisted(broken, 'k', STATE_VERSION, {})).not.toThrow();
  });
});

describe('demo store actions', () => {
  beforeEach(() => {
    useDemo.getState().resetDemo();
  });

  const close = () => {
    const s = useDemo.getState();
    return computeCloseState(s.policy, s.levels, s.resolutions, s.installed);
  };

  it('approving is idempotent: a double approval creates one log entry', () => {
    const before = useDemo.getState().log.length;
    expect(useDemo.getState().approveItem('ACR-221').ok).toBe(true);
    expect(useDemo.getState().approveItem('ACR-221').ok).toBe(false);
    const entries = useDemo.getState().log.filter((e) => e.itemId === 'ACR-221');
    expect(entries).toHaveLength(1);
    expect(useDemo.getState().log.length).toBe(before + 1);
  });

  it('refuses an unbalanced edited entry', () => {
    const result = useDemo.getState().approveItem('ACR-221', [
      { account: 'a', entity: 'US', debitCents: 100, creditCents: 0 },
      { account: 'b', entity: 'US', debitCents: 0, creditCents: 99 },
    ]);
    expect(result.ok).toBe(false);
  });

  it('requires a 5 to 200 character reject reason', () => {
    expect(useDemo.getState().rejectItem('VEN-88', 'no').ok).toBe(false);
    expect(useDemo.getState().rejectItem('VEN-88', 'x'.repeat(201)).ok).toBe(false);
    expect(useDemo.getState().rejectItem('VEN-88', 'Genuine repeat order').ok).toBe(true);
  });

  it('reverses an auto-post once and moves the item to Assisted', () => {
    expect(useDemo.getState().reverseItem('FX-77').ok).toBe(true);
    const log = useDemo.getState().log;
    const original = log.find((e) => e.itemId === 'FX-77' && e.status === 'reversed');
    const reversal = log.find((e) => e.itemId === 'FX-77' && e.status === 'reversal');
    expect(original?.linkedEntryId).toBe(reversal?.id);
    expect(reversal?.linkedEntryId).toBe(original?.id);
    expect(useDemo.getState().reverseEntry(original!.id).ok).toBe(false);
    expect(useDemo.getState().reverseEntry(reversal!.id).ok).toBe(false);
    expect(close().board.find((b) => b.item.id === 'FX-77')?.lane).toBe('ASSISTED');
  });

  it('install and uninstall LedgerLoop adds and removes REV-606', () => {
    useDemo.getState().installAgent('ledgerloop-revrec', []);
    expect(close().items.some((i) => i.id === 'REV-606')).toBe(true);
    expect(useDemo.getState().levels.revenue).toBe('L1');
    useDemo.getState().uninstallAgent('ledgerloop-revrec');
    expect(close().items.some((i) => i.id === 'REV-606')).toBe(false);
  });

  it('expert flow resolves the item as expert-reviewed', () => {
    const id = useDemo.getState().sendToExpert('TP-12', 'priya-raman', 'Is 5% right?');
    expect(useDemo.getState().acceptExpertRecommendation(id).ok).toBe(false);
    useDemo.getState().markExpertReplied(id);
    expect(useDemo.getState().acceptExpertRecommendation(id).ok).toBe(true);
    expect(useDemo.getState().resolutions['TP-12']?.state).toBe('expert_reviewed');
    expect(useDemo.getState().log.at(-1)?.status).toBe('expert_reviewed');
  });

  it('reset restores the seed state', () => {
    useDemo.getState().approveItem('ACR-221');
    useDemo.getState().setMateriality(40);
    useDemo.getState().resetDemo();
    const { policy, levels, resolutions, log } = useDemo.getState();
    const seed = seedState();
    expect({ policy, levels, resolutions, log }).toEqual({
      policy: seed.policy,
      levels: seed.levels,
      resolutions: seed.resolutions,
      log: seed.log,
    });
    expect(close().progress.percent).toBe(42);
    expect(close().openCounts).toMatchObject({ AUTONOMOUS: 4, ASSISTED: 6, EXPERT: 2 });
  });
});
