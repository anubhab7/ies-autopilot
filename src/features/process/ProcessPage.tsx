import { Chip, PageHeader, Panel, PanelHeader } from '@/components/ui';
import { LOFAS, PROCESS_STAGES, REJECTED_IDEAS } from '@/data/process';

export default function ProcessPage() {
  return (
    <div>
      <PageHeader
        title="Process"
        description="How AI boosted each stage of Intuit's Design for Delight: tools, key prompts, what worked, and what I rejected."
      />

      <ol className="space-y-4">
        {PROCESS_STAGES.map((s, i) => (
          <li key={s.stage}>
            <Panel>
              <PanelHeader
                title={
                  <span>
                    <span className="tnum mr-2 text-muted">{i + 1}</span>
                    {s.stage}
                  </span>
                }
                description={s.goal}
              />
              <div className="grid gap-5 p-5 lg:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xs text-muted">Tools</h3>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {s.tools.map((t) => (
                        <li key={t}>
                          <Chip>{t}</Chip>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="flex items-center gap-2 text-xs text-muted">
                      Key prompt
                      {s.keyPrompt.startsWith('Edit me') ? (
                        <Chip className="border-lane-assist/50 text-lane-assist">Placeholder</Chip>
                      ) : null}
                    </h3>
                    <p className="mt-1.5 rounded-chip border border-hairline bg-bg p-3 font-mono text-xs leading-relaxed">
                      {s.keyPrompt}
                    </p>
                  </div>
                </div>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted">What worked</dt>
                    <dd className="mt-1">{s.worked}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">What I rejected and why</dt>
                    <dd className="mt-1">{s.rejected}</dd>
                  </div>
                </dl>
              </div>
            </Panel>
          </li>
        ))}
      </ol>

      <section className="mt-10" aria-labelledby="rejected-heading">
        <h2 id="rejected-heading" className="text-xl font-strong">
          Ideas I rejected
        </h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {REJECTED_IDEAS.map((r) => (
            <li key={r.idea}>
              <Panel className="h-full p-5">
                <h3 className="text-base font-strong">{r.idea}</h3>
                <p className="mt-1 text-sm text-muted">{r.why}</p>
              </Panel>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="lofa-heading">
        <h2 id="lofa-heading" className="text-xl font-strong">
          Riskiest assumptions and rapid tests
        </h2>
        <Panel className="mt-4">
          <div className="overflow-x-auto" role="region" aria-label="Leap of faith assumptions table" tabIndex={0}>
            <table className="w-full min-w-[760px] text-sm">
              <caption className="sr-only">Leap-of-faith assumptions with rapid tests and pass metrics</caption>
              <thead>
                <tr className="border-b border-hairline text-left text-xs text-muted">
                  <th scope="col" className="px-5 py-2.5 font-medium">#</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Assumption</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Rapid test</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Pass metric</th>
                </tr>
              </thead>
              <tbody>
                {LOFAS.map((l, i) => (
                  <tr key={l.assumption} className="border-b border-hairline/60 align-top last:border-0">
                    <td className="tnum px-5 py-3 text-muted">{i + 1}</td>
                    <td className="px-3 py-3">{l.assumption}</td>
                    <td className="px-3 py-3 text-muted">{l.test}</td>
                    <td className="px-5 py-3 text-muted">{l.metric}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>
    </div>
  );
}
