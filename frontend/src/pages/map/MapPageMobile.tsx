import MapCanvas from '@/components/map/MapCanvas'
import SearchCapsule from '@/components/map/SearchCapsule'
import StatusBar from '@/components/map/StatusBar'
import MapControls from '@/components/map/MapControls'
import Fab from '@/components/map/Fab'
import SyncPill from '@/components/map/SyncPill'
import MarkSheet from '@/components/map/MarkSheet'

/** 手机端地图主界面（设计稿画板 2:1，375 × 812） */
export default function MapPageMobile() {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-canvas">
      <MapCanvas />
      <SearchCapsule />
      <StatusBar />
      <MapControls />
      <Fab />
      <SyncPill />
      <MarkSheet />
    </div>
  )
}
