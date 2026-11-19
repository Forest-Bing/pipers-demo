import { cn } from '@/lib/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  /** 选中态配色：只有这两类标记色，不提供第三种 */
  tone?: 'alert' | 'info'
}

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
  className?: string
}

/** 分段控件。选中态为实色填充白字，未选中为透明 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 rounded-[12px] bg-canvas p-1',
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value
        const tone = o.tone ?? 'info'
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-9 flex-1 rounded-[9px] text-[13px] font-medium',
              'transition-all duration-240 ease-glass',
              active
                ? tone === 'alert'
                  ? 'bg-alert text-white shadow-pin'
                  : 'bg-info text-white shadow-pin'
                : 'text-ink-2 hover:text-ink',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
