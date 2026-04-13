/**
 * Multi-shot example loader with CPU-side shot synthesis.
 *
 * Each language file contains sample texts (16 items, index-aligned).
 * Major 5 languages (ja, en, zh, ko, es) include mutual explanations.
 * Shots are synthesized by combining source[i] + target[i] + explanations at runtime.
 */

import type { LanguageCode } from '@/lib/i18n'

export interface Shot {
  user: string
  assistant: string
}

export interface AdjustmentSample {
  formal: string
  adjusted: string
}

export interface TranslationSample {
  text: string
  explanations?: Record<string, string[]>  // targetLang -> explanation array
}

export interface LanguageSamples {
  translation: TranslationSample[]
  adjustment: Record<string, AdjustmentSample[]>
}

export interface ShotLibrary {
  translation: Shot[]
  adjustment: Record<string, Shot[]>
}

// Cache for loaded language samples
const samplesCache = new Map<string, LanguageSamples>()

// Major languages with full samples + explanations
const MAJOR_LANGUAGES = ['ja', 'en', 'zh', 'ko', 'es'] as const
type MajorLanguage = typeof MAJOR_LANGUAGES[number]

function isMajorLanguage(lang: string): lang is MajorLanguage {
  return MAJOR_LANGUAGES.includes(lang as MajorLanguage)
}

/**
 * Load raw samples for a language.
 */
async function loadLanguageSamples(lang: string): Promise<LanguageSamples> {
  if (samplesCache.has(lang)) {
    return samplesCache.get(lang)!
  }

  // Fallback to English for unsupported languages
  const langToLoad = isMajorLanguage(lang) ? lang : 'en'

  if (langToLoad !== lang && samplesCache.has(langToLoad)) {
    const samples = samplesCache.get(langToLoad)!
    samplesCache.set(lang, samples)
    return samples
  }

  try {
    const response = await fetch(`/shots/samples/${langToLoad}.json`)
    if (!response.ok) {
      throw new Error(`Failed to load samples for ${langToLoad}`)
    }
    const samples: LanguageSamples = await response.json()
    samplesCache.set(langToLoad, samples)
    if (langToLoad !== lang) {
      samplesCache.set(lang, samples)
    }
    return samples
  } catch (error) {
    console.warn(`Failed to load samples for ${lang}:`, error)
    return getInlineFallbackSamples()
  }
}

/**
 * Synthesize translation shots from source and target language samples.
 * Includes explanations if available for the source→target direction.
 */
function synthesizeTranslationShots(
  sourceSamples: TranslationSample[],
  targetSamples: TranslationSample[],
  targetLang: string
): Shot[] {
  const shots: Shot[] = []
  const count = Math.min(sourceSamples.length, targetSamples.length)

  for (let i = 0; i < count; i++) {
    const sourceText = sourceSamples[i].text
    const targetText = targetSamples[i].text
    // Get explanations from source language's perspective to target language
    const explanations = sourceSamples[i].explanations?.[targetLang] || []

    shots.push({
      user: `<translate>${sourceText}</translate>`,
      assistant: JSON.stringify({
        variants: [{
          style: 'Translation',
          emoji: '📝',
          text: targetText,
          explanation: explanations
        }]
      })
    })
  }

  return shots
}

/**
 * Synthesize adjustment shots from a language's adjustment samples.
 */
function synthesizeAdjustmentShots(
  adjustmentSamples: Record<string, AdjustmentSample[]>,
  styleEmojis: Record<string, string>
): Record<string, Shot[]> {
  const result: Record<string, Shot[]> = {}

  for (const [style, samples] of Object.entries(adjustmentSamples)) {
    result[style] = samples.map(sample => ({
      user: `Text: ${sample.formal}\nStyle: ${style}`,
      assistant: JSON.stringify({
        variants: [{
          style: style.charAt(0).toUpperCase() + style.slice(1),
          emoji: styleEmojis[style] || '✨',
          text: sample.adjusted,
          explanation: []
        }]
      })
    }))
  }

  return result
}

const STYLE_EMOJIS: Record<string, string> = {
  casual: '😎',
  polite: '🤓',
  neutral: '😶',
  concise: '✂️',
  detailed: '📝',
  catchy: '🤩',
  natural: '🗣️',
  'less-ai': '🧑',
  alternative: '💬'
}

/**
 * Load and synthesize shots for a translation direction.
 *
 * @param sourceLang - Source language code (input text language)
 * @param targetLang - Target language code (translation output language)
 */
export async function loadShots(
  sourceLang: LanguageCode,
  targetLang: LanguageCode
): Promise<ShotLibrary> {
  const [sourceSamples, targetSamples] = await Promise.all([
    loadLanguageSamples(sourceLang),
    loadLanguageSamples(targetLang)
  ])

  return {
    translation: synthesizeTranslationShots(
      sourceSamples.translation,
      targetSamples.translation,
      targetLang
    ),
    adjustment: synthesizeAdjustmentShots(
      targetSamples.adjustment,
      STYLE_EMOJIS
    )
  }
}

/**
 * Preload samples for languages (call during app init).
 */
export async function preloadSamples(...langs: LanguageCode[]): Promise<void> {
  await Promise.all(langs.map(loadLanguageSamples))
}

/**
 * Select translation shots (returns 3 diverse examples).
 * Indices chosen for maximum diversity: poetic(0), child(5), humor(10), social(14)
 */
export function selectTranslationShots(library: ShotLibrary): Shot[] {
  const shots = library.translation
  if (shots.length <= 3) return shots

  const diverseIndices = [0, 5, 10, 14].filter(i => i < shots.length)
  return diverseIndices.slice(0, 3).map(i => shots[i])
}

/**
 * Select adjustment shots for a specific style (returns 3 examples).
 */
export function selectAdjustmentShots(
  library: ShotLibrary,
  styleType: string
): Shot[] {
  const styleKey = styleType in library.adjustment ? styleType : 'casual'
  const shots = library.adjustment[styleKey] || []
  return shots.slice(0, 3)
}

/**
 * Minimal inline fallback when fetch fails.
 */
function getInlineFallbackSamples(): LanguageSamples {
  return {
    translation: [
      { text: 'Hello, how are you?', explanations: { ja: ['標準的な挨拶'] } },
      { text: 'Thank you for your help.', explanations: { ja: ['感謝の表現'] } }
    ],
    adjustment: {
      casual: [
        { formal: 'Please wait.', adjusted: 'Hang on!' }
      ],
      polite: [
        { formal: 'Check this', adjusted: 'Would you mind reviewing this?' }
      ]
    }
  }
}
