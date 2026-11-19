import { MAP_CENTER } from '../amap'
import { distanceMeters } from '../geo'
import { formatDistance, formatTime } from '../format'
import { appendAudit, loadDb, mutateDb, resetDb, type DemoDb } from './db'
import type {
  AuditLog,
  Keypoint,
  KeypointType,
  Mark,
  MarkKind,
  Pipeline,
  Position,
  User,
  UserRole,
  UserStatus,
} from '../mock/types'
import { KEYPOINT_TYPE_LABEL } from '../mock/types'

/**
 * Mock API —— 按 PRD §5 的接口清单组织，前端各页只认这里的函数名。
 *
 * 约定：
 * 1. 全部 `async`，带 120–320ms 的模拟网络延迟，方便演示 loading / 骨架；
 * 2. 数据落在 localStorage 的 mock 库里（见 `./db.ts`），刷新不丢；
 * 3. 出错抛 `ApiError`，带 HTTP 风格的状态码，页面按 `message` 直接 toast；
 * 4. 写操作顺带写审计日志（PRD §7「所有写操作必须落 audit_logs」）；
 *    当前操作人由 `setApiActor()` 注入，等价于真实接口里的 token 解析。
 *
 * 接后端时：把每个方法体换成 `fetch('/api/...')`，函数签名保持不变即可。
 */

export class ApiError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** 模拟网络延迟，UI 上能看出「在读」的过程 */
function delay(min = 120, max = 320): Promise<void> {
  const ms = min + Math.random() * (max - min)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 当前操作人（真实实现由服务端从 token 里取） */
let actor: User | null = null
export function setApiActor(user: User | null): void {
  actor = user
}

function requireActor(): User {
  if (!actor) throw new ApiError('登录状态已失效，请重新登录', 401)
  return actor
}

function assertOwnerOrAdmin(creatorId: string): void {
  const me = requireActor()
  if (me.role === 'admin') return
  if (creatorId !== me.id) throw new ApiError('没有权限操作他人创建的记录', 403)
}

/** 去掉密码字段，模拟服务端不返回 password_hash */
function publicUser(user: User): User {
  const { password: _password, ...rest } = user
  return rest
}

/** 展示字段（time / distance）在读取时算，避免种子里写死过期值 */
function decorate(mark: Mark): Mark {
  return {
    ...mark,
    time: formatTime(mark.createdAt),
    distance: formatDistance(distanceMeters(MAP_CENTER, [mark.lng, mark.lat])),
  }
}

const byNewest = (a: Mark, b: Mark) => (a.createdAt < b.createdAt ? 1 : -1)

// ---------------------------------------------------------------- 认证

export interface LoginParams {
  phone: string
  password: string
  /** 登录页页签：要求返回的角色必须匹配 */
  expectRole?: UserRole
}

export interface LoginResult {
  user: User
  token: string
}

export const authApi = {
  /** POST /auth/login */
  async login({ phone, password, expectRole }: LoginParams): Promise<LoginResult> {
    await delay(220, 420)
    const db = loadDb()
    const found = db.users.find((u) => u.phone === phone)
    if (!found || found.password !== password) {
      throw new ApiError('手机号或密码错误', 401)
    }
    if (found.status === 'disabled') {
      throw new ApiError('该账号已停用，请联系管理员', 403)
    }
    if (expectRole === 'admin' && found.role !== 'admin') {
      throw new ApiError('该手机号不是管理员账号，请切换到「用户登录」', 403)
    }
    if (expectRole === 'user' && found.role === 'admin') {
      throw new ApiError('该手机号是管理员账号，请切换到「管理员登录」', 403)
    }

    mutateDb((cur) => {
      appendAudit(cur, {
        actorId: found.id,
        actorName: found.name,
        action: 'login',
        targetType: 'user',
        targetId: found.id,
        detail: `${found.role === 'admin' ? '管理员' : '用户'}登录（Web · 济南）`,
      })
    })

    return { user: publicUser(found), token: `mock.${found.id}.${Date.now().toString(36)}` }
  },

  /** POST /auth/logout */
  async logout(): Promise<void> {
    await delay(80, 160)
  },

  /** GET /auth/me */
  async me(userId: string): Promise<User | null> {
    await delay(60, 140)
    const user = loadDb().users.find((u) => u.id === userId)
    return user ? publicUser(user) : null
  },
}

// ---------------------------------------------------------------- 标记

export interface MarkInput {
  kind: MarkKind
  lng: number
  lat: number
  description: string
  keypointId?: string
  photos?: string[]
  audio?: { duration: number }
  pending?: boolean
}

export interface MarkQuery {
  kind?: MarkKind | 'all'
  /** 视野范围 [minLng, minLat, maxLng, maxLat]，对应 GET /marks?bbox= */
  bbox?: [number, number, number, number]
  /** 缩放级别：过低时后端会返回 too_wide */
  zoom?: number
}

/** 缩放低于该级别时模拟「请放大地图查看」（PRD §3.1） */
const MIN_ZOOM = 11
/** 单次返回条数上限，模拟后端保护 */
const MAX_ROWS = 500

export const marksApi = {
  /** GET /marks?bbox=&zoom=&kind= */
  async list(query: MarkQuery = {}): Promise<Mark[]> {
    await delay()
    if (typeof query.zoom === 'number' && query.zoom < MIN_ZOOM) {
      throw new ApiError('当前缩放级别过低，请放大地图查看（12 级及以上）', 413)
    }
    const { marks } = loadDb()
    const box = query.bbox
    return marks
      .filter((m) => (query.kind && query.kind !== 'all' ? m.kind === query.kind : true))
      .filter((m) =>
        box ? m.lng >= box[0] && m.lat >= box[1] && m.lng <= box[2] && m.lat <= box[3] : true,
      )
      .sort(byNewest)
      .slice(0, MAX_ROWS)
      .map(decorate)
  },

  /** GET /marks/{id} */
  async get(id: string): Promise<Mark> {
    await delay(80, 180)
    const mark = loadDb().marks.find((m) => m.id === id)
    if (!mark) throw new ApiError('标记不存在或已被删除', 404)
    return decorate(mark)
  },

  /** POST /marks */
  async create(input: MarkInput): Promise<Mark> {
    await delay(260, 520)
    const me = requireActor()
    if (!input.description.trim()) throw new ApiError('描述不能为空', 422)

    const { result } = mutateDb((cur) => {
      const keypoint = input.keypointId
        ? cur.keypoints.find((k) => k.id === input.keypointId)
        : undefined
      const mark: Mark = {
        id: `m-${Date.now().toString(36)}`,
        kind: input.kind,
        lng: input.lng,
        lat: input.lat,
        title: keypoint
          ? keypoint.type === 'valve'
            ? `${keypoint.code} · ${keypoint.name}`
            : `${keypoint.code} · ${KEYPOINT_TYPE_LABEL[keypoint.type]}`
          : '手动落点',
        description: input.description.trim(),
        distance: formatDistance(distanceMeters(MAP_CENTER, [input.lng, input.lat])),
        time: formatTime(new Date()),
        keypointId: keypoint?.id,
        creatorId: me.id,
        creatorName: me.name,
        creatorPosition: me.position,
        createdAt: new Date().toISOString(),
        photos: input.photos ?? [],
        audio: input.audio,
        pending: input.pending,
      }
      cur.marks = [mark, ...cur.marks]
      appendAudit(cur, {
        actorId: me.id,
        actorName: me.name,
        action: 'create',
        targetType: 'mark',
        targetId: mark.id,
        detail: `新建${mark.kind === 'alert' ? '警告' : '普通信息'}标记：${mark.description.slice(0, 24)}`,
      })
      return mark
    })

    return decorate(result)
  },

  /** PATCH /marks/{id} */
  async update(id: string, patch: Partial<MarkInput>): Promise<Mark> {
    await delay(200, 380)
    const me = requireActor()
    const { result } = mutateDb((cur) => {
      const index = cur.marks.findIndex((m) => m.id === id)
      if (index < 0) throw new ApiError('标记不存在或已被删除', 404)
      const prev = cur.marks[index]
      assertOwnerOrAdmin(prev.creatorId)
      const next: Mark = {
        ...prev,
        ...(patch.kind ? { kind: patch.kind } : {}),
        ...(patch.lng !== undefined ? { lng: patch.lng } : {}),
        ...(patch.lat !== undefined ? { lat: patch.lat } : {}),
        ...(patch.description !== undefined ? { description: patch.description.trim() } : {}),
        ...(patch.photos ? { photos: patch.photos } : {}),
        ...(patch.audio !== undefined ? { audio: patch.audio } : {}),
        ...(patch.keypointId !== undefined ? { keypointId: patch.keypointId } : {}),
      }
      cur.marks[index] = next
      appendAudit(cur, {
        actorId: me.id,
        actorName: me.name,
        action: 'update',
        targetType: 'mark',
        targetId: id,
        detail: `编辑标记：${next.description.slice(0, 24)}`,
      })
      return next
    })
    return decorate(result)
  },

  /** DELETE /marks/{id}（硬删除，级联附件；PRD 决策 D2） */
  async remove(id: string): Promise<void> {
    await delay(200, 360)
    const me = requireActor()
    mutateDb((cur) => {
      const target = cur.marks.find((m) => m.id === id)
      if (!target) throw new ApiError('标记不存在或已被删除', 404)
      assertOwnerOrAdmin(target.creatorId)
      cur.marks = cur.marks.filter((m) => m.id !== id)
      appendAudit(cur, {
        actorId: me.id,
        actorName: me.name,
        action: 'delete',
        targetType: 'mark',
        targetId: id,
        detail: `删除标记：${target.description.slice(0, 24)}`,
      })
    })
  },

  /** GET /admin/marks（分页 + 类型筛选） */
  async listAdmin(params: {
    page?: number
    pageSize?: number
    kind?: MarkKind | 'all'
    keyword?: string
  } = {}): Promise<{ rows: Mark[]; total: number; page: number; pageSize: number }> {
    await delay()
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 10
    const kw = (params.keyword ?? '').trim().toLowerCase()
    const rows = loadDb()
      .marks.filter((m) => (params.kind && params.kind !== 'all' ? m.kind === params.kind : true))
      .filter(
        (m) =>
          !kw ||
          m.description.toLowerCase().includes(kw) ||
          m.creatorName.toLowerCase().includes(kw) ||
          m.title.toLowerCase().includes(kw),
      )
      .sort(byNewest)
    return {
      rows: rows.slice((page - 1) * pageSize, page * pageSize).map(decorate),
      total: rows.length,
      page,
      pageSize,
    }
  },

  /** POST /marks/drafts（弱网时先入本地队列，界面显示「待同步 N 条」） */
  async saveDraft(input: Omit<MarkInput, 'pending'>): Promise<void> {
    await delay(120, 240)
    mutateDb((cur) => {
      cur.drafts = [
        {
          id: `d-${Date.now().toString(36)}`,
          kind: input.kind,
          lng: input.lng,
          lat: input.lat,
          description: input.description.trim(),
          keypointId: input.keypointId,
          photos: input.photos ?? [],
          audio: input.audio,
          createdAt: new Date().toISOString(),
        },
        ...cur.drafts,
      ]
    })
  },

  /** POST /marks/sync：把草稿补传为正式标记（对应「立即重试」） */
  async syncDrafts(): Promise<number> {
    await delay(400, 700)
    const me = requireActor()
    const { result } = mutateDb((cur) => {
      const created = cur.drafts.map<Mark>((d, i) => ({
        id: `m-${Date.now().toString(36)}-${i}`,
        kind: d.kind,
        lng: d.lng,
        lat: d.lat,
        title: d.keypointId
          ? (cur.keypoints.find((k) => k.id === d.keypointId)?.code ?? '手动落点')
          : '手动落点',
        description: d.description,
        distance: formatDistance(distanceMeters(MAP_CENTER, [d.lng, d.lat])),
        time: formatTime(d.createdAt),
        keypointId: d.keypointId,
        creatorId: me.id,
        creatorName: me.name,
        creatorPosition: me.position,
        createdAt: d.createdAt,
        photos: d.photos,
        audio: d.audio,
      }))

      // 草稿转正；种子里那两条 pending 标记也一并转正，让「立即重试」看得到变化
      cur.marks = [
        ...created,
        ...cur.marks.map((m) => (m.pending ? { ...m, pending: false } : m)),
      ]
      cur.drafts = []

      if (created.length > 0) {
        appendAudit(cur, {
          actorId: me.id,
          actorName: me.name,
          action: 'create',
          targetType: 'mark',
          targetId: created[0].id,
          detail: `弱网草稿补传成功 ${created.length} 条`,
        })
      }
      return created.length
    })
    return result
  },
}

// ---------------------------------------------------------------- 用户

export interface UserInput {
  name: string
  phone: string
  position: Position
  role: UserRole
  password: string
}

export const usersApi = {
  /** GET /admin/users?page=&keyword=（前端列表页自己在内存里筛选分页，这里返回全量） */
  async list(): Promise<User[]> {
    await delay()
    return loadDb().users.map(publicUser)
  },

  /** POST /admin/users */
  async create(input: UserInput): Promise<User> {
    await delay(260, 480)
    const me = requireActor()
    if (me.role !== 'admin') throw new ApiError('仅管理员可创建账号', 403)
    if (!/^1\d{10}$/.test(input.phone)) throw new ApiError('请输入 11 位手机号', 422)
    if (input.password.length < 6) throw new ApiError('初始密码至少 6 位', 422)

    const { result } = mutateDb((cur) => {
      if (cur.users.some((u) => u.phone === input.phone)) {
        throw new ApiError('该手机号已存在', 409)
      }
      const user: User = {
        id: `u-${Date.now().toString(36)}`,
        name: input.name.trim(),
        phone: input.phone,
        position: input.position,
        role: input.role,
        status: 'active',
        createdBy: me.id,
        createdAt: new Date().toISOString(),
        password: input.password,
      }
      cur.users = [user, ...cur.users]
      appendAudit(cur, {
        actorId: me.id,
        actorName: me.name,
        action: 'create',
        targetType: 'user',
        targetId: user.id,
        detail: `创建账号 ${user.name}（${user.position}）`,
      })
      return publicUser(user)
    })
    return result
  },

  /** PATCH /admin/users/{id} */
  async update(id: string, patch: Partial<Omit<UserInput, 'password'>> & { status?: UserStatus }): Promise<User> {
    await delay(200, 380)
    const me = requireActor()
    if (me.role !== 'admin') throw new ApiError('仅管理员可修改账号', 403)

    const { result } = mutateDb((cur) => {
      const index = cur.users.findIndex((u) => u.id === id)
      if (index < 0) throw new ApiError('用户不存在', 404)
      const prev = cur.users[index]

      // PRD §2.3：管理员不能停用或降级自己，防止锁死唯一管理员
      if (id === me.id) {
        if (patch.status === 'disabled') throw new ApiError('不能停用自己的账号', 409)
        if (patch.role && patch.role !== prev.role) throw new ApiError('不能修改自己的角色', 409)
      }
      if (patch.phone && cur.users.some((u) => u.phone === patch.phone && u.id !== id)) {
        throw new ApiError('该手机号已被占用', 409)
      }

      const next: User = { ...prev, ...patch, name: (patch.name ?? prev.name).trim() }
      cur.users[index] = next
      appendAudit(cur, {
        actorId: me.id,
        actorName: me.name,
        action:
          patch.status === 'disabled' ? 'disable' : patch.status === 'active' ? 'enable' : 'update',
        targetType: 'user',
        targetId: id,
        detail: `更新账号 ${next.name}`,
      })
      return publicUser(next)
    })
    return result
  },

  /** POST /admin/users/{id}/reset-password，返回新密码（仅此一次可见） */
  async resetPassword(id: string): Promise<string> {
    await delay(240, 420)
    const me = requireActor()
    if (me.role !== 'admin') throw new ApiError('仅管理员可重置密码', 403)

    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const password = Array.from(
      { length: 8 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('')

    mutateDb((cur) => {
      const user = cur.users.find((u) => u.id === id)
      if (!user) throw new ApiError('用户不存在', 404)
      user.password = password
      appendAudit(cur, {
        actorId: me.id,
        actorName: me.name,
        action: 'reset_password',
        targetType: 'user',
        targetId: id,
        detail: `重置 ${user.name} 的密码`,
      })
    })
    return password
  },
}

// ---------------------------------------------------------------- 台账 / 管段 / 审计

export const keypointsApi = {
  /** GET /keypoints?bbox=&type= */
  async list(params: { type?: KeypointType | 'all' } = {}): Promise<Keypoint[]> {
    await delay()
    const rows = loadDb().keypoints
    return rows
      .filter((k) => (params.type && params.type !== 'all' ? k.type === params.type : true))
      .sort((a, b) => a.distance - b.distance)
  },
}

export const pipelinesApi = {
  /** GET /pipelines */
  async list(): Promise<Pipeline[]> {
    await delay(60, 160)
    return loadDb().pipelines
  },
}

export const auditApi = {
  /** GET /admin/audit-logs */
  async list(params: { page?: number; pageSize?: number } = {}): Promise<{
    rows: AuditLog[]
    total: number
  }> {
    await delay()
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 20
    const rows = loadDb().auditLogs
    return { rows: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length }
  },
}

export const demoApi = {
  /** 恢复种子数据（演示用，真实环境没有这个接口） */
  async reset(): Promise<DemoDb> {
    await delay(220, 380)
    return resetDb()
  },
}
