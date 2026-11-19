import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Eye, EyeOff, ShieldCheck, UserRound } from 'lucide-react'
import { Button, SegmentedControl, TextField } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { DEMO_ACCOUNTS } from '@/lib/mock/users'
import { ApiError } from '@/lib/api'

type LoginMode = 'user' | 'admin'

/** 画板 1「登录」。无注册、无微信、无忘记密码、无验证码（PRD 硬约束） */
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [mode, setMode] = useState<LoginMode>('user')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const isAdmin = mode === 'admin'

  function switchMode(next: LoginMode) {
    setMode(next)
    setErrors({})
    setFormError('')
    setPassword('')
  }

  /** 点测试账号：自动切页签并填好手机号 / 密码 */
  function fillDemo(next: LoginMode) {
    const account = next === 'admin' ? DEMO_ACCOUNTS.admin : DEMO_ACCOUNTS.user
    setMode(next)
    setPhone(account.phone)
    setPassword(account.password)
    setErrors({})
    setFormError('')
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!/^\d{11}$/.test(phone)) next.phone = '请输入 11 位手机号'
    if (password.length < 6) next.password = '密码至少 6 位'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length > 0) return

    setLoading(true)
    try {
      // TODO 已就位：换成真实接口后此处逻辑不变，mock API 内部走 localStorage
      const user = await login(phone, password, isAdmin ? 'admin' : 'user')
      // 被守卫拦下来的地址：角色对得上就送回去，否则回各自的首页
      const from = (location.state as { from?: string } | null)?.from
      const canReturn =
        !!from && (from.startsWith('/admin') ? user.role === 'admin' : user.role !== 'admin')
      navigate(canReturn ? from : user.role === 'admin' ? '/admin/users' : '/', { replace: true })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '登录失败，请稍后重试'
      setFormError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-canvas px-6">
      {/* 极淡波纹装饰，让玻璃卡片有可透的层次 */}
      <svg
        aria-hidden
        viewBox="0 0 400 220"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[220px] w-full text-info"
        preserveAspectRatio="none"
      >
        <path
          d="M-20 150 C 60 150, 60 100, 140 100 S 220 150, 300 150 S 380 100, 460 100"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.09"
          strokeWidth="2"
        />
        <path
          d="M-20 176 C 60 176, 60 126, 140 126 S 220 176, 300 176 S 380 126, 460 126"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.06"
          strokeWidth="1.5"
        />
      </svg>

      <div className="relative z-10 mx-auto flex w-full max-w-[380px] flex-1 flex-col">
        <header className="pt-[10vh] text-center">
          <img
            src="/pipechina.svg"
            alt="国家管网"
            className="mx-auto h-[40px] w-auto select-none"
            draggable={false}
          />
          {/* 品牌线：双道波纹，接住 logo 与标题之间的一段留白 */}
          <svg viewBox="0 0 64 22" className="mx-auto mt-4 h-[22px] w-[64px]" aria-hidden>
            <path
              d="M2 14 C 12 14, 12 6, 22 6 S 32 14, 42 14 S 52 6, 62 6"
              fill="none"
              stroke="#0A84FF"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M2 19 C 12 19, 12 11, 22 11 S 32 19, 42 19 S 52 11, 62 11"
              fill="none"
              stroke="#0A84FF"
              strokeOpacity="0.4"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <h1 className="mt-2 text-[19px] font-semibold text-ink">管道巡检自由标记系统</h1>
        </header>

        <form onSubmit={submit} className="glass mt-7 p-5">
          <SegmentedControl<LoginMode>
            value={mode}
            onChange={switchMode}
            options={[
              { value: 'user', label: '用户登录' },
              { value: 'admin', label: '管理员登录' },
            ]}
          />

          <div className="mt-4 space-y-3.5">
            <TextField
              label="手机号"
              inputMode="numeric"
              autoComplete="username"
              placeholder={isAdmin ? '请输入管理员手机号' : '请输入手机号'}
              maxLength={11}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              error={errors.phone}
            />

            <div className="relative">
              <TextField
                label="密码"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="请输入密码"
                className="pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
              />
              <button
                type="button"
                aria-label={showPwd ? '隐藏密码' : '显示密码'}
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-2.5 top-[34px] text-ink-2 transition-colors duration-240 hover:text-ink"
              >
                {showPwd ? (
                  <EyeOff size={16} strokeWidth={1.8} />
                ) : (
                  <Eye size={16} strokeWidth={1.8} />
                )}
              </button>
            </div>
          </div>

          {formError ? (
            <p role="alert" className="mt-3 rounded-[8px] bg-alert/[0.08] px-2.5 py-2 text-[12px] text-alert">
              {formError}
            </p>
          ) : null}

          <Button type="submit" block size="lg" loading={loading} className="mt-5 rounded-[14px]">
            {isAdmin ? '进入管理后台' : '登录'}
          </Button>
        </form>

        {/* 测试版说明：把可用账号直接摊开，点一下就自动填好，省去记密码 */}
        <section className="mt-4 rounded-[14px] border border-info/20 bg-white/70 px-3.5 py-3">
          <h2 className="flex items-center gap-1.5 text-[12px] font-medium text-info">
            <ShieldCheck size={13} strokeWidth={2} />
            测试版说明
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-2">
            当前为演示环境，数据均为模拟数据。普通账号初始密码统一为 123456，管理员为
            admin123；点击下方账号可自动填入。
          </p>

          <div className="mt-2 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => fillDemo('user')}
              className="flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-left transition-colors duration-240 hover:bg-info/[0.06]"
            >
              <UserRound size={13} strokeWidth={1.9} className="shrink-0 text-info" />
              <span className="text-[11px] text-ink">
                巡线员 · {DEMO_ACCOUNTS.user.name}
              </span>
              <span className="ml-auto font-mono text-[11px] text-ink-2">
                {DEMO_ACCOUNTS.user.phone} / {DEMO_ACCOUNTS.user.password}
              </span>
            </button>

            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-left transition-colors duration-240 hover:bg-info/[0.06]"
            >
              <ShieldCheck size={13} strokeWidth={1.9} className="shrink-0 text-alert" />
              <span className="text-[11px] text-ink">
                管理员 · {DEMO_ACCOUNTS.admin.name}
              </span>
              <span className="ml-auto font-mono text-[11px] text-ink-2">
                {DEMO_ACCOUNTS.admin.phone} / {DEMO_ACCOUNTS.admin.password}
              </span>
            </button>
          </div>
        </section>

        <p className="mt-auto pb-[calc(16px_+_env(safe-area-inset-bottom))] pt-6 text-center text-[10px] text-ink-2/70">
          v1.0 · 试点
        </p>
      </div>
    </div>
  )
}
