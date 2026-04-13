import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/home/ihasq/code/nanya/debug-screenshots-real';
const LOCAL_URL = 'http://localhost:5173/test/streaming-debug-real';
const TICK_MS = 500;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureFrame(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`) });
  console.log(`  [FRAME] ${name}`);
}

async function main() {
  if (fs.existsSync(SCREENSHOT_DIR)) {
    fs.rmSync(SCREENSHOT_DIR, { recursive: true });
  }
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(LOCAL_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(500);

    console.log('\n=== TEST 1: First conversation turn (Real Store) ===');
    await captureFrame(page, '01-initial');

    // Click "Start First Turn"
    await page.click('#start-first-turn');

    // Capture frames during streaming
    for (let i = 0; i < 12; i++) {
      await sleep(TICK_MS);
      await captureFrame(page, `02-first-turn-${String(i).padStart(2, '0')}`);
    }

    // Wait for completion
    await sleep(1000);
    await captureFrame(page, '03-first-turn-complete');

    console.log('\n=== TEST 2: Second conversation turn (Real Store) ===');
    await sleep(500);

    // Click "Start Second Turn"
    await page.click('#start-second-turn');

    // Capture frames during streaming
    for (let i = 0; i < 12; i++) {
      await sleep(TICK_MS);
      await captureFrame(page, `04-second-turn-${String(i).padStart(2, '0')}`);
    }

    // Wait for completion
    await sleep(1000);
    await captureFrame(page, '05-second-turn-complete');

    console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}`);
    console.log(`Total files: ${fs.readdirSync(SCREENSHOT_DIR).length}`);

  } catch (err) {
    console.error('Error:', err.message);
    await captureFrame(page, 'error-state');
  } finally {
    await browser.close();
  }
}

main();
