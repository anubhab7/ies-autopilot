import { Headset, Pencil, Plane, UserCheck, type LucideIcon } from 'lucide-react';
import type { Lane } from '@/domain/types';
import { cn } from '@/lib/cn';

export const LANE_META: Record<Lane, { label: string; icon: LucideIcon; text: string; border: string; bg: string; description: string }> = {
  AUTONOMOUS: {
    label: 'Autonomous',
    icon: Plane,
    text: 'text-lane-auto',
    border: 'border-lane-auto/50',
    bg: 'bg-lane-auto/10',
    description: 'Agents post with evidence attached. You can reverse any entry.',
  },
  ASSISTED: {
    label: 'Assisted',
    icon: UserCheck,
    text: 'text-lane-assist',
    border: 'border-lane-assist/50',
    bg: 'bg-lane-assist/10',
    description: 'Agents draft, you decide.',
  },
  EXPERT: {
    label: 'Expert',
    icon: Headset,
    text: 'text-lane-expert',
    border: 'border-lane-expert/50',
    bg: 'bg-lane-expert/10',
    description: 'A vetted CPA reviews before anything posts.',
  },
  MANUAL: {
    label: 'Manual',
    icon: Pencil,
    text: 'text-lane-manual',
    border: 'border-lane-manual/50',
    bg: 'bg-lane-manual/10',
    description: 'Agents are off for this workflow.',
  },
};

export const LANE_ORDER: Lane[] = ['AUTONOMOUS', 'ASSISTED', 'EXPERT', 'MANUAL'];

export function LaneBadge({ lane, className }: { lane: Lane; className?: string }) {
  const meta = LANE_META[lane];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-chip border px-1.5 py-0.5 text-xs font-medium',
        meta.text,
        meta.border,
        meta.bg,
        className,
      )}
      data-lane={lane}
    >
      <Icon size={12} aria-hidden />
      {meta.label}
    </span>
  );
}

export function LaneIcon({ lane, size = 16 }: { lane: Lane; size?: number }) {
  const meta = LANE_META[lane];
  const Icon = meta.icon;
  return <Icon size={size} className={meta.text} aria-hidden />;
}
