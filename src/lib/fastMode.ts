declare global {
  interface Window {
    __IES_FAST__?: boolean;
  }
}

/** Simulated delays collapse to zero under unit tests or when e2e sets the fast flag. */
export function isFastMode(): boolean {
  if (import.meta.env.MODE === 'test') return true;
  return typeof window !== 'undefined' && window.__IES_FAST__ === true;
}

export function simulatedDelay(ms: number): number {
  return isFastMode() ? 0 : ms;
}
