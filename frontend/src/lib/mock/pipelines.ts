import type { Pipeline } from './types'

/**
 * 管段台账。演示环境只放一条：中俄东线山东段（济南—泰安方向）。
 * `path` 是 GCJ-02 顶点串，地图上直接用 Polyline 连线（PRD 决策 D10）。
 *
 * TODO: 接后端后由 GET /api/pipelines 替换（GeoJSON LineString）
 */
export const pipelines: Pipeline[] = [
  {
    id: 'pl-zed-sd',
    code: 'ZED-SD-01',
    name: '中俄东线 · 济南—泰安段',
    company: '国家管网山东公司',
    path: [
      [117.1462, 36.7864],
      [117.1284, 36.7418],
      [117.1023, 36.7052],
      [117.0781, 36.6812],
      [117.0584, 36.6586],
      [117.0402, 36.6322],
      [117.0186, 36.6046],
      [116.9974, 36.5782],
      [116.9812, 36.5486],
      [116.9668, 36.5168],
    ],
  },
]

export const activePipeline = pipelines[0]
