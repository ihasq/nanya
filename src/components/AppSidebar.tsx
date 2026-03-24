import { useEffect, useState } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { type HistoryEntry } from '@/lib/history-storage'
import { useTranslationStore } from '@/stores/translation-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useAuthStore } from '@/stores/auth-store'
import {
  fetchAvailableModels,
  getDefaultModels,
  formatPrice,
  type ModelOption,
} from '@/lib/models'
import { SettingsDialog } from './SettingsDialog'
import { PenLine, Zap, ChevronDown, LogOut, Check } from 'lucide-react'

interface AppSidebarProps {
  entries: HistoryEntry[]
  onNewTranslation: () => void
}

export function AppSidebar({ entries, onNewTranslation }: AppSidebarProps) {
  const { inputText, setInputText } = useTranslationStore()
  const { selectedModel, setSelectedModel } = useSettingsStore()
  const { clearAuth } = useAuthStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const [models, setModels] = useState<ModelOption[]>(getDefaultModels())

  useEffect(() => {
    fetchAvailableModels().then(setModels).catch(() => {})
  }, [])

  const handleSelectEntry = (entry: HistoryEntry) => {
    setInputText(entry.inputText)
    // Re-translate when selecting from history
  }

  const currentModel = models.find((m) => m.id === selectedModel)
  const quickModels = models.filter((m) => m.category === 'fast').slice(0, 5)

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold">N</span>
          </div>
          <span className="font-semibold">Nanya</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-3 py-0">
          <SidebarGroupContent>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 font-normal h-9"
              onClick={onNewTranslation}
            >
              <PenLine className="h-4 w-4" />
              あたらしく翻訳
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {entries.map((entry) => (
                <SidebarMenuItem key={entry.id}>
                  <SidebarMenuButton
                    onClick={() => handleSelectEntry(entry)}
                    isActive={inputText === entry.inputText}
                    className="truncate"
                  >
                    <span className="truncate">{entry.inputText}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t space-y-2">
        {/* Quick Model Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between h-8 text-xs">
              <span className="flex items-center gap-1.5">
                <Zap className="h-3 w-3" />
                <span className="truncate max-w-[140px]">
                  {currentModel?.name || selectedModel.split('/').pop()}
                </span>
              </span>
              <span className="flex items-center gap-1">
                {currentModel && (
                  <span className="text-muted-foreground">
                    {formatPrice(currentModel.pricePerMillion)}
                  </span>
                )}
                <ChevronDown className="h-3 w-3" />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuLabel className="text-xs">クイック選択</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {quickModels.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={selectedModel === model.id ? 'bg-accent' : ''}
              >
                <span className="flex items-center justify-between w-full gap-2">
                  <span className="truncate">{model.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatPrice(model.pricePerMillion)}
                  </span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Auth Status & Settings Row */}
        <div className="flex items-center justify-between">
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-destructive"
              onClick={clearAuth}
            >
              <Check className="h-3 w-3 text-green-500" />
              OpenRouter
              <LogOut className="h-3 w-3" />
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">未接続</span>
          )}
          <SettingsDialog />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
