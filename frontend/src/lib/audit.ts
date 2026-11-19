import type { AuditLog } from './mock/types'

/** 审计动作的中文名与配色，概览页与审计日志页共用 */

export const AUDIT_ACTION_LABEL: Record<AuditLog['action'], string> = {
  create: '新建',
  update: '修改',
  delete: '删除',
  login: '登录',
  logout: '退出',
  reset_password: '重置密码',
  disable: '停用',
  enable: '启用',
}

export const AUDIT_ACTION_TONE: Record<AuditLog['action'], 'alert' | 'info' | 'neutral'> = {
  create: 'info',
  update: 'neutral',
  delete: 'alert',
  login: 'neutral',
  logout: 'neutral',
  reset_password: 'neutral',
  disable: 'alert',
  enable: 'info',
}

export const AUDIT_TARGET_LABEL: Record<AuditLog['targetType'], string> = {
  mark: '标记',
  user: '账号',
  keypoint: '关键点',
}
