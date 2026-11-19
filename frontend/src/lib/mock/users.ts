import type { Position, User } from './types'

/**
 * 28 个演示账号：2 名管理员 + 26 名普通用户，其中 3 个已停用、6 个本月新增。
 * 全部属于国家管网山东公司（中俄东线济南段），账号由管理员在后台创建（PRD §2.3）。
 *
 * 演示期密码明文存在 mock 数据库里：管理员 admin123，其余统一 123456。
 * 登录页会把这两个测试账号直接写在提示区，方便演示时切换角色。
 *
 * TODO: 接后端后由 GET /api/admin/users?page=&keyword= 替换
 */

const NAMES = [
  '李国强', '张建国', '王志强', '刘海涛', '陈立新', '杨春林', '赵德海', '孙建军',
  '周文斌', '吴明辉', '孙德胜', '冯少军', '陈永刚', '褚国平', '卫红兵', '蒋伟民',
  '沈立军', '韩振华', '杨志刚', '朱建平', '秦学军', '尤海峰', '许建东', '何文军',
  '吕新国', '施立新', '张宏伟', '孔祥军',
]

/** 按岗位配比排的职位，和实际巡线队的人员结构接近 */
const POSITIONS: Position[] = [
  '段长', '巡线工', '巡线工', '巡线工', '巡线工', '现场代表', '巡线工', '巡线工',
  '技术员', '巡线工', '监控室值班员', '巡线工', '巡线工', '司机', '巡线工', '现场代表',
  '巡线工', '技术员', '巡线工', '巡线工', '监控室值班员', '巡线工', '巡线工', '司机',
  '巡线工', '巡线工', '现场代表', '巡线工',
]

/** 第 0 位是主管理员；第 10 位是备用管理员 */
const ADMIN_INDEXES = new Set([0, 10])
/** 已停用的 3 个账号 */
const DISABLED = new Set([6, 19, 25])
/** 本月（2026-11）新增的 6 个账号，对应后台「本月新增」统计 */
const THIS_MONTH_START = NAMES.length - 6

const ADMIN_PASSWORD = 'admin123'
const DEFAULT_PASSWORD = '123456'

function pad(n: number, len = 2) {
  return String(n).padStart(len, '0')
}

function buildUser(name: string, i: number): User {
  const isAdmin = ADMIN_INDEXES.has(i)
  const seq = 1001 + i

  const createdAt =
    i >= THIS_MONTH_START
      ? `2026-11-${pad(i - THIS_MONTH_START + 3)}T09:${pad(10 + (i % 40))}:00+08:00`
      : `2025-${pad((i % 12) + 1)}-${pad((i % 27) + 1)}T${i % 2 === 0 ? '10' : '15'}:30:00+08:00`

  // 前两个是登录页写死的演示账号，其余按 138 段批量生成，保证 11 位且不重复
  const phone = i === 0 ? '13900001001' : i === 1 ? '13800006027' : `138${53100000 + i * 131}`

  return {
    id: i === 0 ? 'u-admin' : i === 1 ? 'u-zhang' : `u-${seq}`,
    name,
    phone,
    position: POSITIONS[i],
    role: isAdmin ? 'admin' : 'user',
    status: DISABLED.has(i) ? 'disabled' : 'active',
    createdBy: i === 0 ? undefined : 'u-admin',
    createdAt,
    password: isAdmin ? ADMIN_PASSWORD : DEFAULT_PASSWORD,
  }
}

export const users: User[] = NAMES.map(buildUser)

/** 当前登录用户（演示种子，登录页决定最终身份） */
export const currentAdmin = users[0]
export const currentWorker = users[1]

/** 登录页展示的测试账号，改这里就能改提示文案 */
export const DEMO_ACCOUNTS = {
  user: { name: currentWorker.name, phone: currentWorker.phone, password: DEFAULT_PASSWORD },
  admin: { name: currentAdmin.name, phone: currentAdmin.phone, password: ADMIN_PASSWORD },
}

export const userStats = {
  total: users.length,
  active: users.filter((u) => u.status === 'active').length,
  disabled: users.filter((u) => u.status === 'disabled').length,
  createdThisMonth: users.filter((u) => u.createdAt.startsWith('2026-11')).length,
}
