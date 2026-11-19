import { useNavigate } from 'react-router'
import { ChevronLeft, CircleCheck, RefreshCw, RotateCw } from 'lucide-react'
import { Avatar, Button, IconButton } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/lib/store'
import { maskPhone } from '@/lib/format'
import { activePipeline } from '@/lib/mock/pipelines'

const SYNCED_COUNT = 12

/** 画板 8「我的 / 设置」 */
export default function MePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { toast, marks } = useStore()

  const pending = marks.filter((m) => m.pending).length

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-canvas px-4 pb-[calc(20px+env(safe-area-inset-bottom))] pt-[calc(12px+env(safe-area-inset-top))]">
      <header className="mb-4 flex items-center gap-1">
        <IconButton label="返回地图" onClick={() => navigate('/')} className="-ml-1">
          <ChevronLeft size={20} strokeWidth={1.9} />
        </IconButton>
        <h1 className="text-[26px] font-semibold tracking-tight text-ink">我的</h1>
      </header>

      {/* 用户信息 */}
      <section className="glass px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name ?? '张建国'} size={52} />
          <div className="min-w-0">
            <p className="text-[16px] font-semibold text-ink">{user?.name ?? '张建国'}</p>
            <p className="mt-0.5 text-[12px] text-ink-2">{user?.position ?? '巡线工'}</p>
            <p className="mt-1 font-mono text-[12px] text-ink-2">
              {maskPhone(user?.phone ?? '13800006027')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="ml-auto self-end text-[12px] text-alert transition-colors duration-240 hover:text-alert/75"
          >
            退出登录
          </button>
        </div>
      </section>

      {/* 同步状态 */}
      <section className="glass mt-3 px-4 py-4">
        <h2 className="text-[13px] font-semibold text-ink">同步状态</h2>

        <div className="mt-3 flex items-center gap-2 border-b border-hairline pb-2.5">
          <CircleCheck size={15} strokeWidth={2} className="text-success" />
          <span className="text-[13px] text-ink">已同步 {SYNCED_COUNT} 条</span>
        </div>

        <div className="flex items-center gap-2 pt-2.5">
          <i className="size-2 rounded-full bg-warn-ink" />
          <span className="text-[13px] text-ink">待同步 {pending} 条</span>
          <Button
            variant="secondary"
            size="sm"
            className="ml-auto h-7 px-2.5 text-[11px]"
            icon={<RotateCw size={12} strokeWidth={2} />}
            onClick={() => toast('正在重试同步…', 'success')}
          >
            立即重试
          </Button>
        </div>
      </section>

      {/* 关于 */}
      <section className="glass mt-3 px-4 py-4">
        <h2 className="text-[13px] font-semibold text-ink">关于</h2>

        <dl className="mt-3 space-y-2 text-[12px]">
          <div className="flex items-center">
            <dt className="text-ink-2">版本</dt>
            <dd className="ml-auto font-mono text-ink">v1.0.0 · 试点</dd>
          </div>
          <div className="flex items-center">
            <dt className="text-ink-2">当前管段</dt>
            <dd className="ml-auto truncate pl-6 text-ink">{activePipeline.name}</dd>
          </div>
          <div>
            <dt className="text-ink-2">位置服务</dt>
            <dd className="mt-0.5 text-ink">高德地图 JS API · 坐标 WGS-84 / GCJ-02</dd>
          </div>
        </dl>

        <p className="mt-3 flex items-start gap-1.5 rounded-[10px] bg-warn-soft px-2.5 py-2 text-[11px] leading-relaxed text-warn-ink">
          <RefreshCw size={12} strokeWidth={2} className="mt-0.5 shrink-0" />
          本系统为试点演示环境，禁止录入真实生产数据
        </p>
      </section>

      <p className="mt-4 text-center text-[10px] text-ink-2/70">
        © 2026 国家管网 · 试点环境
      </p>
    </div>
  )
}
