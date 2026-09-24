import { roundDiv } from './money';

export const TIER_BOUNDARY_CENTS = 100_000_000; // $1,000,000 lifetime gross
export const SHARE_BELOW_BPS = 8_000;
export const SHARE_ABOVE_BPS = 8_500;

export class RevenueShareError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RevenueShareError';
  }
}

function assertValid(value: number, label: string) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new RevenueShareError(`${label} must be a non-negative number of cents`);
  }
}

/**
 * Developer earnings for a period. The developer keeps 80% of lifetime gross up to
 * $1,000,000 and 85% above it; a period that crosses the boundary is split.
 */
export function developerEarnings(grossCents: number, priorLifetimeGrossCents: number): number {
  assertValid(grossCents, 'Gross');
  assertValid(priorLifetimeGrossCents, 'Prior lifetime gross');
  const roomBelow = Math.max(0, TIER_BOUNDARY_CENTS - priorLifetimeGrossCents);
  const below = Math.min(grossCents, roomBelow);
  const above = grossCents - below;
  return roundDiv(below * SHARE_BELOW_BPS, 10_000) + roundDiv(above * SHARE_ABOVE_BPS, 10_000);
}

export function intuitShare(grossCents: number, priorLifetimeGrossCents: number): number {
  return grossCents - developerEarnings(grossCents, priorLifetimeGrossCents);
}
