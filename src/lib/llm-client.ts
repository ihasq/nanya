import { useAuthStore } from '@/stores/auth-store'
import { useSettingsStore, DEFAULT_MODEL } from '@/stores/settings-store'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/i18n'
import { loadShots, selectTranslationShots, selectAdjustmentShots, type ShotLibrary, type Shot } from '@/lib/shot-loader'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export type TargetLanguage = 'auto' | 'ja' | 'en'

export interface TranslationVariant {
  style: string
  emoji: string
  text: string
  explanation?: string[]
  example?: {
    original: string
    translated: string
  }
}

export interface TranslationResult {
  variants: TranslationVariant[]
}

function isQwenModel(modelId: string): boolean {
  return modelId.toLowerCase().includes('qwen')
}

function getLanguageName(code: LanguageCode): string {
  return SUPPORTED_LANGUAGES[code]?.englishName || code
}

/**
 * Detect if text is primarily Japanese (contains Japanese characters).
 */
function isJapaneseText(text: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text)
}

/**
 * Determine source and target languages based on input text and settings.
 */
function detectTranslationDirection(
  text: string,
  systemLanguage: LanguageCode,
  defaultTargetLanguage: LanguageCode
): { sourceLang: LanguageCode; targetLang: LanguageCode } {
  const isJapanese = isJapaneseText(text)

  // If text is in system language, translate to target; otherwise translate to system language
  if (systemLanguage === 'ja') {
    return isJapanese
      ? { sourceLang: 'ja', targetLang: defaultTargetLanguage }
      : { sourceLang: 'en', targetLang: 'ja' }
  } else {
    return isJapanese
      ? { sourceLang: 'ja', targetLang: systemLanguage }
      : { sourceLang: 'en', targetLang: 'ja' }
  }
}

function buildTranslationMessages(
  text: string,
  modelId: string,
  systemLanguage: LanguageCode,
  sourceLang: LanguageCode,
  targetLang: LanguageCode,
  shots: Shot[],
  attachments?: AttachmentContext[]
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const systemLangName = getLanguageName(systemLanguage)
  const sourceLangName = getLanguageName(sourceLang)
  const targetLangName = getLanguageName(targetLang)

  // Concise system prompt - patterns learned from multi-shot examples
  let systemPrompt = `Translation engine. Translate <translate> content.
Direction: ${sourceLangName} → ${targetLangName}.
Output: Raw JSON only. "explanation" field MUST be in ${systemLangName}.`

  if (isQwenModel(modelId)) {
    systemPrompt = `\\no_think\n${systemPrompt}`
  }

  // Build the final user message with optional attachment context
  let userMessage = `<translate>${text}</translate>`

  if (attachments && attachments.length > 0) {
    const contextParts = attachments.map((att) => {
      if (att.type.startsWith('text/') || att.type === 'application/json') {
        return `<context file="${att.name}">\n${att.content}\n</context>`
      }
      return `<context file="${att.name}" type="${att.type}">[Attached file]</context>`
    })
    userMessage = `${contextParts.join('\n\n')}\n\n${userMessage}`
  }

  // Construct message array with multi-shot examples
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt }
  ]

  for (const shot of shots) {
    messages.push({ role: 'user', content: shot.user })
    messages.push({ role: 'assistant', content: shot.assistant })
  }

  messages.push({ role: 'user', content: userMessage })

  return messages
}

function buildAdjustmentMessages(
  currentTranslation: string,
  adjustmentType: string,
  modelId: string,
  systemLanguage: LanguageCode,
  shots: Shot[]
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const systemLangName = getLanguageName(systemLanguage)

  // Detect translation language
  const isTranslationJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(currentTranslation)
  const translationLang = isTranslationJapanese ? 'Japanese' : 'English'

  // Concise system prompt - behavior learned from multi-shot examples
  let systemPrompt = `Style adjuster. Adjust text to requested style.
Output: Raw JSON. "explanation" field MUST be in ${systemLangName}. "text" in ${translationLang}.`

  if (isQwenModel(modelId)) {
    systemPrompt = `\\no_think\n${systemPrompt}`
  }

  // Build messages with selected multi-shot examples
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt }
  ]

  for (const shot of shots) {
    messages.push({ role: 'user', content: shot.user })
    messages.push({ role: 'assistant', content: shot.assistant })
  }

  // Final user message with actual content
  messages.push({
    role: 'user',
    content: `Text: ${currentTranslation}\nStyle: ${adjustmentType}`
  })

  return messages
}

// Partial variant for streaming - fields may be incomplete
export interface PartialVariant {
  style?: string
  emoji?: string
  text?: string
  explanation?: string[]
  isComplete?: boolean
}

export interface AttachmentContext {
  name: string
  type: string
  content: string
}

export interface TranslateOptions {
  text: string
  attachments?: AttachmentContext[]
  onPartialResult?: (variant: PartialVariant) => void
}

export interface AdjustOptions {
  originalText: string
  currentTranslation: string
  adjustmentType: string
  onPartialResult?: (variant: PartialVariant) => void
}

async function callLLM(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model: string,
  accessToken: string
): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Nanya Translate',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || error.message || 'Translation failed')
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

// Streaming LLM call with partial JSON parsing
async function callLLMStreaming(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model: string,
  accessToken: string,
  onPartialResult?: (variant: PartialVariant) => void
): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Nanya Translate',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      stream: true,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || error.message || 'Translation failed')
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let fullContent = ''
  let lastParsedState: PartialVariant = {}

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta?.content || ''
          fullContent += delta

          // Parse partial JSON and emit updates
          if (onPartialResult) {
            const newState = parsePartialJSON(fullContent)
            if (hasNewContent(lastParsedState, newState)) {
              onPartialResult(newState)
              lastParsedState = { ...newState }
            }
          }
        } catch {
          // Skip invalid JSON chunks
        }
      }
    }
  }

  return fullContent
}

// Parse partial JSON to extract completed fields
function parsePartialJSON(content: string): PartialVariant {
  const result: PartialVariant = {}

  // Clean up markdown code blocks and other wrappers
  let cleaned = content.trim()
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  // Handle triple-quoted strings (some models wrap JSON this way)
  cleaned = cleaned.replace(/^"""\s*/, '').replace(/\s*"""$/, '')
  // Handle single-quoted wrappers
  cleaned = cleaned.replace(/^'\s*/, '').replace(/\s*'$/, '')

  // Extract style field
  const styleMatch = cleaned.match(/"style"\s*:\s*"([^"]*)"/)
  if (styleMatch) {
    result.style = styleMatch[1]
  }

  // Extract emoji field
  const emojiMatch = cleaned.match(/"emoji"\s*:\s*"([^"]*)"/)
  if (emojiMatch) {
    result.emoji = emojiMatch[1]
  }

  // Extract text field (must be complete - ends with closing quote not followed by incomplete escape)
  const textMatch = cleaned.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"\s*[,\}]/)
  if (textMatch) {
    let extractedText = textMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\')

    // Safety check: if extracted text looks like it contains the JSON envelope,
    // something went wrong - try to extract the actual text from it
    if (extractedText.startsWith('{"variants":[') || extractedText.startsWith('{ "variants"')) {
      try {
        const nestedParse = JSON.parse(extractedText)
        if (nestedParse.variants?.[0]?.text) {
          extractedText = nestedParse.variants[0].text
        }
      } catch {
        // If parsing fails, try regex extraction from the nested structure
        const nestedTextMatch = extractedText.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/)?.[1]
        if (nestedTextMatch) {
          extractedText = nestedTextMatch.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\')
        }
      }
    }

    result.text = extractedText
  }

  // Extract explanation array - parse completed items
  const explanationMatch = cleaned.match(/"explanation"\s*:\s*\[([\s\S]*?)(?:\]|$)/)
  if (explanationMatch) {
    const arrayContent = explanationMatch[0]
    const items: string[] = []

    // Find all complete string items in the array
    const itemRegex = /"((?:[^"\\]|\\.)*)"/g
    let match
    // Skip first match if it's the key "explanation"
    const afterKey = arrayContent.replace(/"explanation"\s*:\s*\[/, '')

    while ((match = itemRegex.exec(afterKey)) !== null) {
      items.push(match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\'))
    }

    if (items.length > 0) {
      result.explanation = items
    }

    // Check if array is complete
    if (arrayContent.includes(']')) {
      result.isComplete = true
    }
  }

  return result
}

// Check if there's new content worth emitting
function hasNewContent(prev: PartialVariant, next: PartialVariant): boolean {
  if (next.text && next.text !== prev.text) return true
  if (next.style && next.style !== prev.style) return true
  if (next.emoji && next.emoji !== prev.emoji) return true
  if (next.explanation && next.explanation.length !== (prev.explanation?.length || 0)) return true
  if (next.isComplete && !prev.isComplete) return true
  return false
}

function parseTranslationResult(content: string): TranslationResult {
  try {
    let jsonStr = content.trim()

    // Remove markdown code blocks if present (handles ```json, ```, etc.)
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    // Handle triple-quoted strings (some models wrap JSON this way)
    jsonStr = jsonStr.replace(/^"""\s*/, '').replace(/\s*"""$/, '')
    // Handle single-quoted wrappers
    jsonStr = jsonStr.replace(/^'\s*/, '').replace(/\s*'$/, '')

    // Try to find JSON object in the response using regex
    const jsonMatch = jsonStr.match(/\{[\s\S]*"variants"[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    // Try parsing
    const result = JSON.parse(jsonStr)

    if (result.variants && Array.isArray(result.variants) && result.variants.length > 0) {
      // Validate each variant has at least a text field
      const validVariants = result.variants.filter(
        (v: TranslationVariant) => v.text && typeof v.text === 'string'
      )
      if (validVariants.length > 0) {
        return { variants: validVariants }
      }
    }

    // If we have a text field directly, wrap it
    if (result.text && typeof result.text === 'string') {
      return {
        variants: [{
          style: '翻訳',
          emoji: '📝',
          text: result.text,
        }]
      }
    }

    throw new Error('Invalid response structure')
  } catch {
    // Fallback: extract plain text translation
    let text = content.trim()

    // Remove any wrappers (markdown code blocks, triple quotes, etc.)
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    text = text.replace(/^"""\s*/, '').replace(/\s*"""$/, '')
    text = text.replace(/^'\s*/, '').replace(/\s*'$/, '')

    // If it still looks like JSON with variants, try to extract the text field properly
    if (text.includes('"variants"') && text.includes('"text"')) {
      // Try with escape-aware regex
      const textMatch = text.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"\s*[,\}]/)
      if (textMatch) {
        text = textMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\')
      } else {
        // Last resort: find the text value by locating "text":" and finding the closing quote
        const textKeyPos = text.indexOf('"text"')
        if (textKeyPos !== -1) {
          const colonPos = text.indexOf(':', textKeyPos)
          const quoteStartPos = text.indexOf('"', colonPos + 1)
          if (quoteStartPos !== -1) {
            // Manually find closing quote, handling escapes
            let i = quoteStartPos + 1
            let extractedText = ''
            while (i < text.length) {
              if (text[i] === '\\' && i + 1 < text.length) {
                // Handle escape sequence
                const nextChar = text[i + 1]
                if (nextChar === 'n') extractedText += '\n'
                else if (nextChar === '"') extractedText += '"'
                else if (nextChar === '\\') extractedText += '\\'
                else extractedText += nextChar
                i += 2
              } else if (text[i] === '"') {
                // Found closing quote
                break
              } else {
                extractedText += text[i]
                i++
              }
            }
            if (extractedText) {
              text = extractedText
            }
          }
        }
      }
    } else {
      // Remove JSON-like structures if no variants pattern found
      text = text.replace(/^\{[\s\S]*\}$/, '')
    }

    // Clean up any remaining escaped characters
    text = text.replace(/\\n/g, '\n').replace(/\\"/g, '"')

    // If empty after cleanup, this is a real failure - return error message
    if (!text.trim()) {
      text = '[Translation parsing failed]'
    }

    return {
      variants: [{
        style: '翻訳',
        emoji: '📝',
        text: text,
      }]
    }
  }
}

export async function translate(options: TranslateOptions): Promise<TranslationResult> {
  const { accessToken } = useAuthStore.getState()
  const settings = useSettingsStore.getState()

  if (!accessToken) {
    throw new Error('Not authenticated')
  }

  const model = settings.selectedModel || DEFAULT_MODEL

  // Detect translation direction from input text
  const { sourceLang, targetLang } = detectTranslationDirection(
    options.text,
    settings.systemLanguage,
    settings.defaultTargetLanguage
  )

  // Load shots for this language pair (CPU-synthesized from samples)
  const shotLibrary = await loadShots(sourceLang, targetLang)
  const shots = selectTranslationShots(shotLibrary)

  const messages = buildTranslationMessages(
    options.text,
    model,
    settings.systemLanguage,
    sourceLang,
    targetLang,
    shots,
    options.attachments
  )

  // Use streaming if callback provided
  if (options.onPartialResult) {
    const content = await callLLMStreaming(messages, model, accessToken, options.onPartialResult)
    return parseTranslationResult(content)
  }

  const content = await callLLM(messages, model, accessToken)
  return parseTranslationResult(content)
}

export async function adjustTranslation(options: AdjustOptions): Promise<TranslationResult> {
  const { accessToken } = useAuthStore.getState()
  const settings = useSettingsStore.getState()

  if (!accessToken) {
    throw new Error('Not authenticated')
  }

  const model = settings.selectedModel || DEFAULT_MODEL

  // Detect translation language for loading appropriate adjustment samples
  const translationLang: LanguageCode = isJapaneseText(options.currentTranslation) ? 'ja' : 'en'

  // Load shots for the translation's language (adjustments are within same language)
  const shotLibrary = await loadShots(translationLang, translationLang)
  const shots = selectAdjustmentShots(shotLibrary, options.adjustmentType)

  const messages = buildAdjustmentMessages(
    options.currentTranslation,
    options.adjustmentType,
    model,
    settings.systemLanguage,
    shots
  )

  // Use streaming if callback provided
  if (options.onPartialResult) {
    const content = await callLLMStreaming(messages, model, accessToken, options.onPartialResult)
    return parseTranslationResult(content)
  }

  const content = await callLLM(messages, model, accessToken)
  return parseTranslationResult(content)
}

// Simple translation for back-translation
export async function simpleTranslate(text: string, targetLang: 'ja' | 'en'): Promise<string> {
  const { accessToken } = useAuthStore.getState()
  const settings = useSettingsStore.getState()

  if (!accessToken) {
    throw new Error('Not authenticated')
  }

  const model = settings.selectedModel || DEFAULT_MODEL
  const targetName = targetLang === 'ja' ? 'Japanese' : 'English'

  let systemPrompt = `Translate the following text to ${targetName}. Output only the translation, nothing else.`

  if (isQwenModel(model)) {
    systemPrompt = `\\no_think\n${systemPrompt}`
  }

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: text }
  ]

  return await callLLM(messages, model, accessToken)
}
