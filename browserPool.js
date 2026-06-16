import puppeteer from 'puppeteer';
import { createPool } from 'generic-pool';

const LAUNCH_OPTIONS = {
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',     // avoids /dev/shm size issues in containers
    '--disable-gpu',                // no GPU available in this environment anyway
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-translate',
    '--disable-features=site-per-process,TranslateUI,NetworkService',
    '--single-process',             // run renderer in-process — cuts memory use significantly on tiny containers
    '--no-zygote',
    '--js-flags=--max-old-space-size=256', // cap V8 heap so it doesn't try to use more RAM than the container has
  ],
};

export const browserPool = createPool({
  create: () => puppeteer.launch(LAUNCH_OPTIONS),
  destroy: (browser) => browser.close(),
  validate: (browser) => Promise.resolve(browser.connected),
}, {
  min: 0,                  // don't keep a browser warm at all times — let it spin up on demand
  max: 1,                  // free tier can't realistically support concurrent Chromium instances
  acquireTimeoutMillis: 45000,
  idleTimeoutMillis: 30000,
  testOnBorrow: true,
});

process.on('SIGTERM', async () => {
  await browserPool.drain();
  await browserPool.clear();
  process.exit(0);
});