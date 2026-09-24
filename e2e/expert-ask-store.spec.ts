import { expect, laneCounts, test } from './fixtures';

test.describe('expert, ask, store', () => {
  test('6: expert flow on TP-12 resolves as Expert-reviewed', async ({ page }) => {
    await page.goto('/cfo/close/TP-12');
    await page.getByTestId('ask-expert').click();
    await expect(page).toHaveURL(/\/cfo\/experts\/new-TP-12$/);
    await expect(page.getByRole('radio', { name: /Priya Raman/ })).toBeChecked();
    await expect(page.getByTestId('context-packet')).toContainText('IC-310');
    await expect(page.getByTestId('expert-cost')).toHaveText('$180.00');
    await page.getByRole('button', { name: 'Send to expert' }).click();
    await expect(page).toHaveURL(/\/cfo\/experts\/XS-1$/);
    await expect(page.getByTestId('expert-reply')).toBeVisible();
    await page.getByRole('button', { name: 'Accept recommendation' }).click();
    await expect(page.getByTestId('expert-accepted')).toBeVisible();

    await page.goto('/cfo/flight-log');
    const row = page.getByTestId('log-row-TP-12');
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('Expert-reviewed');
    await expect(row).toContainText('Priya Raman, CPA');
  });

  test('6b: cancelling before sending changes nothing', async ({ page }) => {
    await page.goto('/cfo/close/TP-12');
    await page.getByTestId('ask-expert').click();
    await page.getByRole('radio', { name: /Daniel Osei/ }).check();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveURL(/\/cfo\/close\/TP-12$/);
    await expect(page.getByTestId('item-status')).toHaveText('Needs an expert');
    await expect(page.getByTestId('ask-expert')).toBeVisible();
    await page.goto('/cfo/close');
    expect(await laneCounts(page)).toEqual({ auto: 4, assisted: 6, expert: 2 });
  });

  test('8: Ask Autopilot answers each intent and falls back on gibberish', async ({ page }) => {
    await page.goto('/cfo/ask');
    const input = page.getByLabel('Your question');
    const send = page.getByTestId('ask-send');
    await expect(send).toBeDisabled();
    await input.fill('    ');
    await expect(send).toBeDisabled();

    await page.getByRole('button', { name: 'What if revenue drops 15%?' }).click();
    const drop = page.getByTestId('answer-revenue_drop');
    await expect(drop).toContainText('8 months');
    await expect(drop).toContainText('May 2027');
    await expect(drop.getByTestId('scenario-chart')).toBeVisible();

    await input.fill('What if we delay UK hires?');
    await send.click();
    await expect(page.getByTestId('answer-delay_uk_hires')).toContainText('$114,300.00');
    await expect(page.getByTestId('answer-delay_uk_hires').getByTestId('scenario-chart')).toBeVisible();

    await input.fill('Could we collect receivables faster?');
    await input.press('Enter');
    await expect(page.getByTestId('answer-collect_faster')).toContainText('$1,841,095.89');
    await expect(page.getByTestId('answer-collect_faster').getByTestId('scenario-chart')).toBeVisible();

    await input.fill('What if we open an entity in Germany?');
    await send.click();
    const germany = page.getByTestId('answer-germany_entity');
    await expect(germany).toContainText('Readiness checklist');
    await expect(germany.getByRole('button', { name: 'Ask an expert' })).toBeVisible();

    await input.fill('blorp zanzibar quux');
    await send.click();
    const fallback = page.getByTestId('fallback-answer');
    await expect(fallback.getByRole('button')).toHaveCount(4);

    await input.fill('x'.repeat(501));
    await expect(send).toBeDisabled();
    await expect(page.getByTestId('ask-counter')).toHaveText('501 / 500');

    await page.getByRole('button', { name: 'Clear conversation' }).click();
    await expect(page.getByTestId('conversation')).toHaveCount(0);
  });

  test('9: store search, consent, REV-606, uninstall, and uncertified agent', async ({ page }) => {
    await page.goto('/cfo/store');
    await page.getByLabel('Search agents').fill('zzz');
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.getByTestId('store-count')).toHaveText('6 agents');

    await page.getByTestId('agent-card-ledgerloop-revrec').click();
    await page.getByTestId('install-agent').click();
    const confirm = page.getByTestId('confirm-install');
    await expect(confirm).toBeDisabled();
    await expect(page.getByRole('checkbox', { name: 'Read: contracts and documents' })).toBeDisabled();
    await page.getByTestId('consent-checkbox').check();
    await expect(confirm).toBeEnabled();
    await confirm.click();
    await expect(page.getByTestId('installed-state')).toBeVisible();

    await page.goto('/cfo/close');
    await expect(page.getByTestId('board-row-REV-606')).toBeVisible();
    await expect(page.getByTestId('board-row-REV-606')).toHaveAttribute('data-lane', 'ASSISTED');

    await page.goto('/cfo/store/ledgerloop-revrec');
    await page.getByRole('button', { name: 'Uninstall' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Uninstall agent' }).click();
    await expect(page.getByTestId('install-agent')).toBeVisible();
    await page.goto('/cfo/close');
    await expect(page.getByTestId('board-row-REV-606')).toHaveCount(0);

    await page.goto('/cfo/store/vendor-contract-reader');
    await expect(page.getByTestId('install-agent')).toBeDisabled();
    await expect(page.getByTestId('not-installable')).toContainText('In certification');
  });
});
