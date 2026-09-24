import { roundDiv } from './money';
import type { Currency } from './types';

/** Fictional fixed rates, stored as USD per unit in 1/10000 so conversion stays integer. */
export const FX_RATES_E4: Record<Currency, number> = {
  USD: 10_000,
  CAD: 7_300,
  GBP: 12_700,
};

export const FX_RATE_LABELS: Record<Currency, string> = {
  USD: '1 USD = 1 USD',
  CAD: '1 CAD = 0.73 USD',
  GBP: '1 GBP = 1.27 USD',
};

export function isCurrency(value: unknown): value is Currency {
  return value === 'USD' || value === 'CAD' || value === 'GBP';
}

/** usdCents = round(amountCents * rate), computed in integers. */
export function toUsdCents(amountCents: number, currency: Currency): number {
  const rate = FX_RATES_E4[currency];
  if (rate === undefined) throw new Error(`Unknown currency ${String(currency)}`);
  return roundDiv(amountCents * rate, 10_000);
}
