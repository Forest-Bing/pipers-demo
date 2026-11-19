import type { Position, User } from './types'

/**
 * 53 条示例用户：
 * - 在册（active）48 条 / 已停用（disabled）5 条
 * - 本月新增 6 条（createdAt 在 2026-11）
 * - [0] 为当前登录管理员李国强，[1] 为巡线员张建国
 *
 * TODO: 接后端后由 GET /api/admin/users?page=&keyword= 替换
 */

const NAMES = [
  '李国强', '张建国', '王志强', '刘海涛', '陈立新', '杨春林', '赵德海', '孙建军',
  '周文斌', '吴明辉', '郑国庆', '冯少军', '陈永刚', '褚国平', '卫红兵', '蒋伟民',
  '沈立军', '韩振华', '杨志刚', '朱建平', '秦学军', '尤海峰', '许建东', '何文军',
  '吕新国', '施立新', '张宏伟', '孔祥军', '曹永强', '严国栋', '华建明', '金志强',
  '魏红卫', '陶立新', '姜海军', '戚文亮', '谢建平', '邹德明', '喻国华', '柏立军',
  '水建波', '窦文涛', '章国平', '云海龙', '苏建明', '潘志远', '葛立国', '奚文军',
  '范建国', '彭少华', '郎永强', '鲁海涛', '韦国栋',
]

const POSITION_CYCLE: Position[] = [
  '巡线工', '巡线工', '巡线工', '巡线工', '段长',
  '现场代表', '技术员', '监控室值班员', '司机', '巡线工',
]

/** 已停用的 5 条 */
const DISABLED = new Set([6, 16, 25, 33, 44])

const ACTIVE_ADMIN_INDEX = 11
const THIS_MONTH_START_INDEX = NAMES.length - 6

function buildUser(name: string, i: number): User {
  const seq = String(i + 1).padStart(3, '0')
  const isAdmin = i === 0 || i === ACTIVE_ADMIN_INDEX

  const createdAt =
    i >= THIS_MONTH_START_INDEX
      ? `2026-11-${String(i - THIS_MONTH_START_INDEX + 3).padStart(2, '0')}T09:${String(
          10 + (i % 40),
        ).padStart(2, '0')}:00+08:00`
      : `2026-${String((i % 10) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}T${
          i % 2 === 0 ? '10' : '15'
        }:30:00+08:00`

  return {
    id: i === 0 ? 'u-admin' : i === 1 ? 'u-zhang' : `u-${seq}`,
    name,
    phone: i === 0 ? '13900001001' : i === 1 ? '13800006027' : `1380000${seq}0`,
    position: isAdmin ? '段长' : POSITION_CYCLE[i % POSITION_CYCLE.length],
    role: isAdmin ? 'admin' : 'user',
    status: DISABLED.has(i) ? 'disabled' : 'active',
    createdBy: i === 0 ? undefined : 'u-admin',
    createdAt,
  }
}

export const users: User[] = NAMES.map(buildUser)

/** 当前登录用户（演示期固定为管理员，登录页可切换角色） */
export const currentAdmin = users[0]
export const currentWorker = users[1]

export const userStats = {
  total: users.length,
  active: users.filter((u) => u.status === 'active').length,
  disabled: users.filter((u) => u.status === 'disabled').length,
  createdThisMonth: users.filter((u) => u.createdAt.startsWith('2026-11')).length,
}
