import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/cn'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  className?: string
  /** compact 用于弹层内，占据更少高度 */
  size?: 'default' | 'compact'
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
  size = 'default',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        size === 'compact' ? 'px-6 py-10' : 'px-6 py-16',
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-ink/5 text-ink-2">
        <Icon size={22} strokeWidth={1.5} />
      </span>
      <p className="mt-3 text-[14px] font-medium text-ink">{title}</p>
      {description ? (
        <p className="mt-1 max-w-[280px] text-[12px] leading-relaxed text-ink-2">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
