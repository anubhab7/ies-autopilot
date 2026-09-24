export interface Insight {
  title: string;
  finding: string;
  implication: string;
  source: { label: string; url: string };
}

export const INSIGHTS: Insight[] = [
  {
    title: 'IES already has seven function-level agents',
    finding:
      'Intuit Enterprise Suite ships Finance, Accounting, Project Management, Payments, Customer, Payroll, and Sales Tax agents.',
    implication: 'Another agent is not the gap. Orchestrating them around an outcome, like a 3-day close, is.',
    source: { label: 'Peak Advisers, IES AI agents', url: 'https://peakadvisers.com/blog/intuit-enterprise-suite-ai-agents/' },
  },
  {
    title: 'Adoption is already high',
    finding: 'Intuit reported that 75% of IES customers use its AI agents monthly (August 2026 earnings).',
    implication: 'Customers are past curiosity. The next unlock is trusting agents to act, not just suggest.',
    source: {
      label: 'PYMNTS, Intuit earnings',
      url: 'https://www.pymnts.com/earnings/2026/intuit-says-75-of-enterprise-customers-deploy-ai-agents-monthly/',
    },
  },
  {
    title: 'Custom agents are now possible on Intuit',
    finding: 'Intuit and Anthropic announced a partnership (February 2026) so businesses can build custom agents on Intuit.',
    implication: 'The building blocks exist. What is missing is a trust layer and an economic reason for builders to show up.',
    source: {
      label: 'Intuit press release',
      url: 'https://investors.intuit.com/news-events/press-releases/detail/1305/intuit-and-anthropic-partner-to-bring-trusted-financial-intelligence-and-custom-ai-agents-to-consumers-and-businesses',
    },
  },
  {
    title: 'Developer economics point the wrong way',
    finding:
      'The Intuit App Partner Program has a free Builder tier with capped reads and paid tiers of $300, $1,700, and $4,500 per month. Marketplace security review can take up to 30 business days.',
    implication: 'Builders pay to read data and wait weeks to ship. A platform grows when builders earn and ship in days.',
    source: { label: 'Intuit App Partner Program', url: 'https://intuitapppartners.com/' },
  },
  {
    title: 'The close is still slow',
    finding:
      'Only 18% of finance teams close in 3 business days or fewer and 50% take 6 or more. The APQC median is about 6.4 calendar days; the bottom quartile takes 10 or more.',
    implication: 'Close speed is a measurable, felt outcome that a CFO will pay to improve.',
    source: { label: 'Ledge, close benchmarks', url: 'https://ledge.co/content/month-end-close-benchmarks-for-2025' },
  },
  {
    title: 'Competitors are opening their platforms to AI',
    finding:
      'NetSuite 2026.1 exposes ERP data to Claude and ChatGPT through MCP and lets partners monetize AI SuiteApps. Workday runs an Agent Partner Network and an Agent System of Record. AI-native ERPs such as Rillet reached a $1B valuation.',
    implication: 'Open AI access is becoming table stakes. Trust and builder economics are where IES can lead.',
    source: {
      label: 'NetSuite 2026.1',
      url: 'https://www.netsuite.com/portal/resource/articles/cloud-saas/suitecloud-platform-delivers-ai-native-development-expanded-rest-apis-and-next-generation-extensibility-in-netsuite-2026-1.shtml',
    },
  },
];

export const EXTRA_SOURCES = [
  { label: 'Vorplabs, QuickBooks Online API pricing', url: 'https://vorplabs.com/agent-tools/quickbooks-online-api' },
  {
    label: 'Workday Agent Partner Network',
    url: 'https://newsroom.workday.com/2025-06-03-Workday-Announces-New-AI-Agent-Partner-Network-and-Agent-Gateway-to-Power-the-Next-Generation-of-Human-and-Digital-Workforces',
  },
  { label: 'Sacra, Rillet', url: 'https://sacra.com/c/rillet/' },
  { label: 'TRG International, hidden costs of a slow close', url: 'https://trginternational.com/blog/hidden-costs-slow-month-end-close-solution/' },
];

export type Support = 'yes' | 'partial' | 'no';

export const COMPETITORS = ['IES Autopilot', 'NetSuite', 'Workday', 'AI-native ERPs'] as const;

export const COMPARISON: Array<{ capability: string; values: Array<{ level: Support; note: string }> }> = [
  {
    capability: 'Outcome autopilots',
    values: [
      { level: 'yes', note: 'Multi-entity close as one outcome' },
      { level: 'partial', note: 'Feature-level AI' },
      { level: 'partial', note: 'Role-based agents' },
      { level: 'yes', note: 'Automation-first close' },
    ],
  },
  {
    capability: 'Trust controls',
    values: [
      { level: 'yes', note: 'Autonomy Dial, guardrails, Flight Log, reversal' },
      { level: 'partial', note: 'Standard ERP controls' },
      { level: 'yes', note: 'Agent System of Record' },
      { level: 'partial', note: 'Varies by vendor' },
    ],
  },
  {
    capability: 'Human expert network',
    values: [
      { level: 'yes', note: 'One-click CPA handoff with context packet' },
      { level: 'no', note: 'Partner services, separate' },
      { level: 'no', note: 'Partner services, separate' },
      { level: 'partial', note: 'Some bundle services' },
    ],
  },
  {
    capability: 'Developer earnings model',
    values: [
      { level: 'yes', note: '80% to 85% revenue share' },
      { level: 'yes', note: 'Monetized AI SuiteApps' },
      { level: 'partial', note: 'Partner network' },
      { level: 'no', note: 'Closed platforms' },
    ],
  },
  {
    capability: 'Certification speed',
    values: [
      { level: 'yes', note: 'About 3 business days, automated evals' },
      { level: 'partial', note: 'SuiteApp review' },
      { level: 'partial', note: 'Partner onboarding' },
      { level: 'no', note: 'No marketplace' },
    ],
  },
  {
    capability: 'Mid-market fit',
    values: [
      { level: 'yes', note: 'Built on QuickBooks familiarity' },
      { level: 'partial', note: 'Heavier implementation' },
      { level: 'no', note: 'Enterprise focus' },
      { level: 'partial', note: 'Early, fast-moving' },
    ],
  },
];

export const VOC_THEMES = [
  {
    theme: 'I cannot hand over what I cannot see',
    quote: 'If an agent books something, I need to see why, and I need to undo it in one click.',
    who: 'Controller, multi-entity distributor',
  },
  {
    theme: 'The close is a relay race, not a task list',
    quote: 'Every entity waits on intercompany. One mismatch holds up consolidation for two days.',
    who: 'CFO, outdoor retail group',
  },
  {
    theme: 'I want my CPA on speed dial, not a ticket queue',
    quote: 'The hard calls are transfer pricing and tax. I want an expert who already has the context.',
    who: 'VP Finance, manufacturing',
  },
  {
    theme: 'Builders want customers, not fees',
    quote: 'We would build for IES tomorrow if the store sent us revenue instead of an invoice.',
    who: 'Founder, finance automation startup',
  },
];
