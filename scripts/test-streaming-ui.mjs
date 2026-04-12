import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/home/ihasq/code/nanya/screenshots';
const BASE_URL = 'http://localhost:5173/test/streaming';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Clean and create screenshots directory
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
  await page.setViewport({ width: 800, height: 900 });

  console.log('📄 Navigating to test page...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await sleep(500);

  // Screenshot: Initial state
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-initial.png') });
  console.log('📸 Screenshot 1: Initial state');

  // Get test info
  const stepIndicator = await page.$eval('[data-testid="step-indicator"]', el => el.textContent);
  console.log(`   ${stepIndicator}`);

  // Click "Auto Run" to start streaming test
  console.log('\n▶️ Starting auto streaming test...');
  await page.click('[data-testid="btn-auto"]');

  // Capture screenshots during streaming
  const totalSteps = 7;
  for (let i = 0; i < totalSteps; i++) {
    await sleep(350); // Slightly longer than the 300ms delay in test page

    const screenshot = `02-step-${String(i + 1).padStart(2, '0')}.png`;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, screenshot) });

    // Get current state info
    const state = await page.evaluate(() => {
      const text = document.querySelector('[data-testid="text"]')?.textContent || null;
      const explanations = document.querySelectorAll('[data-testid^="explanation-"]').length;
      const loading = !!document.querySelector('[data-testid="loading"]');
      return { text: text?.slice(0, 30), explanations, loading };
    });

    console.log(`📸 Screenshot ${i + 2}: Step ${i + 1}`);
    console.log(`   Text: "${state.text || '(none)'}${state.text && state.text.length >= 30 ? '...' : ''}"`);
    console.log(`   Explanations: ${state.explanations}`);
    console.log(`   Loading: ${state.loading}`);
  }

  // Wait for completion
  await sleep(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-complete.png') });
  console.log('\n📸 Screenshot: Complete state');

  // Verify final state
  const finalState = await page.evaluate(() => {
    return {
      text: document.querySelector('[data-testid="text"]')?.textContent || null,
      explanations: document.querySelectorAll('[data-testid^="explanation-"]').length,
      loading: !!document.querySelector('[data-testid="loading"]'),
      logs: document.querySelector('[data-testid="logs"]')?.textContent || ''
    };
  });

  console.log('\n📊 Final State Verification:');
  console.log(`   Text: "${finalState.text}"`);
  console.log(`   Explanations: ${finalState.explanations}`);
  console.log(`   Loading indicator: ${finalState.loading ? '❌ Still showing' : '✅ Hidden'}`);

  // Test manual stepping
  console.log('\n🔧 Testing manual stepping...');
  await page.click('[data-testid="btn-reset"]');
  await sleep(200);

  // Step through manually
  for (let i = 0; i < 3; i++) {
    await page.click('[data-testid="btn-next"]');
    await sleep(100);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-manual-step-3.png') });
  console.log('📸 Screenshot: Manual step 3');

  // Step back
  await page.click('[data-testid="btn-prev"]');
  await sleep(100);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-manual-step-back.png') });
  console.log('📸 Screenshot: Step back');

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✅ Streaming UI Test Complete!');
  console.log('='.repeat(50));
  console.log('\nScreenshots saved to:', SCREENSHOT_DIR);
  console.log('\nFiles:');
  fs.readdirSync(SCREENSHOT_DIR).forEach(f => console.log(`  - ${f}`));

  // Verify assertions
  console.log('\n📋 Test Results:');
  const passed = [];
  const failed = [];

  if (finalState.text === 'Hello, this is a test translation.') {
    passed.push('Text renders correctly');
  } else {
    failed.push(`Text mismatch: "${finalState.text}"`);
  }

  if (finalState.explanations === 3) {
    passed.push('All 3 explanations rendered');
  } else {
    failed.push(`Explanation count: ${finalState.explanations} (expected 3)`);
  }

  if (!finalState.loading) {
    passed.push('Loading indicator hidden on complete');
  } else {
    failed.push('Loading indicator still visible');
  }

  passed.forEach(p => console.log(`  ✅ ${p}`));
  failed.forEach(f => console.log(`  ❌ ${f}`));

  if (failed.length > 0) {
    console.log('\n⚠️  Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
  }
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
