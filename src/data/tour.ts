/** The 12-step guided tour. Each step deep-links to a route and spotlights a data-tour target. */
export interface TourStep {
  route: string;
  target: string;
  title: string;
  body: string;
  matches?: (path: string) => boolean;
}

export const TOUR_STEPS: TourStep[] = [
  {
    route: '/',
    target: 'home-hero',
    title: 'IES Autopilot in one screen',
    body: 'An AI crew that runs finance outcomes, with a human expert on call. Turn the mini dial to feel the core idea: you choose how much flies itself.',
  },
  {
    route: '/cfo/brief',
    target: 'brief-progress',
    title: 'Maya’s morning brief',
    body: 'Maya is Controller at Northwind (3 entities). Overnight, agents auto-posted routine entries. Six items need her, two are with experts.',
  },
  {
    route: '/cfo/close',
    target: 'lane-board',
    title: 'Close Autopilot: one outcome, four lanes',
    body: 'Every close item is routed to Autonomous, Assisted, Expert, or Manual. Each lane has an icon and label, not just a color.',
  },
  {
    route: '/cfo/close/IC-310',
    target: 'why-lane',
    title: 'Why this lane',
    body: 'IC-310 is $120,000, above the $40,000 limit, so it waits for Maya. Every check is shown in plain words, with evidence and a balanced draft.',
  },
  {
    route: '/cfo/autonomy',
    target: 'autonomy-dial',
    title: 'The Autonomy Dial',
    body: 'Turn a workflow from L0 (manual) to L3. Move the materiality slider and watch the preview: at 0.4%, FX-77 stops auto-posting.',
  },
  {
    route: '/cfo/experts/new-TP-12',
    target: 'expert-packet',
    title: 'Expert on call',
    body: 'Transfer pricing always goes to a CPA. Autopilot assembles the context packet, recommends Priya, and shows the cost before you send.',
    matches: (path) => path.startsWith('/cfo/experts/'),
  },
  {
    route: '/cfo/ask',
    target: 'ask-revenue',
    title: 'Ask Autopilot',
    body: 'Click "What if revenue drops 15%?". Answers are computed from the ledger with assumptions and a chart: 8 months of runway.',
  },
  {
    route: '/cfo/store/ledgerloop-revrec',
    target: 'install-agent',
    title: 'Agent Store',
    body: 'Certified partner agents come with an accuracy scorecard and Intuit Assured. Install LedgerLoop: consent is explicit and it starts at L1.',
  },
  {
    route: '/cfo/flight-log',
    target: 'flight-log-table',
    title: 'Flight Log',
    body: 'Every agent, human, and expert action, with confidence and lane. Reverse any posted entry; reversals are linked and cannot repeat.',
  },
  {
    route: '/dev',
    target: 'hangar-stepper',
    title: 'The Hangar, for developers',
    body: 'Sam builds agents for mid-market finance. Four steps to a first API call on a synthetic Northwind sandbox, with a timer.',
  },
  {
    route: '/dev/studio',
    target: 'run-evals',
    title: 'Agent Studio and evaluations',
    body: 'Run 50 automated cases. v1 scores 88% and cannot be certified. Apply the suggested fix and v2 reaches 98%.',
  },
  {
    route: '/dev/publish',
    target: 'publish-form',
    title: 'Publish and earn',
    body: 'Certification in about 3 business days, not 30. Developers keep 80% of revenue, 85% after $1M. That is the flywheel.',
  },
];

