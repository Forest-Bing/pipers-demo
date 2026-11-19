import { MAP_CENTER } from '../amap'
import { distanceMeters, offsetPoint, pointAt } from '../geo'
import { formatDistance, formatTime } from '../format'
import { keypoints } from './keypoints'
import { activePipeline } from './pipelines'
import { users } from './users'
import { KEYPOINT_TYPE_LABEL, type Mark, type MarkKind } from './types'

/**
 * 15 条演示标记（警告 6 / 普通信息 9），沿中俄东线济南段铺开。
 * - 13 条挂在关键点上（`keypointId` 有值），2 条是自由落点；
 * - 2 条 `pending`，对应地图下方的「待同步 N 条」；
 * - m1 带 4 张照片 + 37 秒录音，用来演示附件区。
 *
 * TODO: 接后端后由 GET /api/marks?bbox=&zoom=&kind= 替换
 */

/** 现场照片占位：用渐变模拟，避免引入真人照片 */
const PHOTO_POOL = [
  'from-amber-200 via-stone-300 to-stone-500',
  'from-stone-400 via-amber-100 to-stone-300',
  'from-emerald-200 via-stone-300 to-stone-400',
  'from-sky-200 via-stone-200 to-stone-400',
  'from-orange-200 via-stone-300 to-stone-500',
  'from-slate-300 via-sky-100 to-slate-400',
  'from-lime-200 via-stone-200 to-stone-500',
  'from-rose-200 via-stone-300 to-stone-400',
]

/** 沿线取点：t 是弧长比例（0.42–0.57 为演示视野），dx/dy 是米级偏移 */
const at = (t: number, dx = 0, dy = 0) => offsetPoint(pointAt(activePipeline.path, t), dx, dy)

const kp = (i: number) => keypoints[i]

/** 关键点标题：阀室带编号，其余用类型名，与设计稿「JMZ-0421 · 3# 阀室」同构 */
function kpTitle(index: number) {
  const k = kp(index)
  return k.type === 'valve'
    ? `${k.code} · ${k.name}`
    : `${k.code} · ${KEYPOINT_TYPE_LABEL[k.type]}`
}

interface MarkSeed {
  kind: MarkKind
  /** 关键点下标，-1 表示自由落点 */
  kpIndex: number
  /** 关键点落点时的弧长比例（自由落点用它决定坐标） */
  t: number
  dx?: number
  dy?: number
  description: string
  creatorIndex: number
  createdAt: string
  photos?: number[]
  audio?: number
  pending?: boolean
}

const SEEDS: MarkSeed[] = [
  {
    kind: 'alert',
    kpIndex: 18,
    t: 0.4655,
    description:
      'K318+600 处管线上方发现挖掘机夜间取土，已现场叫停并留存操作手信息，要求恢复原状后报段里复核',
    creatorIndex: 1,
    createdAt: '2026-11-20T00:22:00+08:00',
    photos: [0, 1, 2, 3],
    audio: 37,
  },
  {
    kind: 'alert',
    kpIndex: 12,
    t: 0.4582,
    dx: 20,
    description: 'K317+900 段坡面受降雨冲刷，管堤回填土流失约 0.6m，需安排水工保护修复',
    creatorIndex: 2,
    createdAt: '2026-11-19T18:05:00+08:00',
    photos: [1, 4, 5],
  },
  {
    kind: 'info',
    kpIndex: 9,
    t: 0.4545,
    description: '6# 阀室进出口压力 6.42MPa / 6.39MPa，阀位指示正常，无渗漏',
    creatorIndex: 4,
    createdAt: '2026-11-19T17:12:00+08:00',
    photos: [2],
  },
  {
    kind: 'alert',
    kpIndex: 24,
    t: 0.4768,
    dx: -30,
    description: 'K318+150 处蔬菜大棚搭设至管道保护范围边缘，最近点距管中心约 4.2m，需督促退让',
    creatorIndex: 3,
    createdAt: '2026-11-19T16:40:00+08:00',
    photos: [4, 0, 6, 3, 7],
  },
  {
    kind: 'info',
    kpIndex: 13,
    t: 0.4598,
    description: '智能测试桩电位读数 -1.42V，处于有效保护区间，数据已同步至阴保台账',
    creatorIndex: 5,
    createdAt: '2026-11-19T15:28:00+08:00',
    photos: [],
  },
  {
    kind: 'info',
    kpIndex: 15,
    t: 0.4625,
    description: '今日巡检完成 4.2km，途经 6# 阀室并校核 K318 段标志桩编号，未见异常',
    creatorIndex: 1,
    createdAt: '2026-11-19T14:05:00+08:00',
    photos: [],
  },
  {
    kind: 'alert',
    kpIndex: 21,
    t: 0.4722,
    dx: 14,
    description: '加密桩 1122 倾斜约 15°，桩体与地面结合处有松动，需扶正并对中复测',
    creatorIndex: 6,
    createdAt: '2026-11-19T13:22:00+08:00',
    photos: [7, 2],
  },
  {
    kind: 'info',
    kpIndex: 27,
    t: 0.4821,
    description: '与市政热力管廊交叉施工，已签署管道保护协议，施工方采用人工开挖，现场交底完成',
    creatorIndex: 8,
    createdAt: '2026-11-19T12:10:00+08:00',
    photos: [5, 6, 1],
  },
  {
    kind: 'info',
    kpIndex: 30,
    t: 0.4872,
    description: '完成 K318+900 段阴极保护电位测试 6 点，全部合格，最小保护电位 -1.05V',
    creatorIndex: 17,
    createdAt: '2026-11-19T11:35:00+08:00',
    photos: [3],
  },
  {
    kind: 'alert',
    kpIndex: 33,
    t: 0.4925,
    dx: -18,
    description: '光纤预警系统报机械振动事件，现场核查为村民在桩位旁 12m 处打井，已制止并登记',
    creatorIndex: 9,
    createdAt: '2026-11-19T10:48:00+08:00',
    photos: [0, 4],
    audio: 52,
  },
  {
    kind: 'info',
    kpIndex: 39,
    t: 0.5018,
    description: '7# 阀室月度巡检：球阀、放空阀、压力表、可燃气体报警器均正常，卫生已清理',
    creatorIndex: 12,
    createdAt: '2026-11-19T09:52:00+08:00',
    photos: [6],
  },
  {
    kind: 'alert',
    kpIndex: 42,
    t: 0.5062,
    dx: 22,
    description: 'K319+420 处管道伴行排水沟被秸秆堵塞约 8m，雨天易积水，已拍照上报待清理',
    creatorIndex: 11,
    createdAt: '2026-11-19T08:58:00+08:00',
    photos: [2, 5],
  },
  {
    kind: 'info',
    kpIndex: 45,
    t: 0.5115,
    description: '夜班交接：管段无施工动态，GPS 巡检轨迹已上传，遗留 1 处大棚占压待跟进',
    creatorIndex: 14,
    createdAt: '2026-11-19T08:10:00+08:00',
    photos: [],
  },
  {
    kind: 'info',
    kpIndex: -1,
    t: 0.4968,
    dx: -120,
    dy: 60,
    description: '夜巡途经 K319+050 临时便道，路面有新碾压痕迹，未见机械驻留，明日白天复查',
    creatorIndex: 1,
    createdAt: '2026-11-20T00:35:00+08:00',
    photos: [4],
    pending: true,
  },
  {
    kind: 'info',
    kpIndex: -1,
    t: 0.5205,
    dx: 90,
    dy: -40,
    description: '夜巡记录：7# 阀室周边照明正常，围墙无破损，值班电话已核通',
    creatorIndex: 1,
    createdAt: '2026-11-20T00:41:00+08:00',
    photos: [],
    pending: true,
  },
]

export const marks: Mark[] = SEEDS.map((seed, i) => {
  const keypoint = seed.kpIndex >= 0 ? kp(seed.kpIndex) : undefined
  const [lng, lat] = keypoint
    ? [keypoint.lng, keypoint.lat]
    : at(seed.t, seed.dx ?? 0, seed.dy ?? 0)
  const creator = users[seed.creatorIndex]
  const photos = (seed.photos ?? []).map((p) => PHOTO_POOL[p % PHOTO_POOL.length])

  return {
    id: `m${i + 1}`,
    kind: seed.kind,
    lng,
    lat,
    title: keypoint ? kpTitle(seed.kpIndex) : '手动落点',
    description: seed.description,
    distance: formatDistance(distanceMeters(MAP_CENTER, [lng, lat])),
    time: formatTime(seed.createdAt),
    keypointId: keypoint?.id,
    creatorId: creator.id,
    creatorName: creator.name,
    creatorPosition: creator.position,
    createdAt: seed.createdAt,
    photos,
    audio: seed.audio ? { duration: seed.audio } : undefined,
    pending: seed.pending,
  }
})

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
