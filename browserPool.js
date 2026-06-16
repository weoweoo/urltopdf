import puppeteer from 'puppeteer';
import { createPool } from 'generic-pool';

const LAUNCH_OPTIONS = {
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
};

export const browserPool = createPool({
  create: () => puppeteer.launch(LAUNCH_OPTIONS),
  destroy: (browser) => browser.close(),
  validate: (browser) => Promise.resolve(browser.connected),
}, {
  min: 1,
  max: 5,
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 60000,
  testOnBorrow: true,
});

process.on('SIGTERM', async () => {
  await browserPool.drain();
  await browserPool.clear();
  process.exit(0);
});