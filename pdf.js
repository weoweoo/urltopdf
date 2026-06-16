import { buildInjectionCss } from "./cssInjector.js";
import { browserPool } from './browserPool.js';

export async function generatePdf(url, { suppressSelectors = [], ...pdfOptions }) {
  const browser = await browserPool.acquire();

  try {
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      // Let fonts and late-loading CSS settle before printing.
      await page.evaluateHandle('document.fonts.ready');

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