import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { MarkPin } from '@/components/ui'
import LandingPointSheet, { type LandingChoice } from './LandingPointSheet'

/**
 * 地图落点状态机（画板 4）：
 * 1. 在地图上长按 480ms → 落点处出现双色引脚 + 脉冲环，底部弹出落点面板
 * 2. `?pick=1` 直接打开面板（无独立路由的状态，沿用 `?zoom=province` 的做法，便于演示与截图）
 * 3. `?geo=fail` 展示定位失败态
 *
 * 只叠加浮层，不改地图两屏的既有布局。
 */

/** 演示基准点，与 mock 数据同源 */
const ORIGIN = { lng: 106.2718, lat: 37.5421 }
/** 每像素对应的经纬度跨度（假地图，接高德后由地图实例反查） */
const DEG_PER_PX = 0.00004

interface PickedPoint {
  /** 引脚落点，视口像素 */
  x: number
  y: number
  lng: number
  lat: number
}

function toLngLat(x: number, y: number): { lng: number; lat: number } {
  const w = window.innerWidth || 375
  const h = window.innerHeight || 812
  return {
    lng: Number((ORIGIN.lng + (x - w / 2) * DEG_PER_PX).toFixed(4)),
    lat: Number((ORIGIN.lat - (y - h / 2) * DEG_PER_PX).toFixed(4)),
  }
}

interface MapPickStateProps {
  /** 覆盖默认跳转（新建标记表单内复用本面板时传入） */
  onChoose?: (choice: LandingChoice) => void
}

export default function MapPickState({ onChoose }: MapPickStateProps) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [picked, setPicked] = useState<PickedPoint | null>(null)
  const geoFail = params.get('geo') === 'fail'
  const pickParam = params.get('pick')

  const pressTimer = useRef<number | null>(null)
  const pressStart = useRef<{ x: number; y: number } | null>(null)

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
    const x = Math.round((window.innerWidth || 375) * 0.52)
    const y = Math.round((window.innerHeight || 812) * 0.42)
    setPicked({ x, y, ...toLngLat(x, y) })
  }, [pickParam])

  useEffect(() => clearPress, [])

  const pick = useCallback((x: number, y: number) => {
    setPicked({ x, y, ...toLngLat(x, y) })
  }, [])

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
  }

  const handleChoose = (choice: LandingChoice) => {
    setPicked(null)
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

  return (
    <>
      {/* 长按拾取层：排在 MapCanvas 之后、其余浮层之前，不遮挡已有控件与卡片 */}
      <div
        className="absolute inset-0 select-none [-webkit-touch-callout:none]"
        aria-hidden
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={clearPress}
        onPointerLeave={clearPress}
        onPointerCancel={clearPress}
      />

      {picked ? (
        <div
          className="pointer-events-none absolute"
          style={{ left: picked.x, top: picked.y }}
          aria-hidden
        >
          <div className="-translate-x-1/2 -translate-y-full">
            <MarkPin kind="alert" size={28} dual pulse />
          </div>
        </div>
      ) : null}

      <LandingPointSheet
        open={picked !== null}
        lng={picked?.lng ?? ORIGIN.lng}
        lat={picked?.lat ?? ORIGIN.lat}
        geoFail={geoFail}
        onClose={close}
        onChoose={handleChoose}
      />
    </>
  )
}
