import { useCallback, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useTranslationStore, type Attachment } from '@/stores/translation-store'
import { useAuthStore } from '@/stores/auth-store'
import { useSettingsStore, useT, getLanguageEnglishName } from '@/stores/settings-store'
import { startOpenRouterAuth } from '@/lib/openrouter-pkce'
import { Paperclip, Loader2, SlidersHorizontal, Share2, Check, X } from 'lucide-react'

// Writing style options - keys map to i18n
const WRITING_STYLE_IDS = [
  'polite',
  'casual',
  'formal',
  'formalImper',
  'childFriendly',
  'businessEmail',
  'customerSupport',
  'officialForms',
  'socialPost',
  'messages',
] as const

interface InputPanelProps {
  onTranslate: () => void
  showCompact?: boolean
}

export function InputPanel({ onTranslate, showCompact }: InputPanelProps) {
  const { inputText, setInputText, isTranslating, attachments, addAttachment, removeAttachment } = useTranslationStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const { systemLanguage, defaultTargetLanguage } = useSettingsStore()
  const t = useT()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Independent local state for compact mode input
  const [compactInput, setCompactInput] = useState('')
  const [writingStyleEnabled, setWritingStyleEnabled] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [translationStyle, setTranslationStyle] = useState<'literal' | 'natural'>('natural')
  const [showRomaji, setShowRomaji] = useState(false)
  const [sendWithEnter, setSendWithEnter] = useState(false)

  // File attachment handler
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      // Limit file size to 1MB for text, 5MB for images
      const maxSize = file.type.startsWith('image/') ? 5 * 1024 * 1024 : 1024 * 1024
      if (file.size > maxSize) {
        console.warn(`File ${file.name} is too large`)
        continue
      }

      const attachment: Attachment = {
        name: file.name,
        type: file.type,
        content: '',
      }

      if (file.type.startsWith('text/') || file.type === 'application/json') {
        // Read as text
        attachment.content = await file.text()
      } else if (file.type.startsWith('image/')) {
        // Read as base64 for images
        const reader = new FileReader()
        attachment.content = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
      } else {
        // Skip unsupported types
        continue
      }

      addAttachment(attachment)
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [addAttachment])

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

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(selectedStyle === styleId ? null : styleId)
  }

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
                aria-label="Writing style"
              />
              <span className="text-sm text-muted-foreground">
                {t('input.writingStyle')}
              </span>
            </div>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <span>✏</span>
              <span>{targetLangName}</span>
            </button>
          </div>

          {/* Writing Style Grid - Shows when toggle is ON */}
          {writingStyleEnabled && (
            <div className="px-4 pb-3 border-b border-border/50">
              <div className="flex flex-wrap gap-2">
                {WRITING_STYLE_IDS.map((styleId) => (
                  <button
                    key={styleId}
                    onClick={() => handleStyleSelect(styleId)}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
                      transition-colors border
                      ${selectedStyle === styleId
                        ? 'bg-sky-100 border-sky-300 text-sky-700 dark:bg-sky-900/30 dark:border-sky-700 dark:text-sky-300'
                        : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    {selectedStyle === styleId && <Check className="h-3 w-3" />}
                    {t(`style.${styleId}` as const)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attached Files */}
          {attachments.length > 0 && (
            <div className="px-4 py-2 border-b border-border/50">
              <div className="flex flex-wrap gap-2">
                {attachments.map((att) => (
                  <div
                    key={att.name}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 text-xs"
                  >
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                    <span className="max-w-[120px] truncate">{att.name}</span>
                    <button
                      onClick={() => removeAttachment(att.name)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={`Remove ${att.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            <div className="flex items-center gap-2">
              {/* Preferences Popover */}
              <Popover open={preferencesOpen} onOpenChange={setPreferencesOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" aria-label="Preferences">
                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="start">
                  <div className="space-y-3">
                    {/* Translation Style */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-medium text-muted-foreground">{t('quickSettings.translationStyle')}</div>
                      <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
                        <button
                          onClick={() => setTranslationStyle('literal')}
                          className={`flex-1 py-1 px-2 rounded-md text-xs font-medium transition-colors ${
                            translationStyle === 'literal'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {t('quickSettings.literal')}
                        </button>
                        <button
                          onClick={() => setTranslationStyle('natural')}
                          className={`flex-1 py-1 px-2 rounded-md text-xs font-medium transition-colors ${
                            translationStyle === 'natural'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {t('quickSettings.natural')}
                        </button>
                      </div>
                    </div>

                    {/* Romaji */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('quickSettings.romaji')}</span>
                      <Switch
                        checked={showRomaji}
                        onCheckedChange={setShowRomaji}
                        className="scale-75"
                      />
                    </div>

                    {/* Send with Enter */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('quickSettings.sendWithEnter')}</span>
                      <Switch
                        checked={sendWithEnter}
                        onCheckedChange={setSendWithEnter}
                        className="scale-75"
                      />
                    </div>

                    {/* More Settings Link */}
                    <button className="text-xs text-sky-500 hover:text-sky-600 transition-colors">
                      {t('quickSettings.moreSettings')}
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg"
                aria-label="Attach file"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="text/*,application/json,image/*"
                multiple
                onChange={handleFileSelect}
              />
            </div>
            <Button
              onClick={onTranslate}
              disabled={!inputText.trim() || isTranslating || !isAuthenticated}
              className="bg-sky-500 hover:bg-sky-600 rounded-full px-5 h-9 gap-1"
              aria-label="Send"
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
