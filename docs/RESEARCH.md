# Research

What already exists as of September 2026, the gaps IES Autopilot attacks, and the competitive landscape. The same content appears on the `/research` page of the prototype.

## What already exists

- **IES ships seven first-party AI agents**: Finance, Accounting, Project Management, Payments, Customer, Payroll, and Sales Tax. Source: [Peak Advisers](https://peakadvisers.com/blog/intuit-enterprise-suite-ai-agents/)
- **Intuit and Anthropic partnership (February 2026)** lets businesses build custom agents on Intuit's platform. Source: [Intuit press release](https://investors.intuit.com/news-events/press-releases/detail/1305/intuit-and-anthropic-partner-to-bring-trusted-financial-intelligence-and-custom-ai-agents-to-consumers-and-businesses)
- **75% of IES customers use its AI agents monthly** (August 2026 earnings). Source: [PYMNTS](https://www.pymnts.com/earnings/2026/intuit-says-75-of-enterprise-customers-deploy-ai-agents-monthly/)
- **Intuit App Partner Program pricing**: free Builder tier with capped read calls; paid tiers of $300, $1,700, and $4,500 per month; Marketplace security review estimated at up to 30 business days. Sources: [Vorplabs](https://vorplabs.com/agent-tools/quickbooks-online-api), [Intuit App Partners](https://intuitapppartners.com/)

## Competitors

- **NetSuite 2026.1** exposes ERP data to Claude and ChatGPT through MCP and lets partners monetize AI SuiteApps. [Source](https://www.netsuite.com/portal/resource/articles/cloud-saas/suitecloud-platform-delivers-ai-native-development-expanded-rest-apis-and-next-generation-extensibility-in-netsuite-2026-1.shtml)
- **Workday** runs an Agent Partner Network and an Agent System of Record. [Source](https://newsroom.workday.com/2025-06-03-Workday-Announces-New-AI-Agent-Partner-Network-and-Agent-Gateway-to-Power-the-Next-Generation-of-Human-and-Digital-Workforces)
- **AI-native ERPs** are well funded, for example Rillet at a $1B valuation in August 2026. [Source](https://sacra.com/c/rillet/)

## Close pain

- Only 18% of finance teams close in 3 business days or fewer; 50% take 6 or more. [Ledge](https://ledge.co/content/month-end-close-benchmarks-for-2025)
- The APQC median is about 6.4 calendar days; the bottom quartile takes 10 or more. [TRG International](https://trginternational.com/blog/hidden-costs-slow-month-end-close-solution/)

## The gap

1. Agents are organized by function, but a CFO thinks in outcomes ("close 3 entities in 3 days").
2. Trust is the blocker to autonomy: finance leaders need evidence, limits, an audit trail, undo, and a human expert on call.
3. Developer economics point the wrong way: developers mostly pay the platform to read data. A platform grows when builders earn.

## Competitive comparison

| Capability | IES Autopilot | NetSuite | Workday | AI-native ERPs |
|---|---|---|---|---|
| Outcome autopilots | Strong: multi-entity close as one outcome | Partial: feature-level AI | Partial: role-based agents | Strong: automation-first close |
| Trust controls | Strong: Autonomy Dial, guardrails, Flight Log, reversal | Partial: standard ERP controls | Strong: Agent System of Record | Partial: varies by vendor |
| Human expert network | Strong: one-click CPA handoff with context packet | Missing: partner services, separate | Missing: partner services, separate | Partial: some bundle services |
| Developer earnings model | Strong: 80% to 85% revenue share | Strong: monetized AI SuiteApps | Partial: partner network | Missing: closed platforms |
| Certification speed | Strong: about 3 business days, automated evals | Partial: SuiteApp review | Partial: partner onboarding | Missing: no marketplace |
| Mid-market fit | Strong: built on QuickBooks familiarity | Partial: heavier implementation | Missing: enterprise focus | Partial: early, fast-moving |

Ratings are a judgment call based on public announcements, not a feature audit.

## Voice of the customer

Illustrative, synthesized from public review themes. These are not real quotes.

- **I cannot hand over what I cannot see.** "If an agent books something, I need to see why, and I need to undo it in one click."
- **The close is a relay race, not a task list.** "Every entity waits on intercompany. One mismatch holds up consolidation for two days."
- **I want my CPA on speed dial, not a ticket queue.** "The hard calls are transfer pricing and tax. I want an expert who already has the context."
- **Builders want customers, not fees.** "We would build for IES tomorrow if the store sent us revenue instead of an invoice."
