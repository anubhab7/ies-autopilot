/** The fixed demo clock: business day 2 of the September 2026 close. */
export const DEMO_NOW = '2026-10-02T09:00:00';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function parseNaive(iso: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(iso);
  if (!match) return Number.NaN;
  const [, y, mo, d, h, mi, s] = match;
  return Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s ?? 0));
}

function toNaive(ms: number): string {
  const date = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(
    date.getUTCHours(),
  )}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

/** Demo timestamp offset from DEMO_NOW by a number of minutes (timezone independent). */
export function demoTimestamp(offsetMinutes: number): string {
  return toNaive(parseNaive(DEMO_NOW) + offsetMinutes * 60_000);
}

/** "Oct 2, 09:14" */
export function formatTimestamp(iso: string): string {
  const ms = parseNaive(iso);
  if (Number.isNaN(ms)) return iso;
  const date = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${pad(date.getUTCHours())}:${pad(
    date.getUTCMinutes(),
  )}`;
}

/** Month label for index 0 = October 2026. */
export function projectionMonthLabel(index: number, long = false): string {
  const monthIndex = (9 + index) % 12;
  const year = 2026 + Math.floor((9 + index) / 12);
  return long ? `${MONTHS_LONG[monthIndex]} ${year}` : `${MONTHS[monthIndex]} ${String(year).slice(2)}`;
}
