/**
 * Streaming Debug Test Page
 *
 * This page replicates the exact component structure from ResultsPanel
 * to diagnose streaming animation issues:
 *
 * Issue reported:
 * - First turn: No fade-in, choppy streaming
 * - Second turn+: Choppy streaming first, then clears and re-renders with smooth fade-in
 */

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

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
interface PartialVariant {
  style?: string
  emoji?: string
  text?: string
  explanation?: string[]
}

function StreamingVariantCard({ variant, isAdjustment }: { variant: PartialVariant; isAdjustment?: boolean }) {
  const [prevExpCount, setPrevExpCount] = useState(0)
  const expCount = variant.explanation?.length || 0

  useEffect(() => {
    if (expCount > prevExpCount) {
      setPrevExpCount(expCount)
    }
  }, [expCount, prevExpCount])

  return (
    <Card className={`mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both ${isAdjustment ? 'border-dashed border-primary/50' : ''}`}>
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

// Final variant card (after streaming completes)
function FinalVariantCard({ variant }: { variant: PartialVariant }) {
  return (
    <Card className="mb-4 stream-fade-in">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{variant.emoji || '📝'}</span>
          <span className="text-sm font-medium bg-muted px-2 py-0.5 rounded">
            {variant.style || 'Translation'}
          </span>
        </div>

        <p className="text-lg mb-4">{variant.text}</p>

        {variant.explanation && variant.explanation.length > 0 && (
          <ul className="space-y-1 mb-4">
            {variant.explanation.map((exp, i) => (
              <li
                key={`final-exp-${i}`}
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

// Dummy streaming data
const STREAMING_STEPS = [
  { style: 'Natural', emoji: '🗣️', text: 'こん' },
  { style: 'Natural', emoji: '🗣️', text: 'こんにちは' },
  { style: 'Natural', emoji: '🗣️', text: 'こんにちは、' },
  { style: 'Natural', emoji: '🗣️', text: 'こんにちは、元気' },
  { style: 'Natural', emoji: '🗣️', text: 'こんにちは、元気ですか？' },
  { style: 'Natural', emoji: '🗣️', text: 'こんにちは、元気ですか？', explanation: ['カジュアルな挨拶'] },
  { style: 'Natural', emoji: '🗣️', text: 'こんにちは、元気ですか？', explanation: ['カジュアルな挨拶', '日常会話で使用'] },
]

const FINAL_VARIANT = {
  style: 'Natural',
  emoji: '🗣️',
  text: 'こんにちは、元気ですか？',
  explanation: ['カジュアルな挨拶', '日常会話で使用'],
}

export default function StreamingDebugPage() {
  // State to track conversation turns
  const [turns, setTurns] = useState<Array<{ type: 'final' | 'streaming'; variant: PartialVariant }>>([])
  const [currentStreaming, setCurrentStreaming] = useState<PartialVariant | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [turnCount, setTurnCount] = useState(0)
  const [debugLog, setDebugLog] = useState<string[]>([])

  const log = (msg: string) => {
    const timestamp = new Date().toISOString().slice(11, 23)
    setDebugLog(prev => [...prev.slice(-20), `[${timestamp}] ${msg}`])
    console.log(`[DEBUG] ${msg}`)
  }

  const simulateStreaming = async () => {
    const currentTurn = turnCount + 1
    log(`Starting turn ${currentTurn}`)
    setIsStreaming(true)
    setCurrentStreaming(null)

    // Simulate streaming steps
    for (let i = 0; i < STREAMING_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 300))
      log(`Turn ${currentTurn} - Stream step ${i + 1}/${STREAMING_STEPS.length}`)
      setCurrentStreaming({ ...STREAMING_STEPS[i] })
    }

    // Complete streaming
    await new Promise(r => setTimeout(r, 500))
    log(`Turn ${currentTurn} - Streaming complete, adding to turns`)

    // Add to turns array and clear streaming
    setTurns(prev => [...prev, { type: 'final', variant: FINAL_VARIANT }])
    setCurrentStreaming(null)
    setIsStreaming(false)
    setTurnCount(currentTurn)
    log(`Turn ${currentTurn} - Done`)
  }

  const reset = () => {
    setTurns([])
    setCurrentStreaming(null)
    setIsStreaming(false)
    setTurnCount(0)
    setDebugLog([])
    log('Reset')
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Streaming Animation Debug</h1>

        <div className="mb-6 p-4 bg-muted rounded-lg">
          <h2 className="font-semibold mb-2">Issue Description:</h2>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• First turn: No fade-in, choppy streaming</li>
            <li>• Second turn+: Choppy streaming → clears → smooth fade-in re-render</li>
          </ul>
        </div>

        {/* Control buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            id="start-first-turn"
            onClick={simulateStreaming}
            disabled={isStreaming || turnCount >= 1}
          >
            Start First Turn
          </Button>
          <Button
            id="start-second-turn"
            onClick={simulateStreaming}
            disabled={isStreaming || turnCount < 1 || turnCount >= 2}
          >
            Start Second Turn
          </Button>
          <Button
            id="start-third-turn"
            onClick={simulateStreaming}
            disabled={isStreaming || turnCount < 2 || turnCount >= 3}
          >
            Start Third Turn
          </Button>
          <Button variant="outline" onClick={reset}>
            Reset
          </Button>
        </div>

        {/* Status indicator */}
        <div className="mb-4 p-2 bg-secondary rounded text-sm">
          <span className="font-mono">
            Turn: {turnCount} | Streaming: {isStreaming ? 'YES' : 'NO'} |
            Turns array: {turns.length} | CurrentStreaming: {currentStreaming ? 'SET' : 'NULL'}
          </span>
        </div>

        {/* Conversation area - mimics ResultsPanel structure */}
        <div className="border rounded-lg p-4 min-h-[400px] bg-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Conversation Area (mimics ResultsPanel):
          </h3>

          {/* Previous turns (final cards) */}
          {turns.map((turn, index) => (
            <div key={`turn-${index}`} className="mb-2">
              <div className="text-xs text-muted-foreground mb-1">Turn {index + 1} (final):</div>
              <FinalVariantCard variant={turn.variant} />
            </div>
          ))}

          {/* Current streaming card */}
          {currentStreaming && (
            <div className="mb-2">
              <div className="text-xs text-muted-foreground mb-1">
                Turn {turnCount + 1} (streaming):
              </div>
              <StreamingVariantCard variant={currentStreaming} />
            </div>
          )}

          {/* Initial loading skeleton */}
          {isStreaming && !currentStreaming && (
            <Card className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
        </div>

        {/* Debug log */}
        <div className="mt-6 p-4 bg-black text-green-400 rounded-lg font-mono text-xs max-h-[200px] overflow-y-auto">
          <h3 className="text-white mb-2">Debug Log:</h3>
          {debugLog.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
          {debugLog.length === 0 && <div className="text-gray-500">No logs yet...</div>}
        </div>
      </div>
    </div>
  )
}
