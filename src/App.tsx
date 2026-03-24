import { useCallback, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { InputPanel } from '@/components/InputPanel'
import { ResultsPanel } from '@/components/ResultsPanel'
import { AuthCallback } from '@/components/AuthCallback'
import { useTranslationStore } from '@/stores/translation-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useHistory } from '@/hooks/useHistory'
import { translate } from '@/lib/llm-client'
import { saveHistoryEntry } from '@/lib/history-storage'

function HomePage() {
  const {
    inputText,
    variants,
    setInputText,
    setVariants,
    setIsTranslating,
    setError,
    reset,
  } = useTranslationStore()
  const { targetLanguage, writingStyle, enableHistory } = useSettingsStore()
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

    try {
      const result = await translate({ text: inputText })
      setVariants(result.variants)

      if (enableHistory && result.variants.length > 0) {
        await saveHistoryEntry({
          inputText,
          outputText: result.variants[0].text,
          targetLanguage,
          writingStyle,
        })
        refreshHistory()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed')
    } finally {
      setIsTranslating(false)
    }
  }, [inputText, targetLanguage, writingStyle, enableHistory, setVariants, setIsTranslating, setError, refreshHistory])

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
          <header className="flex h-12 items-center gap-2 border-b px-4 md:hidden">
            <SidebarTrigger className="-ml-2" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">N</span>
              </div>
              <span className="font-medium text-sm">Nanya</span>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* Input Panel */}
            <div className={`${hasResults ? 'hidden md:block md:w-[320px] md:border-r' : 'flex-1'} bg-card transition-all duration-300`}>
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
      </Routes>
    </BrowserRouter>
  )
}

export default App
