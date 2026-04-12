import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/home/ihasq/code/nanya/screenshots/viewports';
const LOCAL_URL = 'http://localhost:5173';

// 20+ viewport sizes covering various devices
const VIEWPORTS = [
  // Mobile Portrait
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-12', width: 390, height: 844 },
  { name: 'iphone-14-pro', width: 393, height: 852 },
  { name: 'iphone-14-pro-max', width: 430, height: 932 },
  { name: 'pixel-7', width: 412, height: 915 },
  { name: 'galaxy-s21', width: 360, height: 800 },
  { name: 'galaxy-fold', width: 280, height: 653 },

  // Mobile Landscape
  { name: 'iphone-12-land', width: 844, height: 390 },

  // Tablets
  { name: 'ipad-mini', width: 768, height: 1024 },
  { name: 'ipad-air', width: 820, height: 1180 },
  { name: 'ipad-pro-11', width: 834, height: 1194 },
  { name: 'ipad-pro-12', width: 1024, height: 1366 },
  { name: 'surface-pro', width: 912, height: 1368 },
  { name: 'galaxy-tab', width: 800, height: 1280 },

  // Desktop
  { name: 'laptop-sm', width: 1280, height: 720 },
  { name: 'laptop-md', width: 1366, height: 768 },
  { name: 'laptop-lg', width: 1440, height: 900 },
  { name: 'desktop-hd', width: 1920, height: 1080 },
  { name: 'desktop-2k', width: 2560, height: 1440 },

  // Edge cases
  { name: 'narrow', width: 320, height: 568 },
  { name: 'wide', width: 1920, height: 600 },
  { name: 'tall', width: 400, height: 1200 },
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureWithSettingsOpen(page, viewport) {
  await page.setViewport({ width: viewport.width, height: viewport.height });
  await sleep(200);

  // Click settings button to open dialog
  try {
    const settingsBtn = await page.$('button[aria-label="Settings"], button:has(svg.lucide-settings), .lucide-settings');
    if (!settingsBtn) {
      // Try finding by icon class
      const btns = await page.$$('button');
      for (const btn of btns) {
        const hasSettings = await btn.$('svg.lucide-settings');
        if (hasSettings) {
          await btn.click();
          break;
        }
      }
    } else {
      await settingsBtn.click();
    }
    await sleep(500);
  } catch (e) {
    console.log(`  Could not open settings for ${viewport.name}`);
  }

  const filename = `settings-${viewport.name}-${viewport.width}x${viewport.height}.png`;
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, filename),
    fullPage: false
  });
  console.log(`  ✓ ${filename}`);

  // Close dialog by pressing Escape
  await page.keyboard.press('Escape');
  await sleep(200);
}

async function captureMainUI(page, viewport) {
  await page.setViewport({ width: viewport.width, height: viewport.height });
  await sleep(200);

  const filename = `main-${viewport.name}-${viewport.width}x${viewport.height}.png`;
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, filename),
    fullPage: false
  });
  console.log(`  ✓ ${filename}`);
}

async function main() {
  // Clean directory
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
    console.log('\n📸 Capturing main UI screenshots...');
    await page.goto(LOCAL_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(1000);

    for (const viewport of VIEWPORTS) {
      await captureMainUI(page, viewport);
    }

    console.log('\n📸 Capturing settings dialog screenshots...');
    // Reset to a standard viewport first
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(LOCAL_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(1000);

    for (const viewport of VIEWPORTS) {
      await captureWithSettingsOpen(page, viewport);
    }

    console.log('\n✅ All screenshots captured!');
    console.log(`📁 Location: ${SCREENSHOT_DIR}`);

    // List files
    const files = fs.readdirSync(SCREENSHOT_DIR);
    console.log(`\nTotal: ${files.length} screenshots`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
