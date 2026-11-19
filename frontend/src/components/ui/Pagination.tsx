import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

interface PaginationProps {
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  className?: string
}

export function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className={cn('flex items-center gap-4 text-[12px] text-ink-2', className)}>
      <span className="tabular-nums">
        共 {total} 条{total > 0 ? `，当前 ${from}–${to}` : ''}
      </span>
      {onPageSizeChange ? (
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-8 rounded-control border border-card-line bg-white px-2 text-[12px] text-ink focus:border-info focus:outline-none"
          aria-label="每页条数"
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n} 条/页
            </option>
          ))}
        </select>
      ) : null}

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          aria-label="上一页"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex size-8 items-center justify-center rounded-control border border-card-line bg-white text-ink transition-colors duration-240 hover:bg-canvas disabled:cursor-not-allowed disabled:text-ink-2/40"
        >
          <ChevronLeft size={15} strokeWidth={1.8} />
        </button>
        <span className="px-2 tabular-nums text-ink">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          aria-label="下一页"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="flex size-8 items-center justify-center rounded-control border border-card-line bg-white text-ink transition-colors duration-240 hover:bg-canvas disabled:cursor-not-allowed disabled:text-ink-2/40"
        >
          <ChevronRight size={15} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  )
}
