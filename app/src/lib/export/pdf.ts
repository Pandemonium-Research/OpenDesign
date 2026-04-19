import { chromium } from 'playwright-core';

export async function exportPdf(fullHtml: string): Promise<Buffer> {
  const executablePath = process.env.CHROMIUM_PATH ?? '/usr/bin/chromium';
  const browser = await chromium.launch({
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
