import { Camera, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'

interface PhotoGridProps {
  /** 每项是 Tailwind 渐变类名，模拟现场照片 */
  photos: string[]
  max?: number
  onAdd?: () => void
  onRemove?: (index: number) => void
  className?: string
}

/** 3×3 九宫格。已上传为色块+序号，空位为虚线框 */
export function PhotoGrid({ photos, max = 9, onAdd, onRemove, className }: PhotoGridProps) {
  const slots = Array.from({ length: max }, (_, i) => photos[i])
  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {slots.map((photo, i) =>
        photo ? (
          <button
            key={i}
            type="button"
            onClick={() => onRemove?.(i)}
            aria-label={`删除第 ${i + 1} 张照片`}
            className={cn(
              'group relative aspect-square overflow-hidden rounded-[8px] bg-gradient-to-br',
              photo,
            )}
          >
            <span className="absolute bottom-1 right-1 rounded-[4px] bg-black/45 px-1 text-[10px] leading-4 text-white">
              {i + 1}
            </span>
            <span className="absolute inset-0 hidden items-center justify-center bg-black/30 text-[11px] text-white group-hover:flex">
              移除
            </span>
          </button>
        ) : (
          <button
            key={i}
            type="button"
            onClick={onAdd}
            aria-label="添加照片"
            className="flex aspect-square items-center justify-center rounded-[8px] border border-dashed border-ink-2/35 bg-white/60 text-ink-2 transition-colors duration-240 hover:border-info/50 hover:text-info"
          >
            <Camera size={18} strokeWidth={1.5} />
          </button>
        ),
      )}
    </div>
  )
}

/** 未上传时的单格快捷入口，用于其他场景 */
export function AddPhotoTile({ onClick, label = '添加' }: { onClick?: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[8px] border border-dashed border-ink-2/35 text-[11px] text-ink-2 transition-colors duration-240 hover:border-info/50 hover:text-info"
    >
      <Plus size={16} strokeWidth={1.8} />
      {label}
    </button>
  )
}
