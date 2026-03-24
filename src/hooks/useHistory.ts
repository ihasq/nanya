import { useCallback, useEffect, useState } from 'react'
import { getAllHistoryEntries, type HistoryEntry } from '@/lib/history-storage'

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    const data = await getAllHistoryEntries()
    setEntries(data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { entries, isLoading, refresh }
}
