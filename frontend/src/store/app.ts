import Taro from '@tarojs/taro'
import { create } from 'zustand'
import { persist, createJSONStorage, type PersistStorage } from 'zustand/middleware'
import type { Family, Kid, User } from '@/types'
import { clearToken, setToken } from '@/services/request'

interface AppState {
  user: User | null
  family: Family | null
  kids: Kid[]
  currentKidId: number | null
  hydrated: boolean
  setAuth: (user: User, token: string) => void
  setFamilyData: (family: Family, kids: Kid[]) => void
  setCurrentKidId: (id: number) => void
  logout: () => void
  markHydrated: () => void
}

const taroStorage: PersistStorage<unknown> = {
  getItem: (key) => {
    try {
      const raw = Taro.getStorageSync(key)
      if (!raw) return null
      return typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    Taro.setStorageSync(key, JSON.stringify(value))
  },
  removeItem: (key) => {
    Taro.removeStorageSync(key)
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      family: null,
      kids: [],
      currentKidId: null,
      hydrated: false,
      setAuth: (user, token) => {
        setToken(token)
        set({ user })
      },
      setFamilyData: (family, kids) => {
        set((state) => ({
          family,
          kids,
          currentKidId:
            state.currentKidId && kids.some((k) => k.id === state.currentKidId)
              ? state.currentKidId
              : kids[0]?.id ?? null
        }))
      },
      setCurrentKidId: (id) => set({ currentKidId: id }),
      logout: () => {
        clearToken()
        set({ user: null, family: null, kids: [], currentKidId: null })
      },
      markHydrated: () => set({ hydrated: true })
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => taroStorage),
      partialize: (state) => ({
        user: state.user,
        family: state.family,
        kids: state.kids,
        currentKidId: state.currentKidId
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated()
      }
    }
  )
)
