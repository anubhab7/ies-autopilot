import { test as base, expect, type Page } from '@playwright/test';

/**
 * Every spec fails on console errors or uncaught page errors, and runs with
 * simulated delays collapsed so flows stay fast and deterministic.
 */
export const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') problems.push(`console.error: ${msg.text()}`);
      });
      page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
      await page.addInitScript(() => {
        (window as unknown as { __IES_FAST__: boolean }).__IES_FAST__ = true;
      });
      await use();
      expect(problems, problems.join('\n')).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export async function laneCounts(page: Page) {
  const read = async (lane: string) => Number(await page.getByTestId(`lane-count-${lane}`).innerText());
  return { auto: await read('AUTONOMOUS'), assisted: await read('ASSISTED'), expert: await read('EXPERT') };
}

export async function progress(page: Page) {
  return page.getByTestId('close-progress-value').first().innerText();
}
