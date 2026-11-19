import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import MapBackdrop from '@/components/map/MapBackdrop'
import {
  AudioBar,
  Badge,
  Button,
  Drawer,
  EmptyState,
  IconButton,
  MarkPin,
  TextButton,
} from '@/components/ui'
import { useStore } from '@/lib/store'
import { formatDate, formatLngLat, formatTime } from '@/lib/format'
import { cn } from '@/lib/cn'

/** 画板 11「管理后台 · 标记管理 + 详情抽屉」 */
export default function MarksPage() {
  const { marks, removeMark, toast } = useStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const active = marks.find((m) => m.id === activeId)

  const closeDrawer = () => {
    setActiveId(null)
    setConfirmDelete(false)
  }

  const handleDelete = (id: string) => {
    // TODO: DELETE /api/marks/:id，并写入审计日志
    removeMark(id)
    closeDrawer()
    toast('标记已删除')
  }

  return (
    <AdminLayout breadcrumb={['系统管理', '标记管理']}>
      <div className="flex items-center gap-3">
        <h1 className="text-[20px] font-semibold text-ink">标记管理</h1>
        <span className="rounded-md bg-ink/[0.06] px-2 py-0.5 text-[12px] text-ink-2">
          共 {marks.length} 条
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {marks.length === 0 ? (
          <EmptyState
            icon={Filter}
            title="暂无标记"
            description="现场提交标记后会出现在这里。"
          />
        ) : (
          marks.map((mark) => (
            <article
              key={mark.id}
              className="card flex items-start gap-3.5 p-3.5 transition-colors duration-240 hover:border-info/30"
            >
              <span
                className={cn(
                  'size-14 shrink-0 rounded-[8px] bg-gradient-to-br',
                  mark.photos[0] ?? 'from-stone-200 via-stone-300 to-stone-400',
                )}
                aria-hidden
              />

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[13px] leading-relaxed text-ink">
                  {mark.description}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-ink-2">
                  <Badge tone={mark.kind}>{mark.kind === 'alert' ? '警告' : '普通信息'}</Badge>
                  <span>{mark.creatorName}</span>
                  <span className="tabular-nums">{formatTime(mark.createdAt)}</span>
                  <span className="font-mono">{formatLngLat(mark.lng, mark.lat)}</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3 pt-0.5">
                <TextButton onClick={() => setActiveId(mark.id)}>查看</TextButton>
                <TextButton tone="danger" onClick={() => handleDelete(mark.id)}>
                  删除
                </TextButton>
              </div>
            </article>
          ))
        )}
      </div>

      <Drawer open={Boolean(active)} onClose={closeDrawer}>
        {active ? (
          <div className="flex h-full flex-col">
            <header className="flex items-center gap-3 border-b border-card-line px-5 py-3.5">
              <h2 className="text-[15px] font-semibold text-ink">标记详情</h2>
              <IconButton label="关闭" className="ml-auto" onClick={closeDrawer}>
                <X size={17} strokeWidth={1.8} />
              </IconButton>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-2">
                <Badge tone={active.kind}>{active.kind === 'alert' ? '警告' : '普通信息'}</Badge>
                <span>{active.creatorName}</span>
                <span className="tabular-nums">{formatDate(active.createdAt)}</span>
              </div>

              {/* 大图预览：4 张小图纵向排列，第一张为主图 */}
              <div className="mt-3 flex flex-col gap-2">
                {active.photos.length > 0 ? (
                  active.photos.map((photo, i) => (
                    <span
                      key={i}
                      className={cn(
                        'w-full rounded-[8px] bg-gradient-to-br',
                        i === 0 ? 'h-[180px]' : 'h-[96px]',
                        photo,
                      )}
                      aria-hidden
                    />
                  ))
                ) : (
                  <div className="flex h-[120px] items-center justify-center rounded-[8px] bg-canvas text-[12px] text-ink-2">
                    无现场照片
                  </div>
                )}
              </div>

              <p className="mt-3.5 text-[14px] leading-[1.65] text-ink">{active.description}</p>

              {active.audio ? (
                <div className="mt-3">
                  <AudioBar duration={active.audio.duration} />
                </div>
              ) : null}

              {/* 位置：200px 高迷你静态地图 */}
              <div className="mt-4">
                <p className="mb-1.5 text-[12px] text-ink-2">
                  位置 · {active.keypointId ? active.title : formatLngLat(active.lng, active.lat)}
                </p>
                <div className="relative h-[200px] overflow-hidden rounded-[8px] border border-card-line bg-map-base">
                  <MapBackdrop />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
                    <MarkPin kind={active.kind} size={26} />
                  </div>
                </div>
              </div>
            </div>

            <footer className="border-t border-card-line px-5 py-3.5">
              <p className="mb-2 text-[11px] leading-tight text-warn-ink">
                删除后不可恢复，操作将记入审计日志
              </p>
              <div className="flex items-center gap-2">
                {confirmDelete ? (
                  <>
                    <span className="text-[12px] text-ink-2">确认删除？</span>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(active.id)}>
                      确认删除
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                      className="ml-auto"
                    >
                      取消
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="danger-outline"
                      size="sm"
                      onClick={() => setConfirmDelete(true)}
                    >
                      删除标记
                    </Button>
                    <Button variant="secondary" size="sm" onClick={closeDrawer} className="ml-auto">
                      关闭
                    </Button>
                  </>
                )}
              </div>
            </footer>
          </div>
        ) : null}
      </Drawer>
    </AdminLayout>
  )
}
