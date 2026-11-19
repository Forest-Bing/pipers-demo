import { keypoints as seedKeypoints } from '../mock/keypoints'
import { marks as seedMarks } from '../mock/marks'
import { pipelines as seedPipelines } from '../mock/pipelines'
import { users as seedUsers } from '../mock/users'
import type { AuditLog, Keypoint, Mark, Pipeline, User } from '../mock/types'

/**
 * 演示用 mock 数据库。
 *
 * 设计要点：
 * 1. 种子数据来自 `src/lib/mock/*`，只在 `localStorage` 为空（或版本变更）时灌一次；
 * 2. 之后所有写操作都落在这里 → 刷新页面数据仍在，符合「交互存 localStorage」的演示要求；
 * 3. 版本号变更会自动重建，避免改了种子数据却看不到变化（旧数据卡住）。
 *
 * ⚠️ 这是**纯前端演示库**，没有任何鉴权与并发控制；正式实现见 PRD §4/§5 的
 * PostgreSQL + FastAPI 方案。密码在这里是明文，仅用于登录页提示测试账号。
 */

const DB_KEY = 'pipe.demo.db'
/** 种子结构版本：改种子数据后 +1，旧 localStorage 会被丢弃重建 */
export const DB_VERSION = 3

/** 弱网草稿（PRD D11：先入本地，联网后补传） */
export interface Draft {
  id: string
  kind: Mark['kind']
  lng: number
  lat: number
  description: string
  keypointId?: string
  photos: string[]
  audio?: { duration: number }
  createdAt: string
}

export interface DemoDb {
  version: number
  marks: Mark[]
  users: User[]
  keypoints: Keypoint[]
  pipelines: Pipeline[]
  auditLogs: AuditLog[]
  drafts: Draft[]
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** 预置 8 条审计日志，让「审计日志」有真实感（写操作会继续往后追加） */
function seedAuditLogs(): AuditLog[] {
  const rows: Array<Pick<AuditLog, 'actorId' | 'actorName' | 'action' | 'targetType' | 'targetId' | 'detail' | 'createdAt'>> = [
    {
      actorId: 'u-admin',
      actorName: '李国强',
      action: 'login',
      targetType: 'user',
      targetId: 'u-admin',
      detail: '管理员登录（Web · 济南）',
      createdAt: '2026-11-19T07:52:00+08:00',
    },
    {
      actorId: 'u-admin',
      actorName: '李国强',
      action: 'create',
      targetType: 'user',
      targetId: 'u-1023',
      detail: '创建账号 许建东（巡线工）',
      createdAt: '2026-11-19T08:06:00+08:00',
    },
    {
      actorId: 'u-zhang',
      actorName: '张建国',
      action: 'create',
      targetType: 'mark',
      targetId: 'm6',
      detail: '新建标记：今日巡检完成 4.2km',
      createdAt: '2026-11-19T14:05:00+08:00',
    },
    {
      actorId: 'u-1028',
      actorName: '王志强',
      action: 'update',
      targetType: 'mark',
      targetId: 'm2',
      detail: '补充照片 2 张',
      createdAt: '2026-11-19T18:14:00+08:00',
    },
    {
      actorId: 'u-admin',
      actorName: '李国强',
      action: 'reset_password',
      targetType: 'user',
      targetId: 'u-1019',
      detail: '重置 朱建平 的密码',
      createdAt: '2026-11-19T19:20:00+08:00',
    },
    {
      actorId: 'u-admin',
      actorName: '李国强',
      action: 'disable',
      targetType: 'user',
      targetId: 'u-1007',
      detail: '停用 赵德海（离岗待分配）',
      createdAt: '2026-11-19T19:24:00+08:00',
    },
    {
      actorId: 'u-zhang',
      actorName: '张建国',
      action: 'create',
      targetType: 'mark',
      targetId: 'm14',
      detail: '新建标记：夜巡途经 K319+050 临时便道',
      createdAt: '2026-11-20T00:35:00+08:00',
    },
    {
      actorId: 'u-admin',
      actorName: '李国强',
      action: 'login',
      targetType: 'user',
      targetId: 'u-admin',
      detail: '管理员登录（Web · 济南）',
      createdAt: '2026-11-20T00:48:00+08:00',
    },
  ]
  return rows.map((row, i) => ({ id: `audit-${i + 1}`, ...row }))
}

export function createSeedDb(): DemoDb {
  return {
    version: DB_VERSION,
    marks: clone(seedMarks),
    users: clone(seedUsers),
    keypoints: clone(seedKeypoints),
    pipelines: clone(seedPipelines),
    auditLogs: seedAuditLogs(),
    drafts: [],
  }
}

/** 读库：不存在 / 解析失败 / 版本不符 → 重新灌种子 */
export function loadDb(): DemoDb {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) return resetDb()
    const parsed = JSON.parse(raw) as Partial<DemoDb>
    if (parsed.version !== DB_VERSION || !Array.isArray(parsed.marks)) return resetDb()
    return {
      version: DB_VERSION,
      marks: parsed.marks,
      users: parsed.users ?? clone(seedUsers),
      keypoints: parsed.keypoints ?? clone(seedKeypoints),
      pipelines: parsed.pipelines ?? clone(seedPipelines),
      auditLogs: parsed.auditLogs ?? [],
      drafts: parsed.drafts ?? [],
    }
  } catch {
    return resetDb()
  }
}

export function saveDb(db: DemoDb): void {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch (err) {
    // 隐私模式 / 配额满：不阻断演示，只是刷新后回种子
    console.warn('[mock-db] 写入 localStorage 失败，本次改动不会持久化', err)
  }
}

/** 重置为种子数据（对应「我的 → 重置演示数据」） */
export function resetDb(): DemoDb {
  const seed = createSeedDb()
  saveDb(seed)
  return seed
}

/** 读改写一整轮，保证同一时刻只有一份最新库 */
export function mutateDb<T>(fn: (db: DemoDb) => T): { db: DemoDb; result: T } {
  const db = loadDb()
  const result = fn(db)
  saveDb(db)
  return { db, result }
}

export function appendAudit(db: DemoDb, log: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
  const entry: AuditLog = {
    id: `audit-${Date.now().toString(36)}-${db.auditLogs.length + 1}`,
    createdAt: new Date().toISOString(),
    ...log,
  }
  db.auditLogs = [entry, ...db.auditLogs]
  return entry
}
