import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-outline'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-info text-white shadow-fab hover:brightness-[1.04] active:scale-[0.98] disabled:bg-info/50 disabled:shadow-none',
  secondary:
    'border border-hairline bg-white text-ink hover:bg-canvas active:scale-[0.98]',
  ghost: 'text-info hover:bg-info/10 active:bg-info/15',
  danger: 'bg-alert text-white hover:brightness-[1.04] active:scale-[0.98]',
  'danger-outline':
    'border border-alert text-alert bg-white hover:bg-alert/5 active:scale-[0.98]',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-[12px] rounded-control gap-1',
  md: 'h-11 px-4 text-[13px] rounded-control gap-1.5',
  lg: 'h-12 px-5 text-[15px] rounded-control gap-2',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  block?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center font-medium',
        'transition-all duration-240 ease-glass disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  /** glass = 44px 玻璃圆按钮；plain = 无底色 */
  tone?: 'glass' | 'plain' | 'filled'
  size?: number
}

export function IconButton({
  label,
  tone = 'plain',
  size = 18,
  className,
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center transition-colors duration-240 ease-glass',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/40',
        tone === 'glass' && 'glass-btn text-ink hover:bg-white/75',
        tone === 'plain' && 'size-9 rounded-full text-ink-2 hover:bg-ink/5 hover:text-ink',
        tone === 'filled' && 'size-9 rounded-full bg-info text-white hover:brightness-105',
        className,
      )}
      {...rest}
    >
      <span className="flex items-center justify-center">{children}</span>
    </button>
  )
}

/** 文字型操作按钮，用于表格行内「编辑」「重置密码」这类 */
export function TextButton({
  tone = 'info',
  className,
  children,
  type = 'button',
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'info' | 'ink' | 'danger' | 'muted' }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'text-[13px] transition-colors duration-240',
        tone === 'info' && 'text-info hover:text-info/75',
        tone === 'ink' && 'text-ink hover:text-ink/70',
        tone === 'danger' && 'text-alert/80 hover:text-alert',
        tone === 'muted' && 'text-ink-2 hover:text-ink',
        disabled && 'cursor-not-allowed text-ink-2/45 hover:text-ink-2/45',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
