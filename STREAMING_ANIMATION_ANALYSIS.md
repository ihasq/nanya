# ストリーミングアニメーション問題分析レポート

## 報告された問題

1. **最初のターン**: フェードインなし、カクカクとストリーミング表示
2. **2ターン目以降**: カクカクとストリーミング → クリア → 滑らかなフェードイン再レンダリング

## 調査方法

- CDPによる500msティックでのスクリーンショット取得
- 実際のzustandストア動作を再現するテストページ作成
- ResultsPanelの正確な条件分岐を再現

## 根本原因の特定

### 1. `animate-in` クラスの動作タイミング問題

```tsx
// StreamingVariantCard (ResultsPanel.tsx)
<Card className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
```

**問題**: `animate-in` はコンポーネントのマウント時に一度だけ実行される。
- アニメーション時間: 300ms
- しかし、マウント直後はコンテンツがまだ空または最小限
- アニメーションが完了した後にコンテンツが徐々に追加される
- 結果: ユーザーにはアニメーションが見えない

### 2. `StreamingText` コンポーネントの効果が微弱

```tsx
// StreamingText (ResultsPanel.tsx)
function StreamingText({ text, className }: { text: string; className?: string }) {
  // ...
  return (
    <p className={`transition-opacity duration-150 ${isAnimating ? 'opacity-90' : 'opacity-100'} ...`}>
      {displayText}
    </p>
  )
}
```

**問題**: 不透明度が0.9→1.0の変化のみ（わずか10%の差）
- 人間の目にはほぼ検知できない
- テキスト自体は瞬時に置換される（アニメーションなし）

### 3. 1ターン目 vs 2ターン目の違い

#### 1ターン目のタイムライン:
```
T+0ms:   setIsTranslating(true)
T+0ms:   setVariants([]) → streamingVariant も null に
T+0ms:   showResultsView = true → ResultsPanel マウント
T+0ms:   showInitialLoading = true → スケルトン表示
T+~50ms: setStreamingVariant(data) → StreamingVariantCard マウント
         └─ animate-in 開始 (300ms)
T+~100ms: テキスト更新 "こん"
T+~200ms: テキスト更新 "こんにちは"
T+~300ms: animate-in 完了 (この時点で既にコンテンツ更新中)
T+~500ms: テキスト更新 "こんにちは、元気ですか？"
T+~800ms: setVariants([FINAL]) → VariantCard に切り替え
```

**結果**: アニメーションとコンテンツ更新が重なり、滑らかさが失われる

#### 2ターン目のタイムライン:
```
T+0ms:   前ターンの VariantCard が表示中
T+0ms:   setIsTranslating(true)
T+0ms:   setVariants([]) → 前ターンの VariantCard アンマウント ★可視★
T+~50ms: setStreamingVariant(data) → 新 StreamingVariantCard マウント ★可視★
         └─ animate-in 開始
...ストリーミング更新（カクカク）...
T+~800ms: setVariants([FINAL])
          └─ StreamingVariantCard アンマウント ★可視★
          └─ VariantCard マウント with stream-fade-in ★可視★
```

**結果**: 前のカードの消失 → 新しいカードの出現が明確に見える

## 問題の本質

| 要素 | 現状 | 理想 |
|-----|-----|-----|
| カードマウント | 300ms fade-in (空コンテンツ時に実行) | コンテンツ到着後に実行 |
| テキスト更新 | opacity 90%→100% (微弱) | 文字ごとにfade-in |
| 説明項目追加 | animate-in (マウント時のみ) | 各項目が追加時にfade-in |

## 証拠スクリーンショット

### 1ターン目
- `02-first-turn-00.png`: StreamingVariantCard即座に表示（animate-in実行中だがコンテンツ少）
- `02-first-turn-03.png`: テキスト更新完了（アニメーションは既に終了）

### 2ターン目
- `04-second-turn-00.png`: variants.length=0（前ターンクリア済）、新カードマウント
- `05-second-turn-complete.png`: 最終VariantCard表示（stream-fade-inが効いている）

## 技術的詳細

### setVariants の副作用 (translation-store.ts:60)
```typescript
setVariants: (variants) => set({ variants, backTranslation: null, streamingVariant: null }),
```
`setVariants([])` は `streamingVariant` も null にリセットする。
これにより一瞬 `showInitialLoading` が true になるが、即座に新しい streaming data が来る。

### ResultsPanel の条件分岐 (ResultsPanel.tsx:329-333)
```typescript
const showStreamingCard = isTranslating && streamingVariant && streamingVariant.text
const showInitialLoading = isTranslating && !showStreamingCard && variants.length === 0
```

## 結論

**「カクカク」の原因**: テキスト更新時にアニメーションがない（opacity変化が微弱すぎる）

**「1ターン目でフェードインなし」の原因**:
- animate-in は実行されているが、空コンテンツ時に完了
- ユーザーが見る頃にはアニメーション終了済み

**「2ターン目でクリア→フェードイン」が見える理由**:
- 前ターンのカード消失が可視
- 新カードのマウントアニメーションが相対的に目立つ
- 最終 VariantCard の stream-fade-in が効果的に機能

---
*Generated: 2026-04-13*
*Test files: streaming-debug.tsx, streaming-debug-real.tsx*
*Screenshots: debug-screenshots/, debug-screenshots-real/*
