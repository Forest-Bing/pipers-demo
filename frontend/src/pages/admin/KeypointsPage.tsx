import { useEffect, useMemo, useState } from 'react'
import { Download, Waypoints, X } from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import {
  Badge,
  Button,
  Drawer,
  EmptyState,
  IconButton,
  KeypointIcon,
  Pagination,
  SearchField,
  Select,
  StatCard,
  TextButton,
} from '@/components/ui'
import { useStore } from '@/lib/store'
import { keypointsApi } from '@/lib/api'
import {
  KEYPOINT_TYPE_LABEL,
  type Keypoint,
  type KeypointType,
  type Mark,
} from '@/lib/mock/types'
import { formatDate, formatDistance, formatLngLat } from '@/lib/format'

const COLUMNS = ['编号', '类型', '名称', '坐标', '距当前位置', '关联标记']

/** 画板 12「管理后台 · 关键点台账」：只读台账，供管理员核对编号与落点 */
export default function KeypointsPage() {
  const { marks, toast } = useStore()
  const [keypoints, setKeypoints] = useState<Keypoint[]>([])
  const [loading, setLoading] = useState(true)

  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState<'all' | KeypointType>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void keypointsApi.list().then((rows) => {
      if (!alive) return
      setKeypoints(rows)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [])

  // 每条关键点挂了几条标记（标记在 store 里，改动后这里自动跟着变）
  const markCounts = useMemo(() => {
    const map = new Map<string, Mark[]>()
    for (const mark of marks) {
      if (!mark.keypointId) continue
      const list = map.get(mark.keypointId) ?? []
      list.push(mark)
      map.set(mark.keypointId, list)
    }
    return map
  }, [marks])

  const stats = useMemo(
    () => ({
      stake: keypoints.filter((k) => k.type === 'stake').length,
      test: keypoints.filter((k) => k.type === 'stake-test').length,
      valve: keypoints.filter((k) => k.type === 'valve').length,
    }),
    [keypoints],
  )

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return keypoints
      .filter((k) => (type === 'all' ? true : k.type === type))
      .filter(
        (k) =>
          !kw || k.code.toLowerCase().includes(kw) || k.name.toLowerCase().includes(kw),
      )
      // 台账按桩号排序，跟现场台账本一致（接口默认按距离，那是给地图用的）
      .sort((a, b) => a.code.localeCompare(b.code))
  }, [keypoints, keyword, type])

  useEffect(() => {
    setPage(1)
  }, [keyword, type, pageSize])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const active = keypoints.find((k) => k.id === activeId)
  const activeMarks = activeId ? (markCounts.get(activeId) ?? []) : []

  return (
    <AdminLayout breadcrumb={['系统管理', '关键点台账']}>
      <div className="flex items-center gap-3">
        <h1 className="text-[20px] font-semibold text-ink">关键点台账</h1>
        <span className="rounded-md bg-ink/[0.06] px-2 py-0.5 text-[12px] text-ink-2">
          共 {keypoints.length} 个
        </span>
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

      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatCard label="加密桩" value={stats.stake} suffix="个" />
        <StatCard label="智能测试桩" value={stats.test} suffix="个" />
        <StatCard label="阀室" value={stats.valve} suffix="个" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <div className="w-[240px]">
          <SearchField
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="编号 / 名称，如 SD-ZED-1101"
            aria-label="搜索关键点"
          />
        </div>
        <div className="w-[150px]">
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as 'all' | KeypointType)}
            className="h-9 text-[12px]"
            options={[
              { value: 'all', label: '全部类型' },
              ...(Object.keys(KEYPOINT_TYPE_LABEL) as KeypointType[]).map((t) => ({
                value: t,
                label: KEYPOINT_TYPE_LABEL[t],
              })),
            ]}
          />
        </div>
        <p className="text-[12px] text-ink-2">
          坐标按 GCJ-02 存储，与高德底图直接对齐
        </p>
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
            {rows.map((k, i) => {
              const related = markCounts.get(k.id)?.length ?? 0
              return (
                <tr
                  key={k.id}
                  className={[
                    'border-b border-card-line/70 transition-colors duration-240 last:border-0',
                    i % 2 === 1 ? 'bg-canvas' : '',
                    'hover:bg-info/[0.05]',
                  ].join(' ')}
                >
                  <td className="px-4 py-2.5 font-mono text-[12px] text-ink">{k.code}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2 text-ink-2">
                      <KeypointIcon type={k.type} size={9} />
                      {KEYPOINT_TYPE_LABEL[k.type]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-ink">{k.name}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-ink-2">
                    {formatLngLat(k.lng, k.lat)}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-ink-2">
                    {formatDistance(k.distance)}
                  </td>
                  <td className="px-4 py-2.5">
                    {related > 0 ? (
                      <TextButton onClick={() => setActiveId(k.id)}>{related} 条</TextButton>
                    ) : (
                      <span className="text-[12px] text-ink-2/60">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-16">
                  <EmptyState
                    icon={Waypoints}
                    title={loading ? '正在读取台账…' : '没有符合条件的关键点'}
                    description={loading ? undefined : '换个编号或类型再试。'}
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
            pageSizeOptions={[15, 30, 60]}
          />
        </div>
      </div>

      <Drawer open={Boolean(active)} onClose={() => setActiveId(null)} width={440}>
        {active ? (
          <div className="flex h-full flex-col">
            <header className="flex items-center gap-3 border-b border-card-line px-5 py-3.5">
              <h2 className="font-mono text-[14px] font-semibold text-ink">{active.code}</h2>
              <IconButton label="关闭" className="ml-auto" onClick={() => setActiveId(null)}>
                <X size={17} strokeWidth={1.8} />
              </IconButton>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <dl className="space-y-2.5 text-[13px]">
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 text-ink-2">类型</dt>
                  <dd className="flex items-center gap-2 text-ink">
                    <KeypointIcon type={active.type} size={9} />
                    {KEYPOINT_TYPE_LABEL[active.type]}
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 text-ink-2">名称</dt>
                  <dd className="text-ink">{active.name}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 text-ink-2">坐标</dt>
                  <dd className="font-mono text-[12px] text-ink">
                    {formatLngLat(active.lng, active.lat)}
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 text-ink-2">距当前位置</dt>
                  <dd className="tabular-nums text-ink">{formatDistance(active.distance)}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 text-ink-2">所属管段</dt>
                  <dd className="text-ink">中俄东线 · 济南—泰安段</dd>
                </div>
              </dl>

              <h3 className="mt-5 border-t border-card-line pt-4 text-[13px] font-semibold text-ink">
                关联标记 · {activeMarks.length} 条
              </h3>

              {activeMarks.length === 0 ? (
                <p className="mt-3 text-[12px] text-ink-2">该关键点暂无标记记录。</p>
              ) : (
                <ul className="mt-2 divide-y divide-card-line">
                  {activeMarks.map((mark) => (
                    <li key={mark.id} className="py-2.5">
                      <div className="flex items-center gap-2">
                        <Badge tone={mark.kind}>{mark.kind === 'alert' ? '警告' : '普通信息'}</Badge>
                        <span className="text-[12px] text-ink-2">{mark.creatorName}</span>
                        <span className="ml-auto text-[11px] tabular-nums text-ink-2">
                          {formatDate(mark.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink">
                        {mark.description}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <footer className="border-t border-card-line px-5 py-3.5">
              <Button variant="secondary" size="sm" onClick={() => setActiveId(null)}>
                关闭
              </Button>
            </footer>
          </div>
        ) : null}
      </Drawer>
    </AdminLayout>
  )
}
