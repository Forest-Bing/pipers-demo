import { ZoomIn } from 'lucide-react'

interface ZoomHintProps {
  onLocate?: () => void
}

/**
 * 画板 3「地图 · 缩放过度提示」。
 * 由 `/ ?zoom=province` 触发，不改变默认地图页布局。
 */
export default function ZoomHint({ onLocate }: ZoomHintProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-8">
      <div className="glass pointer-events-auto w-full max-w-[300px] px-5 py-5 text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-info/10 text-info">
          <ZoomIn size={20} strokeWidth={1.9} />
        </span>
        <p className="mt-3 text-[15px] font-semibold text-ink">请放大地图查看标记</p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-ink-2">
          当前范围过大，最多显示 200 条数据
        </p>
        <button
          type="button"
          onClick={onLocate}
          className="mt-3 text-[13px] font-medium text-info transition-opacity duration-240 hover:opacity-75"
        >
          定位到我的位置
        </button>
      </div>
    </div>
  )
}
