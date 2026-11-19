/** 展示层格式化工具。时间统一按本地时区，不做时区换算。 */

const pad = (n: number) => String(n).padStart(2, '0')

/** '14:32' */
export function formatTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** '2026-11-19 14:32' */
export function formatDateTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${formatTime(d)}`
}

/** '2026-11-19' */
export function formatDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 米 → '86m' | '1.1km'；负数或非有限值返回 '—' */
export function formatDistance(m: number): string {
  if (!Number.isFinite(m) || m < 0) return '—'
  if (m < 1000) return `${Math.round(m)}m`
  return `${(m / 1000).toFixed(1)}km`
}

/** '13800006027' → '138****6027' */
export function maskPhone(phone: string): string {
  if (phone.length !== 11) return phone
  return `${phone.slice(0, 3)}****${phone.slice(7)}`
}

/** 聚合气泡数字：>99 显示 '99+' */
export function formatCount(n: number): string {
  return n > 99 ? '99+' : String(n)
}

/** 秒 → '00:37' */
export function formatDuration(seconds: number): string {
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`
}

/** 经纬度：'E 106.2718, N 37.5421'，保留 4 位小数 */
export function formatLngLat(lng: number, lat: number): string {
  const ew = lng >= 0 ? 'E' : 'W'
  const ns = lat >= 0 ? 'N' : 'S'
  return `${ew} ${Math.abs(lng).toFixed(4)}, ${ns} ${Math.abs(lat).toFixed(4)}`
}

/** 相对时间：'刚刚' / '3 分钟前' / '2 小时前' / '昨天' / '2026-11-17' */
export function formatRelative(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} 小时前`
  if (hour < 48) return '昨天'
  return formatDate(d)
}
