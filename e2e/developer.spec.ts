import { expect, test } from './fixtures';

test.describe('developer journey', () => {
  test('10: explorer returns 401, 200, 400, and 422 and the timer freezes', async ({ page }) => {
    await page.goto('/dev/explorer');
    await page.getByTestId('send-request').click();
    await expect(page.getByTestId('response-status')).toHaveText('401 Unauthorized');
    await page.getByRole('link', { name: 'Generate an API key' }).click();
    await expect(page).toHaveURL(/\/dev$/);

    await page.getByRole('button', { name: 'Create workspace' }).click();
    await page.getByRole('button', { name: 'Launch sandbox' }).click();
    await expect(page.getByTestId('sandbox-ready')).toBeVisible();
    await page.getByRole('button', { name: 'Generate API key' }).click();
    await expect(page.getByTestId('api-key')).toContainText('ies_sk_test_');
    await expect(page.getByTestId('first-call-timer')).toHaveAttribute('data-frozen', 'false');
    await page.getByRole('link', { name: 'Open the explorer' }).click();

    await page.getByTestId('send-request').click();
    await expect(page.getByTestId('response-status')).toHaveText('200 OK');
    await expect(page.getByTestId('first-call-timer')).toHaveAttribute('data-frozen', 'true');
    const frozen = await page.getByTestId('first-call-timer').innerText();
    await page.waitForTimeout(1200);
    expect(await page.getByTestId('first-call-timer').innerText()).toBe(frozen);

    await page.getByLabel('period (path, YYYY-MM)').fill('2026-13');
    await page.getByTestId('send-request').click();
    await expect(page.getByTestId('response-status')).toHaveText('400 Bad Request');
    await expect(page.getByTestId('api-response')).toContainText('01 to 12');

    await page.getByRole('button', { name: /POST/ }).click();
    const body = page.getByLabel('Request body (JSON)');
    const text = await body.inputValue();
    await body.fill(text.replace('"credit": 2450', '"credit": 2400'));
    await page.getByTestId('send-request').click();
    await expect(page.getByTestId('response-status')).toHaveText('422 Unprocessable Entity');

    await page.getByRole('tab', { name: 'MCP server' }).click();
    await page.getByRole('button', { name: 'Try tool ies.get_trial_balance' }).click();
    await expect(page.getByTestId('mcp-result-ies.get_trial_balance')).toContainText('"ok": true');
  });

  test('11: evals gate certification, publish validates, earnings show data', async ({ page }) => {
    await page.goto('/dev/earnings');
    await expect(page.getByTestId('empty-state')).toBeVisible();

    await page.goto('/dev/publish');
    await expect(page.getByTestId('publish-blocked')).toBeVisible();
    await expect(page.getByTestId('publish-submit')).toBeDisabled();

    await page.goto('/dev/studio');
    await expect(page.getByTestId('submit-certification')).toBeDisabled();
    await page.getByTestId('run-evals').click();
    await expect(page.getByTestId('eval-score')).toHaveText('88%');
    await expect(page.getByTestId('submit-certification')).toBeDisabled();
    await expect(page.getByTestId('submit-reason')).toContainText('Reach 95%');
    await page.getByRole('button', { name: 'Apply suggested fix' }).click();
    await expect(page.getByTestId('agent-version')).toHaveText('v2');
    await expect(page.getByTestId('submit-certification')).toBeDisabled();
    await page.getByTestId('run-evals').click();
    await expect(page.getByTestId('eval-score')).toHaveText('98%');
    await page.getByTestId('submit-certification').click();
    await page.getByRole('link', { name: 'Continue to Publish' }).click();

    const submit = page.getByTestId('publish-submit');
    await expect(submit).toBeEnabled();
    await page.getByLabel('Price per outcome (USD)').fill('-5');
    await expect(page.getByText('no minus sign')).toBeVisible();
    await expect(submit).toBeDisabled();
    await page.getByLabel('Price per outcome (USD)').fill('0.50');
    await page.getByLabel('Agent name').fill('ab');
    await expect(page.getByText('Name must be 3 to 60 characters.')).toBeVisible();
    await expect(submit).toBeDisabled();
    await page.getByLabel('Agent name').fill('Rebatewise Rebate Accruals');
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page.getByTestId('publish-success')).toBeVisible();

    await page.getByRole('link', { name: 'View earnings' }).click();
    await expect(page.getByTestId('earnings-stats')).toContainText('Installs');
    await expect(page.getByTestId('empty-state')).toHaveCount(0);
  });
});
