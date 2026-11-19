import { useSyncExternalStore } from 'react'

/**
 * 地图运行时状态（不是业务数据，不进 store.tsx）。
 *
 * 为什么用外部 store 而不是 Context：
 * 地图实例由 `MapCanvas` 创建，消费方（落点状态机、地图控件）却是它的兄弟节点。
 * 用 Context 就必须在页面里包一层 Provider，会改动两屏地图的 DOM 结构；
 * 这里用最小订阅，`MapPageMobile` / `MapPageDesktop` 一行都不用动。
 */

let mapInstance: AMap.Map | null = null
const mapListeners = new Set<() => void>()

export function setMapInstance(next: AMap.Map | null) {
  if (mapInstance === next) return
  mapInstance = next
  mapListeners.forEach((fn) => fn())
}

/**
 * 只在自己仍是当前实例时置空。
 *
 * 断点壳（`MapPage`）里手机/桌面两套布局同时挂载，各自有一个 `MapCanvas`；
 * 无条件置空会把另一套刚设好的实例清掉。
 */
export function clearMapInstance(target: AMap.Map) {
  if (mapInstance === target) setMapInstance(null)
}

function subscribeMap(fn: () => void) {
  mapListeners.add(fn)
  return () => {
    mapListeners.delete(fn)
  }
}

/** 地图实例；SDK 未加载或无 Key 时为 null */
export function useMapInstance(): AMap.Map | null {
  return useSyncExternalStore(subscribeMap, () => mapInstance, () => null)
}

/**
 * 视图版本号：地图平移 / 缩放 / 尺寸变化时 +1。
 *
 * 覆盖物是 React 绝对定位层（不是 `AMap.Marker`），像素坐标由 `lngLatToContainer` 算出来，
 * 所以地图每动一下都要重算。这里用版本号订阅，避免让每个覆盖物组件自己去绑事件。
 * 拖动时 `mapmove` 触发频率很高，用 rAF 合并到每帧一次。
 */
let viewVersion = 0
let viewDirty = false
const viewListeners = new Set<() => void>()

export function notifyViewChange() {
  if (viewDirty) return
  viewDirty = true
  const flush = () => {
    viewDirty = false
    viewVersion += 1
    viewListeners.forEach((fn) => fn())
  }
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(flush)
  else window.setTimeout(flush, 16)
}

function subscribeView(fn: () => void) {
  viewListeners.add(fn)
  return () => {
    viewListeners.delete(fn)
  }
}

/** 地图视图版本；把它放进依赖里即可在平移/缩放后重算像素 */
export function useMapTick(): number {
  return useSyncExternalStore(subscribeView, () => viewVersion, () => 0)
}

/**
 * 地图可视区尺寸。
 *
 * 为什么不直接读 `map.getSize()` / `map.getContainer().clientWidth`：
 * 实测高德 2.0 在 iframe 里初始化后这两者可能返回 0（DOM 已经是 375×812），
 * 覆盖物据此过滤视口就会全空。这里由 `MapCanvas` 用 ResizeObserver 观测真实容器。
 */
let mapSize = { width: 0, height: 0 }
const sizeListeners = new Set<() => void>()

export function setMapSize(next: { width: number; height: number }) {
  if (mapSize.width === next.width && mapSize.height === next.height) return
  mapSize = next
  sizeListeners.forEach((fn) => fn())
}

function subscribeSize(fn: () => void) {
  sizeListeners.add(fn)
  return () => {
    sizeListeners.delete(fn)
  }
}

export function useMapSize(): { width: number; height: number } {
  return useSyncExternalStore(subscribeSize, () => mapSize, () => mapSize)
}

export interface LngLat {
  lng: number
  lat: number
}

/**
 * 用户当前位置（定位成功后由地图控件写入）。
 * 覆盖物用它画蓝点；未定位时为 null，不显示。
 */
let currentLocation: LngLat | null = null
const locationListeners = new Set<() => void>()

export function setCurrentLocation(next: LngLat | null) {
  if (currentLocation === next) return
  currentLocation = next
  locationListeners.forEach((fn) => fn())
}

function subscribeLocation(fn: () => void) {
  locationListeners.add(fn)
  return () => {
    locationListeners.delete(fn)
  }
}

export function useCurrentLocation(): LngLat | null {
  return useSyncExternalStore(subscribeLocation, () => currentLocation, () => null)
}

/**
 * 选点模式：只有开启时，长按拾取层才接管指针事件。
 * 关闭（默认）时该层 `pointer-events: none`，地图可以正常拖动、双指缩放。
 */
let selectMode = false
const selectListeners = new Set<() => void>()

export function setSelectMode(next: boolean) {
  if (selectMode === next) return
  selectMode = next
  selectListeners.forEach((fn) => fn())
}

function subscribeSelect(fn: () => void) {
  selectListeners.add(fn)
  return () => {
    selectListeners.delete(fn)
  }
}

export function useSelectMode(): [boolean, (next: boolean) => void] {
  const value = useSyncExternalStore(
    subscribeSelect,
    () => selectMode,
    () => false,
  )
  return [value, setSelectMode]
}
