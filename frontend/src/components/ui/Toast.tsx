import { Check, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useStore } from '@/lib/store'

/** 全局 toast 出口。挂在 App 根部，读取 store 里的队列 */
export function ToastHost() {
  const { toasts, dismissToast } = useStore()
  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(16px,env(safe-area-inset-top))] z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismissToast(t.id)}
          className={cn(
            'pointer-events-auto flex max-w-[420px] items-center gap-2 rounded-[14px] px-4 py-2.5',
            'text-[13px] shadow-glass transition-all duration-240 ease-glass',
            t.tone === 'danger'
              ? 'bg-alert text-white'
              : t.tone === 'success'
                ? 'bg-ink text-white'
                : 'glass-strong text-ink',
          )}
        >
          {t.tone === 'success' ? <Check size={14} strokeWidth={2.4} /> : null}
          {t.tone === 'danger' ? <TriangleAlert size={14} strokeWidth={2.2} /> : null}
          {t.message}
        </button>
      ))}
    </div>
  )
}
