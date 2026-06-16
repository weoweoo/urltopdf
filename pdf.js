import { buildInjectionCss } from "./cssInjector.js";
import { browserPool } from './browserPool.js';

export async function generatePdf(url, { suppressSelectors = [], ...pdfOptions }) {
  console.log('[pdf] acquiring browser from pool...');
  const browser = await browserPool.acquire();
  console.log('[pdf] browser acquired. connected:', browser.connected);

  try {
    console.log('[pdf] opening new page...');
    const page = await browser.newPage();
    console.log('[pdf] page opened.');

    try {
      console.log('[pdf] starting navigation to:', url);

      try {
        console.log('[pdf] attempting networkidle2...');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 8000 });
        console.log('[pdf] networkidle2 succeeded.');
      } catch (err) {
        console.warn('[pdf] networkidle2 failed:', err.message);
        console.log('[pdf] attempting domcontentloaded fallback...');
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        console.log('[pdf] domcontentloaded succeeded.');
      }

      console.log('[pdf] waiting on document.fonts.ready...');
      await page.evaluateHandle('document.fonts.ready');
      console.log('[pdf] fonts ready.');

      console.log('[pdf] waiting on chartsReady signal...');
      await page.waitForFunction(
        () => window.chartsReady === undefined || window.chartsReady === true,
        { timeout: 10000 }
      ).catch((err) => {
        console.warn('[pdf] chartsReady wait failed/timed out (continuing anyway):', err.message);
      });
      console.log('[pdf] chartsReady check done.');

      console.log('[pdf] injecting CSS...');
      await page.addStyleTag({ content: buildInjectionCss(suppressSelectors) });
      console.log('[pdf] CSS injected.');

      console.log('[pdf] setting media type to screen...');
      await page.emulateMediaType('screen');
      console.log('[pdf] media type set.');

      console.log('[pdf] generating PDF buffer...');
      const buffer = await page.pdf(pdfOptions);
      console.log('[pdf] PDF buffer generated. size:', buffer.length);

      return buffer;
    } finally {
      console.log('[pdf] closing page...');
      await page.close();
      console.log('[pdf] page closed.');
    }
  } finally {
    console.log('[pdf] releasing browser back to pool...');
    browserPool.release(browser);
    console.log('[pdf] browser released.');
  }
}