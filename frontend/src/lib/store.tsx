import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  ApiError,
  demoApi,
  marksApi,
  usersApi,
  type MarkInput,
  type UserInput,
} from './api'
import { loadDb } from './api/db'
import type { Mark, User, UserStatus } from './mock/types'

/**
 * 前端数据仓库：把 mock API 的结果缓存在内存里，供各页面同步渲染。
 *
 * 读：首次渲染直接用 localStorage 里的快照（不闪空态），随后再走一次
 *     `marksApi.list()` / `usersApi.list()` 做「revalidate」，等价于 SWR 的第一层。
 * 写：一律调 mock API —— 它会写 localStorage 与审计日志；成功后把返回值合并回内存。
 *     失败时 toast 出 `ApiError.message`，不改内存态，页面看到的就是「没成功」。
 *
 * 接后端时只需把 `./api` 换成 fetch 实现，本文件不用动。
 */

export interface ToastItem {
  id: number
  message: string
  tone: 'default' | 'success' | 'danger'
}

interface StoreValue {
  marks: Mark[]
  users: User[]
  /** 首帧来自 localStorage 快照，ready=false 表示还没跟 mock API 对齐 */
  ready: boolean
  createMark: (input: MarkInput) => Promise<Mark | null>
  updateMark: (id: string, patch: Partial<MarkInput>) => Promise<Mark | null>
  deleteMark: (id: string) => Promise<boolean>
  /** 弱网草稿：入本地队列，地图上显示「待同步 N 条」 */
  saveDraft: (input: Omit<MarkInput, 'pending'>) => Promise<boolean>
  addUser: (input: UserInput) => Promise<User | null>
  updateUser: (
    id: string,
    patch: Partial<Omit<UserInput, 'password'>> & { status?: UserStatus },
  ) => Promise<User | null>
  resetUserPassword: (id: string) => Promise<string | null>
  syncDrafts: () => Promise<number | null>
  resetDemo: () => Promise<void>
  toasts: ToastItem[]
  toast: (message: string, tone?: ToastItem['tone']) => void
  dismissToast: (id: number) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  // 首帧快照：localStorage 里没有就回种子，且只读一次
  const snapshot = useRef<{ marks: Mark[]; users: User[] } | null>(null)
  if (snapshot.current === null) {
    const db = loadDb()
    snapshot.current = { marks: db.marks, users: db.users }
  }

  const [marks, setMarks] = useState<Mark[]>(snapshot.current.marks)
  const [users, setUsers] = useState<User[]>(snapshot.current.users)
  const [ready, setReady] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const dismissToast = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, tone: ToastItem['tone'] = 'default') => {
    seq.current += 1
    const id = seq.current
    setToasts((list) => [...list, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id))
    }, 2600)
  }, [])

  /** 统一的错误出口：ApiError 直接展示 message，其它错误给兜底文案 */
  const report = useCallback(
    (err: unknown, fallback = '操作失败，请稍后重试') => {
      const message = err instanceof ApiError ? err.message : fallback
      toast(message, 'danger')
    },
    [toast],
  )

  // 与 mock API 对齐一次（数据量很小，全量拉）
  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const [nextMarks, nextUsers] = await Promise.all([marksApi.list(), usersApi.list()])
        if (!alive) return
        setMarks(nextMarks)
        setUsers(nextUsers)
      } catch {
        // 后台对齐失败不打扰用户，继续用快照渲染
      } finally {
        if (alive) setReady(true)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const createMark = useCallback(
    async (input: MarkInput) => {
      try {
        const mark = await marksApi.create(input)
        setMarks((list) => [mark, ...list])
        return mark
      } catch (err) {
        report(err, '标记提交失败')
        return null
      }
    },
    [report],
  )

  const updateMark = useCallback(
    async (id: string, patch: Partial<MarkInput>) => {
      try {
        const mark = await marksApi.update(id, patch)
        setMarks((list) => list.map((m) => (m.id === id ? mark : m)))
        return mark
      } catch (err) {
        report(err, '标记保存失败')
        return null
      }
    },
    [report],
  )

  const deleteMark = useCallback(
    async (id: string) => {
      try {
        await marksApi.remove(id)
        setMarks((list) => list.filter((m) => m.id !== id))
        return true
      } catch (err) {
        report(err, '删除失败')
        return false
      }
    },
    [report],
  )

  const saveDraft = useCallback(
    async (input: Omit<MarkInput, 'pending'>) => {
      try {
        await marksApi.saveDraft(input)
        return true
      } catch (err) {
        report(err, '草稿保存失败')
        return false
      }
    },
    [report],
  )

  const addUser = useCallback(
    async (input: UserInput) => {
      try {
        const user = await usersApi.create(input)
        setUsers((list) => [user, ...list])
        return user
      } catch (err) {
        report(err, '账号创建失败')
        return null
      }
    },
    [report],
  )

  const updateUser = useCallback(
    async (
      id: string,
      patch: Partial<Omit<UserInput, 'password'>> & { status?: UserStatus },
    ) => {
      try {
        const user = await usersApi.update(id, patch)
        setUsers((list) => list.map((u) => (u.id === id ? user : u)))
        return user
      } catch (err) {
        report(err, '账号更新失败')
        return null
      }
    },
    [report],
  )

  const resetUserPassword = useCallback(
    async (id: string) => {
      try {
        const password = await usersApi.resetPassword(id)
        return password
      } catch (err) {
        report(err, '重置密码失败')
        return null
      }
    },
    [report],
  )

  const syncDrafts = useCallback(async () => {
    try {
      const count = await marksApi.syncDrafts()
      const next = await marksApi.list()
      setMarks(next)
      return count
    } catch (err) {
      report(err, '同步失败，请稍后重试')
      return null
    }
  }, [report])

  const resetDemo = useCallback(async () => {
    try {
      const db = await demoApi.reset()
      setMarks(db.marks)
      setUsers(db.users)
      toast('演示数据已重置', 'success')
    } catch (err) {
      report(err, '重置失败')
    }
  }, [report, toast])

  const value = useMemo<StoreValue>(
    () => ({
      marks,
      users,
      ready,
      createMark,
      updateMark,
      deleteMark,
      saveDraft,
      addUser,
      updateUser,
      resetUserPassword,
      syncDrafts,
      resetDemo,
      toasts,
      toast,
      dismissToast,
    }),
    [
      marks,
      users,
      ready,
      createMark,
      updateMark,
      deleteMark,
      saveDraft,
      addUser,
      updateUser,
      resetUserPassword,
      syncDrafts,
      resetDemo,
      toasts,
      toast,
      dismissToast,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore 必须在 StoreProvider 内使用')
  return ctx
}
