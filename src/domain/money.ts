import type { Currency } from './types';

const SYMBOLS: Record<Currency, string> = { USD: '$', CAD: 'CA$', GBP: '£' };

function groupThousands(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** "-$1,234.56". Works on integer cents only; decimals appear at display time. */
export function formatMoney(cents: number, currency: Currency = 'USD'): string {
  if (!Number.isFinite(cents)) return 'Not available';
  const rounded = Math.round(cents);
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded);
  const whole = Math.floor(abs / 100);
  const fraction = String(abs % 100).padStart(2, '0');
  return `${sign}${SYMBOLS[currency]}${groupThousands(whole)}.${fraction}`;
}

/** Whole-unit display for thresholds and headlines: "$40,000". */
export function formatMoneyWhole(cents: number, currency: Currency = 'USD'): string {
  if (!Number.isFinite(cents)) return 'Not available';
  const rounded = Math.round(cents / 100);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}${SYMBOLS[currency]}${groupThousands(Math.abs(rounded))}`;
}

/** Compact chart format: "$6.4M", "$850K", "-$1.2M". */
export function formatCompact(cents: number): string {
  if (!Number.isFinite(cents)) return 'Not available';
  const dollars = cents / 100;
  const sign = dollars < 0 ? '-' : '';
  const abs = Math.abs(dollars);
  const trim = (n: number) => n.toFixed(1).replace(/\.0$/, '');
  if (abs >= 1_000_000_000) return `${sign}$${trim(abs / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${sign}$${trim(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}$${trim(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
}

/** Integer division rounding half away from zero. */
export function roundDiv(numerator: number, denominator: number): number {
  const sign = Math.sign(numerator) * Math.sign(denominator);
  const n = Math.abs(numerator);
  const d = Math.abs(denominator);
  return sign * Math.floor((n * 2 + d) / (d * 2));
}

/** Apply basis points to cents in integers: cents * bps / 10000. */
export function applyBps(cents: number, bps: number): number {
  return roundDiv(cents * bps, 10_000);
}

/** Parse "1,234.56" into cents. Returns null when the text is not a valid amount. */
export function parseMoneyInput(text: string): number | null {
  const cleaned = text.replace(/[$,\s]/g, '');
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const negative = cleaned.startsWith('-');
  const [whole, fraction = ''] = cleaned.replace('-', '').split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return negative ? -cents : cents;
}

/** Confidence in bps shown as a decimal: 9500 to "0.95". */
export function formatConfidence(bps: number): string {
  return (bps / 10_000).toFixed(2);
}

/** Basis points shown as a percent: 50 to "0.5%". */
export function formatBpsPercent(bps: number): string {
  const whole = Math.floor(bps / 100);
  const rest = bps % 100;
  if (rest === 0) return `${whole}%`;
  return `${whole}.${String(rest).padStart(2, '0').replace(/0$/, '')}%`;
}

/** Whole units when there are no cents ("$43,800"), otherwise full ("$2,730.50"). */
export function formatMoneyShort(cents: number, currency: Currency = 'USD'): string {
  if (Number.isFinite(cents) && Math.round(cents) % 100 === 0) return formatMoneyWhole(cents, currency);
  return formatMoney(cents, currency);
}
