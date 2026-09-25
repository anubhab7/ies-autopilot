# IES Autopilot prototype: working notes for Claude

The full specification lives in `BUILD_PROMPT.md`. Progress lives in `PLAN.md`: resume from the first unticked phase. Record every assumption in `docs/ASSUMPTIONS.md`.

## Hard rules

1. Never use the em dash (U+2014) or the en dash (U+2013) anywhere: UI copy, code comments, markdown, test names, commit messages, JSON data. Use commas, colons, parentheses, or the word "to" for ranges (for example "3 to 5 days"). `npm run check:dashes` scans the repo (excluding node_modules, dist, .git, playwright-report, test-results) and fails if either character is found. It runs inside `npm run verify`.
2. All company, people, and partner data is fictional. No Intuit logo or any real company logo. Use the text wordmark "IES Autopilot". Every page shows the footer: "Concept prototype by Anubhab Chakraborty for the Intuit PM Intern case. Not affiliated with or endorsed by Intuit. All data is fictional."
3. Deterministic demo: fixed demo clock `DEMO_NOW = 2026-10-02T09:00:00` (business day 2 of the September 2026 close). No `Math.random()` in rendered data; use the seeded PRNG in `src/lib/prng.ts`.
4. Money is stored and computed in integer cents. Ratios (materiality, confidence thresholds, revenue shares) are integer basis points. Format to decimals only at display time.
5. Accessibility: semantic HTML, visible focus rings, keyboard reachable, aria labels on icon buttons, color never the only signal (lanes have icon plus text label), WCAG AA contrast, respect `prefers-reduced-motion`.
6. Responsive from 375px to 1920px. No horizontal page scroll at 375px; wide tables scroll inside their own container.
7. UI copy: sentence case, plain verbs, a button says exactly what it does and the toast uses the same verb ("Approve entry" then "Entry approved"). No ALL CAPS labels, no arrows appended to button text, no lorem ipsum. Errors say what happened and how to fix it. Empty states invite an action.
8. No console errors or React warnings in normal use. TypeScript strict. No `any` unless justified in a comment.
9. Works with zero environment variables. Live AI mode is off unless `ANTHROPIC_API_KEY` exists on the server.

## Design tokens ("Night cockpit", dark only)

- `--bg` #0D1524, `--surface` #131D30, `--raised` #1A2740, `--hairline` #25354F
- `--text` #E6EDF7, `--muted` #8FA3BF
- `--action` #4C8DFF (primary buttons, links, focus ring)
- Lanes (always with icon and label): Autonomous `--lane-auto` #2DD4BF (plane), Assisted `--lane-assist` #F5B544 (user-check), Expert `--lane-expert` #A78BFA (headset), Manual `--lane-manual` #94A3B8 (pencil)
- Status: success #34D399, danger #F87171
- Type: Instrument Sans Variable, scale 12 / 14 / 16 / 20 / 24 / 32 / 44 px, weights 400 / 500 / 650, tabular numerals for figures.
- Radius: 6px inputs and chips, 10px panels, 16px dialogs only. Borders over shadows. Content max width 1280px.
- Motion: one orchestrated moment on Close Autopilot load (about 1.5s, skippable, off under reduced motion). Other motion only responds to user actions.

## Commands

- `npm run dev`: dev server
- `npm run build` / `npm run preview`
- `npm run lint`, `npm run typecheck`
- `npm test`: Vitest unit and component tests
- `npm run test:e2e`: Playwright against the production preview
- `npm run check:dashes`: fails on em or en dashes
- `npm run screenshots`: deck screenshots into `docs/screenshots/`
- `npm run verify`: lint + typecheck + test + check:dashes + build + test:e2e (must pass before done)
