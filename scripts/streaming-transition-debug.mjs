import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/tmp/streaming-debug';
const LOCAL_URL = 'http://localhost:5173';

// Simulated streaming data - incremental JSON chunks
const STREAMING_CHUNKS = [
  { style: 'Natural', emoji: '🗣️', text: 'こん' },
  { style: 'Natural', emoji: '🗣️', text: 'こんにちは' },
  { style: 'Natural', emoji: '🗣️', text: 'こんにちは、' },
  { style: 'Natural', emoji: '🗣️', text: 'こんにちは、元気' },
  { style: 'Natural', emoji: '🗣️', text: 'こんにちは、元気ですか？' },
  { style: 'Natural', emoji: '🗣️', text: 'こんにちは、元気ですか？', explanation: ['カジュアルな挨拶'] },
  { style: 'Natural', emoji: '🗣️', text: 'こんにちは、元気ですか？', explanation: ['カジュアルな挨拶', '日常会話で使用'] },
];

const FINAL_VARIANT = {
  style: 'Natural',
  emoji: '🗣️',
  text: 'こんにちは、元気ですか？',
  explanation: ['カジュアルな挨拶', '日常会話で使用'],
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Setup screenshot directory
  if (fs.existsSync(SCREENSHOT_DIR)) {
    fs.rmSync(SCREENSHOT_DIR, { recursive: true });
  }
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  console.log('Launching browser with CDP...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  const client = await page.createCDPSession();

  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(LOCAL_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(500);

    // Input text
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.type('Hello, how are you?', { delay: 5 });
    }
    await sleep(100);

    console.log('Starting CDP tracing with screenshots...');

    // Enable precise timestamps
    await client.send('Performance.enable');

    let frameIndex = 0;
    const captureFrame = async (label) => {
      const screenshot = await page.screenshot({
        encoding: 'binary',
        captureBeyondViewport: false
      });
      const filename = `${String(frameIndex).padStart(3, '0')}-${label}.png`;
      fs.writeFileSync(path.join(SCREENSHOT_DIR, filename), screenshot);
      frameIndex++;
    };

    // Phase 1: Initial state
    await captureFrame('initial');

    // Phase 2: Start translation (isTranslating = true, variants = [])
    await page.evaluate(() => {
      const store = window.__TRANSLATION_STORE__;
      if (store) {
        store.getState().setInputText('Hello, how are you?');
        store.getState().setIsTranslating(true);
        store.getState().setVariants([]);
        store.getState().setStreamingVariant(null);
      }
    });

    // Capture multiple frames during initial loading state
    for (let i = 0; i < 5; i++) {
      await sleep(16); // ~60fps
      await captureFrame(`loading-${i}`);
    }

    // Phase 3: Streaming chunks arrive
    console.log('Simulating streaming...');
    for (let i = 0; i < STREAMING_CHUNKS.length; i++) {
      const chunk = STREAMING_CHUNKS[i];
      await page.evaluate((c) => {
        const store = window.__TRANSLATION_STORE__;
        if (store) {
          store.getState().setStreamingVariant(c);
        }
      }, chunk);

      // Capture multiple frames per chunk to see animation
      for (let j = 0; j < 3; j++) {
        await sleep(16);
        await captureFrame(`stream-${i}-frame-${j}`);
      }
    }

    // Phase 4: Transition to final state (the critical part)
    console.log('Simulating transition to final state...');

    // Capture state just before transition
    await captureFrame('pre-transition');

    // Set final variants (this is where the bug was)
    await page.evaluate((variant) => {
      const store = window.__TRANSLATION_STORE__;
      if (store) {
        store.getState().setVariants([variant]);
      }
    }, FINAL_VARIANT);

    // Capture rapid frames during transition
    for (let i = 0; i < 10; i++) {
      await sleep(16);
      await captureFrame(`transition-${i}`);
    }

    // Phase 5: isTranslating = false
    await page.evaluate(() => {
      const store = window.__TRANSLATION_STORE__;
      if (store) {
        store.getState().setIsTranslating(false);
      }
    });

    // Capture frames after isTranslating becomes false
    for (let i = 0; i < 10; i++) {
      await sleep(16);
      await captureFrame(`post-translating-${i}`);
    }

    // Final state
    await sleep(200);
    await captureFrame('final');

    // Generate report
    const files = fs.readdirSync(SCREENSHOT_DIR).sort();
    console.log(`\n=== Screenshot Report ===`);
    console.log(`Directory: ${SCREENSHOT_DIR}`);
    console.log(`Total frames: ${files.length}`);
    console.log(`\nPhases captured:`);
    console.log(`  - Initial: 1 frame`);
    console.log(`  - Loading: 5 frames`);
    console.log(`  - Streaming: ${STREAMING_CHUNKS.length * 3} frames`);
    console.log(`  - Transition: 11 frames (pre + 10)`);
    console.log(`  - Post-translating: 10 frames`);
    console.log(`  - Final: 1 frame`);
    console.log(`\nKey frames to inspect:`);
    console.log(`  - pre-transition.png: Last streaming state`);
    console.log(`  - transition-0.png: First frame after setVariants()`);
    console.log(`  - post-translating-0.png: First frame after isTranslating=false`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
