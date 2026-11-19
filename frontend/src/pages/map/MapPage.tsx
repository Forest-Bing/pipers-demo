import { useSearchParams } from 'react-router'
import MapPageMobile from './MapPageMobile'
import MapPageDesktop from './MapPageDesktop'

/**
 * 断点壳：两套布局共存、用 CSS 互斥切换。
 * < 1024 一律手机布局（横向拉伸也走手机布局），>= 1024 走侧栏 + 地图。
 *
 * `?zoom=province` 用于展示画板 3 的缩放过度提示。
 */
export default function MapPage() {
  const [params] = useSearchParams()
  const showZoomHint = params.get('zoom') === 'province'

  return (
    <>
      <div className="lg:hidden">
        <MapPageMobile showZoomHint={showZoomHint} />
      </div>
      <div className="hidden lg:block">
        <MapPageDesktop showZoomHint={showZoomHint} />
      </div>
    </>
  )
}
