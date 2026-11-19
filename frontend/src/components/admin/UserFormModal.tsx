import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import {
  Button,
  Modal,
  OverlayHeader,
  RadioGroup,
  Select,
  TextField,
} from '@/components/ui'
import { useStore } from '@/lib/store'
import { POSITIONS, type Position, type User, type UserRole } from '@/lib/mock/types'

/** 8 位字母 + 数字，去掉易混字符 */
function randomPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

interface UserFormModalProps {
  open: boolean
  onClose: () => void
  /** 传入则为编辑态 */
  editing?: User
  /** 当前登录管理员，编辑自己时角色单选禁用 */
  selfId?: string
}

/** 画板 12「新建用户 · 弹窗」；编辑态复用同一份表单 */
export default function UserFormModal({ open, onClose, editing, selfId }: UserFormModalProps) {
  const { users, addUser, updateUser, toast } = useStore()
  const [name, setName] = useState(editing?.name ?? '')
  const [phone, setPhone] = useState(editing?.phone ?? '')
  const [position, setPosition] = useState<Position>(editing?.position ?? '巡线工')
  const [role, setRole] = useState<UserRole>(editing?.role ?? 'user')
  const [password, setPassword] = useState(editing ? '' : randomPassword())
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [touched, setTouched] = useState(false)

  const isSelf = Boolean(editing && editing.id === selfId)
  const phoneTaken = users.some((u) => u.phone === phone && u.id !== editing?.id)
  const phoneInvalid = phone.length > 0 && !/^1\d{10}$/.test(phone)
  const phoneError = touched && phoneTaken ? '该手机号已存在' : phoneInvalid ? '请输入 11 位手机号' : undefined
  const dirty = name !== (editing?.name ?? '') || phone !== (editing?.phone ?? '')

  const reset = () => {
    setName(editing?.name ?? '')
    setPhone(editing?.phone ?? '')
    setPosition(editing?.position ?? '巡线工')
    setRole(editing?.role ?? 'user')
    setPassword(editing ? '' : randomPassword())
    setCopied(false)
    setTouched(false)
  }

  // 每次打开都回到当前编辑对象的状态，避免上一次的输入残留
  useEffect(() => {
    if (open) reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing])

  const close = () => {
    if (dirty) {
      setConfirmClose(true)
      return
    }
    reset()
    onClose()
  }

  const generate = async () => {
    const next = randomPassword()
    setPassword(next)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
    try {
      await navigator.clipboard.writeText(next)
    } catch {
      // 剪贴板不可用时仍展示密码，由管理员手工抄录
    }
  }

  const submit = () => {
    setTouched(true)
    if (!name.trim() || !/^1\d{10}$/.test(phone) || phoneTaken) return
    if (!editing && !password) return

    setLoading(true)
    // 演示用 300ms 提交中状态
    window.setTimeout(() => {
      if (editing) {
        // TODO: PATCH /api/admin/users/:id
        updateUser(editing.id, { name: name.trim(), phone, position, role })
        toast('账号已更新', 'success')
      } else {
        // TODO: POST /api/admin/users，初始密码由服务端生成并仅返回一次
        const user: User = {
          id: `u-${Date.now()}`,
          name: name.trim(),
          phone,
          position,
          role,
          status: 'active',
          createdBy: selfId,
          createdAt: new Date().toISOString(),
        }
        addUser(user)
        toast('账号已创建', 'success')
      }
      setLoading(false)
      reset()
      onClose()
    }, 300)
  }

  return (
    <>
      <Modal open={open} onClose={close} dismissOnScrim={false} width={520}>
        <OverlayHeader
          title={editing ? '编辑用户' : '新增用户'}
          subtitle="账号创建后请将初始密码线下告知本人"
          onClose={close}
        />

        <div className="flex flex-col gap-3.5 px-6 pb-5 pt-4">
          <TextField
            label="姓名"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入姓名"
          />
          <TextField
            label="手机号"
            required
            value={phone}
            inputMode="numeric"
            maxLength={11}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ''))
              setTouched(true)
            }}
            placeholder="作为登录名"
            hint="作为登录名，不可重复"
            error={phoneError}
          />
          <Select
            label="职位"
            value={position}
            onChange={(e) => setPosition(e.target.value as Position)}
            options={POSITIONS.map((p) => ({ value: p, label: p }))}
          />
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-ink">角色</p>
            <RadioGroup<UserRole>
              value={role}
              onChange={setRole}
              disabled={isSelf}
              options={[
                { value: 'user', label: '普通用户' },
                { value: 'admin', label: '管理员' },
              ]}
            />
            {isSelf ? (
              <p className="mt-1.5 text-[12px] text-ink-2">不能修改自己的角色</p>
            ) : null}
          </div>

          {editing ? null : (
            <div>
              <div className="mb-1.5 flex items-baseline gap-1.5">
                <span className="text-[13px] font-medium text-ink">初始密码</span>
                <button
                  type="button"
                  onClick={generate}
                  className="ml-auto inline-flex items-center gap-1 text-[12px] text-info transition-colors duration-240 hover:text-info/75"
                >
                  {copied ? <Check size={12} strokeWidth={2.4} /> : null}
                  {copied ? '已复制' : '随机生成'}
                </button>
              </div>
              <div className="flex h-11 items-center rounded-control border border-card-line bg-canvas px-3 font-mono text-[14px] tracking-[0.08em] text-ink">
                {password || '—'}
              </div>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-card-line px-6 py-3.5">
          <Button variant="secondary" size="md" onClick={close}>
            取消
          </Button>
          <Button onClick={submit} loading={loading}>
            {editing ? '保存' : '创建账号'}
          </Button>
        </footer>
      </Modal>

      <Modal open={confirmClose} onClose={() => setConfirmClose(false)} width={320}>
        <div className="p-5">
          <h2 className="text-[16px] font-semibold text-ink">放弃已填写的内容？</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">关闭后不会保存本次修改。</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setConfirmClose(false)}>
              继续编辑
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setConfirmClose(false)
                reset()
                onClose()
              }}
            >
              放弃
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
