const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ORDER_ID = process.env.ORDER_ID || 'e59fb154-f55a-44ba-8f43-3e13e152db6d';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const url = `${FRONTEND_URL}/checkout/status?orderId=${encodeURIComponent(ORDER_ID)}`;

(async () => {
  const downloadPath = path.resolve(__dirname, '../tmp/puppeteer-downloads');
  fs.mkdirSync(downloadPath, { recursive: true });

  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  try {
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath });
  } catch (e) {
    console.warn('Could not set download behavior via CDP:', e.message || e);
  }

  console.log('Navigating to', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });

  // Try to find a button with "download" in its text (case-insensitive)
  const [btn] = await page.$x("//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'download')] ");
  if (!btn) {
    console.error('Download button not found on page');
    await browser.close();
    process.exit(2);
  }

  console.log('Clicking download button');
  await btn.click();

  const timeout = 30000;
  const start = Date.now();
  let fileFound = null;
  while (Date.now() - start < timeout) {
    const files = fs.readdirSync(downloadPath).filter((f) => f.toLowerCase().endsWith('.pdf'));
    if (files.length > 0) {
      fileFound = files[0];
      break;
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  if (fileFound) {
    const full = path.join(downloadPath, fileFound);
    console.log('Downloaded PDF to', full);
    await browser.close();
    process.exit(0);
  } else {
    console.error('No PDF downloaded within timeout');
    await browser.close();
    process.exit(3);
  }
})().catch((err) => {
  console.error('Headless script error', err);
  process.exit(1);
});
