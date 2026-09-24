import { expect, laneCounts, progress, test } from './fixtures';

test.describe('finance leader core', () => {
  test('2: approve ACR-221 advances progress and logs exactly one entry @mobile', async ({ page }) => {
    await page.goto('/cfo/close');
    await expect(page.getByTestId('close-progress-value').first()).toHaveText('42%');
    await page.getByTestId('board-row-ACR-221').getByRole('link').click();
    await expect(page).toHaveURL(/\/cfo\/close\/ACR-221$/);
    const approve = page.getByTestId('approve-entry');
    await approve.dblclick();
    await expect(page.getByText('Entry approved').first()).toBeVisible();
    await expect(page.getByTestId('resolved-state')).toContainText('Approved by Maya Chen');
    await expect(page.getByTestId('approve-entry')).toHaveCount(0);

    await page.getByRole('link', { name: 'Back to Close Autopilot' }).click();
    expect(await progress(page)).toBe('46%');

    await page.goto('/cfo/flight-log');
    await expect(page.getByTestId('log-row-ACR-221')).toHaveCount(1);
    await expect(page.getByTestId('log-row-ACR-221')).toContainText('Approved entry');
  });

  test('3: edit and approve blocks an unbalanced entry and accepts a balanced one', async ({ page }) => {
    await page.goto('/cfo/close/IC-310');
    await page.getByRole('button', { name: 'Edit and approve' }).click();
    const save = page.getByRole('button', { name: 'Approve edited entry' });
    await expect(save).toBeEnabled();
    await page.getByLabel('Debit for 6900 Shared services expense').fill('100000.00');
    await expect(page.getByTestId('balance-status')).toContainText('differ by $20,000.00');
    await expect(save).toBeDisabled();
    await page.getByLabel('Credit for 2300 Intercompany payable, US').fill('100000.00');
    await expect(page.getByTestId('balance-status')).toContainText('Balanced');
    await save.click();
    await expect(page.getByText('Edited entry approved').first()).toBeVisible();
    await expect(page.getByTestId('resolved-state')).toBeVisible();
    await expect(page.getByTestId('proposed-entry')).toContainText('$100,000.00');
  });

  test('4: reject requires a reason', async ({ page }) => {
    await page.goto('/cfo/close/VEN-88');
    await page.getByRole('button', { name: 'Reject', exact: true }).click();
    const confirm = page.getByRole('button', { name: 'Reject entry' });
    await expect(confirm).toBeDisabled();
    await page.getByLabel('Reason').fill('abc');
    await expect(confirm).toBeDisabled();
    await page.getByLabel('Reason').fill('Genuine repeat order, keep both bills');
    await expect(confirm).toBeEnabled();
    await confirm.click();
    await expect(page.getByText('Entry rejected').first()).toBeVisible();
    await expect(page.getByTestId('resolved-state')).toContainText('Rejected by Maya Chen');
  });

  test('5: Control Tower preview follows levels and guardrails', async ({ page }) => {
    await page.goto('/cfo/autonomy');
    const count = page.getByTestId('preview-auto-count');
    await expect(count).toHaveText('4');
    const dial = page.getByRole('slider', { name: /Autonomy level for Accruals/ });
    await dial.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(dial).toHaveAttribute('aria-valuenow', '1');
    await expect(page.getByTestId('workflow-level-accruals')).toHaveText('L1');
    await page.getByTestId('apply-all').click();
    await expect(count).toHaveText('0');
    await page.getByRole('button', { name: 'Restore recommended settings' }).click();
    await expect(count).toHaveText('4');
    const materiality = page.getByRole('slider', { name: 'Materiality limit' });
    await materiality.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByTestId('materiality-value')).toContainText('$32,000');
    await expect(count).toHaveText('3');
    await expect(page.getByTestId('preview-changes')).toContainText('FX-77');
  });

  test('7: reverse an auto-posted item once', async ({ page }) => {
    await page.goto('/cfo/close/FX-77');
    await expect(page.getByTestId('item-status')).toHaveText('Auto-posted');
    await page.getByTestId('reverse-entry').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Reverse entry' }).click();
    await expect(page.getByText('Entry reversed').first()).toBeVisible();
    await expect(page.getByTestId('reverse-entry')).toHaveCount(0);

    await page.goto('/cfo/flight-log');
    const rows = page.getByTestId('log-row-FX-77');
    await expect(rows).toHaveCount(2);
    await expect(page.locator('[data-testid="log-row-FX-77"][data-status="reversed"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="log-row-FX-77"][data-status="reversal"]')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Reverse FX-77' })).toHaveCount(0);
  });

  test('7b: reversing a seeded expert-reviewed entry warns first', async ({ page }) => {
    await page.goto('/cfo/flight-log');
    await page.getByRole('button', { name: 'Reverse IC-305' }).click();
    await expect(page.getByTestId('expert-reverse-warning')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Reverse entry' }).click();
    await expect(page.locator('[data-testid="log-row-IC-305"][data-status="reversed"]')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Reverse IC-305' })).toHaveCount(0);
  });

  test('12: deep links and not-found states @mobile', async ({ page }) => {
    await page.goto('/cfo/close/IC-310');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Intercompany balance mismatch US vs UK');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Intercompany balance mismatch US vs UK');
    await page.goto('/cfo/close/NOPE-1');
    await expect(page.getByTestId('not-found-inline')).toBeVisible();
    await page.getByRole('link', { name: 'Back to Close Autopilot' }).click();
    await expect(page).toHaveURL(/\/cfo\/close$/);
    await page.goto('/does-not-exist');
    await expect(page.getByText('This page is off the flight plan')).toBeVisible();
  });

  test('13: reset demo restores seed counts and progress', async ({ page }) => {
    await page.goto('/cfo/close/ACR-221');
    await page.getByTestId('approve-entry').click();
    await page.goto('/cfo/autonomy');
    await page.getByRole('slider', { name: 'Materiality limit' }).focus();
    await page.keyboard.press('ArrowLeft');
    await page.goto('/cfo/close');
    expect(await laneCounts(page)).toEqual({ auto: 3, assisted: 6, expert: 2 });

    await page.getByRole('button', { name: 'Reset demo' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Reset demo' }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/cfo/close');
    expect(await laneCounts(page)).toEqual({ auto: 4, assisted: 6, expert: 2 });
    expect(await progress(page)).toBe('42%');
  });

  test('bulk approve is disabled at defaults and lists items at L1', async ({ page }) => {
    await page.goto('/cfo/close');
    await expect(page.getByTestId('bulk-approve')).toBeDisabled();
    await page.goto('/cfo/autonomy');
    await page.getByTestId('workflow-bank').click();
    const dial = page.getByRole('slider', { name: /Autonomy level for Bank reconciliation/ });
    await dial.focus();
    await page.keyboard.press('ArrowLeft');
    await page.goto('/cfo/close');
    await page.getByTestId('bulk-approve').click();
    const list = page.getByTestId('bulk-list');
    await expect(list).toContainText('BR-1042');
    await expect(list).toContainText('BR-1043');
    await page.getByRole('dialog').getByRole('button', { name: 'Approve 2 entries' }).click();
    await expect(page.getByText('2 entries approved').first()).toBeVisible();
  });
});
