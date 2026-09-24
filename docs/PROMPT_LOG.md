# Prompt log

How AI was used at each Design for Delight stage. Rows marked "Edit me" are placeholders to replace with the prompts actually used.

| Stage | Tool | Prompt | Output used | What I rejected and why |
|---|---|---|---|---|
| Empathize | Edit me | Edit me: the prompt used to synthesize controller and ISV pain points from public sources | Edit me | Edit me |
| Define | Edit me | Edit me: the prompt used to write the D4D problem statement (who, trying to, blocked by, how it feels, ideal state) | Edit me | Edit me |
| Ideate | Edit me | Edit me: the prompt used to generate and red-team concepts against what IES already ships | Edit me | Rejected: another chat copilot, a generic app marketplace, replacing accountants with AI, full autonomy by default (reasons on the `/process` page) |
| Prototype | Claude Code | Summary of `BUILD_PROMPT.md`: build a deployable, deterministic React prototype called IES Autopilot in 9 phases. It specifies the case context and research, hard rules (no em or en dashes, fictional data, fixed demo clock, integer cents and basis points, accessibility, responsive layout), the "Night cockpit" design system, exact seed data with expected routing lanes, pure domain functions (autonomy engine, FX, scenarios, revenue share, eval simulator, validators), every screen and flow for both personas, a 12-step guided tour, docs, and a unit, component, and end-to-end test plan that must pass through `npm run verify`. | The full application in this repo: routing engine and tests, Close Autopilot, Control Tower, Flight Log, expert handoff, Ask Autopilot, Agent Store, Hangar, Agent Studio, Publish, Earnings, story pages, tour, docs | A live-LLM-only Ask experience (answers would drift between reviewers, so scripted answers are the default and live mode is optional). Letting partner agents post directly (the only write scope is drafting). |
| Experiment | Edit me | Edit me: the prompt used to design rapid tests for the four leap-of-faith assumptions | Edit me | Edit me |
