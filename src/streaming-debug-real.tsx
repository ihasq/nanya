/**
 * Streaming Debug - Real Store Test
 *
 * This test uses the actual zustand store and ResultsPanel-like logic
 * to reproduce the exact behavior in production.
 */

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { create } from 'zustand'

// Local version of store to replicate exact behavior
interface PartialVariant {
  style?: string
  emoji?: string
  text?: string
  explanation?: string[]
}

interface TranslationVariant {
  style: string
  emoji: string
  text: string
  explanation?: string[]
}

interface TestState {
  variants: TranslationVariant[]
  streamingVariant: PartialVariant | null
  isTranslating: boolean
  setVariants: (variants: TranslationVariant[]) => void
  setStreamingVariant: (variant: PartialVariant | null) => void
  setIsTranslating: (isTranslating: boolean) => void
  reset: () => void
}

const useTestStore = create<TestState>((set) => ({
  variants: [],
  streamingVariant: null,
  isTranslating: false,
  setVariants: (variants) => set({ variants, streamingVariant: null }),
  setStreamingVariant: (variant) => set({ streamingVariant: variant }),
  setIsTranslating: (isTranslating) => set({ isTranslating }),
  reset: () => set({ variants: [], streamingVariant: null, isTranslating: false }),
}))

// Exact copy of StreamingText from ResultsPanel
function StreamingText({ text, className }: { text: string; className?: string }) {
  const [displayText, setDisplayText] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (text !== displayText) {
      setIsAnimating(true)
      setDisplayText(text)
      const timer = setTimeout(() => setIsAnimating(false), 150)
      return () => clearTimeout(timer)
    }
  }, [text, displayText])

  return (
    <p className={`transition-opacity duration-150 ${isAnimating ? 'opacity-90' : 'opacity-100'} ${className || ''}`}>
      {displayText}
    </p>
  )
}

// Exact copy of StreamingVariantCard from ResultsPanel
function StreamingVariantCard({ variant }: { variant: PartialVariant }) {
  const [prevExpCount, setPrevExpCount] = useState(0)
  const expCount = variant.explanation?.length || 0

  useEffect(() => {
    if (expCount > prevExpCount) {
      setPrevExpCount(expCount)
    }
  }, [expCount, prevExpCount])

  return (
    <Card className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3 animate-in fade-in duration-200 fill-mode-both">
          <span className="text-lg">{variant.emoji || '📝'}</span>
          <span className="text-sm font-medium bg-muted px-2 py-0.5 rounded">
            {variant.style || 'Translation'}
          </span>
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />
        </div>

        {variant.text && (
          <StreamingText text={variant.text} className="text-lg mb-4" />
        )}

        {variant.explanation && variant.explanation.length > 0 && (
          <ul className="space-y-1 mb-4">
            {variant.explanation.map((exp, i) => (
              <li
                key={`exp-${i}-${exp.slice(0, 20)}`}
                className="flex items-start gap-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-200 fill-mode-both"
              >
                <span className="text-primary mt-1.5">•</span>
                <span>{exp}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

// Final variant card (exact copy from ResultsPanel VariantCard structure)
function VariantCard({ variant }: { variant: TranslationVariant }) {
  return (
    <Card className="mb-4 stream-fade-in">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{variant.emoji}</span>
          <span className="text-sm font-medium bg-muted px-2 py-0.5 rounded">
            {variant.style}
          </span>
        </div>

        <p className="text-lg mb-4">{variant.text}</p>

        {variant.explanation && variant.explanation.length > 0 && (
          <ul className="space-y-1 mb-4">
            {variant.explanation.map((exp, i) => (
              <li
                key={`${i}-${exp.slice(0, 10)}`}
                className="flex items-start gap-2 text-sm text-muted-foreground stream-fade-in"
                style={{ animationDelay: `${100 + i * 50}ms` }}
              >
                <span className="text-primary mt-1.5">•</span>
                <span>{exp}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

// Streaming simulation data
const STREAMING_STEPS: PartialVariant[] = [
  { style: 'Natural', emoji: '🗣️', text: 'こん' },
  { style: 'Natural', emoji: '🗣️', text: 'こんにちは' },
  { style: 'Natural', emoji: '🗣️', text: 'こんにちは、' },
  { style: 'Natural', emoji: '🗣️', text: 'こんにちは、元気' },
  { style: 'Natural', emoji: '🗣️', text: 'こんにちは、元気ですか？' },
  { style: 'Natural', emoji: '🗣️', text: 'こんにちは、元気ですか？', explanation: ['カジュアルな挨拶'] },
  { style: 'Natural', emoji: '🗣️', text: 'こんにちは、元気ですか？', explanation: ['カジュアルな挨拶', '日常会話で使用'] },
]

const FINAL_VARIANT: TranslationVariant = {
  style: 'Natural',
  emoji: '🗣️',
  text: 'こんにちは、元気ですか？',
  explanation: ['カジュアルな挨拶', '日常会話で使用'],
}

// Exact replica of ResultsPanel logic
function ResultsPanelReplica() {
  const {
    variants,
    streamingVariant,
    isTranslating,
  } = useTestStore()

  // Show streaming variant during initial translation
  // EXACT condition from ResultsPanel.tsx line 329:
  // const showStreamingCard = isTranslating && streamingVariant && streamingVariant.text
  const showStreamingCard = isTranslating && streamingVariant && streamingVariant.text

  // Show initial loading state (translating but no streaming content yet)
  // EXACT condition from ResultsPanel.tsx line 333:
  // const showInitialLoading = isTranslating && !showStreamingCard && variants.length === 0
  const showInitialLoading = isTranslating && !showStreamingCard && variants.length === 0

  return (
    <div className="border rounded-lg p-4 min-h-[400px] bg-card">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        ResultsPanel Replica (exact logic):
      </h3>

      <div className="mb-2 p-2 bg-secondary/50 rounded text-xs font-mono">
        showStreamingCard: {showStreamingCard ? 'true' : 'false'} |
        showInitialLoading: {showInitialLoading ? 'true' : 'false'} |
        variants.length: {variants.length}
      </div>

      {/* Initial Loading State - EXACT from ResultsPanel.tsx lines 366-378 */}
      {showInitialLoading && (
        <Card className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '100ms' }}>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-3 w-48 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Streaming Card - EXACT from ResultsPanel.tsx lines 380-384 */}
      {/* NOTE: The condition is: showStreamingCard && variants.length === 0 */}
      {showStreamingCard && variants.length === 0 && (
        <StreamingVariantCard variant={streamingVariant} />
      )}

      {/* Variant Cards - EXACT from ResultsPanel.tsx lines 386-393 */}
      {variants.map((variant, index) => (
        <VariantCard
          key={`${variant.style}-${index}`}
          variant={variant}
        />
      ))}
    </div>
  )
}

export default function StreamingDebugRealPage() {
  const {
    variants,
    streamingVariant,
    isTranslating,
    setVariants,
    setStreamingVariant,
    setIsTranslating,
    reset,
  } = useTestStore()

  const [turnCount, setTurnCount] = useState(0)
  const [debugLog, setDebugLog] = useState<string[]>([])

  const log = (msg: string) => {
    const timestamp = new Date().toISOString().slice(11, 23)
    setDebugLog(prev => [...prev.slice(-30), `[${timestamp}] ${msg}`])
    console.log(`[DEBUG] ${msg}`)
  }

  // Simulate the EXACT translation flow from App.tsx handleTranslate
  const simulateTranslation = async () => {
    const turn = turnCount + 1
    log(`=== Starting Turn ${turn} ===`)

    // EXACT from App.tsx lines 57-60:
    // setIsTranslating(true)
    // setError(null)
    // setVariants([])
    // setStreamingVariant(null)
    log('setIsTranslating(true)')
    setIsTranslating(true)

    log('setVariants([])')
    setVariants([])  // NOTE: This also sets streamingVariant to null!

    // Wait a bit to simulate network delay
    await new Promise(r => setTimeout(r, 200))

    // Simulate streaming - EXACT from App.tsx line 70-72:
    // onPartialResult: (partial) => { setStreamingVariant(partial) }
    for (let i = 0; i < STREAMING_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 300))
      log(`setStreamingVariant step ${i + 1}: "${STREAMING_STEPS[i].text?.slice(0, 10)}..."`)
      setStreamingVariant({ ...STREAMING_STEPS[i] })
    }

    // Complete - EXACT from App.tsx line 74:
    // setVariants(result.variants)
    await new Promise(r => setTimeout(r, 300))
    log('setVariants([FINAL_VARIANT])')
    setVariants([FINAL_VARIANT])

    // Finally block - EXACT from App.tsx lines 88-92:
    // setIsTranslating(false)
    // setStreamingVariant(null)  <- This was commented out but may have been there before
    log('setIsTranslating(false)')
    setIsTranslating(false)

    // NOTE: In App.tsx, there's a comment saying:
    // "Don't clear streamingVariant here - keep it for transition detection"
    // But setVariants already clears it! Check line 60 of translation-store.ts:
    // setVariants: (variants) => set({ variants, backTranslation: null, streamingVariant: null }),

    setTurnCount(turn)
    log(`=== Turn ${turn} Complete ===`)
  }

  const handleReset = () => {
    reset()
    setTurnCount(0)
    setDebugLog([])
    log('Reset')
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Streaming Debug - Real Store Behavior</h1>

        <div className="mb-6 p-4 bg-muted rounded-lg">
          <h2 className="font-semibold mb-2">This test replicates:</h2>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Exact zustand store behavior</li>
            <li>• Exact ResultsPanel rendering conditions</li>
            <li>• Exact App.tsx handleTranslate flow</li>
          </ul>
        </div>

        {/* Control buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            id="start-first-turn"
            onClick={simulateTranslation}
            disabled={isTranslating || turnCount >= 1}
          >
            Start First Turn
          </Button>
          <Button
            id="start-second-turn"
            onClick={simulateTranslation}
            disabled={isTranslating || turnCount < 1 || turnCount >= 2}
          >
            Start Second Turn
          </Button>
          <Button
            id="start-third-turn"
            onClick={simulateTranslation}
            disabled={isTranslating || turnCount < 2 || turnCount >= 3}
          >
            Start Third Turn
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>

        {/* Status indicator */}
        <div className="mb-4 p-2 bg-secondary rounded text-sm">
          <span className="font-mono">
            Turn: {turnCount} |
            isTranslating: {isTranslating ? 'YES' : 'NO'} |
            variants.length: {variants.length} |
            streamingVariant: {streamingVariant ? 'SET' : 'NULL'}
          </span>
        </div>

        {/* ResultsPanel replica */}
        <ResultsPanelReplica />

        {/* Debug log */}
        <div className="mt-6 p-4 bg-black text-green-400 rounded-lg font-mono text-xs max-h-[300px] overflow-y-auto">
          <h3 className="text-white mb-2">Debug Log (State Changes):</h3>
          {debugLog.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
          {debugLog.length === 0 && <div className="text-gray-500">No logs yet...</div>}
        </div>
      </div>
    </div>
  )
}
