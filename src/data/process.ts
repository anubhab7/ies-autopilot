/**
 * The AI-boosted Design for Delight (D4D) process. The prompts are placeholders:
 * edit the text marked "Edit me" with the prompts you actually used.
 */
export interface ProcessStage {
  stage: 'Empathize' | 'Define' | 'Ideate' | 'Prototype' | 'Experiment';
  goal: string;
  tools: string[];
  keyPrompt: string;
  worked: string;
  rejected: string;
}

export const PROCESS_STAGES: ProcessStage[] = [
  {
    stage: 'Empathize',
    goal: 'Understand how mid-market finance leaders and ISVs experience IES today.',
    tools: ['Claude (research synthesis)', 'Public reviews and forums', 'Earnings calls and press releases'],
    keyPrompt:
      'Edit me: "Summarize recurring pain points of controllers at 50 to 2,500 employee multi-entity companies during month-end close. Group by theme and cite the source for each."',
    worked: 'Clustering public review themes quickly surfaced trust and intercompany pain as the top blockers.',
    rejected: 'Treating AI summaries as customer quotes. Every quote in the prototype is labelled illustrative.',
  },
  {
    stage: 'Define',
    goal: 'Frame the problem in D4D terms for both personas.',
    tools: ['Claude (problem framing)', 'Benchmarks from Ledge and APQC'],
    keyPrompt:
      'Edit me: "Write a D4D problem statement: who, trying to, blocked by, how it feels, ideal state, for a Controller closing 3 entities."',
    worked: 'Anchoring on a measurable outcome (close in 3 days, not 9) made trade-offs obvious.',
    rejected: 'A broad "make finance AI-native" framing. It could not be tested.',
  },
  {
    stage: 'Ideate',
    goal: 'Generate and stress-test concepts against the gap.',
    tools: ['Claude (divergent ideation and red-teaming)', 'Competitive teardown'],
    keyPrompt:
      'Edit me: "Generate 20 concepts for an AI-native IES. Then critique each against what IES already ships, trust, and developer economics."',
    worked: 'Red-teaming ideas against what IES already ships removed most of them fast.',
    rejected: 'See the rejected ideas below.',
  },
  {
    stage: 'Prototype',
    goal: 'Build a clickable, deterministic prototype a reviewer can finish in 12 minutes.',
    tools: ['Claude Code (build agent)', 'Vite, React, TypeScript', 'Playwright for end-to-end checks'],
    keyPrompt:
      'Summarized: a phased build prompt specifying the domain model, routing rules with exact seed data, the Autonomy Dial, trust flows, the developer journey, and a test suite with edge cases. Full prompt in BUILD_PROMPT.md.',
    worked: 'Writing exact seed values and expected lanes first let tests prove the routing rule.',
    rejected: 'A live-LLM-only demo. Answers would drift between reviewers, so the default is scripted and deterministic.',
  },
  {
    stage: 'Experiment',
    goal: 'Plan the cheapest tests for the riskiest assumptions.',
    tools: ['Claude (test design)', 'Survey and landing-page tools'],
    keyPrompt: 'Edit me: "For each leap-of-faith assumption, propose a test that runs in under 2 weeks with a clear pass metric."',
    worked: 'Pairing each assumption with a single pass metric kept experiments honest.',
    rejected: 'Building a real certification pipeline before proving developers want to earn on IES.',
  },
];

export const REJECTED_IDEAS = [
  { idea: 'Another chat copilot', why: 'IES already has one. More chat does not close the books faster.' },
  { idea: 'A generic app marketplace', why: 'One already exists. The gap is that builders do not earn and customers do not trust third-party AI.' },
  {
    idea: 'Replace accountants with AI',
    why: 'Channel conflict with the accountants who sell and support IES. Instead, advisors become builders and expert reviewers.',
  },
  { idea: 'Full autonomy by default', why: 'Trust must be earned per workflow. New agents start at L1 and move up with evidence.' },
];

export const LOFAS = [
  {
    assumption: 'Controllers will allow autonomous postings when they get evidence and guardrails.',
    test: 'Wizard-of-Oz test with 5 to 8 finance professionals using the Close Autopilot flow.',
    metric: 'Approve-without-edit rate on Autonomous-eligible items; target 80% or higher.',
  },
  {
    assumption: 'Developers will build on IES if they can earn.',
    test: 'Landing page with revenue share terms sent to existing app partners.',
    metric: 'Waitlist conversion; target 15% or higher of visitors.',
  },
  {
    assumption: 'Customers will pay for third-party agents inside IES.',
    test: 'Fake-door install buttons in the Agent Store plus a Van Westendorp price survey.',
    metric: 'Install click-through and acceptable price range per agent type.',
  },
  {
    assumption: 'Automated evaluations can certify accuracy well enough to back Intuit Assured.',
    test: 'Run 3 partner agents through the eval suite and compare with human review of the same cases.',
    metric: 'Agreement between eval verdicts and human reviewers; target 95% or higher.',
  },
];
