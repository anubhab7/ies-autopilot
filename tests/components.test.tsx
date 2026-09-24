import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AutonomyDial } from '@/components/AutonomyDial';
import { findAgent } from '@/data/agents';
import type { Level } from '@/domain/types';
import { ConsentDialog } from '@/features/cfo/AgentDetailPage';
import AskPage from '@/features/cfo/AskPage';
import ExceptionDetailPage from '@/features/cfo/ExceptionDetailPage';
import { useDemo } from '@/store/demoStore';

function renderAt(path: string, pattern: string, element: ReactElement) {
  return render(
    <TooltipPrimitive.Provider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={pattern} element={element} />
        </Routes>
      </MemoryRouter>
    </TooltipPrimitive.Provider>,
  );
}

beforeEach(() => {
  useDemo.getState().resetDemo();
});

describe('AutonomyDial', () => {
  function Harness() {
    const [level, setLevel] = useState<Level>('L2');
    return <AutonomyDial value={level} onChange={setLevel} label="Autonomy level" />;
  }

  it('changes level with arrow, Home, and End keys', () => {
    render(<Harness />);
    const dial = screen.getByRole('slider', { name: 'Autonomy level' });
    expect(dial).toHaveAttribute('aria-valuenow', '2');
    fireEvent.keyDown(dial, { key: 'ArrowRight' });
    expect(dial).toHaveAttribute('aria-valuenow', '3');
    fireEvent.keyDown(dial, { key: 'ArrowRight' });
    expect(dial).toHaveAttribute('aria-valuenow', '3');
    fireEvent.keyDown(dial, { key: 'ArrowLeft' });
    fireEvent.keyDown(dial, { key: 'ArrowDown' });
    expect(dial).toHaveAttribute('aria-valuenow', '1');
    expect(dial).toHaveAttribute('aria-valuetext', 'L1, Assist');
    fireEvent.keyDown(dial, { key: 'Home' });
    expect(dial).toHaveAttribute('aria-valuenow', '0');
    fireEvent.keyDown(dial, { key: 'End' });
    expect(dial).toHaveAttribute('aria-valuenow', '3');
  });
});

describe('Approve entry', () => {
  it('a double click creates exactly one Flight Log entry', async () => {
    renderAt('/cfo/close/ACR-221', '/cfo/close/:itemId', <ExceptionDetailPage />);
    const before = useDemo.getState().log.length;
    await userEvent.dblClick(screen.getByTestId('approve-entry'));
    expect(useDemo.getState().log.length).toBe(before + 1);
    expect(screen.getByTestId('resolved-state')).toHaveTextContent('Approved by Maya Chen');
    expect(screen.queryByTestId('approve-entry')).toBeNull();
  });
});

describe('Consent dialog', () => {
  it('keeps Install agent disabled until the consent box is checked', async () => {
    const agent = findAgent('ledgerloop-revrec')!;
    let installed: string[] | null = null;
    render(<ConsentDialog agent={agent} open onOpenChange={() => {}} onInstall={(s) => (installed = s)} />);
    const install = screen.getByTestId('confirm-install');
    expect(install).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Write: draft entries' })).toBeDisabled();
    await userEvent.click(screen.getByTestId('consent-checkbox'));
    expect(install).toBeEnabled();
    await userEvent.click(install);
    expect(installed).toEqual(['read:ledger']);
  });
});

describe('Ask Autopilot', () => {
  it('disables send for empty, whitespace, and over-long input', async () => {
    renderAt('/cfo/ask', '/cfo/ask', <AskPage />);
    const send = screen.getByTestId('ask-send');
    const input = screen.getByLabelText('Your question');
    expect(send).toBeDisabled();
    await userEvent.type(input, '   ');
    expect(send).toBeDisabled();
    await userEvent.type(input, 'revenue drops');
    expect(send).toBeEnabled();
    fireEvent.change(input, { target: { value: 'a'.repeat(501) } });
    expect(send).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('up to 500 characters');
  });
});
