import { useCallback, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { InputPanel } from '@/components/InputPanel'
import { ResultsPanel } from '@/components/ResultsPanel'
import { AuthCallback } from '@/components/AuthCallback'
import { useTranslationStore } from '@/stores/translation-store'
import { useSettingsStore, useT } from '@/stores/settings-store'
import { useHistory } from '@/hooks/useHistory'
import { translate } from '@/lib/llm-client'
import { saveHistoryEntry, getHistoryEntry } from '@/lib/history-storage'
import {
  generateShortId,
  createConversationHash,
  parseConversationHash,
  setUrlHash,
  clearUrlHash,
  getUrlHash,
} from '@/lib/url-hash'

// Lazy load test pages (dev only)
const StreamingTestPage = lazy(() => import('@/test-streaming'))
const StreamingDemo = lazy(() => import('@/streaming-demo'))

function HomePage() {
  const {
    conversationId,
    inputText,
    attachments,
    variants,
    isTranslating,
    setConversationId,
    setInputText,
    setVariants,
    setStreamingVariant,
    setIsTranslating,
    setError,
    reset,
  } = useTranslationStore()
  const { systemLanguage, writingStyle, enableHistory } = useSettingsStore()
  const t = useT()
  const { entries, refresh: refreshHistory } = useHistory()
  const [searchParams, setSearchParams] = useSearchParams()

  // Handle URL hash on mount - load existing conversation
  useEffect(() => {
    const loadFromHash = async () => {
      const hash = getUrlHash()
      if (!hash) return

      const parsed = parseConversationHash(hash)
      if (!parsed) return

      // Try to load from history
      const entry = await getHistoryEntry(parsed.id)
      if (entry) {
        setConversationId(entry.id)
        setInputText(entry.inputText)
        setVariants(entry.variants || [])
      } else {
        // Backward compatibility: entry not in storage but hash exists
        // Create a new entry with the text from the hash
        setConversationId(parsed.id)
        setInputText(parsed.text)
      }
    }
    loadFromHash()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Handle Web Share Target API
  useEffect(() => {
    const sharedText = searchParams.get('text')
    const sharedTitle = searchParams.get('title')
    const sharedUrl = searchParams.get('url')

    if (sharedText || sharedTitle || sharedUrl) {
      const parts = [sharedTitle, sharedText, sharedUrl].filter(Boolean)
      const combinedText = parts.join('\n\n')

      if (combinedText) {
        // Start a new conversation for shared content
        reset()
        clearUrlHash()
        setInputText(combinedText)
        // Clear URL params after processing
        setSearchParams({}, { replace: true })
      }
    }
  }, [searchParams, setSearchParams, setInputText, reset])

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return

    setIsTranslating(true)
    setError(null)
    setVariants([])
    setStreamingVariant(null)

    // Generate new conversation ID if this is a new conversation
    const isNewConversation = !conversationId
    const currentId = conversationId || generateShortId()

    if (isNewConversation) {
      setConversationId(currentId)
      // Update URL hash immediately
      const hash = createConversationHash(inputText, currentId)
      setUrlHash(hash)
    }

    try {
      const result = await translate({
        text: inputText,
        attachments: attachments.map((a) => ({
          name: a.name,
          type: a.type,
          content: a.content,
        })),
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
        }, currentId)
        refreshHistory()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed')
    } finally {
      setIsTranslating(false)
      // Don't clear streamingVariant here - keep it for transition detection
      // It will be cleared at the start of next translation
    }
  }, [inputText, attachments, conversationId, systemLanguage, writingStyle, enableHistory, setConversationId, setVariants, setStreamingVariant, setIsTranslating, setError, refreshHistory])

  const handleNewTranslation = useCallback(() => {
    reset()
    clearUrlHash()
  }, [reset])

  // Handle loading a conversation from history (sidebar click)
  const handleLoadConversation = useCallback(async (id: string) => {
    const entry = await getHistoryEntry(id)
    if (entry) {
      setConversationId(entry.id)
      setInputText(entry.inputText)
      setVariants(entry.variants || [])
      // Update URL hash
      const hash = createConversationHash(entry.inputText, entry.id)
      setUrlHash(hash)
    }
  }, [setConversationId, setInputText, setVariants])

  // Show results panel when translating OR when we have results
  const showResultsView = isTranslating || variants.length > 0

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-gradient-to-br from-sky-50 via-background to-sky-50/50 dark:from-sky-950/20 dark:via-background dark:to-sky-950/10">
        <AppSidebar entries={entries} onNewTranslation={handleNewTranslation} onLoadConversation={handleLoadConversation} />

        <SidebarInset className="flex flex-col relative">
          {/* Floating Sidebar Trigger */}
          <SidebarTrigger className="absolute top-3 left-3 z-10 md:hidden" />

          <div className="flex-1 flex overflow-hidden">
            {/* Input Panel with Hero */}
            <div className={`${showResultsView ? 'hidden md:block md:w-[320px] md:border-r' : 'flex-1'} bg-card transition-all duration-300`}>
              {/* Tagline - Only show when no results */}
              {!showResultsView && (
                <div className="text-center pt-10 pb-4 px-4">
                  <h1 className="text-3xl font-bold italic text-foreground mb-3">
                    {t('app.name')}
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('app.tagline')}
                  </p>
                </div>
              )}
              <InputPanel onTranslate={handleTranslate} showCompact={showResultsView} />
            </div>

            {/* Results Panel */}
            {showResultsView && (
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
        <Route path="/demo/streaming" element={
          <Suspense fallback={<div className="p-6">Loading demo...</div>}>
            <StreamingDemo />
          </Suspense>
        } />
              </Routes>
    </BrowserRouter>
  )
}

export default App
