import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { MarkKind } from '@/lib/mock/types'

interface BadgeProps {
  /** 只有两类标记，外加后台用的中性标签 */
  tone: MarkKind | 'neutral'
  children: ReactNode
  className?: string
}

const TONES: Record<MarkKind | 'neutral', string> = {
  alert: 'bg-alert text-white',
  info: 'bg-info text-white',
  neutral: 'bg-ink/6 text-ink-2',
}

export function Badge({ tone, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded-[6px] px-1.5 text-[11px] font-medium leading-none',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** 状态点 + 文字：启用绿 / 停用灰 */
export function StatusDot({
  status,
  className,
}: {
  status: 'active' | 'disabled'
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[13px]', className)}>
      <i
        className={cn(
          'size-1.5 rounded-full',
          status === 'active' ? 'bg-success' : 'bg-ink-2/55',
        )}
      />
      <span className={status === 'active' ? 'text-ink' : 'text-ink-2'}>
        {status === 'active' ? '启用' : '停用'}
      </span>
    </span>
  )
}
