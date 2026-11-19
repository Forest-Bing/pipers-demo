import { useRef, useState } from 'react'
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
import { MAP_CENTER } from '@/lib/amap'
import { findKeypoint } from '@/lib/mock/keypoints'
import { KEYPOINT_TYPE_LABEL, type MarkKind } from '@/lib/mock/types'
import { formatLngLat } from '@/lib/format'
import { cn } from '@/lib/cn'

/** 画板 5 的示例文案，作为描述默认值（计数器按实际长度实时算，不硬编码） */
const DEFAULT_DESC = 'K318+600 处管线上方发现第三方施工取土，已现场制止并拍照留证'

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
const DEFAULT_LNG = MAP_CENTER[0]
const DEFAULT_LAT = MAP_CENTER[1]

/** 画板 5「添加标记 · 表单」。路由 /mark/new，可带 ?lng=&lat=&src=&keypointId=；带 ?edit=<id> 时为编辑态 */
export default function NewMarkPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { marks, createMark, updateMark, saveDraft, toast } = useStore()

  const editId = params.get('edit') ?? undefined
  const editing = editId ? marks.find((m) => m.id === editId) : undefined

  // TODO: GET /api/keypoints/:id 校验并补齐关键点信息
  const [keypointId, setKeypointId] = useState<string | undefined>(
    editing?.keypointId ?? params.get('keypointId') ?? undefined,
  )
  const [lng, setLng] = useState(() => editing?.lng ?? (Number(params.get('lng')) || DEFAULT_LNG))
  const [lat, setLat] = useState(() => editing?.lat ?? (Number(params.get('lat')) || DEFAULT_LAT))
  const [src, setSrc] = useState<'current' | 'picked'>(() =>
    params.get('src') === 'current' ? 'current' : 'picked',
  )

  const [kind, setKind] = useState<MarkKind>(editing?.kind ?? 'alert')
  const [desc, setDesc] = useState(editing?.description ?? DEFAULT_DESC)
  const [photos, setPhotos] = useState<string[]>(editing?.photos ?? INITIAL_PHOTOS)
  const [audio, setAudio] = useState<number | null>(
    editing ? (editing.audio?.duration ?? null) : DEFAULT_AUDIO,
  )
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  /** 打开表单时的快照，用于「是否有改动」判断 */
  const initial = useRef({ kind, desc, photoCount: photos.length, audio, lng, lat })
  const keypoint = findKeypoint(keypointId)
  const canSubmit = desc.trim().length > 0 && !submitting
  const dirty =
    kind !== initial.current.kind ||
    desc !== initial.current.desc ||
    photos.length !== initial.current.photoCount ||
    audio !== initial.current.audio ||
    lng !== initial.current.lng ||
    lat !== initial.current.lat

  const positionTitle = keypoint
    ? `关键点 ${keypoint.code} · ${KEYPOINT_TYPE_LABEL[keypoint.type]}`
    : src === 'current'
      ? '当前位置'
      : '此处（长按拾取）'

  const addPhoto = () => {
    if (photos.length >= 9) return
    setPhotos((list) => [...list, PHOTO_POOL[list.length % PHOTO_POOL.length]])
  }

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)

    const payload = {
      kind,
      lng,
      lat,
      description: desc.trim(),
      keypointId: keypoint?.id,
      photos,
      audio: audio === null ? undefined : { duration: audio },
    }

    // 编辑态：只回写内容字段，创建人与创建时间由 mock API 保持不变
    if (editing) {
      const saved = await updateMark(editing.id, payload)
      setSubmitting(false)
      if (saved) {
        toast('标记已保存', 'success')
        navigate(`/marks/${editing.id}`)
      }
      return
    }

    // 创建态：标题、创建人、时间都由 mock API 根据「当前登录人」生成
    const created = await createMark(payload)
    setSubmitting(false)
    if (created) {
      toast('标记已提交', 'success')
      navigate('/')
    }
  }

  const handleDraft = async () => {
    const ok = await saveDraft({
      kind,
      lng,
      lat,
      description: desc.trim(),
      keypointId: keypoint?.id,
      photos,
      audio: audio === null ? undefined : { duration: audio },
    })
    if (ok) {
      toast('已存为草稿，待同步 +1')
      navigate('/')
    }
  }

  const leave = () => {
    if (editing) {
      navigate(`/marks/${editing.id}`)
      return
    }
    navigate('/')
  }

  const requestCancel = () => {
    if (!dirty) {
      leave()
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
      title={editing ? '编辑标记' : '新建标记'}
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
        {editing ? null : (
          <TextButton tone="muted" onClick={handleDraft} className="shrink-0">
            存为草稿
          </TextButton>
        )}
        <Button
          onClick={submit}
          disabled={!canSubmit}
          loading={submitting}
          className={cn('ml-auto h-12 rounded-[14px]', editing ? 'w-full' : 'w-[60%]')}
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
                leave()
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
