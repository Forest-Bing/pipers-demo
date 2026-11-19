import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface MobileShellProps {
  /** 顶栏中部标题 */
  title?: ReactNode
  left?: ReactNode
  right?: ReactNode
  children: ReactNode
  /** 内容区是否自行滚动（地图类页面传 false） */
  scroll?: boolean
  className?: string
  contentClassName?: string
}

/** 手机页外壳：44px 顶栏 + 内容区 + iOS 安全区 */
export function MobileShell({
  title,
  left,
  right,
  children,
  scroll = true,
  className,
  contentClassName,
}: MobileShellProps) {
  return (
    <div className={cn('flex h-[100dvh] w-full flex-col bg-canvas', className)}>
      {title || left || right ? (
        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-hairline glass-bar px-3 pt-[env(safe-area-inset-top)]">
          <div className="flex min-w-[64px] items-center">{left}</div>
          <div className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold text-ink">
            {title}
          </div>
          <div className="flex min-w-[64px] items-center justify-end">{right}</div>
        </header>
      ) : null}

      <div
        className={cn(
          'relative min-h-0 flex-1',
          scroll ? 'overflow-y-auto' : 'overflow-hidden',
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}

/** 顶栏左右槽常用的文字按钮 */
export function NavText({
  children,
  onClick,
  tone = 'info',
}: {
  children: ReactNode
  onClick?: () => void
  tone?: 'info' | 'ink'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-[14px] transition-colors duration-240',
        tone === 'info' ? 'text-info' : 'text-ink',
      )}
    >
      {children}
    </button>
  )
}
