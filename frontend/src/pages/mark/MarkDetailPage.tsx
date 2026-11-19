import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeft, MapPin } from 'lucide-react'
import MapCanvas from '@/components/map/MapCanvas'
import {
  AudioBar,
  Badge,
  Button,
  EmptyState,
  IconButton,
  MarkPin,
  Modal,
  TextButton,
} from '@/components/ui'
import { useStore } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/cn'

/** 画板 6「标记详情」：地图 55% + 玻璃面板 45% */
export default function MarkDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { marks, removeMark, toast } = useStore()
  const { user } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const mark = marks.find((m) => m.id === id)

  if (!mark) {
    return (
      <div className="flex h-[100dvh] flex-col bg-canvas">
        <EmptyState
          className="flex-1"
          title="标记不存在或已被删除"
          description="可能已被创建人删除，或链接已失效。"
          action={
            <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
              返回地图
            </Button>
          }
        />
      </div>
    )
  }

  // 铁律 9：非本人创建的标记不显示「编辑」「删除」
  const isOwner = mark.creatorId === (user?.id ?? 'u-zhang')

  const handleDelete = () => {
    // TODO: DELETE /api/marks/:id
    removeMark(mark.id)
    setConfirmOpen(false)
    toast('标记已删除')
    navigate('/')
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-canvas">
      {/* 地图区：55% */}
      <div className="absolute inset-x-0 top-0 h-[55%] overflow-hidden">
        <MapCanvas />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
          <MarkPin kind={mark.kind} size={30} />
        </div>
      </div>

      <div className="absolute left-3 top-[max(12px,env(safe-area-inset-top))] z-10">
        <IconButton label="返回" tone="glass" onClick={() => navigate(-1)}>
          <ArrowLeft size={19} strokeWidth={1.9} />
        </IconButton>
      </div>

      {/* 玻璃详情面板：45% */}
      <section className="glass-sheet absolute inset-x-0 bottom-0 h-[45%] overflow-y-auto px-4 pb-[calc(16px_+_env(safe-area-inset-bottom))]">
        <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-ink/20" />

        <header className="mt-3 flex items-center gap-2">
          <Badge tone={mark.kind}>{mark.kind === 'alert' ? '警告' : '普通信息'}</Badge>
          {isOwner ? (
            <div className="ml-auto flex items-center gap-3">
              <TextButton onClick={() => navigate(`/mark/new?edit=${mark.id}`)}>编辑</TextButton>
              <TextButton tone="danger" onClick={() => setConfirmOpen(true)}>
                删除
              </TextButton>
            </div>
          ) : null}
        </header>

        <p className="mt-2.5 text-[16px] leading-[1.6] text-ink">{mark.description}</p>

        <div className="mt-3 flex items-center gap-1.5">
          <MapPin size={14} strokeWidth={1.9} className="shrink-0 text-ink-2" />
          <span className="min-w-0 flex-1 truncate text-[13px] text-ink-2">
            {mark.keypointId ? `关键点 ${mark.title}` : `落点 ${mark.lat.toFixed(4)}, ${mark.lng.toFixed(4)}`}
          </span>
          <TextButton
            className="shrink-0"
            onClick={() => toast('已定位到关键点')}
          >
            查看
          </TextButton>
        </div>

        {mark.photos.length > 0 ? (
          <div className="relative mt-3">
            {/* 两行横向滑动缩略图 */}
            <div className="grid grid-flow-col grid-rows-2 gap-2 overflow-x-auto pb-1">
              {mark.photos.map((photo, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`查看第 ${i + 1} 张照片`}
                  onClick={() => toast('大图预览建设中')}
                  className={cn('h-[96px] w-[96px] shrink-0 rounded-[8px] bg-gradient-to-br', photo)}
                />
              ))}
            </div>
            <span className="pointer-events-none absolute bottom-2.5 right-1.5 rounded-[4px] bg-black/45 px-1 text-[10px] leading-4 text-white">
              1/{mark.photos.length}
            </span>
          </div>
        ) : null}

        {mark.audio ? (
          <div className="mt-3">
            <AudioBar duration={mark.audio.duration} />
          </div>
        ) : null}

        <div className="mt-4 border-t border-hairline pt-3">
          <p className="text-[13px] text-ink">
            {mark.creatorName} · {mark.creatorPosition}
          </p>
          <p className="mt-0.5 text-[12px] text-ink-2">{formatDateTime(mark.createdAt)}</p>
        </div>
      </section>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} width={320}>
        <div className="p-5">
          <h2 className="text-[16px] font-semibold text-ink">删除这条标记？</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
            删除后不可恢复，照片与录音会一并移除。
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setConfirmOpen(false)}>
              取消
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              删除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
