import { Search, Settings, Waypoints } from 'lucide-react'
import { marks } from '@/lib/mock-marks'
import { cn } from '@/lib/cn'

const filters = [
  { key: 'all', label: '全部', count: 7, active: true },
  { key: 'alert', label: '警告', count: 3, dot: 'bg-alert' },
  { key: 'info', label: '信息', count: 4, dot: 'bg-info' },
]

export default function Sidebar() {
  return (
    <aside className="relative flex h-full w-[380px] shrink-0 flex-col rounded-r-[24px] bg-white/75 shadow-glass backdrop-blur-glass backdrop-saturate-glass">
      <header className="flex items-center gap-2.5 px-5 pt-5">
        <span className="flex size-8 items-center justify-center rounded-[10px] bg-info text-white">
          <Waypoints size={17} strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-[13px] font-semibold text-ink">
            国家管网 · 管道工标记
          </h1>
          <p className="truncate text-[10px] text-ink-2">巡检标记与告警同步</p>
        </div>
      </header>

      <div className="mx-5 mt-4 flex h-9 items-center gap-2 rounded-[10px] bg-canvas px-3">
        <Search size={14} strokeWidth={2} className="text-ink-2" />
        <span className="text-[12px] text-ink-2">搜索关键点编号 / 名称</span>
      </div>

      <div className="mt-3 flex items-center gap-2 px-5">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px]',
              f.active
                ? 'bg-ink text-white'
                : 'border border-hairline bg-white text-ink',
            )}
          >
            {f.dot ? <i className={cn('size-1.5 rounded-full', f.dot)} /> : null}
            {f.label} {f.count}
          </button>
        ))}
      </div>

      <div className="mb-1 mt-4 flex items-baseline px-5">
        <span className="text-[12px] text-ink-2">附近标记</span>
        <span className="ml-auto text-[11px] text-ink-2">共 7 条 · 按距离</span>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto px-5">
        {marks.map((mark) => (
          <li
            key={mark.id}
            className="flex gap-3 border-b border-hairline py-3 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <i
                  className={cn(
                    'size-1.5 shrink-0 rounded-full',
                    mark.kind === 'alert' ? 'bg-alert' : 'bg-info',
                  )}
                />
                <span className="truncate text-[11px] text-ink-2">
                  {mark.title}
                </span>
                <span className="ml-auto shrink-0 text-[11px] text-ink-2">
                  {mark.time}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink">
                {mark.description}
              </p>
              <p className="mt-1 text-[11px] text-ink-2">{mark.distance}</p>
            </div>
            {/* 设计稿此处为现场照片缩略图；资源未随 D2C 导出，暂用渐变占位 */}
            <span className="mt-0.5 size-11 shrink-0 rounded-[8px] bg-gradient-to-br from-map-green to-map-water" />
          </li>
        ))}
      </ul>

      <footer className="flex items-center gap-2 border-t border-hairline px-5 py-3">
        <span className="flex size-7 items-center justify-center rounded-full bg-info/10 text-[11px] font-medium text-info">
          张
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12px] text-ink">张建国 · 巡线工</p>
          <p className="flex items-center gap-1 text-[10px] text-ink-2">
            <i className="size-1 rounded-full bg-success" />
            已同步
          </p>
        </div>
        <button
          type="button"
          aria-label="设置"
          className="ml-auto text-ink-2 hover:text-ink transition-colors duration-240"
        >
          <Settings size={16} strokeWidth={1.8} />
        </button>
      </footer>
    </aside>
  )
}
