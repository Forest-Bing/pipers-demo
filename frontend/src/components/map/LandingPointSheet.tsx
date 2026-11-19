import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Landmark, Loader2, LocateFixed, MapPin } from 'lucide-react'
import { Sheet, TextButton } from '@/components/ui'
import { formatLngLat } from '@/lib/format'
import { locate } from '@/lib/amap'
import { useMapInstance } from '@/lib/map-runtime'
import { cn } from '@/lib/cn'

/**
 * 画板 4「长按地图 · 选择落点」。
 * 地图全屏不动，底部弹一张玻璃面板；地图上落点处由 MapPickState 画双色引脚。
 */
export type LandingChoice =
  | { kind: 'current'; lng: number; lat: number }
  | { kind: 'picked'; lng: number; lat: number }
  | { kind: 'keypoint' }

interface LandingPointSheetProps {
  open: boolean
  lng: number
  lat: number
  /** 演示定位失败态（`?geo=fail`），该行说明变红且不可点 */
  geoFail?: boolean
  onClose: () => void
  onChoose: (choice: LandingChoice) => void
}

export default function LandingPointSheet({
  open,
  lng,
  lat,
  geoFail = false,
  onClose,
  onChoose,
}: LandingPointSheetProps) {
  const map = useMapInstance()
  const [locating, setLocating] = useState(false)
  /** 真实定位失败的本地态：与 `?geo=fail` 的演示态共用同一套红字样式 */
  const [failed, setFailed] = useState(false)
  const timer = useRef<number | null>(null)
  const blocked = geoFail || failed

  const clearTimer = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }

  useEffect(() => clearTimer, [])

  // 关闭时清掉定位中/失败状态，下次打开回到初始态
  useEffect(() => {
    if (!open) {
      clearTimer()
      setLocating(false)
      setFailed(false)
    }
  }, [open])

  const pickCurrent = async () => {
    if (blocked || locating) return
    setLocating(true)

    // 没有 SDK（未配 Key）时保持原来的演示行为：假定位 900ms 后用面板上的坐标
    if (!window.AMap?.Geolocation) {
      const point = { lng, lat }
      timer.current = window.setTimeout(() => {
        setLocating(false)
        onChoose({ kind: 'current', ...point })
      }, 900)
      return
    }

    const point = await locate()
    setLocating(false)
    if (!point) {
      setFailed(true)
      return
    }
    map?.setCenter([point.lng, point.lat])
    map?.setZoom(17)
    onChoose({ kind: 'current', ...point })
  }

  return (
    <Sheet open={open} onClose={onClose} scrim={false}>
      <div className="relative">
        <TextButton className="absolute -top-0.5 right-0" onClick={onClose}>
          取消
        </TextButton>

        <h2 className="pr-14 text-[17px] font-semibold leading-tight text-ink">在此处添加标记</h2>
        <p className="mt-1 font-mono text-[12px] text-ink-2">{formatLngLat(lng, lat)}</p>

        <ul className="mt-3 divide-y divide-hairline">
          <li>
            <button
              type="button"
              onClick={pickCurrent}
              disabled={blocked}
              className={cn(
                'flex min-h-[56px] w-full items-center gap-3 py-2.5 text-left',
                'transition-colors duration-240',
                blocked ? 'cursor-not-allowed' : 'active:bg-ink/[0.03]',
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-info/10 text-info">
                <LocateFixed size={17} strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium leading-tight text-ink">
                  {locating ? '正在定位…' : '使用当前位置'}
                </span>
                <span
                  className={cn(
                    'mt-0.5 block text-[12px] leading-tight',
                    blocked ? 'text-alert' : 'text-ink-2',
                  )}
                >
                  {blocked ? '定位失败，请检查权限' : 'GPS 定位，精度 ±8 米'}
                </span>
              </span>
              {locating ? (
                <Loader2 size={16} strokeWidth={2} className="shrink-0 animate-spin text-info" />
              ) : (
                <ChevronRight size={16} strokeWidth={1.8} className="shrink-0 text-ink-2/70" />
              )}
            </button>
          </li>

          <li>
            <button
              type="button"
              onClick={() => onChoose({ kind: 'picked', lng, lat })}
              className="flex min-h-[56px] w-full items-center gap-3 py-2.5 text-left transition-colors duration-240 active:bg-ink/[0.03]"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-info/10 text-info">
                <MapPin size={17} strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium leading-tight text-ink">使用此位置</span>
                <span className="mt-0.5 block text-[12px] leading-tight text-ink-2">
                  长按拾取的地图坐标
                </span>
              </span>
              <ChevronRight size={16} strokeWidth={1.8} className="shrink-0 text-ink-2/70" />
            </button>
          </li>

          <li>
            <button
              type="button"
              onClick={() => onChoose({ kind: 'keypoint' })}
              className="flex min-h-[56px] w-full items-center gap-3 py-2.5 text-left transition-colors duration-240 active:bg-ink/[0.03]"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-info/10 text-info">
                <Landmark size={17} strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium leading-tight text-ink">关联关键点</span>
                <span className="mt-0.5 block text-[12px] leading-tight text-ink-2">
                  从台账中选择加密桩、测试桩或阀室
                </span>
              </span>
              <ChevronRight size={16} strokeWidth={1.8} className="shrink-0 text-ink-2/70" />
            </button>
          </li>
        </ul>
      </div>
    </Sheet>
  )
}
