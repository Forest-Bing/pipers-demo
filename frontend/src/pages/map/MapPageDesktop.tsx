import { ChevronDown, Layers, Locate, Minus, Plus } from 'lucide-react'
import MapCanvas from '@/components/map/MapCanvas'
import Sidebar from '@/components/desktop/Sidebar'

const mapControls = [
  { key: 'locate', label: '定位到我的位置', Icon: Locate },
  { key: 'layers', label: '切换图层', Icon: Layers },
  { key: 'zoom-in', label: '放大', Icon: Plus },
  { key: 'zoom-out', label: '缩小', Icon: Minus },
]

/** 桌面端地图主界面（设计稿画板 2:219，1440 × 900） */
export default function MapPageDesktop() {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-canvas">
      <Sidebar />

      <main className="relative min-w-0 flex-1">
        <MapCanvas />

        <button
          type="button"
          className="glass absolute left-4 top-3 flex h-11 items-center gap-2 px-4 text-[13px] text-ink"
        >
          西气东输二线 · 中卫—靖边段
          <ChevronDown size={14} strokeWidth={2} className="text-ink-2" />
        </button>

        <div className="absolute bottom-4 right-4 flex items-center gap-3">
          <div className="glass flex items-center gap-1 rounded-full p-1">
            {mapControls.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                aria-label={label}
                className="flex size-9 items-center justify-center rounded-full text-ink transition-colors duration-240 hover:bg-white/60"
              >
                <Icon size={16} strokeWidth={1.9} />
              </button>
            ))}
          </div>

          <button
            type="button"
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
