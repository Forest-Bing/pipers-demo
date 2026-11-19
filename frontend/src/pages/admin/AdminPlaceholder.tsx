import { Construction } from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { EmptyState } from '@/components/ui'

/** 后台未实现页占位：只保留导航与顶栏，内容区给空态 */
export default function AdminPlaceholder({
  title,
  breadcrumb,
}: {
  title: string
  breadcrumb: string[]
}) {
  return (
    <AdminLayout breadcrumb={breadcrumb}>
      <h1 className="text-[20px] font-semibold text-ink">{title}</h1>
      <div className="card mt-4">
        <EmptyState
          icon={Construction}
          title="功能建设中"
          description="该模块尚未实现。概览、关键点台账、审计日志按需求文档只做导航占位。"
        />
      </div>
    </AdminLayout>
  )
}
