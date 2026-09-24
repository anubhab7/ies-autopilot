import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { USER_ACTOR } from '@/data/company';
import { EXPERTS, EXPERT_REPLIES } from '@/data/experts';
import { FLIGHT_LOG_SEED } from '@/data/flightLog';
import { DEFAULT_LEVELS, DEFAULT_POLICY } from '@/domain/autonomyEngine';
import { isEntryBalanced } from '@/domain/closeProgress';
import { detectIntent, validateQuestion, type IntentId } from '@/domain/scenarioEngine';
import type { ScopeId } from '@/domain/scopes';
import type {
  EntityFilter,
  EntryLine,
  Level,
  Levels,
  LogEntry,
  Resolution,
  Workflow,
} from '@/domain/types';
import type { PricingModel } from '@/domain/validators';
import { createPrng } from '@/lib/prng';
import { demoTimestamp } from '@/lib/time';
import { computeCloseState, type PolicySettings } from './closeState';
import { createSafePersistStorage, STATE_VERSION, STORAGE_KEY } from './safeStorage';

export type Persona = 'finance' | 'developer';

export interface ExpertSession {
  id: string;
  itemId: string;
  expertId: string;
  question: string;
  status: 'sent' | 'replied' | 'accepted';
  createdAt: string;
  estimatedCostCents: number;
}

export interface AskMessage {
  id: string;
  text: string;
  intent: IntentId | null;
  /** Live mode answer text, when the optional live AI mode answered. */
  liveAnswer?: string;
  notice?: string;
}

export interface PublishedListing {
  name: string;
  description: string;
  pricingModel: PricingModel;
  priceCents: number;
  scopes: ScopeId[];
  publishedAt: string;
}

export interface DevState {
  workspaceCreated: boolean;
  sandboxReady: boolean;
  apiKey: string | null;
  keyVersion: number;
  timerStartedAt: number | null;
  firstCallMs: number | null;
  apiCalls: number;
  studioVersion: 1 | 2;
  evalVersionRun: 1 | 2 | null;
  submittedForCertification: boolean;
  published: PublishedListing | null;
}

export interface TourState {
  active: boolean;
  step: number;
}

export interface DataState {
  persona: Persona;
  entityFilter: EntityFilter;
  policy: PolicySettings;
  levels: Levels;
  resolutions: Record<string, Resolution>;
  log: LogEntry[];
  seq: number;
  installed: Record<string, { installedAt: string; optionalScopes: ScopeId[] }>;
  expertSessions: Record<string, ExpertSession>;
  askMessages: AskMessage[];
  dev: DevState;
  tour: TourState;
  navCollapsed: boolean;
}

export const DEFAULT_POLICY_SETTINGS: PolicySettings = {
  materialityBps: DEFAULT_POLICY.materialityBps,
  confidenceMinBps: DEFAULT_POLICY.confidenceMinBps,
};

const INITIAL_DEV: DevState = {
  workspaceCreated: false,
  sandboxReady: false,
  apiKey: null,
  keyVersion: 0,
  timerStartedAt: null,
  firstCallMs: null,
  apiCalls: 0,
  studioVersion: 1,
  evalVersionRun: null,
  submittedForCertification: false,
  published: null,
};

export function seedState(): DataState {
  return {
    persona: 'finance',
    entityFilter: 'ALL',
    policy: { ...DEFAULT_POLICY_SETTINGS },
    levels: { ...DEFAULT_LEVELS },
    resolutions: {},
    log: FLIGHT_LOG_SEED.map((e) => ({ ...e })),
    seq: FLIGHT_LOG_SEED.length,
    installed: {},
    expertSessions: {},
    askMessages: [],
    dev: { ...INITIAL_DEV },
    tour: { active: false, step: 0 },
    navCollapsed: false,
  };
}

export type ActionResult = { ok: true } | { ok: false; message: string };

interface Actions {
  setPersona(persona: Persona): void;
  setEntityFilter(filter: EntityFilter): void;
  setNavCollapsed(collapsed: boolean): void;

  setLevel(workflow: Workflow, level: Level): void;
  setAllLevels(level: Level): void;
  setMateriality(bps: number): void;
  setConfidenceMin(bps: number): void;
  restoreRecommended(): void;

  approveItem(itemId: string, editedEntry?: EntryLine[]): ActionResult;
  rejectItem(itemId: string, reason: string): ActionResult;
  bulkApprove(itemIds: string[]): number;
  reverseEntry(entryId: string): ActionResult;
  reverseItem(itemId: string): ActionResult;

  sendToExpert(itemId: string, expertId: string, question: string): string;
  markExpertReplied(sessionId: string): void;
  acceptExpertRecommendation(sessionId: string): ActionResult;

  installAgent(agentId: string, optionalScopes: ScopeId[]): void;
  uninstallAgent(agentId: string): void;

  askQuestion(text: string, extra?: Pick<AskMessage, 'liveAnswer' | 'notice'>): ActionResult;
  clearConversation(): void;

  createWorkspace(): void;
  launchSandbox(): void;
  generateApiKey(): void;
  recordApiCall(success: boolean): void;
  setStudioVersion(version: 1 | 2): void;
  recordEvalRun(version: 1 | 2): void;
  submitForCertification(): ActionResult;
  publishListing(listing: Omit<PublishedListing, 'publishedAt'>): ActionResult;

  startTour(step?: number): void;
  setTourStep(step: number): void;
  exitTour(): void;

  resetDemo(): void;
}

export type DemoStore = DataState & Actions;

function nextLogId(seq: number): string {
  return `FL-${String(seq).padStart(4, '0')}`;
}

function closeStateOf(s: DataState) {
  return computeCloseState(s.policy, s.levels, s.resolutions, s.installed);
}

export function generateApiKey(version: number): string {
  const next = createPrng(20261002 + version * 7919);
  const alphabet = 'abcdefghijkmnopqrstuvwxyz23456789';
  let key = 'ies_sk_test_';
  for (let i = 0; i < 28; i += 1) key += alphabet[Math.floor(next() * alphabet.length)];
  return key;
}

export const useDemo = create<DemoStore>()(
  persist(
    (set, get) => {
      /** Appends log entries with sequential ids and demo timestamps. */
      const appendLog = (
        state: DataState,
        entries: Array<Omit<LogEntry, 'id' | 'at'>>,
      ): { log: LogEntry[]; seq: number; ids: string[] } => {
        let seq = state.seq;
        const ids: string[] = [];
        const created = entries.map((entry) => {
          seq += 1;
          const id = nextLogId(seq);
          ids.push(id);
          return { ...entry, id, at: demoTimestamp(seq - FLIGHT_LOG_SEED.length) };
        });
        return { log: [...state.log, ...created], seq, ids };
      };

      return {
        ...seedState(),

        setPersona: (persona) => set({ persona }),
        setEntityFilter: (entityFilter) => set({ entityFilter }),
        setNavCollapsed: (navCollapsed) => set({ navCollapsed }),

        setLevel: (workflow, level) => set((s) => ({ levels: { ...s.levels, [workflow]: level } })),
        setAllLevels: (level) =>
          set((s) => ({
            levels: Object.fromEntries(Object.keys(s.levels).map((w) => [w, level])) as Levels,
          })),
        setMateriality: (materialityBps) => set((s) => ({ policy: { ...s.policy, materialityBps } })),
        setConfidenceMin: (confidenceMinBps) =>
          set((s) => ({ policy: { ...s.policy, confidenceMinBps } })),
        restoreRecommended: () =>
          set((s) => ({
            policy: { ...DEFAULT_POLICY_SETTINGS },
            levels: { ...DEFAULT_LEVELS, revenue: s.levels.revenue === 'L0' ? 'L0' : 'L1' },
          })),

        approveItem: (itemId, editedEntry) => {
          const state = get();
          const board = closeStateOf(state).board.find((b) => b.item.id === itemId);
          if (!board) return { ok: false, message: 'This item is no longer on the close board.' };
          const current = state.resolutions[itemId];
          if (current && current.state !== 'reversed') {
            return { ok: false, message: 'This item is already resolved.' };
          }
          if (board.lane === 'EXPERT') {
            return { ok: false, message: 'Expert items need an expert review first.' };
          }
          if (board.autoPosted) return { ok: false, message: 'This entry was already auto-posted.' };
          const entry = editedEntry ?? board.item.proposedEntry;
          if (entry.length === 0 || !isEntryBalanced(entry)) {
            return { ok: false, message: 'The entry must have balanced debit and credit lines.' };
          }
          set((s) => {
            const { log, seq } = appendLog(s, [
              {
                actor: USER_ACTOR,
                actorType: 'human',
                action: editedEntry ? 'Edited and approved entry' : 'Approved entry',
                itemId,
                entities: board.item.entities,
                usdCents: board.route.usdCents,
                lane: board.lane,
                confidenceBps: board.item.confidenceBps,
                status: 'posted',
              },
            ]);
            return {
              log,
              seq,
              resolutions: {
                ...s.resolutions,
                [itemId]: {
                  state: 'approved',
                  at: demoTimestamp(seq - FLIGHT_LOG_SEED.length),
                  by: USER_ACTOR,
                  entry,
                },
              },
            };
          });
          return { ok: true };
        },

        rejectItem: (itemId, reason) => {
          const trimmed = reason.trim();
          if (trimmed.length < 5 || trimmed.length > 200) {
            return { ok: false, message: 'Give a reason between 5 and 200 characters.' };
          }
          const state = get();
          const board = closeStateOf(state).board.find((b) => b.item.id === itemId);
          if (!board) return { ok: false, message: 'This item is no longer on the close board.' };
          const current = state.resolutions[itemId];
          if (current && current.state !== 'reversed') {
            return { ok: false, message: 'This item is already resolved.' };
          }
          set((s) => {
            const { log, seq } = appendLog(s, [
              {
                actor: USER_ACTOR,
                actorType: 'human',
                action: 'Rejected entry',
                itemId,
                entities: board.item.entities,
                usdCents: board.route.usdCents,
                lane: board.lane,
                confidenceBps: board.item.confidenceBps,
                status: 'rejected',
                note: trimmed,
              },
            ]);
            return {
              log,
              seq,
              resolutions: {
                ...s.resolutions,
                [itemId]: {
                  state: 'rejected',
                  at: demoTimestamp(seq - FLIGHT_LOG_SEED.length),
                  by: USER_ACTOR,
                  note: trimmed,
                },
              },
            };
          });
          return { ok: true };
        },

        bulkApprove: (itemIds) => {
          let count = 0;
          for (const id of itemIds) {
            if (get().approveItem(id).ok) count += 1;
          }
          return count;
        },

        reverseEntry: (entryId) => {
          const state = get();
          const close = closeStateOf(state);
          const derived = close.derivedLog.find((e) => e.id === entryId);
          const stored = state.log.find((e) => e.id === entryId);
          const original = derived ?? stored;
          if (!original) return { ok: false, message: 'That Flight Log entry does not exist.' };
          if (original.status !== 'posted' && original.status !== 'expert_reviewed') {
            return { ok: false, message: 'Only posted or expert-reviewed entries can be reversed.' };
          }
          const onBoard = close.board.find((b) => b.item.id === original.itemId);
          set((s) => {
            const reversal: Omit<LogEntry, 'id' | 'at'> = {
              actor: USER_ACTOR,
              actorType: 'human',
              action: 'Reversed entry',
              itemId: original.itemId,
              entities: original.entities,
              usdCents: -original.usdCents,
              lane: original.lane,
              confidenceBps: original.confidenceBps,
              status: 'reversal',
            };
            let base: DataState = s;
            let originalId = original.id;
            if (derived) {
              // Store the auto-post before reversing it so the trail stays complete.
              const materialized = appendLog(s, [{ ...derived, derived: undefined, status: 'reversed' }]);
              base = { ...s, log: materialized.log, seq: materialized.seq };
              originalId = materialized.ids[0];
            }
            const { log, seq, ids } = appendLog(base, [{ ...reversal, linkedEntryId: originalId }]);
            const finalLog = log.map((e) =>
              e.id === originalId ? { ...e, status: 'reversed' as const, linkedEntryId: ids[0] } : e,
            );
            const resolutions = { ...s.resolutions };
            if (onBoard) {
              resolutions[original.itemId] = {
                state: 'reversed',
                at: demoTimestamp(seq - FLIGHT_LOG_SEED.length),
                by: USER_ACTOR,
              };
            }
            return { log: finalLog, seq, resolutions };
          });
          return { ok: true };
        },

        reverseItem: (itemId) => {
          const state = get();
          const close = closeStateOf(state);
          const derived = close.derivedLog.find((e) => e.itemId === itemId);
          if (derived) return get().reverseEntry(derived.id);
          const stored = [...state.log]
            .reverse()
            .find((e) => e.itemId === itemId && (e.status === 'posted' || e.status === 'expert_reviewed'));
          if (!stored) return { ok: false, message: 'There is no posted entry to reverse.' };
          return get().reverseEntry(stored.id);
        },

        sendToExpert: (itemId, expertId, question) => {
          const state = get();
          const existing = Object.values(state.expertSessions).find(
            (x) => x.itemId === itemId && x.status !== 'accepted',
          );
          if (existing) return existing.id;
          const expert = EXPERTS.find((e) => e.id === expertId) ?? EXPERTS[0];
          const id = `XS-${Object.keys(state.expertSessions).length + 1}`;
          set((s) => ({
            expertSessions: {
              ...s.expertSessions,
              [id]: {
                id,
                itemId,
                expertId: expert.id,
                question,
                status: 'sent',
                createdAt: demoTimestamp(s.seq - FLIGHT_LOG_SEED.length + 1),
                estimatedCostCents: expert.rateCentsPer30,
              },
            },
          }));
          return id;
        },

        markExpertReplied: (sessionId) =>
          set((s) => {
            const session = s.expertSessions[sessionId];
            if (!session || session.status !== 'sent') return {};
            return { expertSessions: { ...s.expertSessions, [sessionId]: { ...session, status: 'replied' } } };
          }),

        acceptExpertRecommendation: (sessionId) => {
          const state = get();
          const session = state.expertSessions[sessionId];
          if (!session) return { ok: false, message: 'That expert session does not exist.' };
          if (session.status === 'accepted') return { ok: false, message: 'Recommendation already accepted.' };
          if (session.status !== 'replied') return { ok: false, message: 'Wait for the expert to reply.' };
          const board = closeStateOf(state).board.find((b) => b.item.id === session.itemId);
          if (!board) return { ok: false, message: 'This item is no longer on the close board.' };
          const expert = EXPERTS.find((e) => e.id === session.expertId) ?? EXPERTS[0];
          const reply = EXPERT_REPLIES[session.itemId];
          const entry = reply?.entry ?? board.item.proposedEntry;
          set((s) => {
            const { log, seq } = appendLog(s, [
              {
                actor: `${expert.name}, ${expert.credential}`,
                actorType: 'expert',
                action: 'Expert-reviewed entry accepted',
                itemId: session.itemId,
                entities: board.item.entities,
                usdCents: board.route.usdCents,
                lane: 'EXPERT',
                confidenceBps: board.item.confidenceBps,
                status: 'expert_reviewed',
                note: `Accepted by ${USER_ACTOR}`,
              },
            ]);
            return {
              log,
              seq,
              resolutions: {
                ...s.resolutions,
                [session.itemId]: {
                  state: 'expert_reviewed',
                  at: demoTimestamp(seq - FLIGHT_LOG_SEED.length),
                  by: `${expert.name}, ${expert.credential}`,
                  entry,
                },
              },
              expertSessions: { ...s.expertSessions, [sessionId]: { ...session, status: 'accepted' } },
            };
          });
          return { ok: true };
        },

        installAgent: (agentId, optionalScopes) =>
          set((s) => {
            if (agentId in s.installed) return {};
            const levels =
              agentId === 'ledgerloop-revrec' ? { ...s.levels, revenue: 'L1' as Level } : s.levels;
            return {
              installed: {
                ...s.installed,
                [agentId]: { installedAt: demoTimestamp(0), optionalScopes },
              },
              levels,
            };
          }),

        uninstallAgent: (agentId) =>
          set((s) => {
            if (!(agentId in s.installed)) return {};
            const installed = { ...s.installed };
            delete installed[agentId];
            // Unresolved partner items disappear; resolved ones stay in the Flight Log.
            const resolutions = { ...s.resolutions };
            if (agentId === 'ledgerloop-revrec' && resolutions['REV-606']?.state === 'reversed') {
              delete resolutions['REV-606'];
            }
            return { installed, resolutions };
          }),

        askQuestion: (text, extra) => {
          const check = validateQuestion(text);
          if (!check.ok) return { ok: false, message: check.message };
          set((s) => ({
            askMessages: [
              ...s.askMessages,
              { id: `Q-${s.askMessages.length + 1}`, text: check.text, intent: detectIntent(check.text), ...extra },
            ],
          }));
          return { ok: true };
        },
        clearConversation: () => set({ askMessages: [] }),

        createWorkspace: () =>
          set((s) => ({
            dev: {
              ...s.dev,
              workspaceCreated: true,
              timerStartedAt: s.dev.timerStartedAt ?? Date.now(),
            },
          })),
        launchSandbox: () => set((s) => ({ dev: { ...s.dev, sandboxReady: true } })),
        generateApiKey: () =>
          set((s) => {
            const keyVersion = s.dev.keyVersion + 1;
            return {
              dev: {
                ...s.dev,
                keyVersion,
                apiKey: generateApiKey(keyVersion),
                timerStartedAt: s.dev.timerStartedAt ?? Date.now(),
              },
            };
          }),
        recordApiCall: (success) =>
          set((s) => {
            const dev = { ...s.dev, apiCalls: s.dev.apiCalls + 1 };
            if (success && dev.firstCallMs === null) {
              dev.firstCallMs = Math.max(0, Date.now() - (dev.timerStartedAt ?? Date.now()));
            }
            return { dev };
          }),
        setStudioVersion: (studioVersion) => set((s) => ({ dev: { ...s.dev, studioVersion } })),
        recordEvalRun: (evalVersionRun) => set((s) => ({ dev: { ...s.dev, evalVersionRun } })),
        submitForCertification: () => {
          const { dev } = get();
          if (dev.evalVersionRun !== 2) {
            return { ok: false, message: 'Run evaluations and reach 95% before submitting.' };
          }
          set((s) => ({ dev: { ...s.dev, submittedForCertification: true } }));
          return { ok: true };
        },
        publishListing: (listing) => {
          if (!get().dev.submittedForCertification) {
            return { ok: false, message: 'Pass evaluations and submit for certification first.' };
          }
          set((s) => ({ dev: { ...s.dev, published: { ...listing, publishedAt: demoTimestamp(0) } } }));
          return { ok: true };
        },

        startTour: (step = 0) => set({ tour: { active: true, step } }),
        setTourStep: (step) => set((s) => ({ tour: { ...s.tour, step } })),
        exitTour: () => set((s) => ({ tour: { ...s.tour, active: false } })),

        resetDemo: () => set({ ...seedState() }),
      };
    },
    {
      name: STORAGE_KEY,
      version: STATE_VERSION,
      storage: createSafePersistStorage<Partial<DataState>>(),
      partialize: (s): Partial<DataState> => ({
        persona: s.persona,
        entityFilter: s.entityFilter,
        policy: s.policy,
        levels: s.levels,
        resolutions: s.resolutions,
        log: s.log,
        seq: s.seq,
        installed: s.installed,
        expertSessions: s.expertSessions,
        askMessages: s.askMessages,
        dev: s.dev,
        tour: s.tour,
        navCollapsed: s.navCollapsed,
      }),
      merge: (persisted, current) => {
        const seed = seedState();
        const saved = (persisted ?? {}) as Partial<DataState>;
        return { ...current, ...seed, ...saved, dev: { ...seed.dev, ...saved.dev } };
      },
    },
  ),
);
