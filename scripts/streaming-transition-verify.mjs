import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/home/ihasq/code/nanya/test-output/streaming-transition';
const LOCAL_URL = 'http://localhost:5173';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Clean and create screenshot directory
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

  // Enable CDP for performance tracing
  const client = await page.createCDPSession();

  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(LOCAL_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(500);

    let frameCount = 0;
    const captureFrame = async (label) => {
      const filename = `${String(frameCount).padStart(3, '0')}-${label}.png`;
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename) });
      console.log(`  [${frameCount}] ${label}`);
      frameCount++;
    };

    // === Phase 1: Initial state ===
    console.log('\n=== Phase 1: Initial State ===');
    await captureFrame('initial');

    // Type text in textarea
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.type('Hello, how are you?', { delay: 5 });
    }
    await captureFrame('text-entered');

    // === Phase 2: Start translation (simulate via store) ===
    console.log('\n=== Phase 2: Start Translation ===');

    await page.evaluate(() => {
      const store = window.__TRANSLATION_STORE__;
      if (store) {
        store.getState().setInputText('Hello, how are you?');
        store.getState().setVariants([]);
        store.getState().setStreamingVariant(null);
        store.getState().setIsTranslating(true);
      }
    });

    // Capture initial loading skeleton
    for (let i = 0; i < 3; i++) {
      await sleep(50);
      await captureFrame('loading-skeleton');
    }

    // === Phase 3: Streaming begins ===
    console.log('\n=== Phase 3: Streaming Content ===');

    const streamingSteps = [
      { text: 'こん', explanation: [] },
      { text: 'こんにちは', explanation: [] },
      { text: 'こんにちは、', explanation: [] },
      { text: 'こんにちは、元気', explanation: [] },
      { text: 'こんにちは、元気ですか？', explanation: [] },
      { text: 'こんにちは、元気ですか？', explanation: ['カジュアルな挨拶表現'] },
      { text: 'こんにちは、元気ですか？', explanation: ['カジュアルな挨拶表現', '日常会話で一般的'] },
    ];

    for (const step of streamingSteps) {
      await page.evaluate((data) => {
        const store = window.__TRANSLATION_STORE__;
        if (store) {
          store.getState().setStreamingVariant({
            style: 'ナチュラル',
            emoji: '🗣️',
            text: data.text,
            explanation: data.explanation,
          });
        }
      }, step);

      // Capture multiple frames per step to catch animation
      for (let i = 0; i < 2; i++) {
        await sleep(30);
        await captureFrame(`streaming-${step.text.length}chars`);
      }
    }

    // === Phase 4: Transition to final result (CRITICAL TEST) ===
    console.log('\n=== Phase 4: Transition to Final Result ===');
    console.log('    This is the critical moment - should NOT show double animation');

    // Final variant with exact same text as streamed
    const finalVariant = {
      style: 'ナチュラル',
      emoji: '🗣️',
      text: 'こんにちは、元気ですか？',
      explanation: ['カジュアルな挨拶表現', '日常会話で一般的'],
    };

    // Capture the exact moment of transition with high frequency
    await page.evaluate((variant) => {
      const store = window.__TRANSLATION_STORE__;
      if (store) {
        // This mimics what happens in App.tsx when translation completes
        store.getState().setVariants([variant]);
        store.getState().setIsTranslating(false);
        // Note: setStreamingVariant(null) is NOT called (per our fix)
      }
    }, finalVariant);

    // Capture many frames to detect any flickering/double animation
    for (let i = 0; i < 10; i++) {
      await sleep(30);
      await captureFrame('transition');
    }

    // === Phase 5: Final stable state ===
    console.log('\n=== Phase 5: Final Stable State ===');
    await sleep(200);
    await captureFrame('final-stable');

    // === Phase 6: Start new translation (should clear streamingVariant) ===
    console.log('\n=== Phase 6: New Translation (verify cleanup) ===');

    await page.evaluate(() => {
      const store = window.__TRANSLATION_STORE__;
      if (store) {
        store.getState().setVariants([]);
        store.getState().setStreamingVariant(null);
        store.getState().setIsTranslating(true);
      }
    });

    await sleep(100);
    await captureFrame('new-translation-start');

    // Summary
    console.log(`\n=== Summary ===`);
    console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
    console.log(`Total frames: ${frameCount}`);

    const files = fs.readdirSync(SCREENSHOT_DIR);
    console.log(`\nFrame sequence:`);
    files.forEach(f => console.log(`  ${f}`));

    console.log('\n=== Visual Inspection Guide ===');
    console.log('1. Check frames 000-002: Initial and text entry');
    console.log('2. Check frames 003-005: Loading skeleton appears');
    console.log('3. Check streaming frames: Text should grow incrementally');
    console.log('4. Check transition frames: Card should NOT disappear and reappear');
    console.log('5. Check final frames: Stable result with action buttons');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
