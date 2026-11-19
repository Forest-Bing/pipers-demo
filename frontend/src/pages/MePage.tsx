import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft, CircleCheck, RefreshCw, RotateCw, Trash2 } from 'lucide-react'
import { Avatar, Button, IconButton } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/lib/store'
import { maskPhone } from '@/lib/format'
import { activePipeline } from '@/lib/mock/pipelines'

/** 画板 8「我的 / 设置」 */
export default function MePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { toast, marks, syncDrafts, resetDemo } = useStore()
  const [syncing, setSyncing] = useState(false)
  const [resetting, setResetting] = useState(false)

  const pending = marks.filter((m) => m.pending).length
  const synced = marks.length - pending

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  async function handleSync() {
    setSyncing(true)
    const count = await syncDrafts()
    setSyncing(false)
    if (count === null) return
    toast(count > 0 ? `已同步 ${count} 条草稿` : '没有待同步的草稿', 'success')
  }

  async function handleReset() {
    setResetting(true)
    await resetDemo()
    setResetting(false)
    navigate('/')
  }

  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-canvas px-4 pb-[calc(20px_+_env(safe-area-inset-bottom))] pt-[calc(12px_+_env(safe-area-inset-top))]">
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
          <span className="text-[13px] text-ink">已同步 {synced} 条</span>
        </div>

        <div className="flex items-center gap-2 pt-2.5">
          <i className="size-2 rounded-full bg-warn-ink" />
          <span className="text-[13px] text-ink">待同步 {pending} 条</span>
          <Button
            variant="secondary"
            size="sm"
            loading={syncing}
            className="ml-auto h-7 px-2.5 text-[11px]"
            icon={<RotateCw size={12} strokeWidth={2} />}
            onClick={handleSync}
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
            <dt className="text-ink-2">所属单位</dt>
            <dd className="ml-auto truncate pl-6 text-ink">{activePipeline.company}</dd>
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

      {/* 演示数据：清空本地改动，回到种子数据 */}
      <section className="glass mt-3 px-4 py-4">
        <h2 className="text-[13px] font-semibold text-ink">演示数据</h2>
        <p className="mt-1.5 text-[12px] leading-relaxed text-ink-2">
          新增 / 编辑 / 删除的标记与用户都存在本机浏览器里。重置会清空这些改动，恢复 15
          条标记、28 个用户与 60 个关键点。
        </p>
        <Button
          variant="danger-outline"
          size="sm"
          loading={resetting}
          icon={<Trash2 size={13} strokeWidth={2} />}
          onClick={handleReset}
          className="mt-2.5"
        >
          重置演示数据
        </Button>
      </section>

      <p className="mt-4 text-center text-[10px] text-ink-2/70">
        © 2026 国家管网 · 试点环境
      </p>
    </div>
  )
}
