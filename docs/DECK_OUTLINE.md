# Deck outline (10 slides)

Format: black theme, justified body text, no em dashes. Screenshots come from `npm run screenshots` (files in `docs/screenshots/`).

## 1. Cover

- IES Autopilot
- Your finance team's AI crew, with a human expert always on call.
- Prototype: https://ies-autopilot.b26015.workers.dev/ Research: https://ies-autopilot.b26015.workers.dev/research LinkedIn: https://www.linkedin.com/in/anubhab-chakraborty/
- Screenshot: `01-home.png`

## 2. The customer problem (D4D framing)

- Who: a Controller at a 420-person, 3-entity company (US, Canada, UK).
- Trying to: close the books fast and accurately every month.
- Blocked by: intercompany mismatches, manual reconciliations, and agents she cannot fully trust.
- How it feels: "I am the bottleneck, and I still cannot hand work to AI I cannot see or undo."
- Ideal state, in her words: "Close in 3 days, and only look at what truly needs me." Only 18% of teams close in 3 days or fewer; 50% take 6 or more (Ledge). APQC median is about 6.4 days.
- Screenshot: `02-morning-brief.png`

## 3. What IES has today, and the gap

- IES ships 7 function-level agents; 75% of customers use them monthly; Intuit and Anthropic partner on custom agents.
- Gap 1: agents are organized by function, but CFOs think in outcomes.
- Gap 2: trust blocks autonomy: evidence, limits, audit trail, undo, and an expert on call are missing.
- Gap 3: developers pay to read data and wait up to 30 days for review. NetSuite, Workday, and AI-native ERPs are opening up fast.
- Screenshot: `17-research.png`

## 4. Vision and three pillars

- Vision: every mid-market finance team gets an AI crew that runs outcomes end to end, an expert on call, and an ecosystem of certified agents.
- Pillar 1: Outcome Autopilots, not feature agents.
- Pillar 2: Trust by design: evidence, guardrails, reversibility, expert escalation.
- Pillar 3: An ecosystem where builders earn: AI-ready APIs, hosted MCP, sandbox, certification in days, 80% to 85% revenue share.
- Screenshot: `16-strategy.png`

## 5. Customer experience

- Close Autopilot: one board, four lanes, a checklist per entity, and a 9-day to 3-day timeline.
- Exception detail: evidence, reasoning, a balanced draft, and "Why this lane" in plain words.
- Expert on call: context packet assembled automatically; Priya Raman replies with a recommended entry; accepting logs it as Expert-reviewed.
- Screenshots: `03-close-autopilot.png`, `04-exception-ic-310.png`, `07-expert-reply.png`

## 6. The human plus AI operating model and the Autonomy Dial

- Rule: an agent posts on its own only when confidence meets the minimum, the amount is strictly below the materiality limit, and the entry is reversible.
- Example: materiality 0.5% of $8,000,000 = $40,000. FX-77 ($38,100) auto-posts; DEP-5 (exactly $40,000) and FX-78 ($43,800) wait for Maya.
- Expert-only categories (transfer pricing, tax positions, audit adjustments, new entities) always go to a CPA.
- The dial moves each workflow from L0 (manual) to L3; the preview shows what changes before anything posts.
- Screenshot: `05-control-tower.png`

## 7. Developer journey

- Discover and onboard: Hangar workspace, synthetic Northwind sandbox, sandbox key, and a time-to-first-call timer.
- Build: TypeScript SDK or no-code for accountants; REST and hosted MCP tools that read and draft, never post.
- Certify: 50 automated evaluation cases; v1 scores 88%, the suggested fix gets v2 to 98%, above the 95% bar.
- Publish and earn: live in about 3 business days; developers keep 80%, 85% after $1M.
- Screenshots: `12-hangar.png`, `14-studio-evals.png`, `15-publish.png`

## 8. Business and ecosystem model

- Revenue streams: Autopilot tier (outcome priced), expert session fees, Agent Store take rate.
- Revenue share: 80% to developers up to $1M lifetime gross, 85% above.
- Illustrative GMV = N x a x k x p x 12 = 8,000 x 25% x 2 x $250 x 12 = $12,000,000; Intuit revenue at 20% = $2,400,000 (all assumptions).
- Incentives: free sandbox and reads, fast certification, advisors earn as no-code builders and expert reviewers.
- Screenshot: `10-agent-detail-ledgerloop.png`

## 9. Roadmap, prioritization, experiments, KPIs, risks

- Now (0 to 6 months): Close Autopilot, dial, Flight Log, expert pilot, sandbox and MCP. Next (6 to 18): Agent Store, no-code studio, Intuit Assured. Later (18 to 36): benchmarks, outcome pricing, agent-to-agent commerce.
- Why this order: prove trust on the close before third-party agents can act.
- Riskiest assumptions and rapid tests: Wizard-of-Oz autonomy test, revenue-share landing page, fake-door installs with Van Westendorp, eval versus human review.
- North Star: verified agent hours. Also days to close, approve-without-edit rate, reversal rate, developer earnings.
- Risks: auto-post errors, accountant channel conflict, low-quality agents, privacy; each with a mitigation.
- Screenshot: `11-flight-log.png`

## 10. How I used AI

- Empathize and Define: research synthesis and problem framing (see `docs/PROMPT_LOG.md`).
- Ideate: generated and red-teamed concepts; rejected another copilot, a generic marketplace, replacing accountants, and full autonomy by default.
- Prototype: built with Claude Code from a phased build prompt with exact seed data and a test suite.
- Next steps: run the four rapid tests, interview 8 controllers, and pilot with 3 partner agents.
- Screenshot: `18-process.png`
