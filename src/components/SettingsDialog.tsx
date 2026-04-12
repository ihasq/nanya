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
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettingsStore, useT, getLanguageLabel, getLanguageFlag } from '@/stores/settings-store'
import { clearAllHistory } from '@/lib/history-storage'
import {
  fetchAvailableModels,
  getDefaultModels,
  formatPrice,
  type ModelOption,
} from '@/lib/models'
import { Settings, Trash2, RefreshCw, Loader2 } from 'lucide-react'
import { getAllLanguageCodes, type LanguageCode } from '@/lib/i18n'

const ALL_LANGUAGES = getAllLanguageCodes()

export function SettingsDialog() {
  const settings = useSettingsStore()
  const t = useT()
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
    if (confirm(t('settings.clearHistoryConfirm'))) {
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
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
          <DialogDescription>{t('settings.description')}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 mt-4">
            {/* System Language Selection */}
            <div className="space-y-2">
              <Label>{t('settings.systemLanguage')}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.systemLanguageDesc')}</p>
              <Select
                value={settings.systemLanguage}
                onValueChange={(v: string) => settings.setSystemLanguage(v as LanguageCode)}
              >
                <SelectTrigger>
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      <span>{getLanguageFlag(settings.systemLanguage)}</span>
                      <span>{getLanguageLabel(settings.systemLanguage)}</span>
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[300px]">
                    {ALL_LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        <span className="flex items-center gap-2">
                          <span>{getLanguageFlag(lang)}</span>
                          <span>{getLanguageLabel(lang)}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Model Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('settings.translationModel')}</Label>
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
                        ⚡ {t('settings.fast')}
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
                        ⚖️ {t('settings.balanced')}
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
                        🚀 {t('settings.advanced')}
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
                  {t('settings.contextTokens')}: {(selectedModelInfo.contextLength / 1000).toFixed(0)}K tokens
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('settings.defaultTargetLanguage')}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.defaultTargetLanguageDesc')}</p>
              <Select
                value={settings.defaultTargetLanguage}
                onValueChange={(v: string) => settings.setDefaultTargetLanguage(v as LanguageCode)}
              >
                <SelectTrigger>
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      <span>{getLanguageFlag(settings.defaultTargetLanguage)}</span>
                      <span>{getLanguageLabel(settings.defaultTargetLanguage)}</span>
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[300px]">
                    {ALL_LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        <span className="flex items-center gap-2">
                          <span>{getLanguageFlag(lang)}</span>
                          <span>{getLanguageLabel(lang)}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.keyboardShortcuts')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.keyboardShortcutsDesc')}</p>
              </div>
              <Switch
                checked={settings.enableShortcuts}
                onCheckedChange={settings.setEnableShortcuts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.saveHistory')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.saveHistoryDesc')}</p>
              </div>
              <Switch
                checked={settings.enableHistory}
                onCheckedChange={settings.setEnableHistory}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>{t('settings.translationHistory')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.historyStorageDesc')}
              </p>
              <Button variant="destructive" onClick={handleClearHistory} className="w-full gap-2">
                <Trash2 className="h-4 w-4" />
                {t('settings.clearAllHistory')}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
