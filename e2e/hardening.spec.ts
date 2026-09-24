import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function noHorizontalScroll(page: Page) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(375);
}

test.describe('mobile 375 @mobile-only', () => {
  test('14: drawer, no horizontal scroll, tour panel leaves primary buttons usable', async ({ page }) => {
    await page.goto('/cfo/brief');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    const drawer = page.getByTestId('nav-drawer');
    await expect(drawer).toBeVisible();
    await page.getByRole('button', { name: 'Close navigation' }).click();
    await expect(drawer).toHaveCount(0);
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await drawer.getByRole('link', { name: 'Close Autopilot' }).click();
    await expect(page).toHaveURL(/\/cfo\/close$/);
    await expect(drawer).toHaveCount(0);

    for (const path of ['/cfo/close', '/cfo/close/IC-310', '/cfo/store', '/cfo/flight-log', '/cfo/autonomy', '/', '/dev/explorer', '/dev/publish', '/strategy', '/research']) {
      await page.goto(path);
      await expect(page.locator('main h1').first()).toBeVisible();
      await noHorizontalScroll(page);
    }

    await page.goto('/');
    await page.getByTestId('start-tour').click();
    await page.goto('/cfo/close/ACR-221');
    const panel = page.getByTestId('tour-panel');
    await expect(panel).toBeVisible();
    const approve = page.getByTestId('approve-entry');
    await approve.scrollIntoViewIfNeeded();
    const a = await approve.boundingBox();
    const p = await panel.boundingBox();
    expect(a && p).toBeTruthy();
    const overlaps = a!.y < p!.y + p!.height && a!.y + a!.height > p!.y && a!.x < p!.x + p!.width && a!.x + a!.width > p!.x;
    expect(overlaps).toBe(false);
    await approve.click();
    await expect(page.getByTestId('resolved-state')).toBeVisible();
  });
});

test.describe('accessibility', () => {
  const pages = [
    '/',
    '/cfo/brief',
    '/cfo/close',
    '/cfo/close/IC-310',
    '/cfo/autonomy',
    '/cfo/store',
    '/cfo/store/ledgerloop-revrec',
    '/cfo/flight-log',
    '/cfo/ask',
    '/dev',
    '/dev/explorer',
    '/dev/studio',
    '/dev/publish',
    '/strategy',
    '/research',
    '/process',
  ];
  for (const path of pages) {
    test(`15: axe has no serious or critical violations on ${path}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path);
      await expect(page.locator('main h1').first()).toBeVisible();
      await page.waitForTimeout(300);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }
});

test('17: reduced motion skips the agent animation and shows everything', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/cfo/close');
  await expect(page.getByText(/Agents are working through/)).toHaveCount(0);
  for (const id of ['BR-1042', 'IC-310', 'TP-12', 'BR-1050']) {
    await expect(page.getByTestId(`board-row-${id}`)).toBeVisible();
    const opacity = await page.getByTestId(`board-row-${id}`).evaluate((el) => getComputedStyle(el).opacity);
    expect(opacity).toBe('1');
  }
  expect(errors).toEqual([]);
  await context.close();
});

test('close page plays the agent animation once and it can be skipped', async ({ page }) => {
  await page.goto('/cfo/close');
  const status = page.getByText(/Agents are working through/);
  await expect(status).toBeVisible();
  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(status).toHaveCount(0);
  await expect(page.getByTestId('board-row-IC-310')).toBeVisible();
});
