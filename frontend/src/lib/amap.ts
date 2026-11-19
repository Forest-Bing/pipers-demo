import AMapLoader from '@amap/amap-jsapi-loader'

/**
 * 高德地图 JS API 的唯一加载入口。
 *
 * 约定：
 * 1. `window._AMapSecurityConfig` 必须在 SDK 脚本执行之前设置，否则 v2.0 直接报
 *    `INVALID_USER_SCODE`，地图白屏。
 * 2. 加载是全局单例：React StrictMode 下 effect 会跑两次，`load()` 允许多次调用，
 *    这里再做一层 single-flight，保证只发一次请求。
 * 3. 没配 Key 时返回 `undefined`，调用方回退到 `MapBackdrop` 占位底图，
 *    演示环境不会白屏。
 */

const KEY = (import.meta.env.VITE_AMAP_KEY ?? '').trim()
const SECURITY = (import.meta.env.VITE_AMAP_SECURITY_CODE ?? '').trim()
export const AMAP_STYLE_ID = (import.meta.env.VITE_AMAP_STYLE_ID ?? '').trim()

/** 演示基准点：甘肃张掖一带，与 mock 数据同源 */
export const MAP_CENTER: [number, number] = [106.2718, 37.5421]
export const MAP_ZOOM = 15

/** Key 与安全密钥都齐了才认为可以加载 */
export const hasAMapKey = KEY.length > 0 && SECURITY.length > 0

let pending: Promise<typeof AMap | undefined> | null = null

export function loadAMap(): Promise<typeof AMap | undefined> {
  if (!hasAMapKey) {
    console.info('[amap] 未配置 VITE_AMAP_KEY / VITE_AMAP_SECURITY_CODE，使用降级底图 MapBackdrop')
    return Promise.resolve(undefined)
  }
  if (pending) return pending

  window._AMapSecurityConfig = { securityJsCode: SECURITY }

  pending = AMapLoader.load({
    key: KEY,
    version: '2.0',
    // Geolocation 用于「使用当前位置」，Scale 是比例尺（后续可能开）
    plugins: ['AMap.Geolocation'],
  })
    .then((AMapNS: typeof AMap) => AMapNS)
    .catch((err: unknown) => {
      // 允许下次重试：清掉缓存，避免一次网络抖动永久降级
      pending = null
      console.error('[amap] JS API 加载失败', err)
      return undefined
    }) as Promise<typeof AMap | undefined>

  return pending
}

export interface LngLat {
  lng: number
  lat: number
}

/**
 * 浏览器定位（高德封装的 Geolocation，国内比裸 navigator.geolocation 稳）。
 * 注意：非 localhost 必须 HTTPS，否则浏览器直接拒绝。
 */
export function locate(): Promise<LngLat | null> {
  const AMapNS = typeof window === 'undefined' ? undefined : window.AMap
  if (!AMapNS?.Geolocation) return Promise.resolve(null)

  return new Promise((resolve) => {
    const geo = new AMapNS.Geolocation({
      enableHighAccuracy: true,
      timeout: 8000,
      // 不做坐标偏移转换，直接拿高德坐标（GCJ-02），与底图一致
      needAddress: false,
    })
    let settled = false
    const done = (value: LngLat | null) => {
      if (settled) return
      settled = true
      resolve(value)
    }
    geo.getCurrentPosition((status, result) => {
      if (status === 'complete' && result.position) {
        done({ lng: result.position.lng, lat: result.position.lat })
      } else {
        done(null)
      }
    })
    // 兜底超时：部分浏览器既不回调也不报错
    window.setTimeout(() => done(null), 9000)
  })
}

/** 地图是否已就绪（SDK 可能因 Key 缺失/网络失败而不存在） */
export function isMapReady(map: AMap.Map | null): map is AMap.Map {
  return map !== null
}
