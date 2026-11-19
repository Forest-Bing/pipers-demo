import { Search, Settings } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useMemo } from 'react'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/lib/store'
import { useKindFilter } from '@/lib/map-runtime'
import type { KindFilter } from '@/lib/mock/types'
import { MAP_CENTER } from '@/lib/amap'
import { distanceMeters } from '@/lib/geo'
import { cn } from '@/lib/cn'

export default function Sidebar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { marks } = useStore()
  // 与地图图钉共用同一个筛选状态：点胶囊时侧栏列表和地图覆盖物一起变
  const [filter, setFilter] = useKindFilter()

  const alertCount = marks.filter((m) => m.kind === 'alert').length
  const infoCount = marks.length - alertCount

  /** 「附近标记」按直线距离从近到远，再按当前筛选收起不需要的类型 */
  const nearby = useMemo(() => {
    const sorted = [...marks].sort(
      (a, b) =>
        distanceMeters(MAP_CENTER, [a.lng, a.lat]) - distanceMeters(MAP_CENTER, [b.lng, b.lat]),
    )
    return filter === 'all' ? sorted : sorted.filter((m) => m.kind === filter)
  }, [marks, filter])

  const filters: { key: KindFilter; label: string; count: number; dot?: string }[] = [
    { key: 'all', label: '全部', count: marks.length },
    { key: 'alert', label: '警告', count: alertCount, dot: 'bg-alert' },
    { key: 'info', label: '信息', count: infoCount, dot: 'bg-info' },
  ]

  return (
    <aside className="relative flex h-full w-[380px] shrink-0 flex-col rounded-r-[24px] bg-white/75 shadow-glass backdrop-blur-glass backdrop-saturate-glass">
      <header className="flex items-center gap-2.5 px-5 pt-5">
        {/* 国家管网标识：直接用官方红色徽标，不再用蓝色方底 + 抽象图标 */}
        <img
          src="/shape_logo.svg"
          alt="国家管网"
          className="h-8 w-auto shrink-0 select-none"
          draggable={false}
        />
        <div className="min-w-0">
          <h1 className="truncate text-[13px] font-semibold text-ink">管道巡检自由标记系统</h1>
          <p className="truncate text-[10px] text-ink-2">国家管网 · 中俄东线山东段</p>
        </div>
      </header>

      <div className="mx-5 mt-4 flex h-9 items-center gap-2 rounded-[10px] bg-canvas px-3">
        <Search size={14} strokeWidth={2} className="text-ink-2" />
        <span className="text-[12px] text-ink-2">搜索关键点编号 / 名称</span>
      </div>

      <div className="mt-3 flex items-center gap-2 px-5">
        {filters.map((f) => {
          const active = filter === f.key
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] transition-colors duration-240',
                active
                  ? 'bg-ink text-white'
                  : 'border border-hairline bg-white text-ink hover:border-ink/25',
              )}
            >
              {f.dot ? <i className={cn('size-1.5 rounded-full', f.dot)} /> : null}
              {f.label} {f.count}
            </button>
          )
        })}
      </div>

      <div className="mb-1 mt-4 flex items-baseline px-5">
        <span className="text-[12px] text-ink-2">
          {filter === 'all' ? '附近标记' : filter === 'alert' ? '附近警告' : '附近信息'}
        </span>
        <span className="ml-auto text-[11px] text-ink-2">
          共 {nearby.length} 条 · 按距离
        </span>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto px-5">
        {nearby.length === 0 ? (
          <li className="py-10 text-center text-[12px] text-ink-2">
            当前筛选下没有标记
          </li>
        ) : null}
        {nearby.map((mark) => (
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
          {(user?.name ?? '张建国').slice(0, 1)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12px] text-ink">
            {user?.name ?? '张建国'} · {user?.position ?? '巡线工'}
          </p>
          <p className="flex items-center gap-1 text-[10px] text-ink-2">
            <i className="size-1 rounded-full bg-success" />
            已同步
          </p>
        </div>
        <button
          type="button"
          aria-label="设置"
          onClick={() => navigate('/me')}
          className="ml-auto text-ink-2 hover:text-ink transition-colors duration-240"
        >
          <Settings size={16} strokeWidth={1.8} />
        </button>
      </footer>
    </aside>
  )
}
