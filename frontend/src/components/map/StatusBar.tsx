import { ListFilter } from 'lucide-react'

/**
 * 类型筛选条。
 *
 * 与设计稿的偏差：设计稿里「仅看警告」出现了两次（一个灰色文字 + 一个蓝色选中胶囊），
 * 实际是同一个筛选器的两种状态被同时画了出来。这里按一个可切换按钮实现，
 * 静态渲染展示「已选中」态。详见 docs/ui-notes.md。
 */
export default function StatusBar() {
  return (
    <div className="glass absolute inset-x-4 top-[72px] flex h-10 items-center gap-3 rounded-[14px] px-3">
      <span className="flex items-center gap-1.5 text-[13px] text-ink">
        <i className="size-1.5 rounded-full bg-alert" />3 条警告
      </span>
      <span className="flex items-center gap-1.5 text-[13px] text-ink">
        <i className="size-1.5 rounded-full bg-info" />4 条信息
      </span>

      <button
        type="button"
        aria-pressed="true"
        className="ml-auto flex items-center gap-1.5 rounded-full bg-info px-3 py-1 text-[12px] font-medium text-white"
      >
        <ListFilter size={12} strokeWidth={2.2} />
        仅看警告
      </button>
    </div>
  )
}
