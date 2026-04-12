import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { PartialVariant } from '@/lib/llm-client'

// Streaming variant card - isolated for testing
function StreamingVariantCard({ variant }: { variant: PartialVariant }) {
  return (
    <Card className="mb-4" data-testid="streaming-card">
      <CardContent className="pt-4">
        {/* Style Label */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg" data-testid="emoji">{variant.emoji || '📝'}</span>
          <span className="text-sm font-medium bg-muted px-2 py-0.5 rounded" data-testid="style">
            {variant.style || 'Translation'}
          </span>
          {!variant.isComplete && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" data-testid="loading" />
          )}
        </div>

        {/* Translation Text */}
        {variant.text && (
          <p className="text-lg mb-4 animate-in fade-in duration-300" data-testid="text">
            {variant.text}
          </p>
        )}

        {/* Explanations */}
        {variant.explanation && variant.explanation.length > 0 && (
          <ul className="space-y-1 mb-4" data-testid="explanations">
            {variant.explanation.map((exp, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-300"
                data-testid={`explanation-${i}`}
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

// Mock streaming data - simulates LLM response
const MOCK_STREAMING_STEPS: PartialVariant[] = [
  { style: 'Translation', emoji: '📝' },
  { style: 'Translation', emoji: '📝', text: 'Hello' },
  { style: 'Translation', emoji: '📝', text: 'Hello, this is a' },
  { style: 'Translation', emoji: '📝', text: 'Hello, this is a test translation.' },
  { style: 'Translation', emoji: '📝', text: 'Hello, this is a test translation.', explanation: ['First explanation point'] },
  { style: 'Translation', emoji: '📝', text: 'Hello, this is a test translation.', explanation: ['First explanation point', 'Second explanation about word choice'] },
  { style: 'Translation', emoji: '📝', text: 'Hello, this is a test translation.', explanation: ['First explanation point', 'Second explanation about word choice', 'Third note on nuance'], isComplete: true },
]

export function StreamingTestPage() {
  const [currentStep, setCurrentStep] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)
  const [variant, setVariant] = useState<PartialVariant | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12)
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`])
  }

  const runStreamingTest = async () => {
    setIsRunning(true)
    setVariant(null)
    setLogs([])
    setCurrentStep(-1)
    addLog('Starting streaming test...')

    for (let i = 0; i < MOCK_STREAMING_STEPS.length; i++) {
      setCurrentStep(i)
      const step = MOCK_STREAMING_STEPS[i]
      setVariant(step)

      const changes: string[] = []
      if (i === 0 || step.style !== MOCK_STREAMING_STEPS[i-1]?.style) changes.push('style')
      if (i === 0 || step.text !== MOCK_STREAMING_STEPS[i-1]?.text) changes.push('text')
      if (step.explanation?.length !== MOCK_STREAMING_STEPS[i-1]?.explanation?.length) {
        changes.push(`explanation[${step.explanation?.length || 0}]`)
      }
      if (step.isComplete) changes.push('COMPLETE')

      addLog(`Step ${i + 1}/${MOCK_STREAMING_STEPS.length}: ${changes.join(', ')}`)

      // Wait between steps (simulating streaming delay)
      await new Promise(r => setTimeout(r, 300))
    }

    addLog('Streaming test complete!')
    setIsRunning(false)
  }

  const stepForward = () => {
    if (currentStep < MOCK_STREAMING_STEPS.length - 1) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      setVariant(MOCK_STREAMING_STEPS[nextStep])
      addLog(`Manual step to ${nextStep + 1}`)
    }
  }

  const stepBackward = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      setVariant(MOCK_STREAMING_STEPS[prevStep])
      addLog(`Manual step back to ${prevStep + 1}`)
    }
  }

  const reset = () => {
    setCurrentStep(-1)
    setVariant(null)
    setLogs([])
    setIsRunning(false)
  }

  return (
    <div className="min-h-screen bg-background p-6" data-testid="test-page">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Streaming UI Test</h1>
          <div className="text-sm text-muted-foreground" data-testid="step-indicator">
            Step: {currentStep + 1} / {MOCK_STREAMING_STEPS.length}
          </div>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="pt-4 flex flex-wrap gap-2">
            <Button onClick={runStreamingTest} disabled={isRunning} data-testid="btn-auto">
              {isRunning ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Running...</> : 'Auto Run'}
            </Button>
            <Button variant="outline" onClick={stepBackward} disabled={isRunning || currentStep <= 0} data-testid="btn-prev">
              ← Prev
            </Button>
            <Button variant="outline" onClick={stepForward} disabled={isRunning || currentStep >= MOCK_STREAMING_STEPS.length - 1} data-testid="btn-next">
              Next →
            </Button>
            <Button variant="destructive" onClick={reset} data-testid="btn-reset">
              Reset
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="border rounded-lg p-4 bg-card" data-testid="preview-area">
          <div className="text-sm text-muted-foreground mb-4">Preview:</div>
          {variant ? (
            <StreamingVariantCard variant={variant} />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Click "Auto Run" or "Next →" to start
            </div>
          )}
        </div>

        {/* State Debug */}
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm font-medium mb-2">Current State:</div>
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32" data-testid="state-debug">
              {JSON.stringify(variant, null, 2) || 'null'}
            </pre>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm font-medium mb-2">Logs:</div>
            <div className="text-xs bg-muted p-3 rounded max-h-40 overflow-auto font-mono" data-testid="logs">
              {logs.length === 0 ? (
                <span className="text-muted-foreground">No logs yet</span>
              ) : (
                logs.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default StreamingTestPage
