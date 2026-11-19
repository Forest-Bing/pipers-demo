import type { Keypoint } from './types'

/**
 * 14 条示例关键点：加密桩 6 / 智能测试桩 5 / 阀室 3。
 * 来源是系统预存资产台账，不由现场创建（PRD 决策 D8）。
 *
 * TODO: 接后端后由 GET /api/keypoints?bbox=&type= 替换
 */

export const keypoints: Keypoint[] = [
  { id: 'kp-1', type: 'valve', code: 'JMZ-0421', name: '3# 阀室', lng: 106.2718, lat: 37.5421, pipelineId: 'pl-1', distance: 86 },
  { id: 'kp-2', type: 'stake', code: 'JMZ-0429', name: '加密桩 0429', lng: 106.2752, lat: 37.5408, pipelineId: 'pl-1', distance: 120 },
  { id: 'kp-3', type: 'stake-test', code: 'JMZ-0424', name: '智能测试桩 0424', lng: 106.2685, lat: 37.5456, pipelineId: 'pl-1', distance: 260 },
  { id: 'kp-4', type: 'stake', code: 'JMZ-0431', name: '加密桩 0431', lng: 106.2801, lat: 37.5389, pipelineId: 'pl-1', distance: 340 },
  { id: 'kp-5', type: 'valve', code: 'JMZ-0436', name: '4# 阀室', lng: 106.2843, lat: 37.5472, pipelineId: 'pl-1', distance: 480 },
  { id: 'kp-6', type: 'stake-test', code: 'JMZ-0438', name: '智能测试桩 0438', lng: 106.2644, lat: 37.5371, pipelineId: 'pl-1', distance: 610 },
  { id: 'kp-7', type: 'stake', code: 'JMZ-0442', name: '加密桩 0442', lng: 106.2902, lat: 37.5433, pipelineId: 'pl-1', distance: 720 },
  { id: 'kp-8', type: 'stake', code: 'JMZ-0447', name: '加密桩 0447', lng: 106.2588, lat: 37.5498, pipelineId: 'pl-1', distance: 850 },
  { id: 'kp-9', type: 'stake-test', code: 'JMZ-0451', name: '智能测试桩 0451', lng: 106.2937, lat: 37.5355, pipelineId: 'pl-1', distance: 940 },
  { id: 'kp-10', type: 'valve', code: 'JMZ-0455', name: '5# 阀室', lng: 106.2541, lat: 37.5339, pipelineId: 'pl-1', distance: 1100 },
  { id: 'kp-11', type: 'stake', code: 'JMZ-0460', name: '加密桩 0460', lng: 106.2984, lat: 37.5501, pipelineId: 'pl-1', distance: 1260 },
  { id: 'kp-12', type: 'stake-test', code: 'JMZ-0463', name: '智能测试桩 0463', lng: 106.2499, lat: 37.5452, pipelineId: 'pl-1', distance: 1420 },
  { id: 'kp-13', type: 'stake', code: 'JMZ-0468', name: '加密桩 0468', lng: 106.3021, lat: 37.5388, pipelineId: 'pl-1', distance: 1580 },
  { id: 'kp-14', type: 'stake-test', code: 'JMZ-0472', name: '智能测试桩 0472', lng: 106.2463, lat: 37.5401, pipelineId: 'pl-1', distance: 1730 },
]

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
