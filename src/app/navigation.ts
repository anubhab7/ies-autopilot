import {
  Bot,
  Code2,
  FlaskConical,
  Gauge,
  Home,
  MessageSquare,
  NotebookPen,
  PlaneTakeoff,
  Rocket,
  ScrollText,
  Search,
  Sunrise,
  Target,
  Wallet,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const FINANCE_NAV: NavItem[] = [
  { to: '/cfo/brief', label: 'Morning brief', icon: Sunrise },
  { to: '/cfo/close', label: 'Close Autopilot', icon: PlaneTakeoff },
  { to: '/cfo/autonomy', label: 'Control Tower', icon: Gauge },
  { to: '/cfo/ask', label: 'Ask Autopilot', icon: MessageSquare },
  { to: '/cfo/store', label: 'Agent Store', icon: Bot },
  { to: '/cfo/flight-log', label: 'Flight Log', icon: ScrollText },
];

export const DEV_NAV: NavItem[] = [
  { to: '/dev', label: 'Hangar', icon: Warehouse, end: true },
  { to: '/dev/explorer', label: 'API and MCP explorer', icon: Code2 },
  { to: '/dev/studio', label: 'Agent Studio', icon: FlaskConical },
  { to: '/dev/publish', label: 'Publish', icon: Rocket },
  { to: '/dev/earnings', label: 'Earnings', icon: Wallet },
];

export const STORY_NAV: NavItem[] = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/strategy', label: 'Strategy', icon: Target },
  { to: '/research', label: 'Research', icon: Search },
  { to: '/process', label: 'Process', icon: NotebookPen },
];

export const ALL_ROUTES: Array<NavItem & { group: string }> = [
  ...STORY_NAV.map((n) => ({ ...n, group: 'Story' })),
  ...FINANCE_NAV.map((n) => ({ ...n, group: 'Finance leader' })),
  ...DEV_NAV.map((n) => ({ ...n, group: 'Developer' })),
];
