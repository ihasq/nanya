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
  useSidebar,
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
import { useSettingsStore, useT } from '@/stores/settings-store'
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
  onLoadConversation: (id: string) => void
}

export function AppSidebar({ entries, onNewTranslation, onLoadConversation }: AppSidebarProps) {
  const { conversationId } = useTranslationStore()
  const { selectedModel, setSelectedModel } = useSettingsStore()
  const { clearAuth } = useAuthStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const [models, setModels] = useState<ModelOption[]>(getDefaultModels())
  const t = useT()
  const { isMobile, setOpenMobile } = useSidebar()

  useEffect(() => {
    fetchAvailableModels().then(setModels).catch(() => {})
  }, [])

  const handleSelectEntry = (entry: HistoryEntry) => {
    onLoadConversation(entry.id)
    // Close sidebar on mobile after selecting
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const currentModel = models.find((m) => m.id === selectedModel)
  // Show top models sorted by price (cheapest first)
  const quickModels = [...models].sort((a, b) => a.pricePerMillion - b.pricePerMillion).slice(0, 5)

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="p-3">
        <span className="font-semibold text-lg italic">Nanya</span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-3 py-0">
          <SidebarGroupContent>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 font-normal h-9"
              onClick={() => {
                onNewTranslation()
                if (isMobile) {
                  setOpenMobile(false)
                }
              }}
            >
              <PenLine className="h-4 w-4" />
              {t('app.newTranslation')}
            </Button>

            {/* Privacy Notice */}
            <div className="mt-4 space-y-1 text-xs text-muted-foreground/70">
              <p>{t('sidebar.privacyNotice')}</p>
              <p>{t('sidebar.noAITraining')}</p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {entries.map((entry) => (
                <SidebarMenuItem key={entry.id}>
                  <SidebarMenuButton
                    onClick={() => handleSelectEntry(entry)}
                    isActive={conversationId === entry.id}
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
            <DropdownMenuLabel className="text-xs">{t('sidebar.quickSelect')}</DropdownMenuLabel>
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
            <span className="text-xs text-muted-foreground">{t('sidebar.notConnected')}</span>
          )}
          <SettingsDialog />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
