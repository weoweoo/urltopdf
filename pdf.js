import { buildInjectionCss } from "./cssInjector.js";
import { browserPool } from './browserPool.js';

export async function generatePdf(url, { suppressSelectors = [], ...pdfOptions }) {
  const browser = await browserPool.acquire();

  try {
    const page = await browser.newPage();

    try {
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 8000 });
      } catch (err) {
        console.warn('networkidle2 wait failed or timed out, falling back to domcontentloaded:', err.message);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      }

      // fonts and late-loading CSS settle before printing.
      await page.evaluateHandle('document.fonts.ready');

      await page.waitForFunction(
        () => window.chartsReady === undefined || window.chartsReady === true,
        { timeout: 10000 }
      ).catch(() => {});

      await page.addStyleTag({ content: buildInjectionCss(suppressSelectors) });
      await page.emulateMediaType('screen');

      return await page.pdf(pdfOptions);
    } finally {
      await page.close();
    }
  } finally {
    browserPool.release(browser);
  }
}