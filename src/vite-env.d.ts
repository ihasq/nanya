/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_CLIENT_ID: string
  readonly VITE_OPENROUTER_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
