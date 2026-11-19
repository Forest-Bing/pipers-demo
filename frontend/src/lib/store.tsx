import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { marks as seedMarks } from './mock/marks'
import { users as seedUsers } from './mock/users'
import type { Mark, User } from './mock/types'

/**
 * 演示用内存态仓库。刷新即重置，不持久化。
 * TODO: 接后端后把各 action 换成 fetch，保持函数签名不变。
 */

export interface ToastItem {
  id: number
  message: string
  tone: 'default' | 'success' | 'danger'
}

interface StoreValue {
  marks: Mark[]
  users: User[]
  addMark: (mark: Mark) => void
  updateMark: (id: string, patch: Partial<Mark>) => void
  removeMark: (id: string) => void
  addUser: (user: User) => void
  updateUser: (id: string, patch: Partial<User>) => void
  toasts: ToastItem[]
  toast: (message: string, tone?: ToastItem['tone']) => void
  dismissToast: (id: number) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [marks, setMarks] = useState<Mark[]>(seedMarks)
  const [users, setUsers] = useState<User[]>(seedUsers)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const dismissToast = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, tone: ToastItem['tone'] = 'default') => {
      seq.current += 1
      const id = seq.current
      setToasts((list) => [...list, { id, message, tone }])
      window.setTimeout(() => {
        setToasts((list) => list.filter((t) => t.id !== id))
      }, 2600)
    },
    [],
  )

  const addMark = useCallback((mark: Mark) => {
    setMarks((list) => [mark, ...list])
  }, [])

  const updateMark = useCallback((id: string, patch: Partial<Mark>) => {
    setMarks((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }, [])

  const removeMark = useCallback((id: string) => {
    setMarks((list) => list.filter((m) => m.id !== id))
  }, [])

  const addUser = useCallback((user: User) => {
    setUsers((list) => [user, ...list])
  }, [])

  const updateUser = useCallback((id: string, patch: Partial<User>) => {
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }, [])

  const value = useMemo<StoreValue>(
    () => ({
      marks,
      users,
      addMark,
      updateMark,
      removeMark,
      addUser,
      updateUser,
      toasts,
      toast,
      dismissToast,
    }),
    [marks, users, addMark, updateMark, removeMark, addUser, updateUser, toasts, toast, dismissToast],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore 必须在 StoreProvider 内使用')
  return ctx
}
