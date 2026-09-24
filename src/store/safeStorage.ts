import type { PersistStorage, StorageValue } from 'zustand/middleware';

export const STORAGE_KEY = 'ies-autopilot-demo';
export const STATE_VERSION = 3;

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

/**
 * Returns localStorage when it exists and accepts writes; otherwise an in-memory
 * store, so private browsing or blocked storage never crashes the demo.
 */
export function resolveStorage(getter: () => Storage | undefined = defaultGetter): KeyValueStorage {
  try {
    const storage = getter();
    if (!storage) return createMemoryStorage();
    const probe = '__ies_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return createMemoryStorage();
  }
}

function defaultGetter(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}

/** Reads a persisted envelope; returns null on missing, corrupted, or old-version data. */
export function readPersisted<T>(storage: KeyValueStorage, key: string, version: number): T | null {
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return null;
  }
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('version' in parsed) ||
      !('state' in parsed) ||
      (parsed as { version: unknown }).version !== version ||
      typeof (parsed as { state: unknown }).state !== 'object' ||
      (parsed as { state: unknown }).state === null
    ) {
      safeRemove(storage, key);
      return null;
    }
    return (parsed as { state: T }).state;
  } catch {
    safeRemove(storage, key);
    return null;
  }
}

export function writePersisted<T>(storage: KeyValueStorage, key: string, version: number, state: T): void {
  try {
    storage.setItem(key, JSON.stringify({ version, state }));
  } catch {
    // Quota or access errors: keep running on in-memory state.
  }
}

function safeRemove(storage: KeyValueStorage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // Ignore: nothing else to do.
  }
}

/** Zustand persist adapter built on the safe helpers above. */
export function createSafePersistStorage<S>(
  getStorage: () => KeyValueStorage = () => resolveStorage(),
): PersistStorage<S> {
  let storage: KeyValueStorage | null = null;
  const get = () => (storage ??= getStorage());
  return {
    getItem: (name): StorageValue<S> | null => {
      const state = readPersisted<S>(get(), name, STATE_VERSION);
      return state === null ? null : { state, version: STATE_VERSION };
    },
    setItem: (name, value) => writePersisted(get(), name, STATE_VERSION, value.state),
    removeItem: (name) => safeRemove(get(), name),
  };
}
