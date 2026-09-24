import { CheckCircle2, Headset, RotateCcw, Undo2, XCircle } from 'lucide-react';
import type { LogStatus } from '@/domain/types';
import { cn } from '@/lib/cn';

export const LOG_STATUS_META: Record<LogStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  posted: { label: 'Posted', icon: CheckCircle2, className: 'text-success' },
  expert_reviewed: { label: 'Expert-reviewed', icon: Headset, className: 'text-lane-expert' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'text-danger' },
  reversed: { label: 'Reversed', icon: RotateCcw, className: 'text-muted' },
  reversal: { label: 'Reversal', icon: Undo2, className: 'text-lane-assist' },
};

export function LogStatusBadge({ status }: { status: LogStatus }) {
  const meta = LOG_STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium', meta.className)}>
      <Icon size={13} aria-hidden />
      {meta.label}
    </span>
  );
}
