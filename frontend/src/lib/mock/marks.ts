import type { Mark, MarkKind } from './types'

/**
 * 7 条示例标记：警告 3 / 信息 4。
 * m1 是画板 5/6 的示例（4 张图 + 37 秒录音 + 关键点 JMZ-0421）。
 * m6、m7 为待同步草稿，对应地图上的「待同步 2 条」。
 *
 * TODO: 接后端后由 GET /api/marks?bbox=&zoom=&kind= 替换
 */

/** 现场照片占位：用渐变模拟，避免引入真人照片 */
const PHOTO_POOL = [
  'from-amber-200 via-stone-300 to-stone-500',
  'from-stone-400 via-amber-100 to-stone-300',
  'from-emerald-200 via-stone-300 to-stone-400',
  'from-sky-200 via-stone-200 to-stone-400',
]

export const marks: Mark[] = [
  {
    id: 'm1',
    kind: 'alert',
    lng: 106.2718,
    lat: 37.5421,
    title: 'JMZ-0421 · 3# 阀室',
    description: 'K12+300 处管线上方发现第三方施工取土，已现场制止并拍照留证',
    distance: '120m',
    time: '14:32',
    keypointId: 'kp-1',
    creatorId: 'u-zhang',
    creatorName: '张建国',
    creatorPosition: '巡线工',
    createdAt: '2026-11-19T14:32:00+08:00',
    photos: PHOTO_POOL,
    audio: { duration: 37 },
  },
  {
    id: 'm2',
    kind: 'alert',
    lng: 106.2752,
    lat: 37.5408,
    title: 'JMZ-0429 · 加密桩',
    description: 'K12+860 桩体周边堆载砂石，覆盖深度不足 0.8m',
    distance: '480m',
    time: '13:05',
    keypointId: 'kp-2',
    creatorId: 'u-zhang',
    creatorName: '张建国',
    creatorPosition: '巡线工',
    createdAt: '2026-11-19T13:05:00+08:00',
    photos: [PHOTO_POOL[1]],
  },
  {
    id: 'm3',
    kind: 'info',
    lng: 106.2685,
    lat: 37.5456,
    title: 'JMZ-0424 · 测试桩',
    description: '智能测试桩电位读数 -1.42V，数据已同步至管线台账',
    distance: '260m',
    time: '12:48',
    keypointId: 'kp-3',
    creatorId: 'u-zhang',
    creatorName: '张建国',
    creatorPosition: '巡线工',
    createdAt: '2026-11-19T12:48:00+08:00',
    photos: [PHOTO_POOL[2]],
  },
  {
    id: 'm4',
    kind: 'info',
    lng: 106.2801,
    lat: 37.5389,
    title: 'JMZ-0431 · 巡线记录',
    description: '今日巡检完成 4.2km，途经 3# 阀室并校核标志桩编号',
    distance: '610m',
    time: '11:20',
    keypointId: 'kp-4',
    creatorId: 'u-wang',
    creatorName: '王志强',
    creatorPosition: '巡线工',
    createdAt: '2026-11-19T11:20:00+08:00',
    photos: [],
  },
  {
    id: 'm5',
    kind: 'alert',
    lng: 106.2843,
    lat: 37.5472,
    title: 'JMZ-0436 · 加密桩',
    description: 'K13+120 处标识桩倾斜约 15°，需安排扶正复测',
    distance: '850m',
    time: '10:37',
    keypointId: 'kp-5',
    creatorId: 'u-liu',
    creatorName: '刘海涛',
    creatorPosition: '巡线工',
    createdAt: '2026-11-19T10:37:00+08:00',
    photos: [PHOTO_POOL[3]],
  },
  {
    id: 'm6',
    kind: 'info',
    lng: 106.2644,
    lat: 37.5371,
    title: '3# 阀室',
    description: '3# 阀室压力表读数 6.42MPa，处于正常运行区间',
    distance: '1.1km',
    time: '09:56',
    keypointId: 'kp-6',
    creatorId: 'u-zhang',
    creatorName: '张建国',
    creatorPosition: '巡线工',
    createdAt: '2026-11-19T09:56:00+08:00',
    photos: [],
    pending: true,
  },
  {
    id: 'm7',
    kind: 'info',
    lng: 106.2902,
    lat: 37.5433,
    title: 'JMZ-0442 · 加密桩',
    description: 'K13+280 处新增临时便道，已与施工方确认走向并记录桩位',
    distance: '1.3km',
    time: '09:12',
    keypointId: 'kp-7',
    creatorId: 'u-zhang',
    creatorName: '张建国',
    creatorPosition: '巡线工',
    createdAt: '2026-11-19T09:12:00+08:00',
    photos: [PHOTO_POOL[0]],
    pending: true,
  },
]

export const markCounts: Record<'total' | MarkKind, number> = {
  total: marks.length,
  alert: marks.filter((m) => m.kind === 'alert').length,
  info: marks.filter((m) => m.kind === 'info').length,
}

/** 待同步条数（弱网草稿） */
export const pendingCount = marks.filter((m) => m.pending).length

export function findMark(id: string | undefined | null) {
  if (!id) return undefined
  return marks.find((m) => m.id === id)
}
