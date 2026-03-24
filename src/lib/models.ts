export interface OpenRouterModel {
  id: string
  name: string
  context_length: number
  pricing: {
    prompt: string
    completion: string
  }
}

export interface ModelOption {
  id: string
  name: string
  contextLength: number
  pricePerMillion: number // USD per million tokens (input + output averaged)
  category: 'fast' | 'balanced' | 'advanced'
}

// Cache for fetched models
let cachedModels: ModelOption[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 1000 * 60 * 30 // 30 minutes

// Recommended models for translation (fast and reliable)
const RECOMMENDED_MODEL_IDS = [
  'google/gemini-2.5-flash-lite',
  'openai/gpt-4o-mini',
  'openai/gpt-4.1-nano',
]

function categorizeModel(pricePerMillion: number): 'fast' | 'balanced' | 'advanced' {
  if (pricePerMillion < 0.5) return 'fast'
  if (pricePerMillion < 5) return 'balanced'
  return 'advanced'
}

function parsePrice(priceStr: string): number {
  const price = parseFloat(priceStr)
  return isNaN(price) ? 0 : price
}

export async function fetchAvailableModels(): Promise<ModelOption[]> {
  // Return cached data if valid
  if (cachedModels && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedModels
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models')
    if (!response.ok) {
      throw new Error('Failed to fetch models')
    }

    const data = await response.json()
    const models: OpenRouterModel[] = data.data || []

    // Filter to only recommended models
    const modelOptions: ModelOption[] = models
      .filter((model) => RECOMMENDED_MODEL_IDS.includes(model.id))
      .map((model) => {
        const promptPrice = parsePrice(model.pricing?.prompt || '0')
        const completionPrice = parsePrice(model.pricing?.completion || '0')
        const pricePerMillion = ((promptPrice + completionPrice) / 2) * 1_000_000

        // Clean up model name
        let name = model.name
        if (name.includes(':')) {
          name = name.split(':').pop()?.trim() || name
        }

        return {
          id: model.id,
          name,
          contextLength: model.context_length,
          pricePerMillion,
          category: categorizeModel(pricePerMillion),
        }
      })
      .sort((a, b) => {
        // Sort by recommended order
        const aIndex = RECOMMENDED_MODEL_IDS.indexOf(a.id)
        const bIndex = RECOMMENDED_MODEL_IDS.indexOf(b.id)
        return aIndex - bIndex
      })

    // If no models found from API, use defaults
    if (modelOptions.length === 0) {
      return getDefaultModels()
    }

    cachedModels = modelOptions
    cacheTimestamp = Date.now()

    return modelOptions
  } catch (error) {
    console.error('Failed to fetch models:', error)
    return getDefaultModels()
  }
}

export function getDefaultModels(): ModelOption[] {
  return [
    {
      id: 'google/gemini-2.5-flash-lite',
      name: 'Gemini 2.5 Flash Lite',
      contextLength: 1000000,
      pricePerMillion: 0.03,
      category: 'fast',
    },
    {
      id: 'openai/gpt-4o-mini',
      name: 'GPT-4o Mini',
      contextLength: 128000,
      pricePerMillion: 0.15,
      category: 'fast',
    },
    {
      id: 'openai/gpt-4.1-nano',
      name: 'GPT-4.1 Nano',
      contextLength: 128000,
      pricePerMillion: 0.05,
      category: 'fast',
    },
  ]
}

export function formatPrice(pricePerMillion: number): string {
  if (pricePerMillion < 0.01) {
    return `$${(pricePerMillion * 1000).toFixed(2)}/B`
  }
  if (pricePerMillion < 1) {
    return `$${pricePerMillion.toFixed(2)}/M`
  }
  return `$${pricePerMillion.toFixed(1)}/M`
}

export function getCategoryLabel(category: 'fast' | 'balanced' | 'advanced'): string {
  switch (category) {
    case 'fast':
      return '高速'
    case 'balanced':
      return 'バランス'
    case 'advanced':
      return '高性能'
  }
}

export function getCategoryColor(category: 'fast' | 'balanced' | 'advanced'): string {
  switch (category) {
    case 'fast':
      return 'text-green-600'
    case 'balanced':
      return 'text-blue-600'
    case 'advanced':
      return 'text-purple-600'
  }
}
