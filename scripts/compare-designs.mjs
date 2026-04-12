import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/home/ihasq/code/nanya/screenshots/comparison';
const TARGET_URL = 'https://nani.now/en';
const LOCAL_URL = 'http://localhost:5173';

// Multiple viewport sizes to test
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreenshots(page, prefix, url) {
  console.log(`\n📸 Capturing ${prefix} screenshots from ${url}...`);

  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(1500); // Wait for animations

  for (const viewport of VIEWPORTS) {
    await page.setViewport({ width: viewport.width, height: viewport.height });
    await sleep(300);

    const filename = `${prefix}-${viewport.name}-${viewport.width}x${viewport.height}.png`;
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, filename),
      fullPage: false
    });
    console.log(`  ✓ ${filename}`);
  }
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
    // Capture target site (nani.now)
    await captureScreenshots(page, 'target', TARGET_URL);

    // Capture local site
    await captureScreenshots(page, 'local', LOCAL_URL);

    console.log('\n✅ All screenshots captured!');
    console.log(`📁 Location: ${SCREENSHOT_DIR}`);

    // List files
    const files = fs.readdirSync(SCREENSHOT_DIR);
    console.log('\nFiles:');
    files.forEach(f => console.log(`  - ${f}`));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
