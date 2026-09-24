export const DATA_SCOPES = [
  { id: 'read:ledger', label: 'Read: general ledger', kind: 'read' },
  { id: 'read:close', label: 'Read: close exceptions', kind: 'read' },
  { id: 'read:customers', label: 'Read: customers and invoices', kind: 'read' },
  { id: 'read:vendors', label: 'Read: vendors and bills', kind: 'read' },
  { id: 'read:contracts', label: 'Read: contracts and documents', kind: 'read' },
  { id: 'read:payroll', label: 'Read: payroll summaries', kind: 'read' },
  { id: 'read:inventory', label: 'Read: inventory and shipments', kind: 'read' },
  { id: 'write:drafts', label: 'Write: draft entries', kind: 'write' },
] as const;

export type ScopeId = (typeof DATA_SCOPES)[number]['id'];

export function scopeLabel(id: ScopeId): string {
  return DATA_SCOPES.find((s) => s.id === id)?.label ?? id;
}

export function isScopeId(value: string): value is ScopeId {
  return DATA_SCOPES.some((s) => s.id === value);
}
