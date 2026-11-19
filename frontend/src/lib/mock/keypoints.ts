import { MAP_CENTER } from '../amap'
import { distanceMeters, offsetPoint, pointAt } from '../geo'
import { activePipeline } from './pipelines'
import { mulberry32 } from './rng'
import type { Keypoint, KeypointType } from './types'

/**
 * 60 个预存关键点，沿中俄东线济南段台账铺开（PRD 决策 D8/D9）。
 * 类型配比按真实台账习惯：加密桩为主，智能测试桩次之，阀室最稀疏。
 * 位置由「沿管线弧长取点 + 确定性抖动」生成，保证每次刷新完全一致。
 *
 * TODO: 接后端后由 GET /api/keypoints?bbox=&type= 替换
 */

/** 10 个一组：7 加密桩 / 2 智能测试桩 / 1 阀室 */
const TYPE_CYCLE: KeypointType[] = [
  'stake',
  'stake',
  'stake-test',
  'stake',
  'stake',
  'stake',
  'stake-test',
  'stake',
  'stake',
  'valve',
]

const TOTAL = 60
/** 台账覆盖的管线弧长区间（t=0.42→0.57，约 5.1km，正好横跨演示视野） */
const T_FROM = 0.42
const T_TO = 0.57

const rnd = mulberry32(20261120)

export const keypoints: Keypoint[] = Array.from({ length: TOTAL }, (_, i) => {
  const type = TYPE_CYCLE[i % TYPE_CYCLE.length]
  const t = T_FROM + ((T_TO - T_FROM) * i) / (TOTAL - 1)
  const onLine = pointAt(activePipeline.path, t)
  // ±28m 抖动，避免所有点严格压在同一条线上（真实台账也有横向偏差）
  const [lng, lat] = offsetPoint(onLine, (rnd() - 0.5) * 56, (rnd() - 0.5) * 56)
  const seq = 1101 + i
  const code = `SD-ZED-${seq}`
  const valveNo = 6 + Math.floor(i / TYPE_CYCLE.length)

  const name =
    type === 'valve'
      ? `${valveNo}# 阀室`
      : type === 'stake-test'
        ? `智能测试桩 ${seq}`
        : `加密桩 ${seq}`

  return {
    id: `kp-${i + 1}`,
    type,
    code,
    name,
    lng,
    lat,
    pipelineId: activePipeline.id,
    distance: Math.round(distanceMeters(MAP_CENTER, [lng, lat])),
  }
})

export const keypointStats = {
  stake: keypoints.filter((k) => k.type === 'stake').length,
  'stake-test': keypoints.filter((k) => k.type === 'stake-test').length,
  valve: keypoints.filter((k) => k.type === 'valve').length,
}

export function findKeypoint(id: string | undefined | null) {
  if (!id) return undefined
  return keypoints.find((k) => k.id === id)
}

export function findKeypointByCode(code: string | undefined | null) {
  if (!code) return undefined
  return keypoints.find((k) => k.code === code)
}
