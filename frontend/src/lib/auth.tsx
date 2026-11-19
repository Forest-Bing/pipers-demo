import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi, setApiActor } from './api'
import { loadDb } from './api/db'
import type { User, UserRole } from './mock/types'

/**
 * 演示期认证。
 *
 * - 校验手机号 + 密码（mock 库里的明文密码），管理员 / 普通用户用登录页的两个页签区分；
 * - 会话写 localStorage（PRD 决策 D6：token 存 localStorage，安全基线刻意从简）；
 * - 首次打开浏览器且没有会话时，默认以种子里的巡线员身份进入，方便直接看地图演示。
 *
 * TODO: 真实实现替换为 POST /api/auth/login，并保存服务端签发的 token。
 */

const SESSION_KEY = 'pipe.session'

interface StoredSession {
  userId: string | null
  token?: string
}

interface AuthValue {
  user: User | null
  role: UserRole | null
  /** 登录成功后返回用户；失败由 mock API 抛 ApiError */
  login: (phone: string, password: string, expectRole?: UserRole) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

const strip = (user: User): User => {
  const { password: _password, ...rest } = user
  return rest
}

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSession
    const valid = parsed?.userId === null || typeof parsed?.userId === 'string'
    return valid ? parsed : null
  } catch {
    return null
  }
}

function readStoredUser(): User | null {
  const db = loadDb()
  const session = readSession()
  if (session) {
    if (!session.userId) return null
    const found = db.users.find((u) => u.id === session.userId)
    return found ? strip(found) : null
  }
  // 首次进入演示：默认巡线员，登录页仍可切换角色
  const worker = db.users.find((u) => u.id === 'u-zhang') ?? db.users[0]
  return worker ? strip(worker) : null
}

function persist(user: User | null, token?: string) {
  const session: StoredSession = { userId: user?.id ?? null, token }
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // 隐私模式写不进去：不影响本次会话
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const initial = readStoredUser()
    setApiActor(initial)
    return initial
  })

  // 任何身份变化都要同步给 mock API（等价于真实接口里的 token 解析）
  useEffect(() => {
    setApiActor(user)
  }, [user])

  const login = useCallback(async (phone: string, password: string, expectRole?: UserRole) => {
    const { user: next, token } = await authApi.login({ phone, password, expectRole })
    setApiActor(next)
    persist(next, token)
    setUser(next)
    return next
  }, [])

  const logout = useCallback(() => {
    persist(null)
    setApiActor(null)
    setUser(null)
    void authApi.logout()
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
