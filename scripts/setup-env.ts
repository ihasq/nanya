import * as fs from 'fs'
import * as path from 'path'

const ENV_PATH = path.resolve(process.cwd(), '.env')

function readEnv(): Record<string, string> {
  if (!fs.existsSync(ENV_PATH)) return {}

  const content = fs.readFileSync(ENV_PATH, 'utf-8')
  const env: Record<string, string> = {}

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [key, ...valueParts] = trimmed.split('=')
    if (key) {
      env[key] = valueParts.join('=')
    }
  }

  return env
}

async function main() {
  const env = readEnv()

  console.log('\n🌐 Nanya - Environment Setup\n')
  console.log('✅ OpenRouter PKCE認証を使用します（Client ID不要）\n')

  if (Object.keys(env).length > 0) {
    console.log('既存の.envファイルを検出しました\n')
  }

  console.log('準備完了！\n')
}

main()
