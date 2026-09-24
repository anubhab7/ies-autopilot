// Saves 1440x900 screenshots of each key screen into docs/screenshots/ for the deck.
// Starts from a fresh demo state. Builds and serves the app if nothing is running on port 4173.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';

const BASE = 'http://localhost:4173';
const OUT = 'docs/screenshots';

async function isUp() {
  try {
    const res = await fetch(BASE);
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await isUp()) return null;
  if (!existsSync('dist/index.html')) {
    await new Promise((resolve, reject) => {
      const build = spawn('npm', ['run', 'build'], { stdio: 'inherit' });
      build.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('Build failed'))));
    });
  }
  const server = spawn('npm', ['run', 'preview'], { stdio: 'ignore', detached: true });
  for (let i = 0; i < 60; i += 1) {
    if (await isUp()) return server;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Preview server did not start on port 4173');
}

/** Each shot: file name, route, and optional steps to reach the right state. */
const SHOTS = [
  { name: '01-home', path: '/' },
  { name: '02-morning-brief', path: '/cfo/brief' },
  { name: '03-close-autopilot', path: '/cfo/close' },
  { name: '04-exception-ic-310', path: '/cfo/close/IC-310' },
  { name: '05-control-tower', path: '/cfo/autonomy' },
  { name: '06-expert-packet-tp-12', path: '/cfo/experts/new-TP-12' },
  {
    name: '07-expert-reply',
    path: '/cfo/experts/new-TP-12',
    steps: async (page) => {
      await page.getByRole('button', { name: 'Send to expert' }).click();
      await page.getByTestId('expert-reply').waitFor();
    },
  },
  {
    name: '08-ask-revenue-drop',
    path: '/cfo/ask',
    steps: async (page) => {
      await page.getByRole('button', { name: 'What if revenue drops 15%?' }).first().click();
      await page.getByTestId('scenario-chart').waitFor();
      await page.waitForTimeout(400);
    },
  },
  { name: '09-agent-store', path: '/cfo/store' },
  { name: '10-agent-detail-ledgerloop', path: '/cfo/store/ledgerloop-revrec' },
  { name: '11-flight-log', path: '/cfo/flight-log' },
  { name: '12-hangar', path: '/dev' },
  { name: '13-explorer', path: '/dev/explorer' },
  {
    name: '14-studio-evals',
    path: '/dev/studio',
    steps: async (page) => {
      await page.getByTestId('run-evals').click();
      await page.getByTestId('eval-results').scrollIntoViewIfNeeded();
    },
  },
  { name: '15-publish', path: '/dev/publish' },
  { name: '16-strategy', path: '/strategy' },
  { name: '17-research', path: '/research' },
  { name: '18-process', path: '/process' },
];

const server = await ensureServer();
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  for (const shot of SHOTS) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      window.__IES_FAST__ = true;
    });
    const page = await context.newPage();
    await page.goto(BASE + shot.path);
    await page.locator('main h1').first().waitFor();
    if (shot.steps) await shot.steps(page);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/${shot.name}.png` });
    console.log(`Saved ${OUT}/${shot.name}.png`);
    await context.close();
  }
} finally {
  await browser.close();
  if (server) process.kill(-server.pid);
}
