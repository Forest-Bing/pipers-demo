import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Eye, EyeOff } from 'lucide-react'
import { Button, SegmentedControl, TextField } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { currentAdmin } from '@/lib/mock/users'

type LoginMode = 'user' | 'admin'

/** 画板 1「登录」。无注册、无微信、无忘记密码、无验证码（PRD 硬约束） */
export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [mode, setMode] = useState<LoginMode>('user')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({})

  const isAdmin = mode === 'admin'

  function switchMode(next: LoginMode) {
    setMode(next)
    setErrors({})
    setPassword('')
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!/^\d{11}$/.test(phone)) next.phone = '请输入 11 位手机号'
    // 演示期角色由手机号判定：管理员页签必须用管理员账号，用户页签不接受管理员账号
    else if (isAdmin && phone !== currentAdmin.phone) next.phone = '该手机号不是管理员账号'
    else if (!isAdmin && phone === currentAdmin.phone) next.phone = '该手机号是管理员账号，请切换到管理员登录'
    if (password.length < 6) next.password = '密码至少 6 位'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    // TODO: POST /api/auth/login { phone, password, role }
    const user = login(phone, isAdmin ? 'admin' : 'user')
    navigate(user.role === 'admin' ? '/admin/users' : '/', { replace: true })
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

          <Button type="submit" block size="lg" className="mt-5 rounded-[14px]">
            {isAdmin ? '进入管理后台' : '登录'}
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-2">
          {isAdmin ? '管理员账号由运维统一分配，如需开通请联系系统管理员' : '账号由管理员统一创建，如需开通请联系管道部门管理员'}
        </p>

        {/* 演示辅助：说明如何切换角色，正式环境删除 */}
        <p className="mt-2 text-center text-[10px] text-ink-2/70">
          演示：{currentAdmin.phone} 为管理员账号，其他手机号为巡线员
        </p>

        <p className="mt-auto pb-[calc(16px_+_env(safe-area-inset-bottom))] pt-8 text-center text-[10px] text-ink-2/70">
          v1.0 · 试点
        </p>
      </div>
    </div>
  )
}
