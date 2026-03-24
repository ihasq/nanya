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

export async function startOpenRouterAuth() {
  const codeVerifier = await generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  sessionStorage.setItem('openrouter_code_verifier', codeVerifier)

  const callbackUrl = `${window.location.origin}/auth/callback`
  const params = new URLSearchParams({
    callback_url: callbackUrl,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  window.location.href = `${OPENROUTER_AUTH_URL}?${params.toString()}`
}

export async function handleOpenRouterCallback(code: string): Promise<boolean> {
  const codeVerifier = sessionStorage.getItem('openrouter_code_verifier')

  if (!codeVerifier) {
    console.error('Code verifier not found')
    return false
  }

  sessionStorage.removeItem('openrouter_code_verifier')

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
