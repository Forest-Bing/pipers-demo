import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/cn'

const FIELD_BASE =
  'w-full rounded-control border bg-white px-3 text-[14px] text-ink placeholder:text-ink-2/70 ' +
  'transition-colors duration-240 focus:outline-none disabled:bg-canvas disabled:text-ink-2'

function borderOf(error?: string) {
  return error
    ? 'border-alert focus:border-alert'
    : 'border-card-line focus:border-info'
}

interface LabelProps {
  htmlFor: string
  label?: ReactNode
  required?: boolean
  hint?: string
  trailing?: ReactNode
}

function FieldLabel({ htmlFor, label, required, hint, trailing }: LabelProps) {
  if (!label && !trailing) return null
  return (
    <div className="mb-1.5 flex items-baseline gap-1.5">
      {required ? <i className="not-italic text-[12px] text-alert">*</i> : null}
      {label ? (
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
          {label}
        </label>
      ) : null}
      {trailing ? <span className="ml-auto text-[12px] text-ink-2">{trailing}</span> : null}
      {hint ? <span className="ml-auto text-[12px] text-ink-2">{hint}</span> : null}
    </div>
  )
}

/** 字段下方的红字校验信息（规格要求出现在字段下方，不是标题行） */
function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null
  return (
    <p id={id} className="mt-1 text-[12px] text-alert">
      {children}
    </p>
  )
}

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
  required?: boolean
  hint?: string
  error?: string
  trailing?: ReactNode
}

export function TextField({
  label,
  required,
  hint,
  error,
  trailing,
  className,
  id,
  ...rest
}: TextFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="w-full">
      <FieldLabel
        htmlFor={fieldId}
        label={label}
        required={required}
        hint={hint}
        trailing={trailing}
      />
      <input
        id={fieldId}
        className={cn(FIELD_BASE, borderOf(error), 'h-11', className)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...rest}
      />
      <FieldError id={`${fieldId}-error`}>{error}</FieldError>
    </div>
  )
}

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode
  required?: boolean
  hint?: string
  error?: string
  /** 显示右下角字数计数，传上限值 */
  maxLength?: number
  /** 当前字数（受控时传入，避免 readOnly 场景下算错） */
  count?: number
}

export function TextArea({
  label,
  required,
  hint,
  error,
  maxLength,
  count,
  className,
  id,
  value,
  ...rest
}: TextAreaProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const current =
    typeof count === 'number'
      ? count
      : typeof value === 'string'
        ? value.length
        : 0
  const over = maxLength ? current > maxLength : false

  return (
    <div className="w-full">
      <FieldLabel htmlFor={fieldId} label={label} required={required} hint={hint} />
      <textarea
        id={fieldId}
        value={value}
        maxLength={undefined}
        className={cn(
          FIELD_BASE,
          borderOf(error ?? (over ? 'over' : undefined)),
          'min-h-[116px] resize-none py-2.5 leading-[1.55]',
          className,
        )}
        {...rest}
      />
      <FieldError id={`${fieldId}-error`}>{error}</FieldError>
      {maxLength ? (
        <div
          className={cn(
            'mt-1 text-right text-[11px] tabular-nums',
            over ? 'text-alert' : 'text-ink-2',
          )}
        >
          {current}/{maxLength}
        </div>
      ) : null}
    </div>
  )
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode
  required?: boolean
  hint?: string
  error?: string
  options: { value: string; label: string }[]
}export function Select({
  label,
  required,
  hint,
  error,
  options,
  className,
  id,
  ...rest
}: SelectProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="w-full">
      <FieldLabel htmlFor={fieldId} label={label} required={required} hint={hint} />
      <div className="relative">
        <select
          id={fieldId}
          className={cn(FIELD_BASE, borderOf(error), 'h-11 appearance-none pr-9', className)}
          {...rest}
        >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          strokeWidth={2}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-2"
        />
      </div>
      <FieldError id={`${fieldId}-error`}>{error}</FieldError>
    </div>
  )
}

export interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** glass 用于地图/手机浮层，plain 用于后台筛选行 */
  tone?: 'glass' | 'plain'
}

/** 带放大镜的搜索输入框，两种底色：玻璃（手机端）/ 白底描边（后台） */
export function SearchField({ tone = 'plain', className, ...rest }: SearchFieldProps) {
  return (
    <div className="relative w-full">
      <Search
        size={tone === 'glass' ? 17 : 15}
        strokeWidth={1.9}
        className={cn(
          'pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-2',
          tone === 'glass' ? 'left-4' : 'left-3',
        )}
      />
      <input
        type="search"
        className={cn(
          'w-full text-ink placeholder:text-ink-2 focus:outline-none',
          '[&::-webkit-search-cancel-button]:appearance-none',
          tone === 'glass'
            ? 'glass h-12 pl-11 pr-4 text-[14px]'
            : 'h-9 rounded-control border border-card-line bg-white pl-9 pr-3 text-[12px] focus:border-info',
          className,
        )}
        {...rest}
      />
    </div>
  )
}
