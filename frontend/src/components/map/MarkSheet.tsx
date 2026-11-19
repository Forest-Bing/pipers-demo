import { marks } from '@/lib/mock-marks'
import MarkCard from './MarkCard'

export default function MarkSheet() {
  return (
    <section className="glass-sheet absolute inset-x-2 bottom-0 h-[244px] px-4 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-ink/20" />

      <header className="mt-4 flex items-center gap-2">
        <h2 className="text-[17px] font-semibold text-ink">附近标记</h2>
        <span className="rounded-md bg-ink/[0.06] px-2 py-0.5 text-[11px] text-ink-2">
          共 7 条
        </span>
        <button type="button" className="ml-auto text-[13px] text-ink-2">
          按距离
        </button>
      </header>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2">
        {marks.slice(0, 4).map((mark) => (
          <MarkCard key={mark.id} mark={mark} />
        ))}
      </div>
    </section>
  )
}
