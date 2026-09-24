import * as ToastPrimitive from '@radix-ui/react-toast';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { create } from 'zustand';

type Tone = 'success' | 'info' | 'error';

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: Tone;
}

interface ToastStore {
  toasts: ToastItem[];
  counter: number;
  push(toast: Omit<ToastItem, 'id'>): void;
  dismiss(id: number): void;
}

const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],
  counter: 0,
  push: (toast) =>
    set((s) => ({ counter: s.counter + 1, toasts: [...s.toasts.slice(-2), { ...toast, id: s.counter + 1 }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(title: string, description?: string, tone: Tone = 'success') {
  useToastStore.getState().push({ title, description, tone });
}

const ICONS = { success: CheckCircle2, info: Info, error: XCircle };
const COLORS = { success: 'text-success', info: 'text-action', error: 'text-danger' };

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
      {toasts.map((t) => {
        const Icon = ICONS[t.tone];
        return (
          <ToastPrimitive.Root
            key={t.id}
            onOpenChange={(open) => {
              if (!open) dismiss(t.id);
            }}
            className="flex items-start gap-3 rounded-panel border border-hairline bg-raised p-3 pr-2"
            data-testid="toast"
          >
            <Icon size={18} className={`mt-0.5 shrink-0 ${COLORS[t.tone]}`} aria-hidden />
            <div className="min-w-0 flex-1">
              <ToastPrimitive.Title className="text-sm font-medium">{t.title}</ToastPrimitive.Title>
              {t.description ? (
                <ToastPrimitive.Description className="mt-0.5 text-sm text-muted">
                  {t.description}
                </ToastPrimitive.Description>
              ) : null}
            </div>
            <ToastPrimitive.Close
              aria-label="Dismiss notification"
              className="rounded-chip p-1 text-muted hover:text-text"
            >
              <X size={16} aria-hidden />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        );
      })}
      <ToastPrimitive.Viewport className="fixed left-1/2 top-3 z-[60] flex w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2 outline-none" />
    </ToastPrimitive.Provider>
  );
}
