export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

export function escapeCsvCell(value: string | number): string {
  const text = String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvCell(c.header)).join(',');
  const body = rows.map((row) => columns.map((c) => escapeCsvCell(c.value(row))).join(','));
  return [header, ...body].join('\r\n');
}
