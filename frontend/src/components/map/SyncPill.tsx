import { RefreshCw } from 'lucide-react'

export default function SyncPill() {
  return (
    <button
      type="button"
      className="glass absolute bottom-[264px] left-4 flex h-9 items-center gap-1.5 rounded-[18px] px-3 text-[12px] text-ink"
    >
      <RefreshCw size={12} strokeWidth={2} className="animate-spin-slow text-ink-2" />
      待同步 2 条
    </button>
  )
}
