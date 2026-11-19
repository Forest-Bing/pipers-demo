import { cn } from '@/lib/cn'

interface StatCardProps {
  label: string
  value: number | string
  /** 数字后缀，如「人」 */
  suffix?: string
  hint?: string
  tone?: 'default' | 'ink' | 'success' | 'alert'
  className?: string
}

const VALUE_TONE = {
  default: 'text-ink',
  ink: 'text-ink',
  success: 'text-success',
  alert: 'text-alert',
} as const

export function StatCard({
  label,
  value,
  suffix,
  hint,
  tone = 'default',
  className,
}: StatCardProps) {
  return (
    <div className={cn('card px-4 py-3.5', className)}>
      <p className="text-[12px] text-ink-2">{label}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className={cn('text-[24px] font-semibold tabular-nums leading-none', VALUE_TONE[tone])}>
          {value}
        </span>
        {suffix ? <span className="text-[12px] text-ink-2">{suffix}</span> : null}
      </p>
      {hint ? <p className="mt-1.5 text-[11px] text-ink-2">{hint}</p> : null}
    </div>
  )
}
