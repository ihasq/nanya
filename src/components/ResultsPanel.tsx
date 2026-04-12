import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslationStore } from '@/stores/translation-store'
import { useT } from '@/stores/settings-store'
import { adjustTranslation, simpleTranslate, type TranslationVariant, type PartialVariant } from '@/lib/llm-client'
import { Copy, Check, Volume2, ChevronDown, RotateCcw, Loader2 } from 'lucide-react'

type AdjustmentOption = {
  type: string
  labelKey: 'results.casual' | 'results.polite' | 'results.neutral' | 'results.catchy' | 'results.concise' | 'results.detailed' | 'results.natural' | 'results.lessAI' | 'results.alternative'
  emoji: string
}

const ADJUSTMENT_OPTIONS: AdjustmentOption[] = [
  { type: 'casual', labelKey: 'results.casual', emoji: '😎' },
  { type: 'polite', labelKey: 'results.polite', emoji: '🤓' },
  { type: 'neutral', labelKey: 'results.neutral', emoji: '😶' },
  { type: 'catchy', labelKey: 'results.catchy', emoji: '🤩' },
  { type: 'concise', labelKey: 'results.concise', emoji: '✂️' },
  { type: 'detailed', labelKey: 'results.detailed', emoji: '📝' },
  { type: 'natural', labelKey: 'results.natural', emoji: '🗣️' },
  { type: 'less-ai', labelKey: 'results.lessAI', emoji: '🧑' },
  { type: 'alternative', labelKey: 'results.alternative', emoji: '💬' },
]

// Streaming variant card - shows partial results as they arrive
function StreamingVariantCard({ variant, isAdjustment }: { variant: PartialVariant; isAdjustment?: boolean }) {
  return (
    <Card className={`mb-4 ${isAdjustment ? 'border-dashed border-primary/50' : ''}`}>
      <CardContent className="pt-4">
        {/* Style Label */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{variant.emoji || '📝'}</span>
          <span className="text-sm font-medium bg-muted px-2 py-0.5 rounded">
            {variant.style || 'Translation'}
          </span>
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />
        </div>

        {/* Translation Text */}
        {variant.text && (
          <p className="text-lg mb-4 animate-in fade-in duration-300">{variant.text}</p>
        )}

        {/* Explanations (streaming) */}
        {variant.explanation && variant.explanation.length > 0 && (
          <ul className="space-y-1 mb-4">
            {variant.explanation.map((exp, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-300">
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

interface VariantCardProps {
  variant: TranslationVariant
  onAdjust: (type: string, currentText: string) => void
  isAdjusting: boolean
}

function VariantCard({ variant, onAdjust, isAdjusting }: VariantCardProps) {
  const [copied, setCopied] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [backTranslation, setBackTranslation] = useState<string | null>(null)
  const [isBackTranslating, setIsBackTranslating] = useState(false)
  const t = useT()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(variant.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSpeak = () => {
    if (isSpeaking) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(variant.text)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    setIsSpeaking(true)
    speechSynthesis.speak(utterance)
  }

  const handleBackTranslate = async () => {
    if (isBackTranslating) return

    setIsBackTranslating(true)
    setBackTranslation(null)

    try {
      const isJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(variant.text)
      const result = await simpleTranslate(variant.text, isJapanese ? 'en' : 'ja')
      setBackTranslation(result)
    } catch (err) {
      console.error('Back translation failed:', err)
    } finally {
      setIsBackTranslating(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        {/* Style Label */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{variant.emoji}</span>
          <span className="text-sm font-medium bg-muted px-2 py-0.5 rounded">
            {variant.style}
          </span>
        </div>

        {/* Translation Text */}
        <p className="text-lg mb-4">{variant.text}</p>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSpeak}>
              <Volume2 className={`h-4 w-4 ${isSpeaking ? 'text-primary' : ''}`} />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hover:text-foreground transition-colors flex items-center gap-1">
                  {t('results.adjust')} <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {ADJUSTMENT_OPTIONS.slice(0, 4).map((opt) => (
                  <DropdownMenuItem
                    key={opt.type}
                    onClick={() => onAdjust(opt.type, variant.text)}
                    disabled={isAdjusting}
                  >
                    <span className="mr-2">{opt.emoji}</span>
                    {t(opt.labelKey)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-muted-foreground/30">|</span>
            <button
              className="hover:text-foreground transition-colors flex items-center gap-1 disabled:opacity-50"
              onClick={handleBackTranslate}
              disabled={isBackTranslating}
            >
              {isBackTranslating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              {t('results.backTranslate')}
            </button>
          </div>
        </div>

        {/* Back Translation */}
        {(backTranslation || isBackTranslating) && (
          <div className="bg-muted/30 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('results.backTo')}</span>
            </div>
            <p className="text-sm">
              {backTranslation || t('results.backTranslating')}
            </p>
          </div>
        )}

        {/* Explanations */}
        {variant.explanation && variant.explanation.length > 0 && (
          <ul className="space-y-1 mb-4">
            {variant.explanation.map((exp, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-1.5">•</span>
                <span>{exp}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Example */}
        {variant.example && (
          <div className="bg-muted/20 rounded-lg p-3 text-sm">
            <div className="text-xs text-muted-foreground mb-2">{t('results.example')}</div>
            <div className="flex items-start gap-2 mb-1">
              <p>{variant.example.original}</p>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <Volume2 className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-muted-foreground">{variant.example.translated}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ResultsPanelProps {
  onRetranslate: () => void
}

export function ResultsPanel({ onRetranslate: _onRetranslate }: ResultsPanelProps) {
  const {
    inputText,
    variants,
    streamingVariant,
    streamingAdjustment,
    isTranslating,
    isAdjusting,
    setIsAdjusting,
    setStreamingAdjustment,
    addVariants,
    error
  } = useTranslationStore()
  const [showAllOptions, setShowAllOptions] = useState(false)
  const t = useT()

  const handleAdjust = async (type: string, currentText: string) => {
    setIsAdjusting(true)
    setStreamingAdjustment(null)
    try {
      const result = await adjustTranslation({
        originalText: inputText,
        currentTranslation: currentText,
        adjustmentType: type,
        onPartialResult: (partial) => {
          setStreamingAdjustment(partial)
        }
      })
      addVariants(result.variants)
    } catch (err) {
      console.error('Adjustment failed:', err)
    } finally {
      setIsAdjusting(false)
      setStreamingAdjustment(null)
    }
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show streaming variant during initial translation
  const showStreamingCard = isTranslating && streamingVariant && streamingVariant.text
  // Show streaming adjustment card
  const showStreamingAdjustment = isAdjusting && streamingAdjustment && streamingAdjustment.text

  if (variants.length === 0 && !showStreamingCard) {
    return null
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Original Text */}
      <div className="mb-6">
        <div className="bg-muted/30 rounded-xl p-4 mb-3">
          <p className="text-foreground">{inputText}</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
          <span className="text-white text-xs">N</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {isTranslating && !variants.length
            ? t('input.translating')
            : variants.length === 1
              ? t('results.translatedOne')
              : t('results.translatedMany').replace('{count}', String(variants.length))}
        </span>
      </div>

      {/* Streaming Card (during initial translation) */}
      {showStreamingCard && variants.length === 0 && (
        <StreamingVariantCard variant={streamingVariant} />
      )}

      {/* Variant Cards */}
      {variants.map((variant, index) => (
        <VariantCard
          key={`${variant.style}-${index}`}
          variant={variant}
          onAdjust={handleAdjust}
          isAdjusting={isAdjusting}
        />
      ))}

      {/* Streaming Adjustment Card */}
      {showStreamingAdjustment && (
        <StreamingVariantCard variant={streamingAdjustment} isAdjustment />
      )}

      {/* Adjustment Loading (only show if no streaming content) */}
      {isAdjusting && !showStreamingAdjustment && (
        <Card className="mb-4 border-dashed">
          <CardContent className="pt-6 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-muted-foreground">{t('results.adjusting')}</span>
          </CardContent>
        </Card>
      )}

      {/* Style Adjustment Panel */}
      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-2 gap-2">
          {(showAllOptions ? ADJUSTMENT_OPTIONS : ADJUSTMENT_OPTIONS.slice(0, 4)).map((opt) => (
            <Button
              key={opt.type}
              variant="outline"
              size="sm"
              className="justify-start gap-2"
              onClick={() => handleAdjust(opt.type, variants[0]?.text || '')}
              disabled={isAdjusting || variants.length === 0}
            >
              <span>{opt.emoji}</span>
              {t(opt.labelKey)}
            </Button>
          ))}
        </div>
        {!showAllOptions && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-muted-foreground"
            onClick={() => setShowAllOptions(true)}
          >
            {t('results.showMore')}
          </Button>
        )}
      </div>
    </div>
  )
}
