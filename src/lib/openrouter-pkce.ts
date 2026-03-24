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

export async function startOpenRouterAuth(): Promise<void> {
  const codeVerifier = await generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  const origin = window.location.origin
  const callbackUrl = `${origin}/auth/callback`

  // Store verifier with the origin for verification
  try {
    localStorage.setItem('nanya_openrouter_code_verifier', codeVerifier)
    localStorage.setItem('nanya_openrouter_origin', origin)

    // Verify the write succeeded
    const storedVerifier = localStorage.getItem('nanya_openrouter_code_verifier')
    const storedOrigin = localStorage.getItem('nanya_openrouter_origin')

    console.log('[Auth] Origin:', origin)
    console.log('[Auth] Callback URL:', callbackUrl)
    console.log('[Auth] Stored verifier:', storedVerifier ? 'OK' : 'FAILED')
    console.log('[Auth] Stored origin:', storedOrigin ? 'OK' : 'FAILED')

    if (!storedVerifier || !storedOrigin) {
      console.error('[Auth] localStorage write verification failed!')
      alert('認証データの保存に失敗しました。ブラウザの設定を確認してください。')
      return
    }
  } catch (e) {
    console.error('[Auth] Failed to store in localStorage:', e)
    alert('認証データの保存に失敗しました: ' + e)
    return
  }

  const params = new URLSearchParams({
    callback_url: callbackUrl,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  const authUrl = `${OPENROUTER_AUTH_URL}?${params.toString()}`
  console.log('[Auth] Redirecting to:', authUrl)

  // Use setTimeout to ensure localStorage is committed before redirect
  setTimeout(() => {
    window.location.href = authUrl
  }, 100)
}

export type CallbackResult = {
  success: boolean
  error?: string
  details?: string
}

export async function handleOpenRouterCallback(code: string): Promise<CallbackResult> {
  const currentOrigin = window.location.origin
  const storedOrigin = localStorage.getItem('nanya_openrouter_origin')
  const codeVerifier = localStorage.getItem('nanya_openrouter_code_verifier')

  console.log('[Callback] Current origin:', currentOrigin)
  console.log('[Callback] Stored origin:', storedOrigin)
  console.log('[Callback] Code verifier:', codeVerifier ? 'found' : 'not found')

  // Check for origin mismatch
  if (storedOrigin && storedOrigin !== currentOrigin) {
    console.error('[Callback] Origin mismatch! Auth started on:', storedOrigin, 'but callback is on:', currentOrigin)
    return {
      success: false,
      error: 'origin_mismatch',
      details: `認証開始時のドメイン (${storedOrigin}) とコールバックのドメイン (${currentOrigin}) が異なります。同じドメインで認証を完了してください。`
    }
  }

  if (!codeVerifier) {
    console.error('[Callback] Code verifier not found in localStorage')
    return {
      success: false,
      error: 'verifier_not_found',
      details: 'コード検証子が見つかりません。ブラウザのプライベートモードを使用している場合は、通常モードでお試しください。'
    }
  }

  // Clear stored data
  localStorage.removeItem('nanya_openrouter_code_verifier')
  localStorage.removeItem('nanya_openrouter_origin')

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
      return {
        success: false,
        error: 'token_exchange_failed',
        details: `トークン交換に失敗しました: ${errorData.error || errorData.message || response.status}`
      }
    }

    const data = await response.json()
    setAuth(data.key)
    return { success: true }
  } catch (error) {
    console.error('OpenRouter OAuth error:', error)
    return {
      success: false,
      error: 'network_error',
      details: `ネットワークエラー: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
