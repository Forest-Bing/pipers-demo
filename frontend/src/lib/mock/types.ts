/**
 * 前端数据模型。字段与后端一致，仅命名风格转 camelCase。
 * 对应 PRD §4.1 的 users / keypoints / marks / attachments / pipelines。
 */

export type UserRole = 'admin' | 'user'
export type UserStatus = 'active' | 'disabled'

/** 职位枚举，与新建用户弹窗的下拉选项一致 */
export const POSITIONS = [
  '巡线工',
  '段长',
  '现场代表',
  '技术员',
  '监控室值班员',
  '司机',
] as const
export type Position = (typeof POSITIONS)[number]

export interface User {
  id: string
  name: string
  /** 11 位手机号，同时是登录名 */
  phone: string
  position: Position
  role: UserRole
  status: UserStatus
  createdBy?: string
  createdAt: string
  /**
   * 仅 mock 层使用：真实实现里是服务端 `password_hash`，永远不出现在响应体里。
   * 演示期用明文放在 localStorage 的 mock 数据库里，方便登录页给出测试账号。
   */
  password?: string
}

/** 三种关键点。keypointTypeLabel 用于展示，图标用 KeypointIcon 组件 */
export type KeypointType = 'stake' | 'stake-test' | 'valve'

export const KEYPOINT_TYPE_LABEL: Record<KeypointType, string> = {
  stake: '加密桩',
  'stake-test': '智能测试桩',
  valve: '阀室',
}

export interface Keypoint {
  id: string
  type: KeypointType
  /** 如 'SD-ZED-1042' */
  code: string
  name: string
  lng: number
  lat: number
  pipelineId?: string
  /** 距当前位置，米。真实接口由服务端计算 */
  distance: number
}

/** 标记只有两类，没有严重程度（PRD 决策 D4） */
export type MarkKind = 'alert' | 'info'

export interface Attachment {
  id: string
  type: 'image' | 'audio'
  url: string
  thumbUrl?: string
  size?: number
  /** 音频时长，秒 */
  duration?: number
}

export interface Mark {
  id: string
  kind: MarkKind
  lng: number
  lat: number
  /** 关键点编号 + 名称，如「SD-ZED-1021 · 3# 阀室」 */
  title: string
  description: string
  /** 派生字段，展示用：'120m' */
  distance: string
  /** 派生字段，展示用：'14:32' */
  time: string
  keypointId?: string
  creatorId: string
  creatorName: string
  creatorPosition: Position
  createdAt: string
  /**
   * 照片占位。真实接口为 Attachment[]，这里用 Tailwind 渐变类名模拟现场照片。
   * TODO: 接后端后换成 attachments: Attachment[]
   */
  photos: string[]
  /** 录音占位，仅有秒数 */
  audio?: { duration: number }
  /** 待同步（弱网草稿） */
  pending?: boolean
}

export interface Pipeline {
  id: string
  code: string
  name: string
  /** 所属单位，展示用 */
  company?: string
  /** 管段几何（GCJ-02 顶点串），地图上直接连线渲染 */
  path: [number, number][]
}

/** 地图端筛选只允许按类型 */
export type KindFilter = 'all' | MarkKind

/** 关键点选择器的类型筛选（多一个「全部」） */
export type KeypointFilter = 'all' | KeypointType

/** 写操作审计日志（PRD §4.1 audit_logs） */
export interface AuditLog {
  id: string
  actorId: string
  actorName: string
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'reset_password' | 'disable' | 'enable'
  targetType: 'mark' | 'user' | 'keypoint'
  targetId: string
  /** 变更摘要，真实实现为 jsonb 快照 */
  detail: string
  createdAt: string
}
