import { useState } from 'react'
import { Pause, Play, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDuration } from '@/lib/format'

/** 固定波形，避免每次渲染抖动（高度百分比） */
const WAVE = [
  22, 48, 66, 34, 78, 92, 58, 40, 72, 88, 54, 30, 62, 84, 46, 68, 36, 74, 52, 26,
  64, 86, 44, 70, 38, 56, 80, 50, 32, 60, 76, 42,
]

interface AudioBarProps {
  duration: number
  /** 录音中状态：显示红点 + 计时，可删除 */
  recording?: boolean
  onDelete?: () => void
  className?: string
}

export function AudioBar({ duration, recording = false, onDelete, className }: AudioBarProps) {
  const [playing, setPlaying] = useState(false)

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-control bg-canvas px-3 py-2.5',
        className,
      )}
    >
      <button
        type="button"
        aria-label={playing ? '暂停' : '播放'}
        onClick={() => setPlaying((p) => !p)}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-info text-white transition-transform duration-240 ease-glass active:scale-95"
      >
        {playing ? (
          <Pause size={13} strokeWidth={2.4} />
        ) : (
          <Play size={13} strokeWidth={2.4} className="translate-x-[1px]" />
        )}
      </button>

      <div className="flex h-6 min-w-0 flex-1 items-center gap-[2px] overflow-hidden">
        {WAVE.map((h, i) => (
          <i
            key={i}
            className={cn(
              'w-[2px] shrink-0 rounded-full',
              playing && i < 12 ? 'bg-info' : 'bg-ink-2/45',
            )}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>

      <span className="shrink-0 font-mono text-[11px] text-ink-2 tabular-nums">
        {recording ? `${formatDuration(duration)} / 01:00` : formatDuration(duration)}
      </span>

      {onDelete ? (
        <button
          type="button"
          aria-label="删除录音"
          onClick={onDelete}
          className="shrink-0 text-ink-2 transition-colors duration-240 hover:text-alert"
        >
          <Trash2 size={15} strokeWidth={1.8} />
        </button>
      ) : null}
    </div>
  )
}
