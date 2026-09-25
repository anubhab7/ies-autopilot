# BUILD PROMPT: "IES Autopilot" clickable prototype (Intuit PM Intern case)

You are a senior product engineer and product designer. Build a polished, fully clickable, deployable web prototype described below. Work autonomously. Do not stop to ask me questions: when something is unclear, make a sensible assumption, write it in `docs/ASSUMPTIONS.md`, and keep going. The submission deadline is tomorrow, so build in the phase order given in Section 11 so that the most important flows are finished first.

Before writing any app code:
1. Read this entire file.
2. Create `CLAUDE.md` in the repo root containing the Hard Rules (Section 2), the design tokens (Section 4), and the test commands (Section 10), so they persist across sessions.
3. Create `PLAN.md` with a checkbox list of the phases in Section 11. Tick each box when its acceptance criteria pass. Commit to git after every phase with a clear message. If the session is interrupted, the next session will resume from the first unticked phase.

Replace the placeholders `Anubhab Chakraborty`, `[REPLACE WITH YOUR LINKEDIN URL]` wherever they appear with obvious placeholder text that is easy to find and edit later (keep them exactly as written, I will fill them in).

---

## 1. Context: the case and the product concept

**The case.** Intuit asks PM candidates to design how Intuit Enterprise Suite (IES), its product for mid-market businesses (50 to 2,500 employees, multi-entity, multi-geography), evolves from an integrated suite into an AI-native business platform. The platform must (a) embed AI agents plus human and AI expert services across finance, accounting, workforce, and commerce workflows, and (b) let third-party developers, ISVs, and advisors build AI-native apps and agents on IES data, APIs, and tools. Two personas: the Mid-Market Finance Leader (CFO, Controller, owner) and the 3rd Party Developer or ISV. The primary deliverable is a clickable prototype that a reviewer can navigate in 10 to 15 minutes.

**What already exists (research, September 2026).** This matters: the prototype must go beyond it, not repeat it.
- IES already ships seven first-party AI agents (Finance, Accounting, Project Management, Payments, Customer, Payroll, Sales Tax). Source: https://peakadvisers.com/blog/intuit-enterprise-suite-ai-agents/
- Intuit and Anthropic announced a partnership (Feb 2026) so businesses can build custom agents on Intuit's platform. Source: https://investors.intuit.com/news-events/press-releases/detail/1305/intuit-and-anthropic-partner-to-bring-trusted-financial-intelligence-and-custom-ai-agents-to-consumers-and-businesses
- Intuit reported that 75% of IES customers use its AI agents monthly (Aug 2026 earnings). Source: https://www.pymnts.com/earnings/2026/intuit-says-75-of-enterprise-customers-deploy-ai-agents-monthly/
- The Intuit App Partner Program charges developers: free Builder tier with capped read calls, paid tiers of $300, $1,700 and $4,500 per month; Marketplace listing needs reviews estimated at up to 30 business days for security. Sources: https://vorplabs.com/agent-tools/quickbooks-online-api and https://intuitapppartners.com/
- Competitors: NetSuite 2026.1 exposes ERP data to Claude and ChatGPT through MCP and lets partners monetize AI SuiteApps (https://www.netsuite.com/portal/resource/articles/cloud-saas/suitecloud-platform-delivers-ai-native-development-expanded-rest-apis-and-next-generation-extensibility-in-netsuite-2026-1.shtml). Workday runs an Agent Partner Network and Agent System of Record (https://newsroom.workday.com/2025-06-03-Workday-Announces-New-AI-Agent-Partner-Network-and-Agent-Gateway-to-Power-the-Next-Generation-of-Human-and-Digital-Workforces). AI-native ERPs are well funded, for example Rillet at a $1B valuation in Aug 2026 (https://sacra.com/c/rillet/).
- Close pain: only 18% of finance teams close in 3 business days or fewer and 50% take 6 or more (https://ledge.co/content/month-end-close-benchmarks-for-2025). APQC median is about 6.4 calendar days, bottom quartile 10 or more (https://trginternational.com/blog/hidden-costs-slow-month-end-close-solution/).

**The gap we attack.**
1. Agents are organized by function, but a CFO thinks in outcomes ("close 3 entities in 3 days").
2. Trust is the blocker to autonomy: finance leaders need evidence, limits, an audit trail, undo, and a human expert on call.
3. Developer economics point the wrong way: developers mostly pay the platform to read data. A platform grows when builders earn.

**The product: IES Autopilot.** Tagline: "Your finance team's AI crew, with a human expert always on call." It uses an aviation vocabulary consistently across the UI:
- **Autopilot**: outcome-level multi-agent workflows (hero: multi-entity month-end close).
- **Autonomy Dial**: per-workflow autonomy levels L0 to L3 plus guardrails (materiality and confidence).
- **Flight Log**: the immutable audit trail of every agent and human action, with reversal.
- **Control Tower**: the settings and oversight area.
- **Expert on call**: one-click handoff of an exception to a vetted human CPA with an auto-assembled context packet.
- **Agent Store**: certified third-party and advisor-built agents a customer installs with scoped permissions.
- **Hangar**: the developer experience (sandbox, API and MCP explorer, Agent Studio with automated evaluations, publish, earnings).
- **Intuit Assured** (concept): certified agents are backed by an accuracy guarantee, similar in spirit to a tax-filing accuracy guarantee.

**Three strategic pillars** (show on the Strategy page):
1. Outcome Autopilots, not feature agents.
2. Trust by design: evidence, guardrails, reversibility, expert escalation.
3. An ecosystem where builders earn: AI-ready APIs, hosted MCP server, sandbox, automated certification in days, outcome pricing, revenue share.

---

## 2. Hard rules (copy these into CLAUDE.md)

1. **Never use the em dash (U+2014) or the en dash (U+2013) anywhere**: UI copy, code comments, markdown, test names, commit messages, JSON data. Use commas, colons, parentheses, or the word "to" for ranges (for example "3 to 5 days"). A script `npm run check:dashes` must scan the repo (excluding node_modules, dist, .git, playwright-report, test-results) and fail if either character is found. It runs inside `npm run verify`.
2. All company, people, and partner data is fictional. Do not use Intuit's logo or any real company logo. Use a custom text wordmark "IES Autopilot". Show a small footer on every page: "Concept prototype by Anubhab Chakraborty for the Intuit PM Intern case. Not affiliated with or endorsed by Intuit. All data is fictional."
3. Deterministic demo: a fixed demo clock (`DEMO_NOW = 2026-10-02T09:00:00`, business day 2 of the September 2026 close). No `Math.random()` in rendered data; use a seeded PRNG where variation is needed, so tests are stable.
4. Money is stored and computed in **integer cents**. Ratios (materiality, confidence thresholds, revenue shares) are compared in **integer basis points** to avoid floating point errors. Only format to decimals at display time.
5. Accessibility: semantic HTML, visible focus rings, every interactive element reachable by keyboard, aria labels on icon buttons, color is never the only signal (lanes also have an icon and a text label), WCAG AA contrast, respects `prefers-reduced-motion`.
6. Responsive from 375px wide to 1920px. No horizontal page scroll at 375px; wide tables scroll inside their own container.
7. UI copy: sentence case, plain verbs, a button says exactly what it does and the resulting toast uses the same verb ("Approve entry" then "Entry approved"). No ALL CAPS labels, no arrows appended to button text, no lorem ipsum. Errors say what happened and how to fix it. Empty states invite an action.
8. No console errors or React warnings in normal use. TypeScript strict mode. No `any` unless justified in a comment.
9. The app must work with zero environment variables. The optional live AI mode (Section 7.6) is off unless `ANTHROPIC_API_KEY` exists on the server.

---

## 3. Tech stack and structure

- Vite + React 18 + TypeScript (strict), React Router (data routes), Tailwind CSS (latest stable), Radix UI primitives for dialogs, tooltips, tabs, sliders, dropdowns, and toasts (or shadcn/ui components generated locally), `lucide-react` icons, `recharts` for charts, `motion` (Framer Motion) for the few purposeful animations, `zustand` with `persist` for state.
- Fonts self-hosted via Fontsource: `@fontsource-variable/instrument-sans` for everything (if unavailable, use `@fontsource-variable/inter-tight` and note it in ASSUMPTIONS.md). Enable tabular numerals for all figures.
- Tests: Vitest + React Testing Library + jsdom for unit and component tests; Playwright (Chromium) for end-to-end; `@axe-core/playwright` for accessibility.
- Lint: ESLint (typescript-eslint, react-hooks) and Prettier.
- Deployment target: Vercel. Add `vercel.json` with an SPA rewrite so deep links like `/cfo/close/IC-310` work on refresh. Optional serverless function at `/api/ask.ts` for live AI mode.

Suggested structure:
```
src/
  app/ (router, layout, providers, error boundary)
  components/ (ui primitives, AutonomyDial, LaneBadge, MoneyText, EmptyState, Tour, CommandPalette)
  features/
    cfo/ (brief, close, exception detail, autonomy, experts, ask, store, flight-log)
    dev/ (onboarding, explorer, studio, publish, earnings)
    strategy/ research/ process/
  domain/ (autonomyEngine.ts, fx.ts, money.ts, scenarioEngine.ts, revenueShare.ts, evalSimulator.ts, closeProgress.ts, validators.ts)
  data/ (seed JSON or TS: company, entities, closeItems, tasks, flightLog, agents, experts, apiMocks, research, process)
  store/ (zustand slices, safe storage wrapper, resetDemo)
  lib/ (format.ts, prng.ts, time.ts)
tests/ (unit and component) e2e/ (Playwright specs)
scripts/ (check-dashes.mjs, screenshots.mjs)
docs/ (ASSUMPTIONS.md, RESEARCH.md, PROMPT_LOG.md, DECK_OUTLINE.md, screenshots/)
```

---

## 4. Design system: "Night cockpit"

The subject is a flight deck for finance: calm, precise, instrument-like, dark. Spend the boldness in one place: the **Autonomy Dial**, a real rotary instrument. Keep everything else quiet and disciplined. Avoid the generic SaaS card kit (identical rounded cards with the same shadow everywhere, gradient washes, all-caps eyebrow labels, middle-dot meta strings).

Color tokens (CSS variables, dark theme only):
- `--bg` #0D1524 (night sky), `--surface` #131D30, `--raised` #1A2740, `--hairline` #25354F
- `--text` #E6EDF7, `--muted` #8FA3BF
- `--action` #4C8DFF (primary buttons, links, focus ring)
- Lane colors, used consistently everywhere with an icon and label:
  - Autonomous: `--lane-auto` #2DD4BF (icon: plane)
  - Assisted: `--lane-assist` #F5B544 (icon: hand or user-check)
  - Expert: `--lane-expert` #A78BFA (icon: headset)
  - Manual: `--lane-manual` #94A3B8 (icon: pencil)
- Status: success #34D399, danger #F87171.

Type: Instrument Sans Variable. Scale 12 / 14 / 16 / 20 / 24 / 32 / 44 px, weights 400, 500, 650. Body line length under 80 characters. Big numbers use weight 500 with tabular numerals, not oversized gradient text.

Layout: left navigation rail (collapsible, becomes a drawer below 1024px) with a persona switch at the top (Finance leader / Developer), then sections. A top bar shows: entity switcher (All entities, US, Canada, UK), period chip "September 2026 close, business day 2", a command palette button (Ctrl or Cmd + K), and "Reset demo". Content max width 1280px. Radius hierarchy: 6px for inputs and chips, 10px for panels, 16px only for dialogs. Borders over shadows.

Motion: one orchestrated moment on the Close Autopilot page (agents visibly working through items when the page first loads, about 1.5 seconds, skippable, disabled under reduced motion). Other motion only responds to user actions (dialog open, item moving lanes, dial needle turning).

---

## 5. Domain data (seed). Use these exact values: tests depend on them.

**Company:** Northwind Outdoor Co., outdoor gear maker and retailer, 420 employees, 3 entities:
- `US` Northwind Outdoor Inc. (USD, parent)
- `CA` Northwind Outdoor Canada Ltd. (CAD)
- `UK` Northwind Outdoor UK Ltd. (GBP)

**Fixed FX rates (fictional, labeled as such in UI):** 1 CAD = 0.73 USD, 1 GBP = 1.27 USD, 1 USD = 1 USD. Conversion: `usdCents = Math.round(amountCents * rate)`.

**Finance baseline:** consolidated monthly revenue $8,000,000 (`800_000_000` cents). Monthly operating costs $7,600,000. Cash on hand at DEMO_NOW $6,400,000. Last close took 9 business days; target is 3.

**Default guardrails:** materiality 50 bps (0.5%) of monthly revenue, so threshold = $40,000 exactly (compute `revenueCents * bps / 10000` in integers). Auto-post confidence minimum 9500 bps (0.95). Low-confidence floor 5000 bps (0.50). Expert-only categories: `transfer_pricing`, `tax_position`, `audit_adjustment`, `new_entity`.

**Close items (exceptions and proposals) for September 2026.** Confidence is given as a decimal here, store as integer bps.

| ID | Entity | Workflow | Description | Amount | Confidence | Reversible | Category | Expected lane at defaults |
|---|---|---|---|---|---|---|---|---|
| BR-1042 | US | bank | Match payout to invoice INV-8831 | USD 3,200.00 | 0.98 | yes | standard | Autonomous |
| BR-1043 | CA | bank | Match deposit to invoice INV-C-2210 | CAD 12,400.00 (USD 9,052.00) | 0.97 | yes | standard | Autonomous |
| ACR-221 | US | accruals | Accrue unbilled consulting (Ridgeway Partners) | USD 18,000.00 | 0.81 | yes | standard | Assisted (confidence below minimum) |
| IC-310 | US and UK | intercompany | Intercompany balance mismatch US vs UK | USD 120,000.00 | 0.90 | yes | standard | Assisted (above threshold) |
| TP-12 | UK | intercompany | Transfer pricing markup on IC-310 services | USD 120,000.00 | 0.72 | yes | transfer_pricing | Expert |
| FX-77 | UK | fx | Revalue GBP intercompany loan | GBP 30,000.00 (USD 38,100.00) | 0.96 | yes | standard | Autonomous (just under threshold) |
| FX-78 | CA | fx | Revalue CAD receivables | CAD 60,000.00 (USD 43,800.00) | 0.99 | yes | standard | Assisted (above threshold) |
| PAY-19 | UK | payroll | Accrue September UK payroll taxes | GBP 9,800.00 (USD 12,446.00) | 0.95 | yes | standard | Autonomous (confidence exactly at minimum) |
| DEP-5 | US | fixed_assets | Monthly depreciation, warehouse equipment | USD 40,000.00 | 0.99 | yes | standard | Assisted (amount exactly equals threshold, rule is strictly less than) |
| VEN-88 | US | ap | Suspected duplicate bill from Cascade Textiles | USD 7,450.00 | 0.64 | no (blocks a payment) | standard | Assisted (not reversible) |
| TAX-3 | CA | tax | GST/HST treatment of cross-border service | CAD 5,000.00 (USD 3,650.00) | 0.88 | yes | tax_position | Expert |
| BR-1050 | UK | bank | Unidentified deposit | GBP 2,150.00 (USD 2,730.50) | 0.42 | yes | standard | Assisted (below low-confidence floor, agent will not draft an entry) |

Totals at defaults: 4 Autonomous, 6 Assisted, 2 Expert, 12 items.

Conditional item (only exists while the partner agent "LedgerLoop RevRec" is installed):
| REV-606 | US | revenue | Deferred revenue schedule for multi-year contracts | USD 22,000.00 | 0.93 | yes | standard | Assisted at default L1 for newly installed agents; Autonomous if revenue workflow is set to L3 |

Each item also has: `evidence` (2 to 4 items such as bank line, invoice, prior-month pattern, policy reference, with fictional document names), `agent` (which agent proposed it: Accounting agent, Intercompany agent, FX agent, Payroll agent, AP agent, Tax agent, or the partner agent), `proposedEntry` (balanced debit and credit lines; must balance to zero, tested), and `reasoning` (2 to 3 plain sentences).

**Close tasks:** per entity, 8 tasks: Bank reconciliations, AP and AR cutoff, Accruals, Payroll, FX revaluation, Intercompany eliminations, Consolidation, Review and sign-off. Seed status so overall progress starts at 10 of 24 done (42%). Resolving all items linked to a task marks it done. Progress = done tasks / total tasks, shown as a percentage rounded to a whole number.

**Flight Log seed:** 15 prior actions from business days 1 and 2 (mix of agent auto-posts, human approvals, one expert-reviewed entry), each with timestamp, actor (agent name or "Maya Chen, Controller"), action, item or entry id, USD amount, lane, confidence, and status.

**People (fictional):** Controller "Maya Chen" (the logged-in user), CFO "Arjun Mehta".
Experts on call:
- Priya Raman, CPA: transfer pricing and intercompany. Typical response 15 minutes. $180 per 30 minutes.
- Daniel Osei, CPA: multi-entity close and consolidation. Typical response 20 minutes. $150 per 30 minutes.
- Hannah Weiss, Chartered Accountant (ICAEW): UK VAT and payroll. Typical response 30 minutes. $160 per 30 minutes.

**Agent Store (fictional partners):**
| Agent | Publisher | Type | Price | Certified accuracy | Eval cases | Status |
|---|---|---|---|---|---|---|
| LedgerLoop RevRec (ASC 606) | LedgerLoop Inc. | ISV | $0.60 per contract processed | 98.4% | 1,200 | Certified, installable |
| LeaseLens (ASC 842) | Brightside Labs | ISV | $199 per month | 97.1% | 800 | Certified, installable |
| Landed Cost Agent | Freightwise | ISV | $0.25 per shipment | 96.3% | 950 | Certified, installable |
| Grant Guardian | Okafor and Rao CPAs | Advisor-built (no-code) | $149 per month | 95.8% | 400 | Certified, installable |
| Commission Calc | Quota Labs | ISV | $3 per sales rep per month | 97.9% | 600 | Certified, installable |
| Vendor Contract Reader | ClauseCraft | ISV | $0.40 per contract | 91.2% | 300 | In certification, NOT installable |

Each agent has requested data scopes (read vs write drafts; no agent may post entries directly, only draft), a short description, rating, installs count, a "certification scorecard" (accuracy, eval cases passed, security review status, data residency, last re-certified date), and an "Intuit Assured" badge only when certified.

---

## 6. Core domain logic (pure functions, fully unit tested)

### 6.1 Autonomy engine `routeItem(item, policy, levels) -> { lane, reasons[], effectiveThresholdCents, usdCents }`
Lanes: `MANUAL`, `ASSISTED`, `AUTONOMOUS`, `EXPERT`. Levels per workflow: `L0` Manual (agents off), `L1` Assist (agents draft, humans approve everything), `L2` Autopilot with guardrails (default), `L3` Autopilot plus (confidence minimum lowered by 500 bps, never below 5000 bps).

Evaluate in this exact order and record a plain-language reason for each check:
1. Invalid input (missing or non-finite amount, unknown currency, confidence outside 0 to 10000 bps, unknown workflow) returns `ASSISTED` with reason "Data needs checking before an agent can act".
2. Workflow level `L0` returns `MANUAL`.
3. Category in expert-only list returns `EXPERT`.
4. Confidence below the low-confidence floor returns `ASSISTED` with flag `noDraft = true`.
5. Eligible for autonomy when ALL of: confidence >= effective minimum, `abs(usdCents) < thresholdCents` (strict), reversible is true. If eligible and level is `L1`, return `ASSISTED` with reason "Would auto-post at L2". If eligible and level is `L2` or `L3`, return `AUTONOMOUS`.
6. Otherwise `ASSISTED` with every failed check listed as a reason (for example "Amount $43,800 is above your $40,000 limit").
Negative amounts use absolute value for the threshold check. Zero amount is valid.

### 6.2 FX and money helpers
`toUsdCents`, `formatMoney(cents, currency)` (handles negatives as "-$1,234.56", zero, very large values), compact format for charts ("$6.4M").

### 6.3 Scenario engine (Ask Autopilot, deterministic)
Baseline 12-month cash projection from Oct 2026: start $6,400,000, monthly revenue $8,000,000, monthly costs $7,600,000. Supported intents (keyword matching, case-insensitive):
- "delay UK hires": 5 UK hires, loaded cost GBP 6,000 per month each, delayed 3 months. Monthly saving = 5 x 6,000 x 1.27 = USD 38,100; total = USD 114,300. Chart baseline vs scenario.
- "revenue drops 15%": revenue becomes $6,800,000 per month, net cash flow becomes -$800,000 per month, runway = 6,400,000 / 800,000 = 8 months. Show the month cash hits zero.
- "collect receivables faster" (DSO 52 to 45 days): one-time cash release = (96,000,000 / 365) x 7 = $1,841,095.89 (compute in cents, round half up). Chart it.
- "open an entity in Germany": this is `new_entity`, so respond that it needs an expert, show a short readiness checklist, and offer "Ask an expert".
Unknown or unsupported question: a helpful fallback listing the 4 supported questions as clickable chips. Empty or whitespace-only input: send button disabled. Input longer than 500 characters: blocked with a counter and message. Each answer shows: a short answer, the assumptions used (editable is not required), a chart, confidence label, and "Sources: Northwind ledger (demo data)".

### 6.4 Revenue share `developerEarnings(grossCents, priorLifetimeGrossCents)`
Developer keeps 8000 bps on lifetime gross up to $1,000,000 and 8500 bps above it. Correctly split a period that crosses the boundary. Example to test: prior $900,000, new $200,000, developer earns $80,000 + $85,000 = $165,000. Invalid (negative, NaN) throws a typed error.

### 6.5 Evaluation simulator
Deterministic. Agent draft "Northwind Rebate Accrual Agent" v1 passes 44 of 50 cases (88%), failing 6 (4 in "Multi-currency", 2 in "Partial periods"). After "Apply suggested fix", v2 passes 49 of 50 (98%). Certification threshold 9500 bps. Categories: Happy path, Multi-currency, Partial periods, Missing data, Adversarial prompts (prompt injection in memo fields). Progress runs about 3 seconds visually (instant in tests via a flag) and can be cancelled; cancel leaves the previous result intact.

### 6.6 Validators (publish form)
Agent name 3 to 60 characters, trimmed, unique among store agents (case-insensitive). Description 20 to 500 characters. Price between $0.01 and $10,000.00 with at most 2 decimals. Pricing model one of per outcome, monthly subscription, free (free hides price and requires $0). At least one data scope selected. "Write: post entries" scope does not exist; only "Write: draft entries".

---

## 7. Screens and flows

Routes (all deep-linkable, all reachable from navigation or the tour):

### Shared
- `/` Home: product name, one-sentence value, two entry points ("Tour as a finance leader", "Tour as a developer"), a "Start the 12 minute guided tour" button, and links to Strategy, Research, and Process. Hero moment: a live miniature of the Autonomy Dial and the close timeline ("9 days before, 3 days with Autopilot").
- `/strategy`: vision, the 3 pillars, the human plus AI operating model table (Autonomous vs Assisted vs Expert with examples from the seed data and the routing rule written in plain words), phased roadmap (Now 0 to 6 months, Next 6 to 18, Later 18 to 36), business model with the illustrative formula `GMV = N x a x k x p x 12` using N = 8,000 customers (assumption), a = 25%, k = 2 agents, p = $250 per month giving $12,000,000 GMV and $2,400,000 Intuit revenue at 20%, KPIs, and a risks and mitigations table. Mark all assumptions visibly.
- `/research`: research insights with source links (from Section 1), a competitive comparison table (IES Autopilot vs NetSuite vs Workday vs AI-native ERPs on: outcome autopilots, trust controls, human expert network, developer earnings model, certification speed, mid-market fit), and "Voice of the customer" themes. Label customer quotes clearly as "Illustrative, synthesized from public review themes", never as real quotes.
- `/process`: the AI-boosted D4D process (Empathize, Define, Ideate, Prototype, Experiment), each with tools used, the key prompt (editable text in `src/data/process.ts`, pre-filled with sensible placeholders marked "Edit me"), what worked, and what was rejected and why. Pre-fill the rejected ideas: "Another chat copilot" (IES already has one), "A generic app marketplace" (one exists; the gap is earning and trust), "Replace accountants with AI" (channel conflict; instead make advisors builders and reviewers), "Full autonomy by default" (trust must be earned per workflow). Also show the riskiest assumptions (LOFAs) table with the rapid test for each:
  1. Controllers will allow autonomous postings with evidence and guardrails: Wizard-of-Oz test with 5 to 8 finance professionals, measure approve-without-edit rate.
  2. Developers will build if they can earn: landing page with revenue share terms to existing app partners, measure waitlist conversion.
  3. Customers will pay for third-party agents inside IES: fake-door install buttons plus Van Westendorp price survey.
  4. Automated evaluations can certify accuracy well enough to back Intuit Assured: run 3 partner agents through the eval suite, compare with human review.
- `*` 404 page with a link home. Unknown item ids inside valid routes show an in-page "not found" state with a way back.

### Finance leader (persona: Maya Chen, Controller)
- `/cfo/brief` Morning brief: greeting, close progress ring (42% at start), "What Autopilot did overnight" (auto-posted items count and total value), "Needs you" list (Assisted items, sorted by amount), "With experts" list, cash snapshot with 12-month mini chart, and 3 suggested questions that link to Ask Autopilot.
- `/cfo/close` Close Autopilot: entity filter, a lane board with 4 columns (Autonomous, Assisted, Expert, Manual; hide Manual when empty), each item as a compact row with amount, agent, confidence meter, and lane badge. Task checklist per entity with progress. Header shows "Business day 2 of target 3" and the before vs after timeline. Bulk action: "Approve all under $10,000 with confidence 0.90 or higher" with a confirmation dialog listing exactly which items it will touch (if none qualify, the button is disabled with a tooltip explaining why).
- `/cfo/close/:itemId` Exception detail: evidence panel, agent reasoning, confidence, proposed balanced entry, "Why this lane" (engine reasons). Actions: Approve entry, Edit and approve (inline edit of line amounts with live balance check; cannot save unbalanced), Reject (requires a reason, 5 to 200 chars), Ask an expert, and for auto-posted items: Reverse. Every action writes to the Flight Log, updates task progress, and shows a toast. Actions are idempotent: after approval the buttons change to a resolved state; double clicks do not create duplicate log entries.
- `/cfo/autonomy` Control Tower: the **Autonomy Dial** as the hero component (SVG rotary control with 4 detents L0 to L3, draggable, clickable, and keyboard operable as `role="slider"` with arrow keys; needle animates). One dial for the selected workflow plus a compact list of all workflows with their level. Guardrail sliders: materiality 10 to 200 bps (step 10) with the dollar threshold displayed, confidence minimum 8000 to 9900 bps (step 100). Live preview: "With these settings, 4 of 12 items would auto-post this month" updating instantly, plus which items changed lane. "Restore recommended settings" button. Changes apply immediately to the Close board.
- Expert handoff (drawer or `/cfo/experts/:sessionId`): pick an expert (recommended one preselected by category), preview the auto-assembled context packet (item, evidence, related entries, policy, question), estimated cost, "Send to expert". Then a simulated chat: status "Priya is reviewing" with typing indicator, a scripted reply with a recommended entry and rationale after about 2 seconds (instant in tests), then "Accept recommendation" which resolves the item with status "Expert-reviewed" in the Flight Log. Cancel before sending leaves the item unchanged.
- `/cfo/ask` Ask Autopilot: chat layout with suggested chips, scenario answers and charts from Section 6.3, clear conversation button. Optional live mode toggle shown only if `/api/ask` responds healthy; otherwise hidden. If live mode errors or times out (8 seconds), fall back to the scripted engine and show a small notice.
- `/cfo/store` Agent Store: search, filters (type, pricing model, workflow), sort (rating, installs), agent cards. Search with no results shows an empty state with a "Clear filters" action.
- `/cfo/store/:agentId` Agent detail: certification scorecard, Intuit Assured badge, scopes, pricing, reviews. "Install agent" opens a consent dialog: scopes listed (required ones locked on, optional ones toggleable), default autonomy L1 explained, required checkbox "I understand this agent can read the data above and draft entries for approval". Install button disabled until checked. After install: toast, agent shows "Installed", and for LedgerLoop the REV-606 item appears in the Close board. "Uninstall" (with confirmation) removes the agent and its unresolved items; resolved items remain in the Flight Log. Vendor Contract Reader shows "In certification" and the install button is disabled with an explanation.
- `/cfo/flight-log` Flight Log: table with filters (actor type agent or human or expert, lane, entity, status) and text search. Reverse action on auto-posted and approved entries (confirmation dialog; expert-reviewed entries show an extra warning). A reversal creates a new linked entry and marks the original "Reversed"; reversing twice is impossible. "Export CSV" downloads the filtered rows (correct escaping of commas and quotes). Empty filter results show an empty state.

### Developer (persona: Sam Okafor, founder of a fictional startup "Rebatewise")
- `/dev` Hangar onboarding: 4-step stepper: Create workspace, Launch sandbox (a synthetic copy of Northwind with 3 entities, created in about 1 second), Generate API key (masked, "Copy key" button with copied state; regenerate with confirmation), Make your first call (links to explorer). A "time to first call" timer runs from step 1 and freezes on the first successful call. Stepper state persists.
- `/dev/explorer` API and MCP explorer: two tabs.
  - REST: endpoints `GET /v1/context/entities`, `GET /v1/close/{period}/exceptions`, `POST /v1/journal-entries/drafts`, `GET /v1/events` (webhook sample `close.exception.created`). Editable params. "Send request" returns mock JSON after a short delay with status and latency. Edge cases: no key generated yet returns 401 with a message and a link to generate one; `period` not matching `YYYY-MM` or month outside 01 to 12 (for example `2026-13`) returns 400 with a helpful message; posting a draft whose lines do not balance returns 422.
  - MCP: hosted server URL (fictional), tool list `ies.get_trial_balance`, `ies.list_close_exceptions`, `ies.draft_journal_entry`, `ies.request_expert_review`, each with JSON schema and a "Try tool" button.
- `/dev/studio` Agent Studio: two build modes as tabs. Code mode: read-only TypeScript SDK sample with syntax highlighting (a small `defineAgent({ name, triggers, tools, guardrails, handler })` example). No-code mode (for accountants and advisors): form for trigger, instructions, allowed tools, guardrails. Then "Run evaluations" using 6.5 with a results table by category, failed cases expandable with expected vs actual, and "Apply suggested fix" that bumps the version to v2. "Submit for certification" disabled below 95% with the reason shown.
- `/dev/publish` Publish: listing form with validators from 6.6 (inline errors, submit disabled until valid), pricing model, price, scopes, and a live earnings estimator: installs slider (0 to 5,000) x price x usage assumption, showing developer earnings via 6.4 and the Intuit share. Certification timeline: Automated evals (minutes), Security scan (1 business day), Human spot review (2 business days), so "Live in about 3 business days". Publishing without passing evals is impossible. After publish, success state with a link to earnings.
- `/dev/earnings` Earnings: monthly gross, developer share, installs, active customers, top workflows, a 6-month chart (seeded), payout schedule. Before publish, show an empty state that links to Publish.

### Guided tour (must have)
A floating tour panel (bottom right, draggable is not required) with 12 steps, each deep-linking to a route and highlighting the relevant element with a spotlight outline. Steps: 1 Home, 2 Morning brief, 3 Close Autopilot, 4 Exception IC-310 detail, 5 Control Tower dial, 6 Expert handoff on TP-12, 7 Ask Autopilot revenue drop scenario, 8 Agent Store install LedgerLoop, 9 Flight Log, 10 Hangar onboarding, 11 Agent Studio evals, 12 Publish and earnings. Buttons: Back, Next, Exit tour. Shows "Step 5 of 12". Keyboard: Escape exits. Tour state persists across reloads. The tour must still work if the user navigates away manually (it offers "Return to step").

### Global
- Command palette (Ctrl or Cmd + K) to jump to any route or close item.
- Reset demo: confirmation dialog, restores all seed state, returns to Home.
- Error boundary with a friendly message and "Reload" and "Reset demo" buttons.
- Safe storage wrapper: if localStorage is unavailable or contains corrupted JSON, the app falls back to in-memory seed state without crashing (unit tested). Version the persisted state; on version mismatch, reset to seed.

### 7.6 Optional live AI mode (build last, only if time remains)
`/api/ask.ts` Vercel function calling the Anthropic Messages API with model from `ANTHROPIC_MODEL` (default `claude-haiku-4-5-20251001`), system prompt grounding answers in the Northwind seed summary, max 600 tokens, 8 second timeout. Never expose the key to the client. `GET /api/ask?health=1` returns `{ ok: true }` only if the key exists. Everything works without it.

---

## 8. Docs to generate

- `README.md`: what this is, live link placeholder, screenshots, how to run, scripts, tech stack, folder structure, how the autonomy engine works (with the rule written in plain words), testing, deployment to Vercel, and the disclaimer.
- `docs/RESEARCH.md`: the research from Section 1 with links, plus the competitive table.
- `docs/PROMPT_LOG.md`: a template table (Stage, Tool, Prompt, Output used, What I rejected and why) with this build prompt summarized as the Prototype stage entry. Leave clear "Edit me" rows for other stages.
- `docs/ASSUMPTIONS.md`: every assumption made (fictional data, FX rates, pricing, customer counts, share rates).
- `docs/DECK_OUTLINE.md`: a 10-slide outline for the separate slide deck (black theme, justified body text, no em dashes). For each slide give a title, 3 to 5 lines of draft content, and which prototype screenshot to use:
  1. Cover: product name "IES Autopilot", tagline, Anubhab Chakraborty, links to prototype and research.
  2. The customer problem in D4D framing (who, trying to, blocked by, how it feels, ideal state in the customer's words) with close benchmark stats.
  3. What IES has today and the gap (agents by function, trust, developer economics) plus competitive landscape.
  4. Vision and 3 strategic pillars.
  5. Customer experience: Close Autopilot, exception detail, expert on call (screenshots).
  6. The human plus AI operating model and the Autonomy Dial (routing rule with the $40,000 example).
  7. Developer journey: discover, onboard, build, certify, publish, earn (screenshots).
  8. Business and ecosystem model: revenue streams, revenue share, illustrative GMV math, incentives for developers and advisors.
  9. Roadmap (now, next, later), prioritization rationale, LOFAs and rapid tests, KPIs with North Star "verified agent hours", risks and mitigations.
  10. How I used AI: tools per D4D stage, key prompts, what I rejected and why, next steps.
- `scripts/screenshots.mjs` (`npm run screenshots`): Playwright script that starts from a fresh demo state and saves 1440x900 PNGs of each key screen into `docs/screenshots/` for the deck.

---

## 9. Performance and quality bar

Initial JS under about 400 KB gzipped (lazy-load route chunks and recharts). Lighthouse on the production build: Performance 85 or higher, Accessibility 95 or higher, Best Practices 95 or higher. No layout shift when data appears. Skeletons only where a simulated delay exists.

---

## 10. Testing (required, edge cases included)

Scripts in `package.json`: `dev`, `build`, `preview`, `lint`, `typecheck`, `test` (Vitest run), `test:e2e` (Playwright against the production preview), `check:dashes`, `screenshots`, and `verify` = lint + typecheck + test + check:dashes + build + test:e2e. `npm run verify` must pass before you declare done.

**Unit tests (Vitest), table-driven where possible:**
- Autonomy engine: every seed item routes to its expected lane at defaults (4 / 6 / 2 counts). Boundaries: amount exactly equal to threshold is not autonomous; confidence exactly at minimum is autonomous; one bp below minimum is not. Negative amounts use absolute value. Zero amount is valid. NaN, Infinity, unknown currency, confidence 10001 or -1, unknown workflow all return ASSISTED with the data reason. L0 returns MANUAL. L1 turns every autonomous-eligible item into ASSISTED with the "Would auto-post at L2" reason. L3 lowers the minimum by 500 bps but never below 5000. Expert categories win over autonomy. Non-reversible never goes autonomous. Changing materiality to 40 bps moves FX-77 to ASSISTED (3 autonomous). Floating point safety: threshold at 50 bps of $8,000,000 is exactly 4,000,000 cents.
- FX: the seed conversions in Section 5 exactly, including 2,730.50 for BR-1050.
- Every seed proposed entry balances to zero.
- Scenario engine: 114,300 saving; runway 8 months; 1,841,095.89 release; unknown question fallback; empty input rejected; 501-character input rejected.
- Revenue share: below boundary, exactly at boundary, crossing boundary ($165,000 example), above boundary, zero, invalid inputs throw.
- Eval simulator: v1 88% (44/50) not certifiable, v2 98% certifiable, deterministic across runs.
- Validators: each rule with valid and invalid cases, including whitespace-only names, 3 decimal places, $0 with non-free model, duplicate name in different case.
- CSV export escaping (commas, quotes, newlines).
- Safe storage: corrupted JSON, missing localStorage, version mismatch.
- Close progress: resolving items marks tasks done; percentage rounding.

**Component tests (React Testing Library):** Autonomy Dial keyboard operation (arrow keys change level, aria-valuenow updates), approve action idempotency (double click creates one log entry), consent checkbox gating the install button, publish form inline errors, Ask Autopilot send button disabled on empty input.

**End-to-end (Playwright, Chromium, desktop 1440x900 plus mobile 375x812 project for the marked specs):**
1. Full guided tour from step 1 to 12 without errors; Escape exits; tour resumes after reload.
2. Approve ACR-221: progress increases, Flight Log shows exactly one new entry, buttons show resolved state.
3. Edit and approve with an unbalanced entry is blocked; balanced edit succeeds.
4. Reject requires a reason.
5. Control Tower: set accruals and all workflows to L1, preview shows 0 auto-posting; restore recommended returns to 4; materiality 40 bps shows 3.
6. Expert flow on TP-12: send, reply arrives, accept, Flight Log shows "Expert-reviewed"; cancelling before send changes nothing.
7. Reverse an auto-posted item: reversal entry created, second reverse not possible.
8. Ask Autopilot: each of the 4 intents renders an answer and chart; gibberish shows the fallback chips; empty input cannot be sent.
9. Store: search "zzz" shows empty state and clear filters works; install LedgerLoop requires consent; REV-606 appears on the Close board; uninstall removes it; Vendor Contract Reader cannot be installed.
10. Explorer: call before generating a key returns 401; after generating returns 200 and the timer freezes; period `2026-13` returns 400; unbalanced draft returns 422.
11. Studio and publish: v1 evals block submission; apply fix then v2 allows it; publish form rejects a negative price and a 2-character name; valid publish succeeds and earnings shows data.
12. Deep link reload on `/cfo/close/IC-310` works; `/cfo/close/NOPE-1` shows the in-page not-found state; `/does-not-exist` shows 404.
13. Reset demo restores seed counts (4 / 6 / 2) and 42% progress.
14. Mobile 375px: navigation drawer opens and closes; Close board, exception detail, and Store have no horizontal page scroll; tour panel does not cover primary buttons.
15. Accessibility: axe scan on Home, Brief, Close, Exception detail, Control Tower, Store, Hangar, Studio, Publish: zero serious or critical violations.
16. No console errors during any e2e spec (fail the test on `console.error` or page errors).
17. Reduced motion: with `reducedMotion: 'reduce'`, the Close page loads without the agent animation and all content is visible.

---

## 11. Build phases (tick in PLAN.md, commit after each)

1. **Scaffold**: Vite, TS strict, Tailwind, tokens, fonts, router, layout (nav rail, top bar, footer), 404, error boundary, safe storage, reset demo, check-dashes script, CLAUDE.md, PLAN.md. Acceptance: app runs, lint and typecheck pass.
2. **Domain and data**: seed data from Section 5, all pure functions from Section 6, all unit tests from Section 10 passing.
3. **Finance leader core**: Morning brief, Close Autopilot, Exception detail with all actions, Flight Log, Control Tower with the Autonomy Dial. Acceptance: e2e 2, 3, 4, 5, 7, 12, 13 pass.
4. **Expert, Ask, Store**: expert handoff, Ask Autopilot, Agent Store with install and uninstall. Acceptance: e2e 6, 8, 9 pass.
5. **Developer journey**: Hangar onboarding, Explorer, Studio, Publish, Earnings. Acceptance: e2e 10, 11 pass.
6. **Story pages and tour**: Home, Strategy, Research, Process, guided tour, command palette. Acceptance: e2e 1 passes.
7. **Hardening**: mobile, accessibility, reduced motion, console-clean, performance, visual polish pass. Take screenshots with Playwright of every main screen at 1440 and 375 widths, review them yourself, and fix anything that looks cramped, misaligned, low-contrast, or generic. Acceptance: e2e 14 to 17 pass, Lighthouse targets met on `npm run preview`.
8. **Docs and deploy prep**: README, docs files, screenshots script, `vercel.json`, `.gitignore`, `.env.example` (only `ANTHROPIC_API_KEY=` and `ANTHROPIC_MODEL=`). Acceptance: `npm run verify` passes from a clean install (`rm -rf node_modules && npm ci`).
9. **Optional**: live AI mode (7.6). Only if everything above is done.

## 12. Definition of done
- `npm run verify` passes with zero failures.
- `npm run check:dashes` finds zero em or en dashes.
- Every route in Section 7 works from navigation, from the tour, and by direct URL.
- The 12-step tour can be completed in 10 to 15 minutes by a first-time viewer.
- Finish by printing a short summary: what was built, test counts, any assumptions, anything skipped, and the exact commands to run locally and deploy.
