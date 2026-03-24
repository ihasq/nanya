import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { handleOpenRouterCallback } from '@/lib/openrouter-pkce'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react'

export function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'context-error'>('loading')
  const [error, setError] = useState<string | null>(null)

  const code = searchParams.get('code')

  useEffect(() => {
    const handleCallback = async () => {
      if (!code) {
        setStatus('error')
        setError('認証コードがありません')
        return
      }

      const success = await handleOpenRouterCallback(code)

      if (success) {
        setStatus('success')
        setTimeout(() => navigate('/'), 1500)
      } else {
        // Check if this might be a context issue (WebView vs original browser)
        setStatus('context-error')
        setError('認証の検証に失敗しました')
      }
    }

    handleCallback()
  }, [code, navigate])

  const handleRetryInBrowser = () => {
    // Copy the current URL to clipboard and instruct user
    const currentUrl = window.location.href
    navigator.clipboard?.writeText(currentUrl)

    // Try to open in external browser
    window.open(currentUrl, '_system')
  }

  const handleRetryAuth = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-50 via-background to-sky-50/50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 flex flex-col items-center gap-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg">認証を完了しています...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-lg">認証に成功しました</p>
              <p className="text-sm text-muted-foreground">リダイレクト中...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-lg">認証に失敗しました</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button onClick={handleRetryAuth} className="mt-2">
                ホームに戻る
              </Button>
            </>
          )}

          {status === 'context-error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-lg font-medium">認証の検証に失敗しました</p>
              <div className="text-sm text-muted-foreground text-center space-y-2">
                <p>別のブラウザやアプリ内ブラウザで開いている可能性があります。</p>
                <p>以下のいずれかをお試しください：</p>
              </div>

              <div className="w-full space-y-2 mt-2">
                <Button
                  onClick={handleRetryInBrowser}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  外部ブラウザで開く
                </Button>

                <Button
                  onClick={handleRetryAuth}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  最初からやり直す
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">ヒント:</p>
                <p>OpenRouterアプリがインストールされている場合、</p>
                <p>ChromeやSafariで直接 nanya.pages.dev を</p>
                <p>開いてから認証してください。</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
