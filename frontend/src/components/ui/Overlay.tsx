import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

/** open 后延迟一帧再显示，保证 CSS transition 有初始态 */
function useDelayedVisible(open: boolean, delay = 16) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!open) {
      setVisible(false)
      return
    }
    const id = window.setTimeout(() => setVisible(true), delay)
    return () => window.clearTimeout(id)
  }, [open, delay])
  return visible
}

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
}

interface BaseOverlayProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** 点击遮罩是否关闭，默认 true */
  dismissOnScrim?: boolean
  className?: string
}

/** Sheet 额外选项：地图落点面板不压暗地图，直接浮在底图上 */
interface SheetProps extends BaseOverlayProps {
  /** 是否铺 scrim 遮罩，默认 true。地图页的落点面板传 false */
  scrim?: boolean
}

function Portal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}

/** 底部上滑玻璃面板（画板 4 的落点选择用） */
export function Sheet({
  open,
  onClose,
  children,
  dismissOnScrim = true,
  scrim = true,
  className,
}: SheetProps) {
  const visible = useDelayedVisible(open)
  useEscape(open, onClose)
  if (!open) return null

  return (
    <Portal>
      <div className={cn('fixed inset-0 z-40', !scrim && 'pointer-events-none')}>
        {scrim ? (
          <div
            className={cn(
              'absolute inset-0 bg-scrim transition-opacity duration-320 ease-glass',
              visible ? 'opacity-100' : 'opacity-0',
            )}
            onClick={dismissOnScrim ? onClose : undefined}
          />
        ) : null}
        <section
          role="dialog"
          aria-modal="true"
          className={cn(
            'glass-sheet pointer-events-auto absolute inset-x-0 bottom-0 px-4 pb-[calc(12px_+_env(safe-area-inset-bottom))] pt-2',
            'transition-transform duration-320 ease-glass',
            visible ? 'translate-y-0' : 'translate-y-full',
            className,
          )}
        >
          <div className="mx-auto h-1 w-9 rounded-full bg-ink/20" />
          {children}
        </section>
      </div>
    </Portal>
  )
}

/** 右侧滑出抽屉，480px 白色实底（画板 11 用） */
export function Drawer({
  open,
  onClose,
  children,
  className,
  width = 480,
}: BaseOverlayProps & { width?: number }) {
  const visible = useDelayedVisible(open)
  useEscape(open, onClose)
  if (!open) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-40">
        <div
          className={cn(
            'absolute inset-0 bg-scrim transition-opacity duration-320 ease-glass',
            visible ? 'opacity-100' : 'opacity-0',
          )}
          onClick={onClose}
        />
        <aside
          role="dialog"
          aria-modal="true"
          style={{ width }}
          className={cn(
            'absolute inset-y-0 right-0 flex flex-col bg-white',
            'border-l border-card-line shadow-[-16px_0_48px_rgba(0,0,0,0.12)]',
            'transition-transform duration-320 ease-glass',
            visible ? 'translate-x-0' : 'translate-x-full',
            className,
          )}
        >
          {children}
        </aside>
      </div>
    </Portal>
  )
}

/** 居中白卡弹窗，默认 520px（画板 12 用） */
export function Modal({
  open,
  onClose,
  children,
  dismissOnScrim = true,
  className,
  width = 520,
}: BaseOverlayProps & { width?: number }) {
  const visible = useDelayedVisible(open)
  useEscape(open, onClose)
  if (!open) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            'absolute inset-0 bg-scrim transition-opacity duration-240 ease-glass',
            visible ? 'opacity-100' : 'opacity-0',
          )}
          onClick={dismissOnScrim ? onClose : undefined}
        />
        <div
          role="dialog"
          aria-modal="true"
          style={{ width }}
          className={cn(
            'relative max-h-[calc(100dvh_-_48px)] overflow-y-auto rounded-card-lg bg-white shadow-glass',
            'transition-all duration-240 ease-glass',
            visible ? 'scale-100 opacity-100' : 'scale-[0.97] opacity-0',
            className,
          )}
        >
          {children}
        </div>
      </div>
    </Portal>
  )
}

/** 弹层统一头部：标题 + 关闭按钮 */
export function OverlayHeader({
  title,
  subtitle,
  onClose,
  className,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  className?: string
}) {
  return (
    <header className={cn('flex items-start gap-3 px-6 pt-5', className)}>
      <div className="min-w-0">
        <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="mt-1 text-[12px] text-ink-2">{subtitle}</p> : null}
      </div>
      <button
        type="button"
        aria-label="关闭"
        onClick={onClose}
        className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-full text-ink-2 transition-colors duration-240 hover:bg-ink/5 hover:text-ink"
      >
        <X size={17} strokeWidth={1.8} />
      </button>
    </header>
  )
}
