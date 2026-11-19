import { ListFilter } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useKindFilter } from '@/lib/map-runtime'
import { cn } from '@/lib/cn'

/**
 * 类型筛选条。
 *
 * 与设计稿的偏差：设计稿里「仅看警告」出现了两次（一个灰色文字 + 一个蓝色选中胶囊），
 * 实际是同一个筛选器的两种状态被同时画了出来。这里按一个可切换按钮实现，
 * 点击在「全部」与「仅看警告」之间切换，地图图钉会同步过滤。详见 docs/ui-notes.md。
 */
export default function StatusBar() {
  const { marks } = useStore()
  const [filter, setFilter] = useKindFilter()

  const alertCount = marks.filter((m) => m.kind === 'alert').length
  const infoCount = marks.length - alertCount
  const onlyAlert = filter === 'alert'

  return (
    <div className="glass absolute inset-x-4 top-[72px] flex h-10 items-center gap-3 rounded-[14px] px-3">
      <span className="flex items-center gap-1.5 text-[13px] text-ink">
        <i className="size-1.5 rounded-full bg-alert" />
        {alertCount} 条警告
      </span>
      <span className="flex items-center gap-1.5 text-[13px] text-ink">
        <i className="size-1.5 rounded-full bg-info" />
        {infoCount} 条信息
      </span>

      <button
        type="button"
        aria-pressed={onlyAlert}
        onClick={() => setFilter(onlyAlert ? 'all' : 'alert')}
        className={cn(
          'ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-colors duration-240',
          onlyAlert ? 'bg-info text-white' : 'bg-ink/[0.06] text-ink-2',
        )}
      >
        <ListFilter size={12} strokeWidth={2.2} />
        {onlyAlert ? '仅看警告' : '全部类型'}
      </button>
    </div>
  )
}
