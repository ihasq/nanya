import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const LOCAL_URL = 'http://localhost:5173';
const TICK = 500; // 500ms tick for slow-motion testing
const SCREENSHOT_DIR = '/tmp/verify-3turn';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getCardStates(page) {
  return page.evaluate(() => {
    const cards = document.querySelectorAll('[data-slot="card"]');
    return Array.from(cards).map((card, i) => {
      const styleLabel = card.querySelector('.text-sm.font-medium')?.textContent || 'unknown';
      return {
        index: i,
        style: styleLabel,
        hasStreamFadeIn: card.classList.contains('stream-fade-in'),
        opacity: parseFloat(getComputedStyle(card).opacity).toFixed(2),
        testId: card.getAttribute('data-test-id')
      };
    });
  });
}

async function markCards(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[data-slot="card"]').forEach((card, i) => {
      if (!card.getAttribute('data-test-id')) {
        card.setAttribute('data-test-id', `card-${Date.now()}-${i}-${Math.random().toString(36).slice(2,6)}`);
      }
    });
  });
}

let frameNum = 0;

async function capture(page, label) {
  const states = await getCardStates(page);
  const filename = `${String(frameNum).padStart(3, '0')}-${label}.png`;
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename) });

  const stateStr = states.map(s => `${s.style}(fade=${s.hasStreamFadeIn},op=${s.opacity})`).join(', ');
  console.log(`  [${frameNum}] ${label}: ${stateStr || '(no cards)'}`);

  frameNum++;
  return states;
}

async function main() {
  console.log('='.repeat(70));
  console.log('3ターン会話テスト (500ms tick スローモーション)');
  console.log('='.repeat(70));
  console.log(`TICK: ${TICK}ms`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}`);

  // Setup screenshot directory
  if (fs.existsSync(SCREENSHOT_DIR)) {
    fs.rmSync(SCREENSHOT_DIR, { recursive: true });
  }
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const results = { passed: 0, failed: 0 };

  function check(condition, passMsg, failMsg) {
    if (condition) {
      console.log('    ✓ ' + passMsg);
      results.passed++;
    } else {
      console.log('    ✗ ' + failMsg);
      results.failed++;
    }
  }

  try {
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(LOCAL_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(TICK);

    await capture(page, 'initial');

    // ============================================================
    // ターン1: 初回翻訳
    // ============================================================
    console.log('\n' + '='.repeat(50));
    console.log('【ターン1】初回翻訳');
    console.log('='.repeat(50));

    // 1-1: 翻訳開始
    console.log('\n[1-1] ストリーミング開始');
    await page.evaluate(() => {
      const store = window.__TRANSLATION_STORE__;
      store.getState().setInputText('Hello, how are you?');
      store.getState().setIsTranslating(true);
      store.getState().setStreamingVariant({
        style: 'Natural',
        emoji: '🗣️',
        text: 'こんにちは'
      });
    });
    await sleep(TICK);
    await capture(page, 't1-streaming-1');

    // 1-2: ストリーミング更新
    console.log('[1-2] ストリーミング更新');
    await page.evaluate(() => {
      const store = window.__TRANSLATION_STORE__;
      store.getState().setStreamingVariant({
        style: 'Natural',
        emoji: '🗣️',
        text: 'こんにちは、元気ですか？',
        explanation: ['カジュアルな挨拶']
      });
    });
    await sleep(TICK);
    await capture(page, 't1-streaming-2');

    // 1-3: 翻訳完了
    console.log('[1-3] 翻訳完了');
    await page.evaluate(() => {
      const store = window.__TRANSLATION_STORE__;
      store.getState().setVariants([{
        style: 'Natural',
        emoji: '🗣️',
        text: 'こんにちは、元気ですか？',
        explanation: ['カジュアルな挨拶']
      }]);
      store.getState().setIsTranslating(false);
      store.getState().setStreamingVariant(null);
    });
    await sleep(TICK);
    await markCards(page);
    let states = await capture(page, 't1-complete');

    console.log('\n  検証:');
    check(states.length === 1, '1カードが存在', `カード数: ${states.length}`);
    check(states[0]?.opacity === '1.00', 'アニメーション完了', `opacity=${states[0]?.opacity}`);

    const turn1CardId = states[0]?.testId;

    // ============================================================
    // ターン2: スタイル調整（1回目）
    // ============================================================
    console.log('\n' + '='.repeat(50));
    console.log('【ターン2】スタイル調整 → Polite');
    console.log('='.repeat(50));

    // 2-1: 調整開始
    console.log('\n[2-1] 調整ストリーミング開始');
    await page.evaluate(() => {
      const store = window.__TRANSLATION_STORE__;
      store.getState().setIsAdjusting(true);
      store.getState().setStreamingAdjustment({
        style: 'Polite',
        emoji: '🤓',
        text: 'こんにちは'
      });
    });
    await sleep(TICK);
    states = await capture(page, 't2-streaming-1');

    const naturalT2S1 = states.find(s => s.style === 'Natural');
    console.log('\n  検証 (ストリーミング中):');
    check(
      naturalT2S1?.hasStreamFadeIn === false && naturalT2S1?.opacity === '1.00',
      'Natural: 再アニメーションなし',
      `Natural: fade=${naturalT2S1?.hasStreamFadeIn}, opacity=${naturalT2S1?.opacity}`
    );

    // 2-2: ストリーミング更新
    console.log('\n[2-2] ストリーミング更新');
    await page.evaluate(() => {
      const store = window.__TRANSLATION_STORE__;
      store.getState().setStreamingAdjustment({
        style: 'Polite',
        emoji: '🤓',
        text: 'こんにちは、お元気でいらっしゃいますか？',
        explanation: ['丁寧な表現']
      });
    });
    await sleep(TICK);
    states = await capture(page, 't2-streaming-2');

    const naturalT2S2 = states.find(s => s.style === 'Natural');
    console.log('\n  検証 (ストリーミング更新後):');
    check(
      naturalT2S2?.hasStreamFadeIn === false && naturalT2S2?.opacity === '1.00',
      'Natural: 依然として安定',
      `Natural: fade=${naturalT2S2?.hasStreamFadeIn}, opacity=${naturalT2S2?.opacity}`
    );

    // 2-3: 調整完了
    console.log('\n[2-3] 調整完了');
    await page.evaluate(() => {
      const store = window.__TRANSLATION_STORE__;
      store.getState().addVariants([{
        style: 'Polite',
        emoji: '🤓',
        text: 'こんにちは、お元気でいらっしゃいますか？',
        explanation: ['丁寧な表現']
      }]);
      store.getState().setIsAdjusting(false);
      store.getState().setStreamingAdjustment(null);
    });
    await sleep(TICK);
    await markCards(page);
    states = await capture(page, 't2-complete');

    const naturalT2C = states.find(s => s.style === 'Natural');
    const politeT2C = states.find(s => s.style === 'Polite');

    console.log('\n  検証 (完了後):');
    check(states.length === 2, '2カードが存在', `カード数: ${states.length}`);
    check(naturalT2C?.testId === turn1CardId, 'Natural: DOM再利用', 'Natural: DOM再作成!');
    check(naturalT2C?.hasStreamFadeIn === false, 'Natural: 再アニメーションなし', `Natural: fade=${naturalT2C?.hasStreamFadeIn}`);
    check(politeT2C?.opacity === '1.00', 'Polite: アニメーション完了', `Polite: opacity=${politeT2C?.opacity}`);

    const turn2CardIds = {
      natural: naturalT2C?.testId,
      polite: politeT2C?.testId
    };

    // ============================================================
    // ターン3: スタイル調整（2回目）
    // ============================================================
    console.log('\n' + '='.repeat(50));
    console.log('【ターン3】スタイル調整 → Casual');
    console.log('='.repeat(50));

    // 3-1: 調整開始
    console.log('\n[3-1] 調整ストリーミング開始');
    await page.evaluate(() => {
      const store = window.__TRANSLATION_STORE__;
      store.getState().setIsAdjusting(true);
      store.getState().setStreamingAdjustment({
        style: 'Casual',
        emoji: '😎',
        text: 'よっ'
      });
    });
    await sleep(TICK);
    states = await capture(page, 't3-streaming-1');

    const naturalT3S1 = states.find(s => s.style === 'Natural');
    const politeT3S1 = states.find(s => s.style === 'Polite');

    console.log('\n  検証 (ストリーミング中):');
    check(
      naturalT3S1?.hasStreamFadeIn === false && naturalT3S1?.opacity === '1.00',
      'Natural: 安定',
      `Natural: fade=${naturalT3S1?.hasStreamFadeIn}, opacity=${naturalT3S1?.opacity}`
    );
    check(
      politeT3S1?.hasStreamFadeIn === false && politeT3S1?.opacity === '1.00',
      'Polite: 安定',
      `Polite: fade=${politeT3S1?.hasStreamFadeIn}, opacity=${politeT3S1?.opacity}`
    );

    // 3-2: ストリーミング更新
    console.log('\n[3-2] ストリーミング更新');
    await page.evaluate(() => {
      const store = window.__TRANSLATION_STORE__;
      store.getState().setStreamingAdjustment({
        style: 'Casual',
        emoji: '😎',
        text: 'よっ、元気？',
        explanation: ['とてもカジュアル']
      });
    });
    await sleep(TICK);
    states = await capture(page, 't3-streaming-2');

    const naturalT3S2 = states.find(s => s.style === 'Natural');
    const politeT3S2 = states.find(s => s.style === 'Polite');

    console.log('\n  検証 (ストリーミング更新後):');
    check(
      naturalT3S2?.hasStreamFadeIn === false && naturalT3S2?.opacity === '1.00',
      'Natural: 依然として安定',
      `Natural: fade=${naturalT3S2?.hasStreamFadeIn}, opacity=${naturalT3S2?.opacity}`
    );
    check(
      politeT3S2?.hasStreamFadeIn === false && politeT3S2?.opacity === '1.00',
      'Polite: 依然として安定',
      `Polite: fade=${politeT3S2?.hasStreamFadeIn}, opacity=${politeT3S2?.opacity}`
    );

    // 3-3: 調整完了
    console.log('\n[3-3] 調整完了');
    await page.evaluate(() => {
      const store = window.__TRANSLATION_STORE__;
      store.getState().addVariants([{
        style: 'Casual',
        emoji: '😎',
        text: 'よっ、元気？',
        explanation: ['とてもカジュアル']
      }]);
      store.getState().setIsAdjusting(false);
      store.getState().setStreamingAdjustment(null);
    });
    await sleep(TICK);
    await markCards(page);
    states = await capture(page, 't3-complete');

    const naturalFinal = states.find(s => s.style === 'Natural');
    const politeFinal = states.find(s => s.style === 'Polite');
    const casualFinal = states.find(s => s.style === 'Casual');

    console.log('\n  検証 (最終状態):');
    check(states.length === 3, '3カードが存在', `カード数: ${states.length}`);
    check(naturalFinal?.testId === turn2CardIds.natural, 'Natural: DOM再利用', 'Natural: DOM再作成!');
    check(politeFinal?.testId === turn2CardIds.polite, 'Polite: DOM再利用', 'Polite: DOM再作成!');
    check(naturalFinal?.hasStreamFadeIn === false, 'Natural: 再アニメーションなし', `Natural: fade=${naturalFinal?.hasStreamFadeIn}`);
    check(politeFinal?.hasStreamFadeIn === false, 'Polite: 再アニメーションなし', `Polite: fade=${politeFinal?.hasStreamFadeIn}`);
    check(casualFinal?.opacity === '1.00', 'Casual: アニメーション完了', `Casual: opacity=${casualFinal?.opacity}`);

    // ============================================================
    // 最終結果
    // ============================================================
    console.log('\n' + '='.repeat(70));
    console.log('最終結果');
    console.log('='.repeat(70));
    console.log(`\n  TICK: ${TICK}ms`);
    console.log(`  フレーム数: ${frameNum}`);
    console.log(`  合格: ${results.passed}`);
    console.log(`  失敗: ${results.failed}`);
    console.log(`\n  Screenshots: ${SCREENSHOT_DIR}`);

    if (results.failed === 0) {
      console.log('\n✓ 全テスト合格: 3ターン会話で再アニメーション問題なし!');
    } else {
      console.log('\n✗ 一部テスト失敗: 問題が残っています');
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
