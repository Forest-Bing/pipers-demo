import { useEffect, useMemo, useState } from 'react'
import { Download, Lock, Plus } from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import {
  Avatar,
  Button,
  Modal,
  Pagination,
  SearchField,
  Select,
  StatCard,
  StatusDot,
  TextButton,
} from '@/components/ui'
import UserFormModal from '@/components/admin/UserFormModal'
import { useStore } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import { POSITIONS, type Position, type User, type UserStatus } from '@/lib/mock/types'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'

const COLUMNS = ['姓名', '职位', '手机号', '角色', '状态', '创建时间', '操作']

/** 画板 10「管理后台 · 用户管理」 */
export default function UsersPage() {
  const { users, updateUser, toast } = useStore()
  const { user: me } = useAuth()

  const [keyword, setKeyword] = useState('')
  const [position, setPosition] = useState<'all' | Position>('all')
  const [status, setStatus] = useState<'all' | UserStatus>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<User | undefined>(undefined)
  const [resetTarget, setResetTarget] = useState<User | null>(null)
  const [statusTarget, setStatusTarget] = useState<User | null>(null)

  useEffect(() => {
    setPage(1)
  }, [keyword, position, status, from, to, pageSize])

  const stats = useMemo(
    () => ({
      active: users.filter((u) => u.status === 'active').length,
      disabled: users.filter((u) => u.status === 'disabled').length,
      thisMonth: users.filter((u) => u.createdAt.startsWith('2026-11')).length,
    }),
    [users],
  )

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return users.filter((u) => {
      if (kw && !u.name.toLowerCase().includes(kw) && !u.phone.includes(kw)) return false
      if (position !== 'all' && u.position !== position) return false
      if (status !== 'all' && u.status !== status) return false
      const day = u.createdAt.slice(0, 10)
      if (from && day < from) return false
      if (to && day > to) return false
      return true
    })
  }, [users, keyword, position, status, from, to])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const openCreate = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  const openEdit = (user: User) => {
    setEditing(user)
    setFormOpen(true)
  }

  const confirmStatus = () => {
    if (!statusTarget) return
    const next: UserStatus = statusTarget.status === 'active' ? 'disabled' : 'active'
    // TODO: PATCH /api/admin/users/:id { status }
    updateUser(statusTarget.id, { status: next })
    toast(next === 'disabled' ? '账号已停用' : '账号已启用')
    setStatusTarget(null)
  }

  return (
    <AdminLayout breadcrumb={['系统管理', '用户管理']}>
      {/* 标题行 */}
      <div className="flex items-center gap-3">
        <h1 className="text-[20px] font-semibold text-ink">用户管理</h1>
        <Button size="sm" icon={<Plus size={14} strokeWidth={2.2} />} onClick={openCreate} className="ml-auto">
          新增用户
        </Button>
      </div>

      {/* 统计行 */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatCard label="在册用户" value={stats.active} suffix="人" />
        <StatCard label="已停用" value={stats.disabled} suffix="人" />
        <StatCard label="本月新增" value={stats.thisMonth} suffix="人" />
      </div>

      {/* 筛选行 */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <div className="w-[220px]">
          <SearchField
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="姓名 / 手机号"
            aria-label="搜索用户"
          />
        </div>
        <div className="w-[140px]">
          <Select
            value={position}
            onChange={(e) => setPosition(e.target.value as 'all' | Position)}
            className="h-9 text-[12px]"
            options={[
              { value: 'all', label: '全部职位' },
              ...POSITIONS.map((p) => ({ value: p, label: p })),
            ]}
          />
        </div>
        <div className="w-[120px]">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'all' | UserStatus)}
            className="h-9 text-[12px]"
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'active', label: '启用' },
              { value: 'disabled', label: '停用' },
            ]}
          />
        </div>
        <div className="flex h-9 items-center gap-1.5 rounded-control border border-card-line bg-white px-2.5">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="创建时间起始"
            className="w-[112px] bg-transparent text-[12px] text-ink focus:outline-none"
          />
          <span className="text-[12px] text-ink-2">至</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="创建时间结束"
            className="w-[112px] bg-transparent text-[12px] text-ink focus:outline-none"
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<Download size={13} strokeWidth={1.9} />}
          onClick={() => toast('导出功能建设中')}
          className="ml-auto"
        >
          导出
        </Button>
      </div>

      {/* 表格 */}
      <div className="card mt-3 overflow-hidden">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-card-line bg-canvas/70 text-[12px] text-ink-2">
              {COLUMNS.map((c) => (
                <th key={c} className="px-4 py-2.5 text-left font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((u, i) => {
              const isSelf = u.id === me?.id
              return (
                <tr
                  key={u.id}
                  className={cn(
                    'border-b border-card-line/70 transition-colors duration-240 last:border-0',
                    i % 2 === 1 && 'bg-canvas',
                    'hover:bg-info/[0.05]',
                  )}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Avatar name={u.name} size={26} tone={u.role === 'admin' ? 'info' : 'ink'} />
                      <span className="text-ink">{u.name}</span>
                      {isSelf ? (
                        <span className="rounded-[4px] bg-info/10 px-1 text-[10px] leading-4 text-info">
                          我
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-ink-2">{u.position}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-ink-2">{u.phone}</td>
                  <td className="px-4 py-2.5 text-ink-2">
                    {u.role === 'admin' ? '管理员' : '普通用户'}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusDot status={u.status} />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px] tabular-nums text-ink-2">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <TextButton onClick={() => openEdit(u)}>编辑</TextButton>
                      <TextButton onClick={() => setResetTarget(u)}>重置密码</TextButton>
                      {isSelf ? (
                        <span
                          title="不能停用自己"
                          className="inline-flex items-center gap-1 text-[13px] text-ink-2/45"
                        >
                          <Lock size={11} strokeWidth={2} />
                          停用
                        </span>
                      ) : (
                        <TextButton
                          tone={u.status === 'active' ? 'danger' : 'muted'}
                          onClick={() => setStatusTarget(u)}
                        >
                          {u.status === 'active' ? '停用' : '启用'}
                        </TextButton>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-[13px] text-ink-2">
                  没有符合条件的用户
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <div className="border-t border-card-line px-4 py-2.5">
          <Pagination
            total={filtered.length}
            page={safePage}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      <UserFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
        selfId={me?.id}
      />

      {/* 重置密码确认 */}
      <Modal open={Boolean(resetTarget)} onClose={() => setResetTarget(null)} width={360}>
        <div className="p-5">
          <h2 className="text-[16px] font-semibold text-ink">重置 {resetTarget?.name} 的密码？</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
            将生成新密码并线下告知本人，原密码立即失效。
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setResetTarget(null)}>
              取消
            </Button>
            <Button
              size="sm"
              onClick={() => {
                // TODO: POST /api/admin/users/:id/reset-password
                toast('密码已重置', 'success')
                setResetTarget(null)
              }}
            >
              重置密码
            </Button>
          </div>
        </div>
      </Modal>

      {/* 停用 / 启用确认 */}
      <Modal open={Boolean(statusTarget)} onClose={() => setStatusTarget(null)} width={360}>
        <div className="p-5">
          <h2 className="text-[16px] font-semibold text-ink">
            {statusTarget?.status === 'active' ? '停用' : '启用'} {statusTarget?.name} 的账号？
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
            {statusTarget?.status === 'active'
              ? '停用后该账号无法登录，历史标记与记录保留。'
              : '启用后该账号可重新登录。'}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setStatusTarget(null)}>
              取消
            </Button>
            <Button
              variant={statusTarget?.status === 'active' ? 'danger' : 'primary'}
              size="sm"
              onClick={confirmStatus}
            >
              确认
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
