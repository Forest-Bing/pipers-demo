import { ChevronDown, Layers, Locate, Minus, Plus } from 'lucide-react'
import { useNavigate } from 'react-router'
import MapCanvas from '@/components/map/MapCanvas'
import MapOverlay from '@/components/map/MapOverlay'
import ZoomHint from '@/components/map/ZoomHint'
import Sidebar from '@/components/desktop/Sidebar'
import { locate } from '@/lib/amap'
import { setCurrentLocation, useMapInstance } from '@/lib/map-runtime'

/** 桌面端地图主界面（设计稿画板 2:219，1440 × 900） */
export default function MapPageDesktop({ showZoomHint = false }: { showZoomHint?: boolean }) {
  const navigate = useNavigate()
  const map = useMapInstance()

  const zoomBy = (delta: number) => {
    if (!map) return
    map.setZoom(map.getZoom() + delta, true)
  }

  const goLocate = async () => {
    const point = await locate()
    if (!point || !map) return
    setCurrentLocation(point)
    map.setCenter([point.lng, point.lat])
    map.setZoom(17)
  }

  const mapControls = [
    { key: 'locate', label: '定位到我的位置', Icon: Locate, onClick: goLocate },
    // 图层切换未实现，保持占位不可点（铁律 12）
    { key: 'layers', label: '切换图层', Icon: Layers, onClick: undefined },
    { key: 'zoom-in', label: '放大', Icon: Plus, onClick: () => zoomBy(1) },
    { key: 'zoom-out', label: '缩小', Icon: Minus, onClick: () => zoomBy(-1) },
  ]


  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-canvas">
      <Sidebar />

      <main className="relative min-w-0 flex-1">
        <MapCanvas />
        <MapOverlay />

        {showZoomHint ? <ZoomHint /> : null}

        <button
          type="button"
          className="glass absolute left-4 top-3 flex h-11 items-center gap-2 px-4 text-[13px] text-ink"
        >
          西气东输二线 · 中卫—靖边段
          <ChevronDown size={14} strokeWidth={2} className="text-ink-2" />
        </button>

        <div className="absolute bottom-4 right-4 flex items-center gap-3">
          <div className="glass flex items-center gap-1 rounded-full p-1">
            {mapControls.map(({ key, label, Icon, onClick }) => (
              <button
                key={key}
                type="button"
                aria-label={label}
                onClick={onClick}
                className="flex size-9 items-center justify-center rounded-full text-ink transition-colors duration-240 hover:bg-white/60"
              >
                <Icon size={16} strokeWidth={1.9} />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigate('/mark/new')}
            className="flex h-10 items-center gap-1.5 rounded-full bg-info px-4 text-[13px] font-medium text-white shadow-fab transition-transform duration-240 ease-glass active:scale-95"
          >
            <Plus size={15} strokeWidth={2.2} />
            添加标记
          </button>
        </div>
      </main>
    </div>
  )
}
