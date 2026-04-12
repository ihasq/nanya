import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { useTranslationStore } from '@/stores/translation-store'
import { useAuthStore } from '@/stores/auth-store'
import { useT } from '@/stores/settings-store'
import { startOpenRouterAuth } from '@/lib/openrouter-pkce'
import { Paperclip, ArrowUpRight, Loader2 } from 'lucide-react'

interface InputPanelProps {
  onTranslate: () => void
  showCompact?: boolean
}

export function InputPanel({ onTranslate, showCompact }: InputPanelProps) {
  const { inputText, setInputText, isTranslating } = useTranslationStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const t = useT()

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

  if (showCompact) {
    return (
      <div className="h-full flex flex-col p-6">
        <div className="text-muted-foreground mb-2">{t('input.translateOther')}</div>
        <Textarea
          placeholder={t('input.placeholder')}
          value={inputText}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none border bg-background text-sm focus-visible:ring-1"
          disabled={isTranslating}
        />
        <Button
          onClick={onTranslate}
          disabled={!inputText.trim() || isTranslating || !isAuthenticated}
          size="sm"
          className="mt-3 w-full gap-1.5"
        >
          {isTranslating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {t('input.translate')}
              <ArrowUpRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-2 space-y-3">
        {/* Auth Button - Show when not authenticated */}
        {!isAuthenticated && (
          <Card className="p-3 bg-muted/30 border-dashed">
            <p className="text-sm text-muted-foreground mb-2 text-center">
              {t('input.connectProvider')}
            </p>
            <div className="flex justify-center">
              <Button onClick={() => startOpenRouterAuth()} variant="outline" size="sm" className="gap-2">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-purple-500 to-pink-500" />
                {t('auth.connect')}
              </Button>
            </div>
          </Card>
        )}

        {/* Input Card */}
        <Card className="overflow-hidden shadow-sm py-0 gap-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <div className="text-sm text-muted-foreground">
              {t('input.inputLabel')}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('input.autoDetect')} ⇄ {t('input.translate')}
            </div>
          </div>

          {/* Input Area */}
          <Textarea
            placeholder={t('input.placeholder')}
            value={inputText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[140px] resize-none border-0 rounded-none bg-transparent text-base focus-visible:ring-0 placeholder:text-muted-foreground/50 px-4 py-3"
            disabled={isTranslating}
          />

          {/* Bottom Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/20">
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <Button
              onClick={onTranslate}
              disabled={!inputText.trim() || isTranslating || !isAuthenticated}
              size="sm"
              className="gap-1.5"
            >
              {isTranslating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {t('input.translate')}
                  <ArrowUpRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Helper Text */}
        <p className="text-xs text-muted-foreground text-center">
          {t('input.aiHelper')}
        </p>
      </div>
    </div>
  )
}
