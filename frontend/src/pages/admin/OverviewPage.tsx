import { useEffect, useMemo, useState } from 'react'
import { Activity, MapPin, Radio, Users } from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Badge, StatCard } from '@/components/ui'
import { useStore } from '@/lib/store'
import { auditApi, keypointsApi } from '@/lib/api'
import { AUDIT_ACTION_LABEL, AUDIT_ACTION_TONE } from '@/lib/audit'
import { KEYPOINT_TYPE_LABEL, type AuditLog, type Keypoint, type KeypointType } from '@/lib/mock/types'
import { activePipeline } from '@/lib/mock/pipelines'
import { formatDate, formatRelative, formatTime } from '@/lib/format'
import { cn } from '@/lib/cn'

/** 近 7 日趋势的横轴标签：'11-20' */
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const KEYPOINT_ORDER: KeypointType[] = ['stake', 'stake-test', 'valve']
const KEYPOINT_BAR: Record<KeypointType, string> = {
  stake: 'bg-stake',
  'stake-test': 'bg-stake-test',
  valve: 'bg-valve',
}
const KEYPOINT_DOT: Record<KeypointType, string> = {
  stake: 'bg-stake',
  'stake-test': 'bg-stake-test',
  valve: 'bg-valve',
}

/** 画板 9「管理后台 · 概览」：一屏看清「有多少标记 / 有多少告警 / 台账规模 / 最近谁在动」 */
export default function OverviewPage() {
  const { marks, users } = useStore()
  const [keypoints, setKeypoints] = useState<Keypoint[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])

  // 台账与审计不进 store（不参与地图渲染），进页面时各拉一次
  useEffect(() => {
    let alive = true
    void Promise.all([keypointsApi.list(), auditApi.list({ page: 1, pageSize: 6 })]).then(
      ([kps, audit]) => {
        if (!alive) return
        setKeypoints(kps)
        setLogs(audit.rows)
      },
    )
    return () => {
      alive = false
    }
  }, [])

  const stats = useMemo(() => {
    const alert = marks.filter((m) => m.kind === 'alert').length
    const info = marks.length - alert
    const pending = marks.filter((m) => m.pending).length
    const activeUsers = users.filter((u) => u.status === 'active').length
    const today = dayKey(new Date())
    const todayNew = marks.filter((m) => dayKey(new Date(m.createdAt)) === today).length
    return { alert, info, pending, activeUsers, todayNew }
  }, [marks, users])

  const trend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - (6 - i))
      const key = dayKey(d)
      const rows = marks.filter((m) => dayKey(new Date(m.createdAt)) === key)
      return {
        key,
        label: `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        alert: rows.filter((m) => m.kind === 'alert').length,
        info: rows.filter((m) => m.kind === 'info').length,
      }
    })
    const max = Math.max(1, ...days.map((d) => d.alert + d.info))
    return { days, max }
  }, [marks])

  const kpStats = useMemo(() => {
    const total = keypoints.length || 1
    return KEYPOINT_ORDER.map((type) => {
      const count = keypoints.filter((k) => k.type === type).length
      return { type, count, percent: Math.round((count / total) * 100) }
    })
  }, [keypoints])

  const alertPercent = marks.length === 0 ? 0 : Math.round((stats.alert / marks.length) * 100)
  const disabledUsers = users.filter((u) => u.status === 'disabled').length

  return (
    <AdminLayout breadcrumb={['系统管理', '概览']}>
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="text-[20px] font-semibold text-ink">概览</h1>
        <p className="pb-0.5 text-[12px] text-ink-2">
          {activePipeline.company} · {activePipeline.name}
        </p>
        <p className="ml-auto pb-0.5 text-[12px] tabular-nums text-ink-2">
          数据截至 {formatDate(new Date())} {formatTime(new Date())}
        </p>
      </div>

      {/* 第一行：四个核心数字 */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        <StatCard
          label="标记总数"
          value={marks.length}
          suffix="条"
          hint={stats.todayNew > 0 ? `今日新增 ${stats.todayNew} 条` : '今日暂无新增'}
        />
        <StatCard
          label="警告标记"
          value={stats.alert}
          suffix="条"
          tone="alert"
          hint={`占全部 ${alertPercent}%`}
        />
        <StatCard
          label="待同步"
          value={stats.pending}
          suffix="条"
          hint={stats.pending > 0 ? '弱网草稿待补传' : '全部已同步'}
        />
        <StatCard
          label="在册用户"
          value={stats.activeUsers}
          suffix="人"
          hint={`已停用 ${disabledUsers} 人`}
        />
      </div>

      {/* 第二行：趋势 + 构成 */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <section className="card col-span-2 px-5 py-4">
          <header className="flex items-center gap-2">
            <Activity size={15} strokeWidth={1.9} className="text-info" />
            <h2 className="text-[14px] font-semibold text-ink">近 7 日标记趋势</h2>
            <span className="text-[11px] tabular-nums text-ink-2">
              共 {trend.days.reduce((sum, d) => sum + d.alert + d.info, 0)} 条
            </span>
            <div className="ml-auto flex items-center gap-3 text-[11px] text-ink-2">
              <span className="flex items-center gap-1.5">
                <i className="size-2 rounded-[2px] bg-alert" />
                警告
              </span>
              <span className="flex items-center gap-1.5">
                <i className="size-2 rounded-[2px] bg-info" />
                普通信息
              </span>
            </div>
          </header>

          <div className="mt-4 flex h-[152px] items-end gap-2">
            {trend.days.map((day) => {
              const total = day.alert + day.info
              const height = total === 0 ? 2 : Math.max(8, (total / trend.max) * 100)
              const alertPart = total === 0 ? 0 : (day.alert / total) * height
              const infoPart = total === 0 ? 0 : (day.info / total) * height
              return (
                <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <div className="relative flex h-[112px] w-full items-end justify-center">
                    <div
                      className={cn(
                        'flex w-full max-w-[38px] flex-col overflow-hidden rounded-t-[4px]',
                        total === 0 && 'bg-ink/10',
                      )}
                      style={{ height }}
                      title={`${day.label}：警告 ${day.alert} 条，普通信息 ${day.info} 条`}
                    >
                      {day.info > 0 ? (
                        <span className="w-full bg-info" style={{ height: infoPart }} />
                      ) : null}
                      {day.alert > 0 ? (
                        <span className="w-full bg-alert" style={{ height: alertPart }} />
                      ) : null}
                    </div>
                  </div>
                  <span className="text-[10px] tabular-nums text-ink-2">{day.label}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="card px-5 py-4">
          <header className="flex items-center gap-2">
            <MapPin size={15} strokeWidth={1.9} className="text-alert" />
            <h2 className="text-[14px] font-semibold text-ink">标记构成</h2>
          </header>

          <div className="mt-4 flex items-center gap-5">
            <div
              className="relative size-[104px] shrink-0 rounded-full"
              style={{
                background:
                  marks.length === 0
                    ? '#EDEDF0'
                    : `conic-gradient(#FF3B30 0 ${alertPercent}%, #0A84FF ${alertPercent}% 100%)`,
              }}
              role="img"
              aria-label={`警告 ${stats.alert} 条，普通信息 ${stats.info} 条`}
            >
              <div className="absolute inset-[16px] flex flex-col items-center justify-center rounded-full bg-white">
                <span className="text-[20px] font-semibold tabular-nums leading-none text-ink">
                  {marks.length}
                </span>
                <span className="mt-0.5 text-[10px] text-ink-2">总标记</span>
              </div>
            </div>

            <ul className="min-w-0 flex-1 space-y-2.5">
              <li className="flex items-center gap-2 text-[12px]">
                <i className="size-2 rounded-[2px] bg-alert" />
                <span className="text-ink-2">警告</span>
                <span className="ml-auto font-medium tabular-nums text-ink">{stats.alert}</span>
              </li>
              <li className="flex items-center gap-2 text-[12px]">
                <i className="size-2 rounded-[2px] bg-info" />
                <span className="text-ink-2">普通信息</span>
                <span className="ml-auto font-medium tabular-nums text-ink">{stats.info}</span>
              </li>
              <li className="flex items-center gap-2 border-t border-card-line pt-2.5 text-[12px]">
                <i className="size-2 rounded-[2px] bg-ink-2/40" />
                <span className="text-ink-2">其中待同步</span>
                <span className="ml-auto font-medium tabular-nums text-ink">{stats.pending}</span>
              </li>
            </ul>
          </div>
        </section>
      </div>

      {/* 第三行：关键点构成 + 最近动态 */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <section className="card px-5 py-4">
          <header className="flex items-center gap-2">
            <Radio size={15} strokeWidth={1.9} className="text-stake-test" />
            <h2 className="text-[14px] font-semibold text-ink">关键点台账</h2>
            <span className="ml-auto text-[11px] tabular-nums text-ink-2">
              共 {keypoints.length} 个
            </span>
          </header>

          <ul className="mt-4 space-y-3.5">
            {kpStats.map((row) => (
              <li key={row.type}>
                <div className="flex items-center gap-2 text-[12px]">
                  <i className={cn('size-2 rounded-full', KEYPOINT_DOT[row.type])} />
                  <span className="text-ink">{KEYPOINT_TYPE_LABEL[row.type]}</span>
                  <span className="ml-auto tabular-nums text-ink-2">
                    {row.count}
                    <span className="ml-1 text-[10px]">个</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas">
                  <i
                    className={cn('block h-full rounded-full', KEYPOINT_BAR[row.type])}
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-4 border-t border-card-line pt-3 text-[11px] leading-relaxed text-ink-2">
            台账区间 K318—K323，覆盖 {activePipeline.name}
          </p>
        </section>

        <section className="card col-span-2 px-5 py-4">
          <header className="flex items-center gap-2">
            <Users size={15} strokeWidth={1.9} className="text-ink-2" />
            <h2 className="text-[14px] font-semibold text-ink">最近动态</h2>
            <span className="ml-auto text-[11px] text-ink-2">来自审计日志</span>
          </header>

          <ul className="mt-2 divide-y divide-card-line">
            {logs.length === 0 ? (
              <li className="py-8 text-center text-[12px] text-ink-2">暂无操作记录</li>
            ) : (
              logs.map((log) => (
                <li key={log.id} className="flex items-center gap-3 py-2.5">
                  <Badge tone={AUDIT_ACTION_TONE[log.action]}>{AUDIT_ACTION_LABEL[log.action]}</Badge>
                  <span className="shrink-0 text-[12px] font-medium text-ink">{log.actorName}</span>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">{log.detail}</span>
                  <span className="shrink-0 text-[11px] text-ink-2">{formatRelative(log.createdAt)}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </AdminLayout>
  )
}
