import { TOUR_STEPS } from '../src/data/tour';
import { expect, test } from './fixtures';

function routeRegex(route: string) {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^http://localhost:\\d+${escaped}$`);
}

test('1: full guided tour, reload resume, return to step, Escape exits', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-tour').click();
  const count = page.getByTestId('tour-step-count');

  for (let i = 0; i < TOUR_STEPS.length; i += 1) {
    const step = TOUR_STEPS[i];
    await expect(count).toHaveText(`Step ${i + 1} of 12`);
    await expect(page.getByTestId('tour-title')).toHaveText(step.title);
    if (step.route.startsWith('/cfo/experts/')) {
      await expect(page).toHaveURL(/\/cfo\/experts\//);
    } else {
      await expect(page).toHaveURL(routeRegex(step.route));
    }
    await expect(page.locator(`[data-tour="${step.target}"]`).first()).toBeVisible();
    await expect(page.getByTestId('tour-spotlight')).toBeVisible();

    if (i === 4) {
      await page.reload();
      await expect(count).toHaveText('Step 5 of 12');
      await page.goto('/research');
      await page.getByRole('button', { name: 'Return to step' }).click();
      await expect(page).toHaveURL(/\/cfo\/autonomy$/);
    }
    if (i < TOUR_STEPS.length - 1) await page.getByTestId('tour-next').click();
  }

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(count).toHaveText('Step 11 of 12');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('tour-panel')).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('tour-panel')).toHaveCount(0);
});

test('tour from the developer entry starts at the Hangar and can finish', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Tour as a developer' }).first().click();
  await expect(page).toHaveURL(/\/dev$/);
  await expect(page.getByTestId('tour-step-count')).toHaveText('Step 10 of 12');
  await page.getByTestId('tour-next').click();
  await page.getByTestId('tour-next').click();
  await page.getByRole('button', { name: 'Finish tour' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('tour-panel')).toHaveCount(0);
});

test('command palette jumps to a close item', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await page.getByLabel('Search commands').fill('IC-310');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/cfo\/close\/IC-310$/);
});

test('story pages render key content', async ({ page }) => {
  await page.goto('/strategy');
  await expect(page.getByTestId('gmv')).toHaveText('$12,000,000');
  await expect(page.getByTestId('intuit-revenue')).toHaveText('$2,400,000');
  await page.goto('/research');
  await expect(page.getByText('Illustrative, synthesized from public review themes').first()).toBeVisible();
  await page.goto('/process');
  await expect(page.getByText('Another chat copilot')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Riskiest assumptions and rapid tests' })).toBeVisible();
});
