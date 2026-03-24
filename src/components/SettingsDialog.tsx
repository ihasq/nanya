import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSettingsStore, LANGUAGE_LABELS, type Language } from '@/stores/settings-store'
import { clearAllHistory } from '@/lib/history-storage'
import {
  fetchAvailableModels,
  getDefaultModels,
  formatPrice,
  getCategoryLabel,
  type ModelOption,
} from '@/lib/models'
import { Settings, Trash2, RefreshCw, Loader2 } from 'lucide-react'

const LANGUAGES: Language[] = ['en', 'ja', 'es', 'ko', 'zh-CN', 'zh-TW']

export function SettingsDialog() {
  const settings = useSettingsStore()
  const [models, setModels] = useState<ModelOption[]>(getDefaultModels())
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  const loadModels = async () => {
    setIsLoadingModels(true)
    try {
      const fetchedModels = await fetchAvailableModels()
      setModels(fetchedModels)
    } catch (error) {
      console.error('Failed to load models:', error)
    } finally {
      setIsLoadingModels(false)
    }
  }

  useEffect(() => {
    loadModels()
  }, [])

  const handleClearHistory = async () => {
    if (confirm('翻訳履歴をすべて削除しますか？')) {
      await clearAllHistory()
    }
  }

  // Group models by category
  const fastModels = models.filter((m) => m.category === 'fast')
  const balancedModels = models.filter((m) => m.category === 'balanced')
  const advancedModels = models.filter((m) => m.category === 'advanced')

  const selectedModelInfo = models.find((m) => m.id === settings.selectedModel)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
          <DialogDescription>翻訳の設定をカスタマイズ</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Model Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>翻訳モデル</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={loadModels}
                disabled={isLoadingModels}
              >
                {isLoadingModels ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
            </div>
            <Select
              value={settings.selectedModel}
              onValueChange={(v: string) => settings.setSelectedModel(v)}
            >
              <SelectTrigger>
                <SelectValue>
                  {selectedModelInfo ? (
                    <span className="flex items-center gap-2">
                      <span>{selectedModelInfo.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatPrice(selectedModelInfo.pricePerMillion)}
                      </span>
                    </span>
                  ) : (
                    settings.selectedModel
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {fastModels.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="text-green-600">
                      ⚡ {getCategoryLabel('fast')}
                    </SelectLabel>
                    {fastModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <span className="flex items-center justify-between w-full gap-4">
                          <span>{model.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatPrice(model.pricePerMillion)}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {balancedModels.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="text-blue-600">
                      ⚖️ {getCategoryLabel('balanced')}
                    </SelectLabel>
                    {balancedModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <span className="flex items-center justify-between w-full gap-4">
                          <span>{model.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatPrice(model.pricePerMillion)}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {advancedModels.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="text-purple-600">
                      🚀 {getCategoryLabel('advanced')}
                    </SelectLabel>
                    {advancedModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <span className="flex items-center justify-between w-full gap-4">
                          <span>{model.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatPrice(model.pricePerMillion)}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
            {selectedModelInfo && (
              <p className="text-xs text-muted-foreground">
                コンテキスト: {(selectedModelInfo.contextLength / 1000).toFixed(0)}K トークン
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>母国語</Label>
            <Select
              value={settings.nativeLanguage}
              onValueChange={(v: string) => settings.setNativeLanguage(v as Language)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {LANGUAGE_LABELS[lang]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>キーボードショートカット</Label>
              <p className="text-sm text-muted-foreground">Cmd/Ctrl + Enter で翻訳</p>
            </div>
            <Switch
              checked={settings.enableShortcuts}
              onCheckedChange={settings.setEnableShortcuts}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>履歴を保存</Label>
              <p className="text-sm text-muted-foreground">翻訳をローカルに保存</p>
            </div>
            <Switch
              checked={settings.enableHistory}
              onCheckedChange={settings.setEnableHistory}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>翻訳履歴</Label>
            <p className="text-sm text-muted-foreground">
              IndexedDBにgzip圧縮で保存されています
            </p>
            <Button variant="destructive" onClick={handleClearHistory} className="w-full gap-2">
              <Trash2 className="h-4 w-4" />
              履歴をすべて削除
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
