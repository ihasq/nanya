import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { handleOpenRouterCallback } from '@/lib/openrouter-pkce'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')

      if (!code) {
        setStatus('error')
        setError('Missing authorization code')
        return
      }

      const success = await handleOpenRouterCallback(code)

      if (success) {
        setStatus('success')
        setTimeout(() => navigate('/'), 1500)
      } else {
        setStatus('error')
        setError('Authentication failed')
      }
    }

    handleCallback()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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
              <p className="text-lg">認証に成功しました！</p>
              <p className="text-sm text-muted-foreground">リダイレクト中...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-lg">認証に失敗しました</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="text-primary underline text-sm"
              >
                ホームに戻る
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
