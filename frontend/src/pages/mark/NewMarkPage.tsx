import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ImagePlus, MapPin, Mic, Plus } from 'lucide-react'
import { MobileShell, NavText } from '@/components/layout/MobileShell'
import {
  AudioBar,
  Button,
  Modal,
  PhotoGrid,
  SegmentedControl,
  TextArea,
  TextButton,
} from '@/components/ui'
import LandingPointSheet, { type LandingChoice } from '@/components/map/LandingPointSheet'
import { useStore } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import { findKeypoint } from '@/lib/mock/keypoints'
import { KEYPOINT_TYPE_LABEL, type Mark, type MarkKind } from '@/lib/mock/types'
import { formatLngLat, formatTime } from '@/lib/format'
import { cn } from '@/lib/cn'

/** 画板 5 的示例文案，作为描述默认值（计数器按实际长度实时算，不硬编码） */
const DEFAULT_DESC = 'K12+300 处管线上方发现第三方施工取土，已现场制止并拍照留证'

/** 现场照片占位：渐变色块，避免引入真人照片 */
const PHOTO_POOL = [
  'from-amber-200 via-stone-300 to-stone-500',
  'from-stone-400 via-amber-100 to-stone-300',
  'from-emerald-200 via-stone-300 to-stone-400',
  'from-sky-200 via-stone-200 to-stone-400',
  'from-orange-200 via-stone-300 to-stone-500',
]
const INITIAL_PHOTOS = PHOTO_POOL.slice(0, 4)
const DEFAULT_AUDIO = 37
const DEFAULT_LNG = 106.2718
const DEFAULT_LAT = 37.5421

/** 画板 5「添加标记 · 表单」。路由 /mark/new，可带 ?lng=&lat=&src=&keypointId= */
export default function NewMarkPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { addMark, toast } = useStore()
  const { user } = useAuth()

  // TODO: GET /api/keypoints/:id 校验并补齐关键点信息
  const [keypointId, setKeypointId] = useState<string | undefined>(
    params.get('keypointId') ?? undefined,
  )
  const [lng, setLng] = useState(() => Number(params.get('lng')) || DEFAULT_LNG)
  const [lat, setLat] = useState(() => Number(params.get('lat')) || DEFAULT_LAT)
  const [src, setSrc] = useState<'current' | 'picked'>(() =>
    params.get('src') === 'current' ? 'current' : 'picked',
  )

  const [kind, setKind] = useState<MarkKind>('alert')
  const [desc, setDesc] = useState(DEFAULT_DESC)
  const [photos, setPhotos] = useState<string[]>(INITIAL_PHOTOS)
  const [audio, setAudio] = useState<number | null>(DEFAULT_AUDIO)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const keypoint = findKeypoint(keypointId)
  const canSubmit = desc.trim().length > 0 && !submitting
  const dirty =
    desc !== DEFAULT_DESC ||
    photos.length !== INITIAL_PHOTOS.length ||
    kind !== 'alert' ||
    audio !== DEFAULT_AUDIO ||
    Boolean(keypointId) ||
    lng !== DEFAULT_LNG ||
    lat !== DEFAULT_LAT

  const positionTitle = keypoint
    ? `关键点 ${keypoint.code} · ${KEYPOINT_TYPE_LABEL[keypoint.type]}`
    : src === 'current'
      ? '当前位置'
      : '此处（长按拾取）'

  const addPhoto = () => {
    if (photos.length >= 9) return
    setPhotos((list) => [...list, PHOTO_POOL[list.length % PHOTO_POOL.length]])
  }

  const submit = () => {
    if (!canSubmit) return
    setSubmitting(true)
    const now = new Date()
    const mark: Mark = {
      id: `m-${now.getTime()}`,
      kind,
      lng,
      lat,
      title: keypoint ? `${keypoint.code} · ${KEYPOINT_TYPE_LABEL[keypoint.type]}` : '手动落点',
      description: desc.trim(),
      distance: '0m',
      time: formatTime(now),
      keypointId: keypoint?.id,
      creatorId: user?.id ?? 'u-zhang',
      creatorName: user?.name ?? '张建国',
      creatorPosition: user?.position ?? '巡线工',
      createdAt: now.toISOString(),
      photos,
      audio: audio === null ? undefined : { duration: audio },
    }
    // TODO: POST /api/marks，成功后用服务端返回的 id 替换本地 id
    addMark(mark)
    toast('标记已提交', 'success')
    navigate('/')
  }

  const saveDraft = () => {
    // TODO: POST /api/marks/drafts，弱网时入本地队列
    toast('已存为草稿，待同步 +1')
    navigate('/')
  }

  const requestCancel = () => {
    if (!dirty) {
      navigate('/')
      return
    }
    setConfirmOpen(true)
  }

  const handleLanding = (choice: LandingChoice) => {
    setSheetOpen(false)
    if (choice.kind === 'keypoint') {
      navigate('/mark/new/keypoint')
      return
    }
    setKeypointId(undefined)
    setLng(choice.lng)
    setLat(choice.lat)
    setSrc(choice.kind)
  }

  return (
    <MobileShell
      title="新建标记"
      left={
        <NavText tone="ink" onClick={requestCancel}>
          取消
        </NavText>
      }
      right={
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className={cn(
            'text-[14px] transition-colors duration-240',
            canSubmit ? 'text-info' : 'cursor-not-allowed text-info/40',
          )}
        >
          提交
        </button>
      }
    >
      <div className="flex flex-col gap-4 px-4 pb-[112px] pt-4">
        {/* 1. 标记类型 */}
        <section className="card p-4">
          <h3 className="text-[13px] font-medium text-ink">标记类型</h3>
          <SegmentedControl<MarkKind>
            className="mt-2.5"
            value={kind}
            onChange={setKind}
            options={[
              { value: 'alert', label: '警告', tone: 'alert' },
              { value: 'info', label: '普通信息', tone: 'info' },
            ]}
          />
          <p className="mt-2 text-[12px] leading-tight text-ink-2">
            警告与普通信息仅作分类，无处理流程
          </p>
        </section>

        {/* 2. 位置 */}
        <section className="card p-4">
          <h3 className="text-[13px] font-medium text-ink">位置</h3>
          <div className="mt-2.5 flex items-center gap-2">
            <MapPin size={16} strokeWidth={1.9} className="shrink-0 text-ink-2" />
            <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{positionTitle}</span>
            <TextButton onClick={() => setSheetOpen(true)} className="shrink-0">
              重新选择
            </TextButton>
          </div>
          <p className="mt-1 pl-6 font-mono text-[12px] text-ink-2">{formatLngLat(lng, lat)}</p>
        </section>

        {/* 3. 描述 */}
        <section className="card p-4">
          <TextArea
            label="描述"
            required
            maxLength={500}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="描述现场情况"
          />
        </section>

        {/* 4. 照片 */}
        <section className="card p-4">
          <div className="flex items-baseline">
            <h3 className="text-[13px] font-medium text-ink">照片</h3>
            <span className="ml-auto text-[12px] tabular-nums text-ink-2">
              {photos.length}/9
            </span>
          </div>
          <PhotoGrid
            className="mt-3"
            photos={photos}
            max={9}
            onAdd={addPhoto}
            onRemove={(i) => setPhotos((list) => list.filter((_, idx) => idx !== i))}
          />
          <div className="mt-2.5 flex items-center gap-5">
            <TextButton onClick={addPhoto} className="inline-flex items-center gap-1">
              <Plus size={13} strokeWidth={2.2} />
              拍照
            </TextButton>
            <TextButton onClick={addPhoto} className="inline-flex items-center gap-1">
              <ImagePlus size={13} strokeWidth={2} />
              从相册选择
            </TextButton>
          </div>
        </section>

        {/* 5. 录音 */}
        <section className="card p-4">
          <h3 className="text-[13px] font-medium text-ink">录音</h3>
          <div className="mt-3">
            {audio === null ? (
              <button
                type="button"
                onClick={() => setAudio(DEFAULT_AUDIO)}
                className="flex h-12 w-full items-center justify-center gap-1.5 rounded-control border border-dashed border-ink-2/35 text-[13px] text-ink-2 transition-colors duration-240 hover:border-info/50 hover:text-info"
              >
                <Mic size={15} strokeWidth={1.8} />
                点击录音
              </button>
            ) : (
              <AudioBar recording tone="alert" duration={audio} onDelete={() => setAudio(null)} />
            )}
          </div>
          <p className="mt-2 text-[12px] leading-tight text-ink-2">最长 60 秒，超时自动停止</p>
        </section>
      </div>

      {/* 底部固定玻璃操作条 */}
      <div className="glass-bar fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-hairline px-4 pb-[calc(12px_+_env(safe-area-inset-bottom))] pt-3">
        <TextButton tone="muted" onClick={saveDraft} className="shrink-0">
          存为草稿
        </TextButton>
        <Button
          onClick={submit}
          disabled={!canSubmit}
          loading={submitting}
          className="ml-auto h-12 w-[60%] rounded-[14px]"
        >
          提交标记
        </Button>
      </div>

      {/* 「重新选择」复用画板 4 的落点面板 */}
      <LandingPointSheet
        open={sheetOpen}
        lng={lng}
        lat={lat}
        onClose={() => setSheetOpen(false)}
        onChoose={handleLanding}
      />

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} width={320}>
        <div className="p-5">
          <h2 className="text-[16px] font-semibold text-ink">放弃本次编辑？</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
            已填写的描述、照片和录音都不会保存。
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setConfirmOpen(false)}>
              继续编辑
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setConfirmOpen(false)
                navigate('/')
              }}
            >
              放弃
            </Button>
          </div>
        </div>
      </Modal>
    </MobileShell>
  )
}
