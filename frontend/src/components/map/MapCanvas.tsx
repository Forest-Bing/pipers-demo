import MapBackdrop from './MapBackdrop'

/**
 * 地图容器（唯一的地图交换点）。
 *
 * 约定：
 * 1. 绝对定位铺满，且必须排在所有玻璃浮层之前（DOM 顺序即层级，不靠 z-index 堆叠）。
 * 2. 接入高德时只改本组件内部：`new AMap.Map(containerRef.current)`，
 *    所有浮层组件一行都不用动。
 * 3. 底图用 #F7F7F5，避免瓦片加载前闪白。
 */
export default function MapCanvas() {
  return (
    <div className="absolute inset-0 bg-map-base">
      <MapBackdrop />
      <div id="map-canvas" className="absolute inset-0" aria-label="地图" />
    </div>
  )
}
