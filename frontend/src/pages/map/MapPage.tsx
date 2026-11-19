import MapPageMobile from './MapPageMobile'
import MapPageDesktop from './MapPageDesktop'

/**
 * 断点壳：两套布局共存、用 CSS 互斥切换。
 * < 1024 一律手机布局（横向拉伸也走手机布局），>= 1024 走侧栏 + 地图。
 */
export default function MapPage() {
  return (
    <>
      <div className="lg:hidden">
        <MapPageMobile />
      </div>
      <div className="hidden lg:block">
        <MapPageDesktop />
      </div>
    </>
  )
}
