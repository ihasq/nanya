import { useCallback, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { AppSidebar } from '@/components/AppSidebar'
import { InputPanel } from '@/components/InputPanel'
import { ResultsPanel } from '@/components/ResultsPanel'
import { AuthCallback } from '@/components/AuthCallback'
import { useTranslationStore } from '@/stores/translation-store'
import { useSettingsStore, useT } from '@/stores/settings-store'
import { useAuthStore } from '@/stores/auth-store'
import { useHistory } from '@/hooks/useHistory'
import { translate } from '@/lib/llm-client'
import { saveHistoryEntry } from '@/lib/history-storage'
import { startOpenRouterAuth } from '@/lib/openrouter-pkce'

// Lazy load test page (dev only)
const StreamingTestPage = lazy(() => import('@/test-streaming'))

function HomePage() {
  const {
    inputText,
    variants,
    setInputText,
    setVariants,
    setStreamingVariant,
    setIsTranslating,
    setError,
    reset,
  } = useTranslationStore()
  const { systemLanguage, writingStyle, enableHistory } = useSettingsStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const t = useT()
  const { entries, refresh: refreshHistory } = useHistory()
  const [searchParams, setSearchParams] = useSearchParams()

  // Handle Web Share Target API
  useEffect(() => {
    const sharedText = searchParams.get('text')
    const sharedTitle = searchParams.get('title')
    const sharedUrl = searchParams.get('url')

    if (sharedText || sharedTitle || sharedUrl) {
      const parts = [sharedTitle, sharedText, sharedUrl].filter(Boolean)
      const combinedText = parts.join('\n\n')

      if (combinedText) {
        setInputText(combinedText)
        // Clear URL params after processing
        setSearchParams({}, { replace: true })
      }
    }
  }, [searchParams, setSearchParams, setInputText])

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return

    setIsTranslating(true)
    setError(null)
    setVariants([])
    setStreamingVariant(null)

    try {
      const result = await translate({
        text: inputText,
        onPartialResult: (partial) => {
          setStreamingVariant(partial)
        }
      })
      setVariants(result.variants)

      if (enableHistory && result.variants.length > 0) {
        await saveHistoryEntry({
          inputText,
          outputText: result.variants[0].text,
          targetLanguage: systemLanguage,
          writingStyle,
          variants: result.variants,
        })
        refreshHistory()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed')
    } finally {
      setIsTranslating(false)
      setStreamingVariant(null)
    }
  }, [inputText, systemLanguage, writingStyle, enableHistory, setVariants, setStreamingVariant, setIsTranslating, setError, refreshHistory])

  const handleNewTranslation = useCallback(() => {
    reset()
  }, [reset])

  const hasResults = variants.length > 0

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-gradient-to-br from-sky-50 via-background to-sky-50/50 dark:from-sky-950/20 dark:via-background dark:to-sky-950/10">
        <AppSidebar entries={entries} onNewTranslation={handleNewTranslation} />

        <SidebarInset className="flex flex-col">
          {/* Mobile Header */}
          <header className="flex h-12 items-center justify-between border-b px-4 md:hidden">
            <SidebarTrigger className="-ml-2" />
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">N</span>
            </div>
            {!isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => startOpenRouterAuth()}
              >
                {t('auth.connect')}
              </Button>
            ) : (
              <div className="w-16" /> // Spacer for alignment
            )}
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* Input Panel with Hero */}
            <div className={`${hasResults ? 'hidden md:block md:w-[320px] md:border-r' : 'flex-1'} bg-card transition-all duration-300`}>
              {/* Tagline - Only show when no results */}
              {!hasResults && (
                <div className="text-center pt-10 pb-4 px-4">
                  <h1 className="text-3xl font-bold italic text-foreground mb-3">
                    {t('app.name')}
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('app.tagline')}
                  </p>
                </div>
              )}
              <InputPanel onTranslate={handleTranslate} showCompact={hasResults} />
            </div>

            {/* Results Panel */}
            {hasResults && (
              <div className="flex-1 bg-background overflow-hidden">
                <ResultsPanel onRetranslate={handleTranslate} />
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/test/streaming" element={
          <Suspense fallback={<div className="p-6">Loading test page...</div>}>
            <StreamingTestPage />
          </Suspense>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
