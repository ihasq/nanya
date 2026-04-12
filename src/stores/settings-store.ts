import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  type LanguageCode,
  SUPPORTED_LANGUAGES,
  detectBrowserLanguage,
  createT,
} from '@/lib/i18n'

export type WritingStyle = 'casual' | 'polite' | 'neutral'

// Re-export for compatibility
export type Language = LanguageCode

interface SettingsState {
  systemLanguage: LanguageCode
  defaultTargetLanguage: LanguageCode // When input matches system language, translate to this
  writingStyle: WritingStyle
  selectedModel: string
  enableShortcuts: boolean
  enableHistory: boolean
  // Actions
  setSystemLanguage: (lang: LanguageCode) => void
  setDefaultTargetLanguage: (lang: LanguageCode) => void
  setWritingStyle: (style: WritingStyle) => void
  setSelectedModel: (modelId: string) => void
  setEnableShortcuts: (enabled: boolean) => void
  setEnableHistory: (enabled: boolean) => void
}

// Helper to get language label (native name)
export function getLanguageLabel(code: LanguageCode): string {
  return SUPPORTED_LANGUAGES[code]?.name || code
}

// Helper to get language English name
export function getLanguageEnglishName(code: LanguageCode): string {
  return SUPPORTED_LANGUAGES[code]?.englishName || code
}

// Helper to get language flag
export function getLanguageFlag(code: LanguageCode): string {
  return SUPPORTED_LANGUAGES[code]?.flag || '🏳️'
}

// Legacy exports for compatibility
export const LANGUAGE_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => [code, info.name])
)

export const LANGUAGE_FLAGS: Record<string, string> = Object.fromEntries(
  Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => [code, info.flag])
)

export const DEFAULT_MODEL = 'google/gemini-2.5-flash-lite'

const detectedLanguage = detectBrowserLanguage()
// Pick sensible default target: Japanese for English users, English for others
const defaultTarget: LanguageCode = detectedLanguage === 'en' ? 'ja' : 'en'

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      systemLanguage: detectedLanguage,
      defaultTargetLanguage: defaultTarget, // When input matches system language, translate to this
      writingStyle: 'neutral',
      selectedModel: DEFAULT_MODEL,
      enableShortcuts: true,
      enableHistory: true,

      setSystemLanguage: (lang) => set({ systemLanguage: lang }),
      setDefaultTargetLanguage: (lang) => set({ defaultTargetLanguage: lang }),
      setWritingStyle: (style) => set({ writingStyle: style }),
      setSelectedModel: (modelId) => set({ selectedModel: modelId }),
      setEnableShortcuts: (enabled) => set({ enableShortcuts: enabled }),
      setEnableHistory: (enabled) => set({ enableHistory: enabled }),
    }),
    {
      name: 'nanya-settings',
    }
  )
)

// Hook to get translation function based on current system language
export function useT() {
  const systemLanguage = useSettingsStore((s) => s.systemLanguage)
  return createT(systemLanguage)
}
