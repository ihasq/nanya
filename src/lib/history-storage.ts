import { get, set, del, keys } from 'idb-keyval'
import pako from 'pako'
import type { TranslationVariant } from '@/lib/llm-client'

export interface HistoryEntry {
  id: string
  inputText: string
  outputText: string
  targetLanguage: string
  writingStyle: string
  timestamp: number
  variants?: TranslationVariant[]
}

const HISTORY_PREFIX = 'history:'
const MAX_HISTORY_ENTRIES = 100

function compress(data: string): Uint8Array {
  return pako.gzip(data)
}

function decompress(data: Uint8Array): string {
  return pako.ungzip(data, { to: 'string' })
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export async function saveHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): Promise<HistoryEntry> {
  const fullEntry: HistoryEntry = {
    ...entry,
    id: generateId(),
    timestamp: Date.now(),
  }

  const compressed = compress(JSON.stringify(fullEntry))
  await set(`${HISTORY_PREFIX}${fullEntry.id}`, compressed)

  // Cleanup old entries if we have too many
  await cleanupOldEntries()

  return fullEntry
}

export async function getHistoryEntry(id: string): Promise<HistoryEntry | null> {
  const compressed = await get<Uint8Array>(`${HISTORY_PREFIX}${id}`)
  if (!compressed) return null

  try {
    return JSON.parse(decompress(compressed))
  } catch {
    return null
  }
}

export async function getAllHistoryEntries(): Promise<HistoryEntry[]> {
  const allKeys = await keys()
  const historyKeys = allKeys.filter((key) => String(key).startsWith(HISTORY_PREFIX))

  const entries: HistoryEntry[] = []

  for (const key of historyKeys) {
    const compressed = await get<Uint8Array>(key)
    if (compressed) {
      try {
        entries.push(JSON.parse(decompress(compressed)))
      } catch {
        // Skip corrupted entries
      }
    }
  }

  // Sort by timestamp descending (newest first)
  return entries.sort((a, b) => b.timestamp - a.timestamp)
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  await del(`${HISTORY_PREFIX}${id}`)
}

export async function clearAllHistory(): Promise<void> {
  const allKeys = await keys()
  const historyKeys = allKeys.filter((key) => String(key).startsWith(HISTORY_PREFIX))

  for (const key of historyKeys) {
    await del(key)
  }
}

async function cleanupOldEntries(): Promise<void> {
  const entries = await getAllHistoryEntries()

  if (entries.length > MAX_HISTORY_ENTRIES) {
    const toDelete = entries.slice(MAX_HISTORY_ENTRIES)
    for (const entry of toDelete) {
      await deleteHistoryEntry(entry.id)
    }
  }
}
