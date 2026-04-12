import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/home/ihasq/code/nanya/screenshots/locale';
const LOCAL_URL = 'http://localhost:5173';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  if (fs.existsSync(SCREENSHOT_DIR)) {
    fs.rmSync(SCREENSHOT_DIR, { recursive: true });
  }
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  console.log('🚀 Launching browser with Japanese locale...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--lang=ja-JP'
    ]
  });

  const page = await browser.newPage();

  // Set Japanese locale
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'ja-JP,ja;q=0.9'
  });

  try {
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(LOCAL_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(1000);

    // Main UI
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'main-ja.png'),
      fullPage: false
    });
    console.log('✓ Main UI (Japanese) captured');

    // Open quick settings popover
    const popoverClicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.querySelector('.lucide-sliders-horizontal')) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (popoverClicked) {
      await sleep(400);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'quick-settings-ja.png'),
        fullPage: false
      });
      console.log('✓ Quick settings (Japanese) captured');
      await page.keyboard.press('Escape');
      await sleep(200);
    }

    // Enable writing style toggle
    const toggleClicked = await page.evaluate(() => {
      const switches = document.querySelectorAll('[role="switch"]');
      for (const sw of switches) {
        sw.click();
        return true;
      }
      return false;
    });

    if (toggleClicked) {
      await sleep(300);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'writing-styles-ja.png'),
        fullPage: false
      });
      console.log('✓ Writing styles (Japanese) captured');
    }

    // Open settings dialog
    const settingsClicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.querySelector('.lucide-settings')) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (settingsClicked) {
      await sleep(500);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'settings-ja.png'),
        fullPage: false
      });
      console.log('✓ Settings dialog (Japanese) captured');
    }

    console.log('\n✅ All Japanese locale screenshots captured!');
    console.log(`📁 Location: ${SCREENSHOT_DIR}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
