import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronRight, SearchX } from 'lucide-react'
import { MobileShell, NavText } from '@/components/layout/MobileShell'
import { EmptyState, KeypointIcon, SearchField } from '@/components/ui'
import { keypoints } from '@/lib/mock/keypoints'
import { KEYPOINT_TYPE_LABEL, type KeypointFilter } from '@/lib/mock/types'
import { formatDistance } from '@/lib/format'
import { cn } from '@/lib/cn'

/** 类型筛选胶囊：只按类型，没有其他维度（铁律 5 的延伸） */
const FILTERS: { value: KeypointFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'stake', label: KEYPOINT_TYPE_LABEL.stake },
  { value: 'stake-test', label: KEYPOINT_TYPE_LABEL['stake-test'] },
  { value: 'valve', label: '阀室' },
]

/** 画板 7「关键点选择器」。独立路由 /mark/new/keypoint，方便做返回 */
export default function KeypointPickerPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState<KeypointFilter>('all')

  const list = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return keypoints
      .filter((k) => (filter === 'all' ? true : k.type === filter))
      .filter((k) => (kw ? k.code.toLowerCase().includes(kw) || k.name.toLowerCase().includes(kw) : true))
      .slice()
      .sort((a, b) => a.distance - b.distance)
  }, [keyword, filter])

  const choose = (id: string, lng: number, lat: number) => {
    // TODO: GET /api/keypoints/:id 校验台账状态
    const query = new URLSearchParams({
      keypointId: id,
      lng: String(lng),
      lat: String(lat),
    })
    navigate(`/mark/new?${query.toString()}`)
  }

  return (
    <MobileShell
      title="选择关键点"
      left={
        <NavText tone="ink" onClick={() => navigate(-1)}>
          取消
        </NavText>
      }
    >
      <div className="px-4 pb-10">
        {/* 搜索框 + 类型胶囊吸顶 */}
        <div className="sticky top-0 z-10 -mx-4 bg-canvas px-4 pb-2.5 pt-3">
          <SearchField
            tone="glass"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索编号或名称"
            aria-label="搜索关键点"
          />
          <div className="-mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 pb-0.5">
            {FILTERS.map((f) => {
              const active = f.value === filter
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    'h-8 shrink-0 rounded-full px-3.5 text-[12px] transition-colors duration-240',
                    active
                      ? 'bg-ink text-white'
                      : 'border border-hairline bg-white text-ink-2 hover:text-ink',
                  )}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mb-1.5 flex justify-end px-1">
          <span className="text-[12px] text-ink-2">按距离排序</span>
        </div>

        {list.length === 0 ? (
          <EmptyState
            size="compact"
            icon={SearchX}
            title="没有匹配的关键点"
            description="试试搜索编号后四位"
          />
        ) : (
          <ul className="card divide-y divide-hairline overflow-hidden">
            {list.map((kp) => (
              <li key={kp.id}>
                <button
                  type="button"
                  onClick={() => choose(kp.id, kp.lng, kp.lat)}
                  className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-240 active:bg-canvas"
                >
                  <KeypointIcon type={kp.type} size={12} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] text-ink">{kp.name}</span>
                    <span className="mt-0.5 block font-mono text-[12px] text-ink-2">{kp.code}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[12px] tabular-nums text-ink-2">
                    {formatDistance(kp.distance)}
                  </span>
                  <ChevronRight size={16} strokeWidth={1.8} className="shrink-0 text-ink-2/60" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MobileShell>
  )
}
