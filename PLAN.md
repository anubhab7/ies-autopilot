# Build plan

Tick a phase only when its acceptance criteria pass. Commit after each phase.

- [x] 1. Scaffold: Vite, TS strict, Tailwind, tokens, fonts, router, layout (nav rail, top bar, footer), 404, error boundary, safe storage, reset demo, check-dashes script. Acceptance: app runs, lint and typecheck pass.
- [x] 2. Domain and data: seed data, all pure functions, all unit tests passing.
- [x] 3. Finance leader core: Morning brief, Close Autopilot, Exception detail with all actions, Flight Log, Control Tower with the Autonomy Dial. Acceptance: e2e 2, 3, 4, 5, 7, 12, 13 pass.
- [x] 4. Expert, Ask, Store: expert handoff, Ask Autopilot, Agent Store with install and uninstall. Acceptance: e2e 6, 8, 9 pass.
- [x] 5. Developer journey: Hangar onboarding, Explorer, Studio, Publish, Earnings. Acceptance: e2e 10, 11 pass.
- [x] 6. Story pages and tour: Home, Strategy, Research, Process, guided tour, command palette. Acceptance: e2e 1 passes.
- [x] 7. Hardening: mobile, accessibility, reduced motion, console-clean, performance, visual polish. Acceptance: e2e 14 to 17 pass, Lighthouse targets met.
- [ ] 8. Docs and deploy prep: README, docs, screenshots script, vercel.json, .gitignore, .env.example. Acceptance: `npm run verify` passes from a clean install.
- [ ] 9. Optional: live AI mode.
