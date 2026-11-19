import { cn } from '@/lib/cn'

interface SwitchProps {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[26px] w-11 shrink-0 rounded-full transition-colors duration-240 ease-glass',
        checked ? 'bg-info' : 'bg-ink/15',
        disabled && 'cursor-not-allowed opacity-45',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 size-[22px] rounded-full bg-white shadow-pin transition-transform duration-240 ease-glass',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
