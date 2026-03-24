import { useAuthStore } from '@/stores/auth-store'

const OPENROUTER_AUTH_URL = 'https://openrouter.ai/auth'
const OPENROUTER_TOKEN_URL = 'https://openrouter.ai/api/v1/auth/keys'

async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(hash))
}

function base64UrlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Store verifier in memory for popup flow
let pendingVerifier: string | null = null

export async function startOpenRouterAuth(): Promise<void> {
  const codeVerifier = await generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  // Store in memory for popup flow
  pendingVerifier = codeVerifier

  // Also store in localStorage as fallback for redirect flow
  localStorage.setItem('nanya_openrouter_code_verifier', codeVerifier)

  const callbackUrl = `${window.location.origin}/auth/callback`
  const params = new URLSearchParams({
    callback_url: callbackUrl,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  const authUrl = `${OPENROUTER_AUTH_URL}?${params.toString()}`

  // Try popup first (works better on mobile with PWAs)
  const width = 500
  const height = 700
  const left = window.screenX + (window.outerWidth - width) / 2
  const top = window.screenY + (window.outerHeight - height) / 2

  const popup = window.open(
    authUrl,
    'openrouter_auth',
    `width=${width},height=${height},left=${left},top=${top},popup=yes`
  )

  // If popup was blocked or failed, fall back to redirect
  if (!popup || popup.closed) {
    window.location.href = authUrl
    return
  }

  // Poll for the popup to return to our callback URL
  return new Promise((resolve) => {
    const pollInterval = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(pollInterval)
          resolve()
          return
        }

        // Check if popup navigated to our callback
        const popupUrl = popup.location.href
        if (popupUrl.startsWith(window.location.origin + '/auth/callback')) {
          clearInterval(pollInterval)

          // Extract code from URL
          const url = new URL(popupUrl)
          const code = url.searchParams.get('code')

          popup.close()

          if (code) {
            // Handle the callback directly
            handleOpenRouterCallback(code).then(() => {
              // Refresh the page to update UI
              window.location.reload()
            })
          }

          resolve()
        }
      } catch {
        // Cross-origin error - popup is still on OpenRouter's domain
        // Continue polling
      }
    }, 500)

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      if (!popup.closed) {
        popup.close()
      }
      resolve()
    }, 5 * 60 * 1000)
  })
}

export async function handleOpenRouterCallback(code: string): Promise<boolean> {
  // Try memory first (popup flow), then localStorage (redirect flow)
  let codeVerifier = pendingVerifier
  if (!codeVerifier) {
    codeVerifier = localStorage.getItem('nanya_openrouter_code_verifier')
  }

  if (!codeVerifier) {
    console.error('Code verifier not found')
    return false
  }

  // Clear stored verifier
  pendingVerifier = null
  localStorage.removeItem('nanya_openrouter_code_verifier')

  const { setAuth } = useAuthStore.getState()

  try {
    const response = await fetch(OPENROUTER_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        code_verifier: codeVerifier,
        code_challenge_method: 'S256',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Token exchange failed:', errorData)
      throw new Error('Token exchange failed')
    }

    const data = await response.json()
    setAuth(data.key)
    return true
  } catch (error) {
    console.error('OpenRouter OAuth error:', error)
    return false
  }
}
