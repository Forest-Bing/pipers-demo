import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Eye, EyeOff } from 'lucide-react'
import { Button, TextField } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { currentAdmin } from '@/lib/mock/users'

/** 画板 1「登录」。无注册、无微信、无忘记密码、无验证码（PRD 硬约束） */
export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({})

  function submit(e: FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!/^\d{11}$/.test(phone)) next.phone = '请输入 11 位手机号'
    if (password.length < 6) next.password = '密码至少 6 位'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    // TODO: POST /api/auth/login { phone, password }
    const user = login(phone)
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
        <header className="pt-[13vh] text-center">
          <svg viewBox="0 0 64 22" className="mx-auto h-[26px] w-[64px]" aria-hidden>
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
          <h1 className="mt-4 text-[19px] font-semibold text-ink">管道巡检标记系统</h1>
          <p className="mt-1.5 text-[12px] text-ink-2">国家管网 · 试点环境</p>
        </header>

        <form onSubmit={submit} className="glass mt-8 p-5">
          <div className="space-y-3.5">
            <TextField
              label="手机号"
              inputMode="numeric"
              autoComplete="username"
              placeholder="请输入手机号"
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
            登录
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-2">
          账号由管理员统一创建，如需开通请联系管道部门管理员
        </p>

        {/* 演示辅助：说明如何切换角色，正式环境删除 */}
        <p className="mt-2 text-center text-[10px] text-ink-2/70">
          演示：{currentAdmin.phone} 为管理员，其他手机号为巡线员
        </p>

        <p className="mt-auto pb-[calc(16px+env(safe-area-inset-bottom))] pt-8 text-center text-[10px] text-ink-2/70">
          v1.0 · 试点
        </p>
      </div>
    </div>
  )
}
