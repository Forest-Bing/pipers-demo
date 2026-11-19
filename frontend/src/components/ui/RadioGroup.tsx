import { useId } from 'react'
import { cn } from '@/lib/cn'

interface RadioGroupProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  /** 是否禁用（编辑自己时角色不可改） */
  disabled?: boolean
  name?: string
  className?: string
}

/** 单选组：白底描边胶囊 + 内圈圆点，用于角色这类二选一 */
export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
  disabled = false,
  name,
  className,
}: RadioGroupProps<T>) {
  const autoName = useId()
  const groupName = name ?? autoName

  return (
    <div className={cn('flex gap-2', className)} role="radiogroup">
      {options.map((o) => {
        const active = o.value === value
        return (
          <label
            key={o.value}
            className={cn(
              'flex h-10 flex-1 cursor-pointer items-center gap-2 rounded-control border px-3 text-[13px] transition-colors duration-240',
              active ? 'border-info bg-info/5 text-ink' : 'border-card-line bg-white text-ink-2',
              disabled ? 'cursor-not-allowed opacity-55' : 'hover:border-info/40',
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={o.value}
              checked={active}
              disabled={disabled}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            <i
              className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded-full border',
                active ? 'border-info' : 'border-ink-2/45',
              )}
            >
              {active ? <i className="size-2 rounded-full bg-info" /> : null}
            </i>
            {o.label}
          </label>
        )
      })}
    </div>
  )
}
