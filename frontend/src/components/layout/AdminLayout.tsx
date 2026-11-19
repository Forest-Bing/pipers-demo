import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import {
  Bell,
  LayoutDashboard,
  MapPin,
  ScrollText,
  Search,
  Users,
  Waypoints,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/lib/auth'

const NAV = [
  { to: '/admin/overview', label: '概览', Icon: LayoutDashboard },
  { to: '/admin/users', label: '用户管理', Icon: Users },
  { to: '/admin/marks', label: '标记管理', Icon: MapPin },
  { to: '/admin/keypoints', label: '关键点台账', Icon: Waypoints },
  { to: '/admin/audit', label: '审计日志', Icon: ScrollText },
]

interface AdminLayoutProps {
  /** 面包屑，如 ['系统管理', '用户管理'] */
  breadcrumb: string[]
  children: ReactNode
  /** 内容区是否内边距 + 滚动，默认 true */
  padded?: boolean
}

export function AdminLayout({ breadcrumb, children, padded = true }: AdminLayoutProps) {
  const { user } = useAuth()

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-canvas">
      {/* 左导航：240px 实色，不用玻璃 */}
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-card-line bg-admin-nav">
        <div className="flex h-14 items-center gap-2 px-5">
          <span className="flex size-7 items-center justify-center rounded-[8px] bg-info text-white">
            <Waypoints size={15} strokeWidth={2} />
          </span>
          <span className="text-[13px] font-semibold text-ink">管道巡检管理后台</span>
        </div>

        <nav className="mt-2 flex flex-col gap-0.5 px-3">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'relative flex h-10 items-center gap-2.5 rounded-[8px] px-3 text-[13px] transition-colors duration-240',
                  isActive
                    ? 'bg-info/10 font-medium text-info'
                    : 'text-ink-2 hover:bg-ink/5 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <i className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-info" />
                  ) : null}
                  <Icon size={16} strokeWidth={1.7} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2 border-t border-card-line px-4 py-3">
          <Avatar name={user?.name ?? '李国强'} size={28} tone="ink" />
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-ink">
              {user?.name ?? '李国强'} · 管理员
            </p>
            <p className="truncate text-[10px] text-ink-2">系统管理</p>
          </div>
        </div>
      </aside>

      {/* 右侧 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-card-line glass-bar px-6">
          <nav className="flex items-center gap-1.5 text-[12px]">
            {breadcrumb.map((crumb, i) => (
              <span key={crumb} className="flex items-center gap-1.5">
                {i > 0 ? <span className="text-ink-2/50">/</span> : null}
                <span className={i === breadcrumb.length - 1 ? 'text-ink' : 'text-ink-2'}>
                  {crumb}
                </span>
              </span>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="flex h-8 w-52 items-center gap-2 rounded-control bg-canvas px-3">
              <Search size={14} strokeWidth={1.9} className="text-ink-2" />
              <span className="text-[12px] text-ink-2">搜索</span>
            </div>
            <button
              type="button"
              aria-label="通知"
              className="relative flex size-8 items-center justify-center rounded-full text-ink-2 transition-colors duration-240 hover:bg-ink/5 hover:text-ink"
            >
              <Bell size={17} strokeWidth={1.7} />
              <i className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-alert" />
            </button>
            <Avatar name={user?.name ?? '李国强'} size={28} tone="ink" />
          </div>
        </header>

        <main className={cn('min-h-0 flex-1 overflow-y-auto', padded && 'px-6 py-5')}>
          {children}
        </main>
      </div>
    </div>
  )
}
