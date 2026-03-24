import { create } from 'zustand'
import type { TranslationVariant } from '@/lib/llm-client'

interface TranslationState {
  inputText: string
  variants: TranslationVariant[]
  backTranslation: string | null
  isTranslating: boolean
  isAdjusting: boolean
  isBackTranslating: boolean
  error: string | null
  // Actions
  setInputText: (text: string) => void
  setVariants: (variants: TranslationVariant[]) => void
  addVariants: (variants: TranslationVariant[]) => void
  setBackTranslation: (text: string | null) => void
  setIsTranslating: (isTranslating: boolean) => void
  setIsAdjusting: (isAdjusting: boolean) => void
  setIsBackTranslating: (isBackTranslating: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useTranslationStore = create<TranslationState>((set) => ({
  inputText: '',
  variants: [],
  backTranslation: null,
  isTranslating: false,
  isAdjusting: false,
  isBackTranslating: false,
  error: null,

  setInputText: (text) => set({ inputText: text }),
  setVariants: (variants) => set({ variants, backTranslation: null }),
  addVariants: (newVariants) => set((state) => ({
    variants: [...state.variants, ...newVariants]
  })),
  setBackTranslation: (text) => set({ backTranslation: text }),
  setIsTranslating: (isTranslating) => set({ isTranslating }),
  setIsAdjusting: (isAdjusting) => set({ isAdjusting }),
  setIsBackTranslating: (isBackTranslating) => set({ isBackTranslating }),
  setError: (error) => set({ error }),
  reset: () => set({
    inputText: '',
    variants: [],
    backTranslation: null,
    isTranslating: false,
    isAdjusting: false,
    isBackTranslating: false,
    error: null
  }),
}))
