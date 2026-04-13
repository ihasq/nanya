/**
 * URL hash utilities for conversation management.
 *
 * Hash format: #<truncated-encoded-text>-<uuid>
 * Example: #Hello%20world-abc123def
 */

// Max characters for the text portion in the hash
const MAX_TEXT_LENGTH = 50

/**
 * Generate a short UUID (8 characters).
 */
export function generateShortId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/**
 * Encode input text for URL hash.
 * Truncates and URL-encodes the text.
 */
function encodeText(text: string): string {
  // Take first line only, truncate, and clean up
  const firstLine = text.split('\n')[0].trim()
  const truncated = firstLine.slice(0, MAX_TEXT_LENGTH)
  return encodeURIComponent(truncated)
}

/**
 * Create a conversation hash from input text and ID.
 */
export function createConversationHash(inputText: string, id: string): string {
  const encodedText = encodeText(inputText)
  return `${encodedText}-${id}`
}

/**
 * Parse a conversation hash into its components.
 * Returns null if the hash is invalid.
 */
export function parseConversationHash(hash: string): { text: string; id: string } | null {
  // Remove leading # if present
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash

  if (!cleanHash) return null

  // Find the last hyphen (ID is always at the end)
  const lastHyphenIndex = cleanHash.lastIndexOf('-')

  if (lastHyphenIndex === -1 || lastHyphenIndex === cleanHash.length - 1) {
    return null
  }

  const encodedText = cleanHash.slice(0, lastHyphenIndex)
  const id = cleanHash.slice(lastHyphenIndex + 1)

  // ID should be alphanumeric
  if (!/^[a-z0-9]+$/i.test(id)) {
    return null
  }

  try {
    const text = decodeURIComponent(encodedText)
    return { text, id }
  } catch {
    return null
  }
}

/**
 * Set the URL hash and push to browser history.
 */
export function pushUrlHash(hash: string): void {
  const newUrl = `${window.location.pathname}${window.location.search}#${hash}`
  window.history.pushState({ hash }, '', newUrl)
}

/**
 * Replace the current URL hash without adding to history.
 */
export function replaceUrlHash(hash: string): void {
  const newUrl = `${window.location.pathname}${window.location.search}#${hash}`
  window.history.replaceState({ hash }, '', newUrl)
}

/**
 * Clear the URL hash and push to browser history.
 */
export function clearUrlHash(): void {
  const newUrl = `${window.location.pathname}${window.location.search}`
  window.history.pushState({ hash: '' }, '', newUrl)
}

/**
 * Replace current URL with no hash (no history entry).
 */
export function replaceUrlHashClear(): void {
  const newUrl = `${window.location.pathname}${window.location.search}`
  window.history.replaceState({ hash: '' }, '', newUrl)
}

/**
 * Get the current URL hash (without the # prefix).
 */
export function getUrlHash(): string {
  return window.location.hash.slice(1)
}
