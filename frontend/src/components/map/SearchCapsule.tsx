import { Search } from 'lucide-react'

export default function SearchCapsule() {
  return (
    <button
      type="button"
      className="glass absolute inset-x-4 top-4 flex h-12 items-center gap-2 px-4 text-left"
    >
      <Search size={16} strokeWidth={2} className="shrink-0 text-ink-2" />
      <span className="truncate text-[13px] text-ink-2">
        搜索关键点编号 / 名称
      </span>
      <span className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-full bg-info/10 text-[13px] font-medium text-info">
        张
      </span>
    </button>
  )
}
