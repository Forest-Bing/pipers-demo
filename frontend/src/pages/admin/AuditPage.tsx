import { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw, ScrollText } from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import {
  Badge,
  Button,
  EmptyState,
  Pagination,
  SearchField,
  Select,
  StatCard,
} from '@/components/ui'
import { auditApi } from '@/lib/api'
import {
  AUDIT_ACTION_LABEL,
  AUDIT_ACTION_TONE,
  AUDIT_TARGET_LABEL,
} from '@/lib/audit'
import type { AuditLog } from '@/lib/mock/types'
import { formatDate, formatDateTime } from '@/lib/format'

const COLUMNS = ['时间', '操作人', '动作', '对象', '详情']

type ActionFilter = 'all' | AuditLog['action']

/** 画板 13「管理后台 · 审计日志」：只读流水，按动作 / 人 / 时间筛 */
export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  const [keyword, setKeyword] = useState('')
  const [action, setAction] = useState<ActionFilter>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const load = async () => {
    setLoading(true)
    try {
      // 演示数据量小，一次取全，筛选留在内存里做（真实接口应把条件带到 query 上）
      const all = await auditApi.list({ page: 1, pageSize: 1000 })
      setLogs(all.rows)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [keyword, action, from, to, pageSize])

  const stats = useMemo(() => {
    const today = formatDate(new Date())
    return {
      today: logs.filter((l) => formatDate(l.createdAt) === today).length,
      actors: new Set(logs.map((l) => l.actorId)).size,
      destructive: logs.filter((l) => l.action === 'delete' || l.action === 'disable').length,
    }
  }, [logs])

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return logs.filter((log) => {
      if (action !== 'all' && log.action !== action) return false
      const day = formatDate(log.createdAt)
      if (from && day < from) return false
      if (to && day > to) return false
      if (
        kw &&
        !log.actorName.toLowerCase().includes(kw) &&
        !log.detail.toLowerCase().includes(kw) &&
        !log.targetId.toLowerCase().includes(kw)
      ) {
        return false
      }
      return true
    })
  }, [logs, keyword, action, from, to])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <AdminLayout breadcrumb={['系统管理', '审计日志']}>
      <div className="flex items-center gap-3">
        <h1 className="text-[20px] font-semibold text-ink">审计日志</h1>
        <span className="rounded-md bg-ink/[0.06] px-2 py-0.5 text-[12px] text-ink-2">
          共 {logs.length} 条
        </span>
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={13} strokeWidth={1.9} />}
          onClick={() => void load()}
          className="ml-auto"
        >
          刷新
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<Download size={13} strokeWidth={1.9} />}
          onClick={() => {}}
          disabled
        >
          导出
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatCard label="今日操作" value={stats.today} suffix="条" hint="含登录记录" />
        <StatCard label="涉及账号" value={stats.actors} suffix="个" hint="按操作人去重" />
        <StatCard
          label="删除 / 停用"
          value={stats.destructive}
          suffix="条"
          tone="alert"
          hint="需重点复核的操作"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <div className="w-[240px]">
          <SearchField
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="操作人 / 详情 / 对象编号"
            aria-label="搜索审计日志"
          />
        </div>
        <div className="w-[150px]">
          <Select
            value={action}
            onChange={(e) => setAction(e.target.value as ActionFilter)}
            className="h-9 text-[12px]"
            options={[
              { value: 'all', label: '全部动作' },
              ...(Object.keys(AUDIT_ACTION_LABEL) as AuditLog['action'][]).map((a) => ({
                value: a,
                label: AUDIT_ACTION_LABEL[a],
              })),
            ]}
          />
        </div>
        <div className="flex h-9 items-center gap-1.5 rounded-control border border-card-line bg-white px-2.5">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="起始日期"
            className="w-[112px] bg-transparent text-[12px] text-ink focus:outline-none"
          />
          <span className="text-[12px] text-ink-2">至</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="结束日期"
            className="w-[112px] bg-transparent text-[12px] text-ink focus:outline-none"
          />
        </div>
        <p className="text-[12px] text-ink-2">日志只读，不提供编辑与删除</p>
      </div>

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
            {rows.map((log, i) => (
              <tr
                key={log.id}
                className={[
                  'border-b border-card-line/70 transition-colors duration-240 last:border-0',
                  i % 2 === 1 ? 'bg-canvas' : '',
                  'hover:bg-info/[0.05]',
                ].join(' ')}
              >
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[12px] tabular-nums text-ink-2">
                  {formatDateTime(log.createdAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-ink">{log.actorName}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={AUDIT_ACTION_TONE[log.action]}>
                    {AUDIT_ACTION_LABEL[log.action]}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-ink-2">
                  {AUDIT_TARGET_LABEL[log.targetType]}
                  <span className="ml-1.5 font-mono text-[11px] text-ink-2/70">
                    {log.targetId}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-ink">{log.detail}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-16">
                  <EmptyState
                    icon={ScrollText}
                    title={loading ? '正在读取日志…' : '没有符合条件的日志'}
                    description={loading ? undefined : '放宽动作或时间范围再试。'}
                    size="compact"
                  />
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
            pageSizeOptions={[20, 50, 100]}
          />
        </div>
      </div>
    </AdminLayout>
  )
}
