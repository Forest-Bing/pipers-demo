import { Footprints } from 'lucide-react'
import type { MarkItem } from '@/lib/mock-marks'
import { cn } from '@/lib/cn'

export default function MarkCard({ mark }: { mark: MarkItem }) {
  return (
    <article className="w-[164px] shrink-0 rounded-[14px] border border-hairline bg-white/85 p-3">
      <div className="flex items-center gap-1.5">
        <i
          className={cn(
            'size-1.5 shrink-0 rounded-full',
            mark.kind === 'alert' ? 'bg-alert' : 'bg-info',
          )}
        />
        <span className="truncate text-[11px] text-ink-2">{mark.title}</span>
        <span className="ml-auto shrink-0 text-[11px] text-ink-2">
          {mark.time}
        </span>
      </div>

      <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-ink">
        {mark.description}
      </p>

      <div className="mt-2 flex items-center gap-1 text-[11px] text-ink-2">
        <Footprints size={11} strokeWidth={1.8} />
        {mark.distance}
      </div>
    </article>
  )
}
