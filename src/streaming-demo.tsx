import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'

// UI Part types for streaming
interface StreamingPart {
  id: string
  type: 'header' | 'text' | 'explanation' | 'example' | 'action'
  content: string
  emoji?: string
  meta?: Record<string, string>
}

interface StreamingState {
  parts: StreamingPart[]
  isComplete: boolean
}

// Mock JSON streaming data - simulates chunked LLM response
// Simplified structure without nested objects for reliable parsing
const MOCK_JSON_CHUNKS = [
  `{"parts":[`,
  `{"id":"h1","type":"header","emoji":"📝","content":"Natural Translation"}`,
  `,{"id":"t1","type":"text","content":"Hello, "}`,
  `,{"id":"t1","type":"text","content":"Hello, how are you today?"}`,
  `,{"id":"e1","type":"explanation","content":"Uses casual greeting form"}`,
  `,{"id":"e2","type":"explanation","content":"How are you is a common opener"}`,
  `,{"id":"e3","type":"explanation","content":"Natural and friendly tone"}`,
  `,{"id":"ex1","type":"example","content":"Hey, whats up?"}`,
  `,{"id":"a1","type":"action","content":"Copy"}`,
  `],"isComplete":true}`,
]

// Parse incremental JSON (simplified parser for demo)
function parsePartialJSON(chunks: string[]): StreamingState {
  const fullText = chunks.join('')
  const parts: StreamingPart[] = []

  // Find all complete JSON objects in the parts array
  // Pattern: {"id":"...", ...} - balanced braces
  const objectPattern = /\{[^{}]*"id"\s*:\s*"[^"]+"\s*,[^{}]*\}/g
  const matches = fullText.match(objectPattern)

  if (matches) {
    for (const match of matches) {
      try {
        const parsed = JSON.parse(match) as StreamingPart

        // Update or add part (for incremental text updates)
        const existingIdx = parts.findIndex(p => p.id === parsed.id)
        if (existingIdx >= 0) {
          parts[existingIdx] = parsed
        } else {
          parts.push(parsed)
        }
      } catch {
        // Incomplete JSON, skip
      }
    }
  }

  const isComplete = fullText.includes('"isComplete":true')
  return { parts, isComplete }
}

// Animated UI Part component with enter transitions
function AnimatedPart({ part, index }: { part: StreamingPart; index: number }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation after mount
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const baseClasses = `
    transform transition-all duration-200 ease-out
    ${isVisible
      ? 'opacity-100 translate-y-0 scale-100'
      : 'opacity-0 translate-y-2 scale-[0.98]'
    }
  `

  switch (part.type) {
    case 'header':
      return (
        <div
          className={`flex items-center gap-2 mb-3 ${baseClasses}`}
          style={{ transitionDelay: `${index * 30}ms` }}
          data-part-id={part.id}
          data-part-type={part.type}
        >
          <span className="text-lg">{part.emoji || '📝'}</span>
          <span className="text-sm font-medium bg-muted px-2 py-0.5 rounded">
            {part.content}
          </span>
        </div>
      )

    case 'text':
      return (
        <p
          className={`text-lg mb-4 ${baseClasses}`}
          style={{ transitionDelay: `${index * 30}ms` }}
          data-part-id={part.id}
          data-part-type={part.type}
        >
          {part.content}
        </p>
      )

    case 'explanation':
      return (
        <li
          className={`flex items-start gap-2 text-sm text-muted-foreground ${baseClasses}`}
          style={{ transitionDelay: `${index * 30}ms` }}
          data-part-id={part.id}
          data-part-type={part.type}
        >
          <span className="text-primary mt-1">•</span>
          <span>{part.content}</span>
        </li>
      )

    case 'example':
      return (
        <div
          className={`bg-muted/30 rounded-lg p-3 text-sm ${baseClasses}`}
          style={{ transitionDelay: `${index * 30}ms` }}
          data-part-id={part.id}
          data-part-type={part.type}
        >
          <div className="text-xs text-muted-foreground mb-1">Example:</div>
          {part.meta?.original && (
            <p className="text-muted-foreground mb-1">{part.meta.original}</p>
          )}
          <p>{part.content}</p>
        </div>
      )

    case 'action':
      return (
        <Button
          variant="outline"
          size="sm"
          className={`${baseClasses}`}
          style={{ transitionDelay: `${index * 30}ms` }}
          data-part-id={part.id}
          data-part-type={part.type}
        >
          {part.content}
        </Button>
      )

    default:
      return null
  }
}

// Streaming Card component
function StreamingCard({ state, isStreaming }: { state: StreamingState; isStreaming: boolean }) {
  // Group parts by type for layout
  const headers = state.parts.filter(p => p.type === 'header')
  const texts = state.parts.filter(p => p.type === 'text')
  const explanations = state.parts.filter(p => p.type === 'explanation')
  const examples = state.parts.filter(p => p.type === 'example')
  const actions = state.parts.filter(p => p.type === 'action')

  let partIndex = 0

  return (
    <Card className="overflow-hidden" data-testid="streaming-card">
      <CardContent className="pt-4">
        {/* Header */}
        {headers.map(h => (
          <div key={h.id} className="flex items-center justify-between">
            <AnimatedPart part={h} index={partIndex++} />
            {isStreaming && !state.isComplete && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>
        ))}

        {/* Text */}
        {texts.map(t => (
          <AnimatedPart key={t.id} part={t} index={partIndex++} />
        ))}

        {/* Explanations */}
        {explanations.length > 0 && (
          <ul className="space-y-1 mb-4">
            {explanations.map(e => (
              <AnimatedPart key={e.id} part={e} index={partIndex++} />
            ))}
          </ul>
        )}

        {/* Examples */}
        {examples.map(ex => (
          <AnimatedPart key={ex.id} part={ex} index={partIndex++} />
        ))}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex gap-2 mt-4">
            {actions.map(a => (
              <AnimatedPart key={a.id} part={a} index={partIndex++} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StreamingDemo() {
  const [chunks, setChunks] = useState<string[]>([])
  const [currentChunk, setCurrentChunk] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)
  const [speed, setSpeed] = useState(150) // ms between chunks
  const intervalRef = useRef<number | null>(null)

  const state = parsePartialJSON(chunks)

  const startStreaming = () => {
    if (currentChunk >= MOCK_JSON_CHUNKS.length - 1) {
      // Reset if already at end
      setChunks([])
      setCurrentChunk(-1)
    }
    setIsRunning(true)
  }

  const pauseStreaming = () => {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const reset = () => {
    pauseStreaming()
    setChunks([])
    setCurrentChunk(-1)
  }

  const stepForward = () => {
    if (currentChunk < MOCK_JSON_CHUNKS.length - 1) {
      const next = currentChunk + 1
      setCurrentChunk(next)
      setChunks(MOCK_JSON_CHUNKS.slice(0, next + 1))
    }
  }

  const stepBackward = () => {
    if (currentChunk > 0) {
      const prev = currentChunk - 1
      setCurrentChunk(prev)
      setChunks(MOCK_JSON_CHUNKS.slice(0, prev + 1))
    } else {
      reset()
    }
  }

  // Auto-advance effect
  useEffect(() => {
    if (isRunning && currentChunk < MOCK_JSON_CHUNKS.length - 1) {
      intervalRef.current = window.setInterval(() => {
        setCurrentChunk(prev => {
          const next = prev + 1
          if (next >= MOCK_JSON_CHUNKS.length) {
            setIsRunning(false)
            return prev
          }
          setChunks(MOCK_JSON_CHUNKS.slice(0, next + 1))
          return next
        })
      }, speed)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, currentChunk, speed])

  // Stop when complete
  useEffect(() => {
    if (currentChunk >= MOCK_JSON_CHUNKS.length - 1) {
      setIsRunning(false)
    }
  }, [currentChunk])

  return (
    <div className="min-h-screen bg-background p-6" data-testid="streaming-demo">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Streaming UI Demo</h1>
          <div className="text-sm text-muted-foreground" data-testid="chunk-indicator">
            Chunk: {currentChunk + 1} / {MOCK_JSON_CHUNKS.length}
          </div>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {!isRunning ? (
                <Button onClick={startStreaming} data-testid="btn-play">
                  <Play className="h-4 w-4 mr-2" /> Play
                </Button>
              ) : (
                <Button onClick={pauseStreaming} variant="secondary" data-testid="btn-pause">
                  <Pause className="h-4 w-4 mr-2" /> Pause
                </Button>
              )}
              <Button variant="outline" onClick={stepBackward} disabled={isRunning || currentChunk < 0} data-testid="btn-prev">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={stepForward} disabled={isRunning || currentChunk >= MOCK_JSON_CHUNKS.length - 1} data-testid="btn-next">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="destructive" onClick={reset} data-testid="btn-reset">
                <RotateCcw className="h-4 w-4 mr-2" /> Reset
              </Button>
            </div>

            {/* Speed control */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Speed:</span>
              <input
                type="range"
                min="50"
                max="500"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="flex-1"
                data-testid="speed-slider"
              />
              <span className="text-sm w-16">{speed}ms</span>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="border rounded-lg p-4 bg-card" data-testid="preview-area">
          <div className="text-sm text-muted-foreground mb-4">Live Preview:</div>
          {state.parts.length > 0 ? (
            <StreamingCard state={state} isStreaming={isRunning} />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Click "Play" to start streaming demo
            </div>
          )}
        </div>

        {/* Current Chunk Debug */}
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm font-medium mb-2">Current JSON Chunk:</div>
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-24 font-mono" data-testid="chunk-debug">
              {currentChunk >= 0 ? MOCK_JSON_CHUNKS[currentChunk] : '(none)'}
            </pre>
          </CardContent>
        </Card>

        {/* Parsed State */}
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm font-medium mb-2">Parsed State ({state.parts.length} parts):</div>
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48 font-mono" data-testid="state-debug">
              {JSON.stringify(state, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default StreamingDemo
