import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/home/ihasq/code/nanya/screenshots/app-streaming';
const LOCAL_URL = 'http://localhost:5173';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(LOCAL_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(500);

    // Type text
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.type('Hello, how are you?', { delay: 10 });
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-input.png') });
    console.log('1. Input state');

    // Simulate translation via store
    await page.evaluate(() => {
      const store = window.__TRANSLATION_STORE__;
      if (store) {
        store.getState().setInputText('Hello, how are you?');
        store.getState().setIsTranslating(true);
      }
    });
    await sleep(100);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-translating-start.png') });
    console.log('2. Translation started');

    // Simulate streaming variant appearing
    await page.evaluate(() => {
      const store = window.__TRANSLATION_STORE__;
      if (store) {
        store.getState().setStreamingVariant({
          style: 'Natural',
          emoji: '🗣️',
          text: 'こんにちは',
        });
      }
    });

    // Capture transition frames
    for (let i = 0; i < 5; i++) {
      await sleep(50);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `03-streaming-${i}.png`) });
    }
    console.log('3. Streaming frames captured');

    // Add explanation
    await page.evaluate(() => {
      const store = window.__TRANSLATION_STORE__;
      if (store) {
        store.getState().setStreamingVariant({
          style: 'Natural',
          emoji: '🗣️',
          text: 'こんにちは、元気ですか？',
          explanation: ['Uses casual greeting form'],
        });
      }
    });

    for (let i = 0; i < 5; i++) {
      await sleep(50);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `04-with-exp-${i}.png`) });
    }
    console.log('4. Explanation added frames');

    // Add second explanation
    await page.evaluate(() => {
      const store = window.__TRANSLATION_STORE__;
      if (store) {
        store.getState().setStreamingVariant({
          style: 'Natural',
          emoji: '🗣️',
          text: 'こんにちは、元気ですか？',
          explanation: ['Uses casual greeting form', 'Common casual Japanese greeting'],
        });
      }
    });

    for (let i = 0; i < 5; i++) {
      await sleep(50);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `05-second-exp-${i}.png`) });
    }
    console.log('5. Second explanation frames');

    // Final result
    await page.evaluate(() => {
      const store = window.__TRANSLATION_STORE__;
      if (store) {
        store.getState().setVariants([{
          style: 'Natural',
          emoji: '🗣️',
          text: 'こんにちは、元気ですか？',
          explanation: ['Uses casual greeting form', 'Common casual Japanese greeting'],
        }]);
        store.getState().setIsTranslating(false);
        store.getState().setStreamingVariant(null);
      }
    });
    await sleep(300);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-final.png') });
    console.log('6. Final result');

    console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}`);
    console.log(`Files: ${fs.readdirSync(SCREENSHOT_DIR).length}`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
