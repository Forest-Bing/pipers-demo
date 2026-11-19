import { useId } from 'react'
import { Info, TriangleAlert, Waves } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { KeypointType, MarkKind } from '@/lib/mock/types'

const KEYPOINT_COLOR: Record<KeypointType, string> = {
  stake: '#5B6B7C',
  'stake-test': '#30B0C7',
  valve: '#8E7BEF',
}

interface KeypointIconProps {
  type: KeypointType
  /** 图形本体尺寸（px）。地图上用 12/14，列表里可放大到 16 */
  size?: number
  /** 智能测试桩的淡青光晕 */
  glow?: boolean
  className?: string
}

/** 三种关键点：加密桩 12 圆点 / 智能测试桩 12 圆点带 20 光晕 / 阀室 14 圆角方 */
export function KeypointIcon({ type, size = 12, glow = true, className }: KeypointIconProps) {
  const color = KEYPOINT_COLOR[type]
  const isValve = type === 'valve'
  const showGlow = glow && type === 'stake-test'

  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {showGlow ? (
        <i
          className="absolute rounded-full"
          style={{
            width: size * 1.7,
            height: size * 1.7,
            background: 'rgba(48,176,199,0.18)',
          }}
        />
      ) : null}
      <i
        className="relative"
        style={{
          width: size,
          height: size,
          borderRadius: isValve ? 3 : '50%',
          background: color,
          boxShadow: '0 0 0 2px #fff',
        }}
      />
    </span>
  )
}

interface MarkPinProps {
  kind: MarkKind
  /** 图钉高度，手机 24 / 桌面 28 */
  size?: number
  /** 双色态：类型未定时使用（上半警告红、下半信息蓝） */
  dual?: boolean
  /** 脉冲环，用于落点预览 */
  pulse?: boolean
  className?: string
}

/** 水滴形标记图钉，尖端指向坐标点 */
export function MarkPin({ kind, size = 24, dual = false, pulse = false, className }: MarkPinProps) {
  const uid = useId().replace(/:/g, '')
  const color = kind === 'alert' ? '#FF3B30' : '#0A84FF'
  const height = Math.round((size * 32) / 24)
  const Icon = kind === 'alert' ? TriangleAlert : Info

  return (
    <span className={cn('relative inline-flex flex-col items-center', className)} aria-hidden>
      {pulse ? (
        <i className="absolute left-1/2 top-1/2 -z-10 size-11 -translate-x-1/2 -translate-y-1/2 animate-breathe rounded-full bg-info/25" />
      ) : null}
      <span className="relative" style={{ width: size, height }}>
        <svg viewBox="0 0 24 32" width={size} height={height} className="block">
          <defs>
            <linearGradient id={`pin-${uid}`} x1="0" y1="0" x2="0" y2="1">
              {dual ? (
                <>
                  <stop offset="50%" stopColor="#FF3B30" />
                  <stop offset="50%" stopColor="#0A84FF" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor={color} />
                  <stop offset="100%" stopColor={color} />
                </>
              )}
            </linearGradient>
          </defs>
          <path
            d="M12 1C5.9 1 1 5.9 1 12c0 8.2 11 19 11 19s11-10.8 11-19c0-6.1-4.9-11-11-11Z"
            fill={`url(#pin-${uid})`}
            stroke="#fff"
            strokeWidth="2"
          />
        </svg>
        <span
          className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center text-white"
          style={{ top: size * 0.21, width: size * 0.5, height: size * 0.5 }}
        >
          <Icon size={size * 0.42} strokeWidth={2.6} />
        </span>
      </span>
    </span>
  )
}

/** 当前位置：蓝点 + 白环 + 呼吸层 */
export function CurrentLocationDot({ size = 8 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size * 5, height: size * 5 }}
      aria-hidden
    >
      <i className="absolute animate-breathe rounded-full bg-info/15" style={{ width: size * 5, height: size * 5 }} />
      <i className="absolute rounded-full bg-white/85" style={{ width: size * 3, height: size * 3 }} />
      <i className="relative rounded-full bg-info" style={{ width: size, height: size }} />
    </span>
  )
}

/** 聚合气泡：白色玻璃圆 + 三角指向；>99 显示 99+ */
export function ClusterBubble({ count, size = 34 }: { count: number; size?: number }) {
  return (
    <span className="relative inline-flex flex-col items-center" aria-hidden>
      <span
        className="flex items-center justify-center rounded-full bg-white/90 font-semibold text-ink shadow-glass backdrop-blur-glass"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {count > 99 ? '99+' : count}
      </span>
      <i
        className="bg-white/90"
        style={{
          width: 6,
          height: 6,
          marginTop: -3,
          clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
        }}
      />
    </span>
  )
}

/** 管段图标，用于侧栏/管段胶囊 */
export function PipelineGlyph({ size = 16, className }: { size?: number; className?: string }) {
  return <Waves size={size} strokeWidth={1.7} className={className} />
}
