import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {
  ChevronsLeft,
  ChevronsRight,
  Command,
  Menu,
  RotateCcw,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CommandPalette } from '@/components/CommandPalette';
import { ConfirmDialog } from '@/components/Dialog';
import { toast, Toaster } from '@/components/toast';
import { TourPanel } from '@/components/Tour';
import { Button, Tooltip } from '@/components/ui';
import type { EntityFilter } from '@/domain/types';
import { cn } from '@/lib/cn';
import { useDemo, type Persona } from '@/store/demoStore';
import { DEV_NAV, FINANCE_NAV, STORY_NAV, type NavItem } from './navigation';

export const FOOTER_TEXT =
  'Concept prototype by YOUR_NAME for the Intuit PM Intern case. Not affiliated with or endorsed by Intuit. All data is fictional.';

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2 font-strong tracking-tight">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="shrink-0">
        <circle cx="12" cy="12" r="10.5" fill="none" stroke="var(--hairline)" strokeWidth="1.5" />
        <path d="M12 12 L18.5 7" stroke="var(--lane-auto)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2" fill="var(--text)" />
      </svg>
      {compact ? <span className="sr-only">IES Autopilot</span> : <span>IES Autopilot</span>}
    </span>
  );
}

function NavSection({
  title,
  items,
  collapsed,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="mt-5">
      <div className={cn('px-3 pb-1.5 text-xs text-muted', collapsed && 'sr-only')}>{title}</div>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.to}>
            <NavRailLink item={item} collapsed={collapsed} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NavRailLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon: LucideIcon = item.icon;
  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'flex h-9 items-center gap-3 rounded-chip px-3 text-sm transition-colors',
          isActive ? 'bg-raised text-text' : 'text-muted hover:bg-raised/60 hover:text-text',
          collapsed && 'justify-center px-0',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={17} aria-hidden className={isActive ? 'text-action' : undefined} />
          {collapsed ? null : <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
  return collapsed ? <Tooltip content={item.label}>{link}</Tooltip> : link;
}

function PersonaSwitch({ collapsed }: { collapsed: boolean }) {
  const persona = useDemo((s) => s.persona);
  const setPersona = useDemo((s) => s.setPersona);
  const navigate = useNavigate();
  const options: Array<{ id: Persona; label: string; short: string; to: string }> = [
    { id: 'finance', label: 'Finance leader', short: 'FL', to: '/cfo/brief' },
    { id: 'developer', label: 'Developer', short: 'Dev', to: '/dev' },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Persona"
      className={cn('grid gap-1 rounded-chip border border-hairline bg-bg p-1', collapsed ? 'grid-cols-1' : 'grid-cols-2')}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={persona === o.id}
          aria-label={collapsed ? o.label : undefined}
          onClick={() => {
            setPersona(o.id);
            navigate(o.to);
          }}
          className={cn(
            'h-8 rounded-[4px] px-2 text-xs font-medium transition-colors',
            persona === o.id ? 'bg-raised text-text' : 'text-muted hover:text-text',
          )}
        >
          {collapsed ? o.short : o.label}
        </button>
      ))}
    </div>
  );
}

function NavContents({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const persona = useDemo((s) => s.persona);
  return (
    <>
      <PersonaSwitch collapsed={collapsed} />
      {persona === 'finance' ? (
        <NavSection title="Maya Chen, Controller" items={FINANCE_NAV} collapsed={collapsed} onNavigate={onNavigate} />
      ) : (
        <NavSection title="Sam Okafor, Rebatewise" items={DEV_NAV} collapsed={collapsed} onNavigate={onNavigate} />
      )}
      <NavSection title="The case" items={STORY_NAV} collapsed={collapsed} onNavigate={onNavigate} />
    </>
  );
}

function TopBar({ onOpenNav, onOpenPalette }: { onOpenNav: () => void; onOpenPalette: () => void }) {
  const entityFilter = useDemo((s) => s.entityFilter);
  const setEntityFilter = useDemo((s) => s.setEntityFilter);
  const resetDemo = useDemo((s) => s.resetDemo);
  const navigate = useNavigate();
  const [confirmReset, setConfirmReset] = useState(false);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <Button variant="ghost" size="sm" className="px-2 lg:hidden" aria-label="Open navigation" onClick={onOpenNav}>
          <Menu size={20} aria-hidden />
        </Button>
        <div className="lg:hidden">
          <Wordmark compact />
        </div>
        <label className="sr-only" htmlFor="entity-switcher">
          Entity
        </label>
        <select
          id="entity-switcher"
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value as EntityFilter)}
          className="h-8 min-w-0 rounded-chip border border-hairline bg-surface px-2 text-sm text-text"
          data-testid="entity-switcher"
        >
          <option value="ALL">All entities</option>
          <option value="US">US</option>
          <option value="CA">Canada</option>
          <option value="UK">UK</option>
        </select>
        <span className="hidden items-center rounded-chip border border-hairline px-2 py-1 text-xs text-muted md:inline-flex">
          September 2026 close, business day 2
        </span>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Button variant="secondary" size="sm" onClick={onOpenPalette} aria-label="Open command palette">
            <Command size={15} aria-hidden />
            <span className="hidden sm:inline">{isMac ? 'Cmd' : 'Ctrl'} + K</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={15} aria-hidden />
            <span className="hidden sm:inline">Reset demo</span>
            <span className="sr-only sm:hidden">Reset demo</span>
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset the demo?"
        description="This restores every setting, approval, install, and Flight Log entry to the starting seed data and returns you to Home."
        confirmLabel="Reset demo"
        danger
        onConfirm={() => {
          resetDemo();
          navigate('/');
          toast('Demo reset', 'Everything is back to the starting seed data.');
        }}
      />
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-hairline">
      <p className="mx-auto max-w-[1280px] px-4 py-5 text-xs text-muted sm:px-6" data-testid="footer">
        {FOOTER_TEXT}
      </p>
    </footer>
  );
}

export function RouteFallback() {
  return (
    <div className="py-24 text-center text-sm text-muted" role="status">
      Loading
    </div>
  );
}

export function AppLayout() {
  const collapsed = useDemo((s) => s.navCollapsed);
  const setCollapsed = useDemo((s) => s.setNavCollapsed);
  const setPersona = useDemo((s) => s.setPersona);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/dev')) setPersona('developer');
    else if (location.pathname.startsWith('/cfo')) setPersona('finance');
  }, [location.pathname, setPersona]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <TooltipPrimitive.Provider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-chip focus:bg-action focus:px-3 focus:py-2 focus:text-bg"
      >
        Skip to content
      </a>
      <div className="flex min-h-screen">
        <aside
          className={cn(
            'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-hairline bg-surface px-3 py-4 lg:flex',
            collapsed ? 'w-[72px]' : 'w-60',
          )}
          aria-label="Primary"
        >
          <div className={cn('mb-4 flex items-center px-1', collapsed ? 'justify-center' : 'justify-between')}>
            {collapsed ? <Wordmark compact /> : <Wordmark />}
          </div>
          <nav aria-label="Main navigation" className="flex-1 overflow-y-auto">
            <NavContents collapsed={collapsed} />
          </nav>
          <Button
            variant="ghost"
            size="sm"
            className={cn('mt-3', collapsed ? 'px-0' : 'justify-start')}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {collapsed ? <ChevronsRight size={16} aria-hidden /> : <ChevronsLeft size={16} aria-hidden />}
            {collapsed ? null : <span>Collapse</span>}
          </Button>
        </aside>

        <DialogPrimitive.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/60 lg:hidden" />
            <DialogPrimitive.Content
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-hairline bg-surface px-3 py-4 lg:hidden"
              aria-describedby={undefined}
              data-testid="nav-drawer"
            >
              <div className="mb-4 flex items-center justify-between px-1">
                <DialogPrimitive.Title asChild>
                  <div>
                    <Wordmark />
                  </div>
                </DialogPrimitive.Title>
                <DialogPrimitive.Close asChild>
                  <Button variant="ghost" size="sm" className="px-2" aria-label="Close navigation">
                    <X size={18} aria-hidden />
                  </Button>
                </DialogPrimitive.Close>
              </div>
              <nav aria-label="Main navigation" className="flex-1 overflow-y-auto">
                <NavContents collapsed={false} onNavigate={() => setDrawerOpen(false)} />
              </nav>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onOpenNav={() => setDrawerOpen(true)} onOpenPalette={() => setPaletteOpen(true)} />
          <main id="main" className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <Suspense fallback={<RouteFallback />}>
              <Outlet />
            </Suspense>
          </main>
          <Footer />
        </div>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <TourPanel />
      <Toaster />
    </TooltipPrimitive.Provider>
  );
}
