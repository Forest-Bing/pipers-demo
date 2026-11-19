import { cn } from '@/lib/cn'

interface AvatarProps {
  name: string
  size?: number
  tone?: 'info' | 'ink'
  className?: string
}

/** 圆形头像，显示姓氏首字 */
export function Avatar({ name, size = 32, tone = 'info', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-medium',
        tone === 'info' ? 'bg-info/10 text-info' : 'bg-ink/8 text-ink',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden
    >
      {name.slice(0, 1)}
    </span>
  )
}
