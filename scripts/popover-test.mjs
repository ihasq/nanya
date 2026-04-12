import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/home/ihasq/code/nanya/screenshots/popovers';
const LOCAL_URL = 'http://localhost:5173';

const VIEWPORTS = [
  { name: 'mobile-sm', width: 320, height: 568 },
  { name: 'mobile-md', width: 375, height: 667 },
  { name: 'mobile-lg', width: 430, height: 932 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 720 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'short', width: 1280, height: 500 },
  { name: 'very-short', width: 1280, height: 400 },
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  if (fs.existsSync(SCREENSHOT_DIR)) {
    fs.rmSync(SCREENSHOT_DIR, { recursive: true });
  }
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();

  try {
    for (const viewport of VIEWPORTS) {
      console.log(`\n📐 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);

      await page.setViewport({ width: viewport.width, height: viewport.height });
      await page.goto(LOCAL_URL, { waitUntil: 'networkidle0', timeout: 30000 });
      await sleep(500);

      // For desktop viewports, try to open settings dialog
      if (viewport.width >= 768) {
        // Find and click the settings gear icon in sidebar footer
        const settingsClicked = await page.evaluate(() => {
          // Look for the settings button (gear icon)
          const btns = document.querySelectorAll('button');
          for (const btn of btns) {
            if (btn.querySelector('.lucide-settings') || btn.querySelector('svg[class*="settings"]')) {
              btn.click();
              return true;
            }
          }
          return false;
        });

        if (settingsClicked) {
          await sleep(600);
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, `settings-dialog-${viewport.name}.png`),
            fullPage: false
          });
          console.log(`  ✓ Settings dialog captured`);

          // Close dialog
          await page.keyboard.press('Escape');
          await sleep(300);
        }

        // Now try to open the input panel quick settings popover
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
            path: path.join(SCREENSHOT_DIR, `quick-settings-${viewport.name}.png`),
            fullPage: false
          });
          console.log(`  ✓ Quick settings popover captured`);

          await page.keyboard.press('Escape');
          await sleep(200);
        }
      }

      // Main UI screenshot
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `main-${viewport.name}.png`),
        fullPage: false
      });
      console.log(`  ✓ Main UI captured`);
    }

    console.log('\n✅ All screenshots captured!');
    console.log(`📁 Location: ${SCREENSHOT_DIR}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
