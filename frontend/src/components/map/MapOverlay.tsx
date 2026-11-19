import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ClusterBubble, CurrentLocationDot, KeypointIcon, MarkPin } from '@/components/ui'
import { keypoints } from '@/lib/mock/keypoints'
import { KEYPOINT_TYPE_LABEL, type Keypoint } from '@/lib/mock/types'
import { useStore } from '@/lib/store'
import {
  useCurrentLocation,
  useMapInstance,
  useMapSize,
  useMapTick,
} from '@/lib/map-runtime'

/**
 * 地图覆盖物（React 叠加层，不用 `AMap.Marker`）。
 *
 * 为什么不用 `AMap.Marker` + HTML content：
 * 1. 图钉的「只有警告红/信息蓝两色」是硬规则，复用现成的 `MarkPin` 才不会漂移；
 * 2. HTML content 每个 marker 一份独立 DOM，样式和事件都要另写一套；
 * 3. 引脚跟随、聚合都只是一次数组计算，比维护 marker 集合简单。
 *
 * 代价是每次平移缩放要重算像素：由 `useMapTick()` 驱动，rAF 合并到每帧一次。
 *
 * 图层次序（后者压前者）：关键点 → 标记图钉 → 当前位置。
 * 标记与关键点可能落在同一坐标（台账点上的标记），图钉在上是符合直觉的。
 */

const PIN_SIZE = 28
/** 达到该缩放级别才画独立关键点，否则按屏幕网格聚合（PRD 决策 D9） */
const KEYPOINT_ZOOM = 15
/** 聚合网格边长（屏幕像素） */
const CLUSTER_CELL = 72
/** 视口外扩边距。0 = 锚点必须在视口内；给正数会让贴边的图钉被容器裁掉半个，很难看 */
const VIEW_PAD = 0

interface ProjectedMark {
  id: string
  kind: 'alert' | 'info'
  title: string
  x: number
  y: number
}

interface ProjectedCluster {
  key: string
  x: number
  y: number
  items: Keypoint[]
}

export default function MapOverlay() {
  const map = useMapInstance()
  const tick = useMapTick()
  const navigate = useNavigate()
  const { marks, toast } = useStore()
  const here = useCurrentLocation()
  const hostRef = useRef<HTMLDivElement>(null)

  /**
   * 断点壳里两套布局同时挂载，只有一个地图实例（可见那套创建的）。
   * 隐藏那套也会渲染本组件并读到同一个实例，坐标却是按另一套容器的尺寸算的；
   * 靠「地图容器是不是自己这一套的兄弟」判断归属，隐藏那套直接不渲染。
   */
  const [ownsMap, setOwnsMap] = useState(false)
  useEffect(() => {
    const el = hostRef.current
    setOwnsMap(Boolean(map && el && el.parentElement?.contains(map.getContainer())))
  }, [map])

  const size = useMapSize()
  const w = size.width
  const h = size.height

  const view = useMemo(() => {
    if (!map || !ownsMap || !w || !h) {
      return {
        pins: [] as ProjectedMark[],
        clusters: [] as ProjectedCluster[],
        here: null as { x: number; y: number } | null,
      }
    }

    const visible = (x: number, y: number) =>
      x > -VIEW_PAD && x < w + VIEW_PAD && y > -VIEW_PAD && y < h + VIEW_PAD

    const project = (lng: number, lat: number) => map.lngLatToContainer([lng, lat])

    // —— 标记：始终显示独立图钉（量级是「当天现场记录」，不会到聚合的量级）
    const pins: ProjectedMark[] = []
    for (const mark of marks) {
      const p = project(mark.lng, mark.lat)
      if (!visible(p.x, p.y)) continue
      pins.push({ id: mark.id, kind: mark.kind, title: mark.title, x: Math.round(p.x), y: Math.round(p.y) })
    }

    // —— 关键点：放大到 KEYPOINT_ZOOM 才逐个画，否则按屏幕网格聚合成计数气泡
    const zoom = map.getZoom()
    const cells = new Map<string, { sx: number; sy: number; n: number; items: Keypoint[] }>()
    for (const kp of keypoints) {
      const p = project(kp.lng, kp.lat)
      if (!visible(p.x, p.y)) continue
      // 放大后每个点独占一格，格子键带 id，天然不合并
      const cellKey =
        zoom >= KEYPOINT_ZOOM
          ? `p:${kp.id}`
          : `${Math.floor(p.x / CLUSTER_CELL)}:${Math.floor(p.y / CLUSTER_CELL)}`
      const cell = cells.get(cellKey) ?? { sx: 0, sy: 0, n: 0, items: [] }
      cell.sx += p.x
      cell.sy += p.y
      cell.n += 1
      cell.items.push(kp)
      cells.set(cellKey, cell)
    }

    const clusters: ProjectedCluster[] = [...cells.entries()].map(([key, cell]) => ({
      key,
      x: Math.round(cell.sx / cell.n),
      y: Math.round(cell.sy / cell.n),
      items: cell.items,
    }))

    // 当前位置：定位成功后才有
    let herePoint: { x: number; y: number } | null = null
    if (here) {
      const p = project(here.lng, here.lat)
      if (visible(p.x, p.y)) herePoint = { x: Math.round(p.x), y: Math.round(p.y) }
    }

    return { pins, clusters, here: herePoint }
    // tick 只是「视图变了」的信号，参与依赖以触发重算
  }, [map, w, h, marks, here, tick])

  // 容器始终挂载：`ownsMap` 要靠它的父节点判断归属，不能提前 return
  const zoomToCluster = (c: ProjectedCluster) => {
    if (!map) return
    const center = map.containerToLngLat([c.x, c.y])
    map.setZoom(Math.min(17, KEYPOINT_ZOOM + 1), true)
    map.setCenter([center.lng, center.lat])
  }

  const showKeypoint = (kp: Keypoint) => {
    toast(`${kp.code} · ${kp.name}（${KEYPOINT_TYPE_LABEL[kp.type]}）`)
  }

  return (
    <div
      ref={hostRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-label="地图覆盖物"
    >
      {/* 关键点层 */}
      {view.clusters.map((c) =>
        c.items.length === 1 ? (
          <button
            key={c.key}
            type="button"
            aria-label={`关键点 ${c.items[0].code} ${c.items[0].name}`}
            onClick={() => showKeypoint(c.items[0])}
            className="pointer-events-auto absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-transform duration-240 ease-glass active:scale-90"
            style={{ left: c.x, top: c.y }}
          >
            <KeypointIcon type={c.items[0].type} size={12} />
          </button>
        ) : (
          <button
            key={c.key}
            type="button"
            aria-label={`展开 ${c.items.length} 个关键点`}
            onClick={() => zoomToCluster(c)}
            className="pointer-events-auto absolute -translate-x-1/2 -translate-y-full transition-transform duration-240 ease-glass active:scale-95"
            style={{ left: c.x, top: c.y }}
          >
            <ClusterBubble count={c.items.length} />
          </button>
        ),
      )}

      {/* 标记图钉层：点击直接进详情 */}
      {view.pins.map((pin) => (
        <button
          key={pin.id}
          type="button"
          aria-label={`标记 ${pin.title}`}
          onClick={() => navigate(`/marks/${pin.id}`)}
          className="pointer-events-auto absolute -translate-x-1/2 -translate-y-full transition-transform duration-240 ease-glass active:scale-95"
          style={{ left: pin.x, top: pin.y }}
        >
          <MarkPin kind={pin.kind} size={PIN_SIZE} pulse={pin.kind === 'alert'} />
        </button>
      ))}

      {/* 当前位置 */}
      {view.here ? (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          aria-hidden
          style={{ left: view.here.x, top: view.here.y }}
        >
          <CurrentLocationDot size={8} />
        </div>
      ) : null}
    </div>
  )
}
