import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  accessToken: string | null
  setAuth: (accessToken: string) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,

      setAuth: (accessToken) => {
        set({ accessToken })
      },

      clearAuth: () => {
        set({ accessToken: null })
      },

      isAuthenticated: () => {
        return !!get().accessToken
      },
    }),
    {
      name: 'nanya-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
      }),
    }
  )
)
