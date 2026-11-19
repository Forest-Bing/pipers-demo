import MapCanvas from '@/components/map/MapCanvas'
import MapPickState from '@/components/map/MapPickState'
import SearchCapsule from '@/components/map/SearchCapsule'
import StatusBar from '@/components/map/StatusBar'
import MapControls from '@/components/map/MapControls'
import Fab from '@/components/map/Fab'
import SyncPill from '@/components/map/SyncPill'
import MarkSheet from '@/components/map/MarkSheet'
import ZoomHint from '@/components/map/ZoomHint'

/** 手机端地图主界面（设计稿画板 2:1，375 × 812） */
export default function MapPageMobile({ showZoomHint = false }: { showZoomHint?: boolean }) {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-canvas">
      <MapCanvas />
      {/* 画板 4：长按拾取的状态浮层，DOM 顺序决定它压在底图之上、既有控件之下 */}
      <MapPickState />
      <SearchCapsule />
      <StatusBar />
      <MapControls />
      <Fab />
      <SyncPill />
      <MarkSheet />
      {showZoomHint ? <ZoomHint /> : null}
    </div>
  )
}
