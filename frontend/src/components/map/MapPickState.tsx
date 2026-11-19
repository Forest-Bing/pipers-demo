import { useCallback, useEffect, useReducer, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { MarkPin } from '@/components/ui'
import { MAP_CENTER } from '@/lib/amap'
import { useMapInstance, useSelectMode } from '@/lib/map-runtime'
import LandingPointSheet, { type LandingChoice } from './LandingPointSheet'

/**
 * 地图落点状态机（画板 4）：
 * 1. 进入「选点模式」后在地图上长按 480ms → 落点处出现双色引脚 + 脉冲环，底部弹出落点面板
 * 2. `?pick=1` 直接进入选点模式并打开面板（无独立路由的状态，沿用 `?zoom=province` 的做法）
 * 3. `?geo=fail` 展示定位失败态
 *
 * 选点模式的边界：拾取层默认 `pointer-events: none`，不挡地图的拖动与双指缩放；
 * 只有开启后才接管指针。接高德前是常驻拦截，接真地图后必须放行，否则地图拖不动。
 */

/** 每像素对应的经纬度跨度（仅降级底图用，接高德后由地图实例反查） */
const DEG_PER_PX = 0.00004

interface PickedPoint {
  /** 视口像素，用于无地图时定位引脚 */
  x: number
  y: number
  lng: number
  lat: number
}

/**
 * 像素 → 经纬度。
 * 有地图实例时走 `containerToLngLat`（真实投影，GCJ-02）；
 * 无地图（没配 Key）时退回按固定比例的假投影，保证演示链路可用。
 */
function toLngLat(x: number, y: number, map: AMap.Map | null): { lng: number; lat: number } {
  if (map) {
    const { lng, lat } = map.containerToLngLat(new window.AMap.Pixel(x, y))
    return { lng: Number(lng.toFixed(6)), lat: Number(lat.toFixed(6)) }
  }
  const w = window.innerWidth || 375
  const h = window.innerHeight || 812
  return {
    lng: Number((MAP_CENTER[0] + (x - w / 2) * DEG_PER_PX).toFixed(4)),
    lat: Number((MAP_CENTER[1] - (y - h / 2) * DEG_PER_PX).toFixed(4)),
  }
}

interface MapPickStateProps {
  /** 覆盖默认跳转（新建标记表单内复用本面板时传入） */
  onChoose?: (choice: LandingChoice) => void
}

export default function MapPickState({ onChoose }: MapPickStateProps) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const map = useMapInstance()
  const [selectMode, setSelectMode] = useSelectMode()
  const [picked, setPicked] = useState<PickedPoint | null>(null)
  const geoFail = params.get('geo') === 'fail'
  const pickParam = params.get('pick')

  const pressTimer = useRef<number | null>(null)
  const pressStart = useRef<{ x: number; y: number } | null>(null)

  // 地图平移/缩放后引脚要跟着走，用一个 tick 触发像素重算
  const [, tick] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    if (!map) return
    const events = ['mapmove', 'zoomchange', 'moveend', 'zoomend'] as const
    events.forEach((name) => map.on(name, tick))
    return () => {
      events.forEach((name) => map.off(name, tick))
    }
  }, [map])

  const clearPress = () => {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
    pressStart.current = null
  }

  // ?pick=1 直接开面板：落点取视口中偏上位置
  useEffect(() => {
    if (pickParam !== '1') return
    setSelectMode(true)
    const x = Math.round((window.innerWidth || 375) * 0.52)
    const y = Math.round((window.innerHeight || 812) * 0.42)
    setPicked((prev) => prev ?? { x, y, ...toLngLat(x, y, map) })
  }, [pickParam, map, setSelectMode])

  // 地图就绪可能比 URL 参数晚一步：像素不变，重新换算一次经纬度
  useEffect(() => {
    if (!map) return
    setPicked((prev) => (prev ? { ...prev, ...toLngLat(prev.x, prev.y, map) } : prev))
  }, [map])

  useEffect(() => clearPress, [])

  const pick = useCallback(
    (x: number, y: number) => {
      setPicked({ x, y, ...toLngLat(x, y, map) })
    },
    [map],
  )

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    pressStart.current = { x: e.clientX, y: e.clientY }
    const { clientX, clientY } = e
    pressTimer.current = window.setTimeout(() => {
      pressTimer.current = null
      pick(clientX, clientY)
    }, 480)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = pressStart.current
    if (!start) return
    if (Math.abs(e.clientX - start.x) > 8 || Math.abs(e.clientY - start.y) > 8) clearPress()
  }

  const close = () => {
    clearPress()
    setPicked(null)
    setSelectMode(false)
  }

  const handleChoose = (choice: LandingChoice) => {
    setPicked(null)
    setSelectMode(false)
    if (onChoose) {
      onChoose(choice)
      return
    }
    if (choice.kind === 'keypoint') {
      navigate('/mark/new/keypoint')
      return
    }
    // TODO: GET /api/keypoints?lng=&lat= 反查最近关键点，替换纯坐标传参
    const query = new URLSearchParams({
      lng: String(choice.lng),
      lat: String(choice.lat),
      src: choice.kind,
    })
    navigate(`/mark/new?${query.toString()}`)
  }

  // 引脚位置：有地图按经纬度反查像素，无地图直接用记录的像素
  const pin = picked
    ? map
      ? map.lngLatToContainer([picked.lng, picked.lat])
      : { x: picked.x, y: picked.y }
    : null

  return (
    <>
      {/* 长按拾取层：默认不接管指针，地图可正常拖动缩放；选点模式下才拦截 */}
      <div
        className={
          selectMode
            ? 'absolute inset-0 select-none [-webkit-touch-callout:none]'
            : 'pointer-events-none absolute inset-0 select-none'
        }
        aria-hidden
        onPointerDown={selectMode ? onPointerDown : undefined}
        onPointerMove={selectMode ? onPointerMove : undefined}
        onPointerUp={selectMode ? clearPress : undefined}
        onPointerLeave={selectMode ? clearPress : undefined}
        onPointerCancel={selectMode ? clearPress : undefined}
      />

      {/* 选点模式的轻提示：只在这一个状态下出现，不占常驻布局 */}
      {selectMode && !picked ? (
        <div className="glass absolute inset-x-4 top-[120px] flex h-9 items-center gap-2 rounded-[12px] px-3">
          <span className="text-[12px] text-ink-2">长按地图任意位置选择落点</span>
          <button
            type="button"
            className="ml-auto text-[12px] font-medium text-info"
            onClick={() => setSelectMode(false)}
          >
            退出
          </button>
        </div>
      ) : null}

      {pin ? (
        <div className="pointer-events-none absolute" style={{ left: pin.x, top: pin.y }} aria-hidden>
          <div className="-translate-x-1/2 -translate-y-full">
            <MarkPin kind="alert" size={28} dual pulse />
          </div>
        </div>
      ) : null}

      <LandingPointSheet
        open={picked !== null}
        lng={picked?.lng ?? MAP_CENTER[0]}
        lat={picked?.lat ?? MAP_CENTER[1]}
        geoFail={geoFail}
        onClose={close}
        onChoose={handleChoose}
      />
    </>
  )
}
