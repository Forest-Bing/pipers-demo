import { useEffect, useRef, useState } from 'react'
import MapBackdrop from './MapBackdrop'
import PipelineLayer from './PipelineLayer'
import { AMAP_STYLE_ID, MAP_CENTER, MAP_ZOOM, loadAMap } from '@/lib/amap'
import { clearMapInstance, notifyViewChange, setMapInstance, setMapSize } from '@/lib/map-runtime'
import { cn } from '@/lib/cn'

/**
 * 地图容器（唯一的地图交换点）。
 *
 * 约定：
 * 1. 绝对定位铺满，且必须排在所有玻璃浮层之前（DOM 顺序即层级，不靠 z-index 堆叠）。
 * 2. 高德 SDK 挂在 `#map-canvas` 上，canvas 由高德自己往里插，外部 DOM 结构不变。
 * 3. 底图用 #F7F7F5，避免瓦片加载前闪白；`MapBackdrop` 保留为降级底图
 *    （没配 Key / SDK 加载失败时占位），地图就绪后淡出。
 *
 * 断点壳里手机/桌面两套布局同时在 DOM 里（`hidden lg:block` 只是 CSS 隐藏），
 * 所以这里**必须等容器可见（有尺寸）才创建地图**：否则被隐藏那套会以 0×0 初始化，
 * 并把模块级的「当前地图实例」抢过去，覆盖物的投影和视口过滤全都会算错。
 */
export default function MapCanvas() {
  const holder = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = holder.current
    if (!el) return

    let alive = true
    let instance: AMap.Map | null = null
    let started = false

    const boot = () => {
      if (started || !alive) return
      // 被 CSS 隐藏的容器没有尺寸，不启动
      if (!el.clientWidth || !el.clientHeight) return
      started = true

      void loadAMap().then((AMapNS) => {
        if (!alive || !AMapNS) return

        instance = new AMapNS.Map(el, {
          // 巡线场景不需要 3D 倾斜与旋转，2D 省性能也少一堆误触
          viewMode: '2D',
          zoom: MAP_ZOOM,
          center: MAP_CENTER,
          zooms: [4, 19],
          ...(AMAP_STYLE_ID ? { mapStyle: `amap://styles/${AMAP_STYLE_ID}` } : {}),
        })

        setMapInstance(instance)
        setMapSize({ width: el.clientWidth, height: el.clientHeight })
        setReady(true)

        // 覆盖物是 React 层，靠像素坐标定位，地图一动就得重算
        const viewEvents = ['mapmove', 'zoomchange', 'moveend', 'zoomend', 'resize', 'complete'] as const
        viewEvents.forEach((name) => instance?.on(name, notifyViewChange))
      })
    }

    const sync = () => {
      const width = el.clientWidth
      const height = el.clientHeight
      if (!width || !height) return

      setMapSize({ width, height })
      if (!started) {
        boot()
        return
      }
      // 断点切换后回到本布局：把「当前实例」和尺寸都交还给可见的这一套
      if (instance) setMapInstance(instance)
    }

    const ro = new ResizeObserver(sync)
    ro.observe(el)
    sync()
    // 首次挂载时容器可能还没完成布局（读到 0）：下一帧 + 一次定时各补一次
    const raf = requestAnimationFrame(sync)
    const timer = window.setTimeout(sync, 60)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
      ro.disconnect()
      if (instance) {
        clearMapInstance(instance)
        instance.destroy()
        instance = null
      }
      setReady(false)
    }
  }, [])

  return (
    <div className="absolute inset-0 bg-map-base">
      {/* 降级底图：无 Key 时就是设计稿的抽象地图；有 Key 时在瓦片到位后淡出 */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 transition-opacity duration-500',
          ready ? 'opacity-0' : 'opacity-100',
        )}
      >
        <MapBackdrop />
      </div>

      <div ref={holder} id="map-canvas" className="absolute inset-0" aria-label="地图" />

      {/* 管道线直接交给高德画（跟着瓦片走不抖），标记与关键点仍是上层的 React 覆盖物 */}
      <PipelineLayer />
    </div>
  )
}
