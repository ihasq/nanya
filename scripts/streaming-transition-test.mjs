import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/home/ihasq/code/nanya/screenshots/streaming';
const LOCAL_URL = 'http://localhost:5173/demo/streaming';

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
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(LOCAL_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(1000);

    // Wait for React to render
    await page.waitForSelector('[data-testid="streaming-demo"]', { timeout: 10000 });
    await sleep(500);

    // Initial state
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '00-initial.png'),
      fullPage: false
    });
    console.log('0. Initial state');

    // Click Play button
    await page.click('[data-testid="btn-play"]');

    // Capture frames rapidly during streaming
    const frameCount = 30;
    const frameInterval = 100; // 100ms between frames

    for (let i = 1; i <= frameCount; i++) {
      await sleep(frameInterval);

      // Check if still running
      const isRunning = await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="btn-pause"]');
        return btn !== null;
      });

      // Get current state
      const state = await page.evaluate(() => {
        const indicator = document.querySelector('[data-testid="chunk-indicator"]');
        const parts = document.querySelectorAll('[data-part-id]');
        return {
          chunkText: indicator?.textContent || '',
          partCount: parts.length,
          partIds: Array.from(parts).map(p => p.getAttribute('data-part-id'))
        };
      });

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${String(i).padStart(2, '0')}-frame.png`),
        fullPage: false
      });

      console.log(`${i}. ${state.chunkText} - ${state.partCount} parts: [${state.partIds.join(', ')}]`);

      if (!isRunning) {
        console.log('Streaming completed');
        break;
      }
    }

    // Final state
    await sleep(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '99-final.png'),
      fullPage: false
    });
    console.log('Final state captured');

    // Now test step-by-step transitions
    console.log('\n--- Step-by-step transition test ---');

    // Reset
    await page.click('[data-testid="btn-reset"]');
    await sleep(300);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'step-00-reset.png'),
      fullPage: false
    });
    console.log('Step 0: Reset');

    // Step through each chunk
    for (let step = 1; step <= 10; step++) {
      const btnNext = await page.$('[data-testid="btn-next"]:not([disabled])');
      if (!btnNext) break;

      await btnNext.click();

      // Capture multiple frames per step to see transition
      for (let frame = 0; frame < 4; frame++) {
        await sleep(50);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `step-${String(step).padStart(2, '0')}-${frame}.png`),
          fullPage: false
        });
      }

      const state = await page.evaluate(() => {
        const parts = document.querySelectorAll('[data-part-id]');
        return Array.from(parts).map(p => ({
          id: p.getAttribute('data-part-id'),
          type: p.getAttribute('data-part-type')
        }));
      });

      console.log(`Step ${step}: ${state.length} parts - ${state.map(p => `${p.type}:${p.id}`).join(', ')}`);
    }

    console.log(`\nAll screenshots saved to: ${SCREENSHOT_DIR}`);
    console.log(`Total files: ${fs.readdirSync(SCREENSHOT_DIR).length}`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
