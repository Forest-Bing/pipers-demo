import { useEffect } from 'react'
import { loadAMap } from '@/lib/amap'
import { useMapInstance } from '@/lib/map-runtime'
import { pipelines } from '@/lib/mock/pipelines'

/**
 * 管道线图层（PRD 决策 D10）。
 *
 * 关键点 / 标记是 React 叠加层，管道线却必须由高德自己画：它要跟着瓦片走、
 * 参与地图层级排序，用 DOM 画会在缩放时抖动。这里是唯一一处直接往地图上
 * `add` 覆盖物的地方，只做「进地图 / 出地图」两件事，不碰业务状态。
 *
 * 坐标沿用 mock 台账的 GCJ-02，和高德瓦片天然对齐，不做转换。
 *
 * ⚠️ 卸载必须容错：路由切换时 `MapCanvas` 的清理与这里的清理**顺序不保证**，
 * 地图实例可能已经 `destroy()`，再调 `map.remove()` 会抛
 * `Cannot read properties of undefined (reading 'remove')` 直接白屏。
 * 因此覆盖物逐条 `setMap(null)`，并且整段 try/catch 吞掉。
 */
export default function PipelineLayer() {
  const map = useMapInstance()

  useEffect(() => {
    if (!map) return

    let alive = true
    const lines: AMap.Polyline[] = []

    void loadAMap().then((AMapNS) => {
      if (!alive || !AMapNS) return
      try {
        pipelines.forEach((pipeline) => {
          const line = new AMapNS.Polyline({
            path: pipeline.path,
            strokeColor: '#45525E',
            strokeWeight: 4,
            strokeOpacity: 0.8,
            lineJoin: 'round',
            lineCap: 'round',
            zIndex: 60,
            // 方向箭头，一眼能看出介质流向
            showDir: true,
          } as AMap.PolylineOptions)
          line.setMap(map)
          lines.push(line)
        })
      } catch {
        // 地图在加载回调返回前已被销毁：静默放弃，下一次挂载会重画
      }
    })

    return () => {
      alive = false
      lines.forEach((line) => {
        try {
          line.setMap(null)
        } catch {
          // 实例已随地图销毁，无需再摘除
        }
      })
      lines.length = 0
    }
  }, [map])

  return null
}
