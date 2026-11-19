export type MarkKind = 'alert' | 'info'

export interface MarkItem {
  id: string
  kind: MarkKind
  /** 关键点编号 + 名称，如「JMZ-0421 · 3# 阀室」 */
  title: string
  description: string
  distance: string
  time: string
}

/**
 * 示例数据，仅用于设计稿还原阶段。
 * 接入后端后由 GET /api/marks?bbox=&zoom= 替换。
 */
export const marks: MarkItem[] = [
  {
    id: 'm1',
    kind: 'alert',
    title: 'JMZ-0421 · 3# 阀室',
    description: 'K12+300 处管线上方发现第三方施工取土，已现场制止并拍照留证',
    distance: '120m',
    time: '14:32',
  },
  {
    id: 'm2',
    kind: 'alert',
    title: 'JMZ-0429 · 加密桩',
    description: 'K12+860 桩体周边堆载砂石，覆盖深度不足 0.8m',
    distance: '480m',
    time: '13:05',
  },
  {
    id: 'm3',
    kind: 'info',
    title: 'JMZ-0424 · 测试桩',
    description: '智能测试桩电位读数 -1.42V，数据已同步至管线台账',
    distance: '260m',
    time: '12:48',
  },
  {
    id: 'm4',
    kind: 'info',
    title: 'JMZ-0431 · 巡线记录',
    description: '今日巡检完成 4.2km，途经 3# 阀室并校核标志桩编号',
    distance: '610m',
    time: '11:20',
  },
  {
    id: 'm5',
    kind: 'alert',
    title: 'JMZ-0436 · 加密桩',
    description: 'K13+120 处标识桩倾斜约 15°，需安排扶正复测',
    distance: '850m',
    time: '10:37',
  },
  {
    id: 'm6',
    kind: 'info',
    title: '3# 阀室',
    description: '3# 阀室压力表读数 6.42MPa，处于正常运行区间',
    distance: '1.1km',
    time: '09:56',
  },
]

export const markCounts = {
  total: 7,
  alert: 3,
  info: 4,
}
