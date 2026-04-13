import { create } from 'zustand'
import type { TranslationVariant, PartialVariant } from '@/lib/llm-client'

export interface Attachment {
  name: string
  type: string
  content: string // Base64 for images, text content for text files
}

interface TranslationState {
  inputText: string
  attachments: Attachment[]
  variants: TranslationVariant[]
  streamingVariant: PartialVariant | null  // Currently streaming variant
  streamingAdjustment: PartialVariant | null  // Currently streaming adjustment
  backTranslation: string | null
  isTranslating: boolean
  isAdjusting: boolean
  isBackTranslating: boolean
  error: string | null
  // Actions
  setInputText: (text: string) => void
  setAttachments: (attachments: Attachment[]) => void
  addAttachment: (attachment: Attachment) => void
  removeAttachment: (name: string) => void
  clearAttachments: () => void
  setVariants: (variants: TranslationVariant[]) => void
  addVariants: (variants: TranslationVariant[]) => void
  setStreamingVariant: (variant: PartialVariant | null) => void
  setStreamingAdjustment: (variant: PartialVariant | null) => void
  setBackTranslation: (text: string | null) => void
  setIsTranslating: (isTranslating: boolean) => void
  setIsAdjusting: (isAdjusting: boolean) => void
  setIsBackTranslating: (isBackTranslating: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useTranslationStore = create<TranslationState>((set) => ({
  inputText: '',
  attachments: [],
  variants: [],
  streamingVariant: null,
  streamingAdjustment: null,
  backTranslation: null,
  isTranslating: false,
  isAdjusting: false,
  isBackTranslating: false,
  error: null,

  setInputText: (text) => set({ inputText: text }),
  setAttachments: (attachments) => set({ attachments }),
  addAttachment: (attachment) => set((state) => ({
    attachments: [...state.attachments, attachment]
  })),
  removeAttachment: (name) => set((state) => ({
    attachments: state.attachments.filter((a) => a.name !== name)
  })),
  clearAttachments: () => set({ attachments: [] }),
  setVariants: (variants) => set({ variants, backTranslation: null }),
  addVariants: (newVariants) => set((state) => ({
    variants: [...state.variants, ...newVariants],
    // Don't clear streamingAdjustment here - allows skipAnimation comparison in ResultsPanel
  })),
  setStreamingVariant: (variant) => set({ streamingVariant: variant }),
  setStreamingAdjustment: (variant) => set({ streamingAdjustment: variant }),
  setBackTranslation: (text) => set({ backTranslation: text }),
  setIsTranslating: (isTranslating) => set({ isTranslating }),
  setIsAdjusting: (isAdjusting) => set({ isAdjusting }),
  setIsBackTranslating: (isBackTranslating) => set({ isBackTranslating }),
  setError: (error) => set({ error }),
  reset: () => set({
    inputText: '',
    attachments: [],
    variants: [],
    streamingVariant: null,
    streamingAdjustment: null,
    backTranslation: null,
    isTranslating: false,
    isAdjusting: false,
    isBackTranslating: false,
    error: null
  }),
}))

// Expose store on window for testing in development
if (import.meta.env.DEV) {
  (window as unknown as { __TRANSLATION_STORE__: typeof useTranslationStore }).
    __TRANSLATION_STORE__ = useTranslationStore
}
