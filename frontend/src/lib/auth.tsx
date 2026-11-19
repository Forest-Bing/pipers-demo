import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { currentAdmin, currentWorker } from './mock/users'
import type { User } from './mock/types'

/**
 * 演示期认证：不校验密码，登录页按手机号决定角色。
 * 真实实现替换为 POST /api/auth/login，token 存 localStorage（PRD 决策 D7）。
 */

const STORAGE_KEY = 'pipe.session'

interface AuthValue {
  user: User | null
  role: User['role'] | null
  login: (phone: string) => User
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

function readStored(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return currentWorker
    const parsed = JSON.parse(raw) as { phone?: string }
    if (parsed.phone === currentAdmin.phone) return currentAdmin
    return currentWorker
  } catch {
    return currentWorker
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStored)

  const login = useCallback((phone: string) => {
    const next = phone === currentAdmin.phone ? currentAdmin : currentWorker
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ phone: next.phone }))
    setUser(next)
    return next
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ user, role: user?.role ?? null, login, logout }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return ctx
}
