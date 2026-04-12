import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useTranslationStore } from '@/stores/translation-store'
import { useAuthStore } from '@/stores/auth-store'
import { useSettingsStore, useT, getLanguageEnglishName } from '@/stores/settings-store'
import { startOpenRouterAuth } from '@/lib/openrouter-pkce'
import { Paperclip, Loader2, SlidersHorizontal, Share2 } from 'lucide-react'

interface InputPanelProps {
  onTranslate: () => void
  showCompact?: boolean
}

export function InputPanel({ onTranslate, showCompact }: InputPanelProps) {
  const { inputText, setInputText, isTranslating } = useTranslationStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const { systemLanguage, defaultTargetLanguage } = useSettingsStore()
  const t = useT()

  // Independent local state for compact mode input
  const [compactInput, setCompactInput] = useState('')
  const [writingStyleEnabled, setWritingStyleEnabled] = useState(false)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (isAuthenticated) {
          onTranslate()
        }
      }
    },
    [onTranslate, isAuthenticated]
  )

  const handleCompactKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (isAuthenticated && compactInput.trim()) {
          setInputText(compactInput)
          setCompactInput('')
          setTimeout(() => onTranslate(), 0)
        }
      }
    },
    [onTranslate, isAuthenticated, compactInput, setInputText]
  )

  const handleCompactTranslate = useCallback(() => {
    if (compactInput.trim()) {
      setInputText(compactInput)
      setCompactInput('')
      setTimeout(() => onTranslate(), 0)
    }
  }, [compactInput, setInputText, onTranslate])

  // Get language names for helper text (use English names for consistency with nani.now)
  const systemLangName = getLanguageEnglishName(systemLanguage)
  const targetLangName = getLanguageEnglishName(defaultTargetLanguage)

  // Format helper text with language names
  // {source} = systemLanguage (input language that triggers translation to target)
  // {target} = defaultTargetLanguage (where source language text is translated to)
  const helperText = t('input.aiHelper')
    .replace(/{source}/g, systemLangName)
    .replace(/{target}/g, targetLangName)

  if (showCompact) {
    return (
      <div className="h-full flex flex-col p-6">
        <div className="text-muted-foreground mb-2">{t('input.translateOther')}</div>
        <Textarea
          placeholder={t('input.placeholder')}
          value={compactInput}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompactInput(e.target.value)}
          onKeyDown={handleCompactKeyDown}
          className="flex-1 resize-none border bg-background text-sm focus-visible:ring-1"
          disabled={isTranslating}
        />
        <Button
          onClick={handleCompactTranslate}
          disabled={!compactInput.trim() || isTranslating || !isAuthenticated}
          size="sm"
          className="mt-3 w-full gap-1.5"
        >
          {isTranslating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t('input.translate')
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-2 space-y-3">
        {/* Translate without signing in - Show when not authenticated */}
        {!isAuthenticated && (
          <div className="text-center py-3">
            <button
              onClick={() => startOpenRouterAuth()}
              className="inline-flex flex-col items-center gap-1 text-sm text-sky-500 hover:text-sky-600 transition-colors group"
            >
              <span>{t('input.translateWithoutLogin')}</span>
              <span className="text-xl leading-none group-hover:translate-y-0.5 transition-transform">↓</span>
            </button>
          </div>
        )}

        {/* Input Card */}
        <Card className="overflow-hidden shadow-sm py-0 gap-0 rounded-xl border-border/50">
          {/* Top Bar - Writing style toggle + Language indicator */}
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Switch
                checked={writingStyleEnabled}
                onCheckedChange={setWritingStyleEnabled}
                className="scale-75"
              />
              <span className="text-sm text-muted-foreground">
                {t('input.writingStyle')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>✏</span>
              <span>{targetLangName}</span>
            </div>
          </div>

          {/* Input Area */}
          <Textarea
            placeholder={t('input.placeholder')}
            value={inputText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[160px] resize-none border-0 rounded-none bg-transparent text-base focus-visible:ring-0 placeholder:text-muted-foreground/50 px-4 py-3"
            disabled={isTranslating}
          />

          {/* Bottom Bar */}
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-border/50">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <Button
              onClick={onTranslate}
              disabled={!inputText.trim() || isTranslating || !isAuthenticated}
              className="bg-sky-500 hover:bg-sky-600 rounded-full px-5 h-9 gap-1"
            >
              {isTranslating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {t('input.translate')}
                  <span className="text-sm">↑</span>
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Helper Text */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Share2 className="h-3 w-3" />
          <span>{helperText}</span>
        </div>
      </div>
    </div>
  )
}
