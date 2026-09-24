import { Code2, Compass, Headset, Plane, ScrollText, Search, Target, UserCheck, NotebookPen } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AutonomyDial } from '@/components/AutonomyDial';
import { CloseTimeline } from '@/components/CloseTimeline';
import { TOUR_STEPS } from '@/data/tour';
import { Button, Panel } from '@/components/ui';
import { CLOSE_ITEMS } from '@/data/closeItems';
import { countLanes, DEFAULT_POLICY, LEVEL_INFO, routeItem } from '@/domain/autonomyEngine';
import { WORKFLOWS, type Level, type Levels } from '@/domain/types';
import { useDemo } from '@/store/demoStore';

const CONCEPTS = [
  { icon: Plane, name: 'Autopilot', text: 'Outcome-level workflows run by a crew of agents, starting with the multi-entity close.' },
  { icon: UserCheck, name: 'Autonomy Dial', text: 'Per-workflow levels L0 to L3 with materiality and confidence guardrails.' },
  { icon: Headset, name: 'Expert on call', text: 'One click hands an exception to a vetted CPA with the context already assembled.' },
  { icon: ScrollText, name: 'Flight Log', text: 'An immutable trail of every agent, human, and expert action, with reversal.' },
  { icon: Code2, name: 'Hangar and Agent Store', text: 'Developers and advisors build, certify in days, and earn 80% to 85%.' },
];

function MiniDial() {
  const [level, setLevel] = useState<Level>('L2');
  const auto = useMemo(() => {
    const levels = Object.fromEntries(WORKFLOWS.map((w) => [w, level])) as Levels;
    return countLanes(CLOSE_ITEMS.map((i) => routeItem(i, DEFAULT_POLICY, levels))).AUTONOMOUS;
  }, [level]);
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-6">
      <AutonomyDial value={level} onChange={setLevel} label="Try the Autonomy Dial" size={168} />
      <div className="text-center sm:text-left" aria-live="polite">
        <div className="text-sm text-muted">
          {level}: {LEVEL_INFO[level].name}
        </div>
        <div className="tnum mt-1 text-3xl font-medium" data-testid="mini-dial-count">
          {auto} of {CLOSE_ITEMS.length}
        </div>
        <div className="text-sm text-muted">close items would auto-post</div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const startTour = useDemo((s) => s.startTour);
  const navigate = useNavigate();

  const start = (step: number) => {
    startTour(step);
    navigate(TOUR_STEPS[step].route);
  };

  return (
    <div>
      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]" data-tour="home-hero">
        <div>
          <p className="text-sm text-muted">A concept for Intuit Enterprise Suite</p>
          <h1 className="mt-2 text-4xl font-strong tracking-tight">IES Autopilot</h1>
          <p className="mt-3 text-xl">Your finance team's AI crew, with a human expert always on call.</p>
          <p className="prose-measure mt-3 text-base text-muted">
            Autopilot turns IES from a suite of function-level agents into a platform that runs finance outcomes, like a
            3-day multi-entity close, with trust built in and an ecosystem where builders earn.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => start(0)} data-testid="start-tour">
              <Compass size={16} aria-hidden />
              Start the 12 minute guided tour
            </Button>
            <Button variant="secondary" onClick={() => start(1)}>
              Tour as a finance leader
            </Button>
            <Button variant="secondary" onClick={() => start(9)}>
              Tour as a developer
            </Button>
          </div>
          <nav aria-label="The case" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link to="/strategy" className="inline-flex items-center gap-1.5 text-action hover:underline">
              <Target size={15} aria-hidden /> Strategy
            </Link>
            <Link to="/research" className="inline-flex items-center gap-1.5 text-action hover:underline">
              <Search size={15} aria-hidden /> Research
            </Link>
            <Link to="/process" className="inline-flex items-center gap-1.5 text-action hover:underline">
              <NotebookPen size={15} aria-hidden /> Process
            </Link>
          </nav>
        </div>
        <Panel className="space-y-6 p-5 sm:p-6">
          <MiniDial />
          <div className="border-t border-hairline pt-5">
            <CloseTimeline compact />
            <p className="mt-3 text-sm text-muted">
              Northwind closed September in 9 business days. With Autopilot the target is 3.
            </p>
          </div>
        </Panel>
      </section>

      <section className="mt-12" aria-labelledby="concepts-heading">
        <h2 id="concepts-heading" className="text-xl font-strong">
          The flight deck
        </h2>
        <ul className="mt-4 grid gap-px overflow-hidden rounded-panel border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-5">
          {CONCEPTS.map((c) => (
            <li key={c.name} className="bg-surface p-4">
              <c.icon size={18} className="text-action" aria-hidden />
              <h3 className="mt-2 text-sm font-strong">{c.name}</h3>
              <p className="mt-1 text-sm text-muted">{c.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2" aria-label="Choose a path">
        <Panel className="p-5">
          <h2 className="text-base font-strong">Maya Chen, Controller</h2>
          <p className="mt-1 text-sm text-muted">
            Closes three entities (US, Canada, UK) for Northwind Outdoor Co. Wants a 3-day close without losing control.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => start(1)}>
              Tour as a finance leader
            </Button>
            <Link to="/cfo/brief" className="inline-flex h-8 items-center text-sm text-action hover:underline">
              Open the morning brief
            </Link>
          </div>
        </Panel>
        <Panel className="p-5">
          <h2 className="text-base font-strong">Sam Okafor, founder of Rebatewise</h2>
          <p className="mt-1 text-sm text-muted">
            Builds a rebate accrual agent. Wants a first call in minutes, certification in days, and real revenue.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => start(9)}>
              Tour as a developer
            </Button>
            <Link to="/dev" className="inline-flex h-8 items-center text-sm text-action hover:underline">
              Open the Hangar
            </Link>
          </div>
        </Panel>
      </section>
    </div>
  );
}
