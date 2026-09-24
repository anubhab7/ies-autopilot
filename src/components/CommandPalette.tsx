import * as DialogPrimitive from '@radix-ui/react-dialog';
import { FileText, Search } from 'lucide-react';
import { useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ALL_ROUTES } from '@/app/navigation';
import { CLOSE_ITEMS, PARTNER_ITEMS } from '@/data/closeItems';
import { STORE_AGENTS } from '@/data/agents';
import { cn } from '@/lib/cn';

interface Command {
  id: string;
  label: string;
  group: string;
  to: string;
  hint?: string;
}

const COMMANDS: Command[] = [
  ...ALL_ROUTES.map((r) => ({ id: `route-${r.to}`, label: r.label, group: r.group, to: r.to })),
  ...[...CLOSE_ITEMS, ...PARTNER_ITEMS].map((i) => ({
    id: `item-${i.id}`,
    label: `${i.id}: ${i.description}`,
    group: 'Close items',
    to: `/cfo/close/${i.id}`,
    hint: i.entities.join(' and '),
  })),
  ...STORE_AGENTS.map((a) => ({
    id: `agent-${a.id}`,
    label: a.name,
    group: 'Agent Store',
    to: `/cfo/store/${a.id}`,
    hint: a.publisher,
  })),
];

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? COMMANDS.filter((c) => `${c.label} ${c.group} ${c.hint ?? ''}`.toLowerCase().includes(q))
      : COMMANDS;
    return list.slice(0, 40);
  }, [query]);

  const go = (command: Command | undefined) => {
    if (!command) return;
    onOpenChange(false);
    setQuery('');
    setActive(0);
    navigate(command.to);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setQuery('');
          setActive(0);
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-dialog border border-hairline bg-surface"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <div className="flex items-center gap-2 border-b border-hairline px-4">
            <Search size={16} className="text-muted" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Jump to a page, close item, or agent"
              aria-label="Search commands"
              role="combobox"
              aria-expanded="true"
              aria-controls="command-results"
              aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
              className="h-12 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted"
            />
          </div>
          <ul id="command-results" role="listbox" aria-label="Results" className="max-h-[50vh] overflow-y-auto p-2">
            {results.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted">
                Nothing matches "{query}". Try an item id like IC-310 or a page name.
              </li>
            ) : (
              results.map((c, index) => (
                <li
                  key={c.id}
                  id={`cmd-${c.id}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(c)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 rounded-chip px-3 py-2 text-sm',
                    index === active ? 'bg-raised text-text' : 'text-muted',
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FileText size={14} aria-hidden className="shrink-0" />
                    <span className="truncate text-text">{c.label}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">{c.hint ?? c.group}</span>
                </li>
              ))
            )}
          </ul>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
