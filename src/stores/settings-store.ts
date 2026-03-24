import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Language = 'en' | 'ja' | 'es' | 'ko' | 'zh-CN' | 'zh-TW'
export type WritingStyle = 'casual' | 'polite' | 'neutral'

interface SettingsState {
  targetLanguage: Language
  nativeLanguage: Language
  writingStyle: WritingStyle
  selectedModel: string
  enableShortcuts: boolean
  enableHistory: boolean
  // Actions
  setTargetLanguage: (lang: Language) => void
  setNativeLanguage: (lang: Language) => void
  setWritingStyle: (style: WritingStyle) => void
  setSelectedModel: (modelId: string) => void
  setEnableShortcuts: (enabled: boolean) => void
  setEnableHistory: (enabled: boolean) => void
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  'en': 'English',
  'ja': '日本語',
  'es': 'Español',
  'ko': '한국어',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
}

export const LANGUAGE_FLAGS: Record<Language, string> = {
  'en': '🇺🇸',
  'ja': '🇯🇵',
  'es': '🇪🇸',
  'ko': '🇰🇷',
  'zh-CN': '🇨🇳',
  'zh-TW': '🇹🇼',
}

export const DEFAULT_MODEL = 'google/gemini-2.5-flash-lite'

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      targetLanguage: 'ja',
      nativeLanguage: 'en',
      writingStyle: 'neutral',
      selectedModel: DEFAULT_MODEL,
      enableShortcuts: true,
      enableHistory: true,

      setTargetLanguage: (lang) => set({ targetLanguage: lang }),
      setNativeLanguage: (lang) => set({ nativeLanguage: lang }),
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
