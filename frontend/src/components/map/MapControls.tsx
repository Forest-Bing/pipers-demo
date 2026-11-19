import { Crosshair, Layers, Locate, Minus, Plus } from 'lucide-react'
import { locate } from '@/lib/amap'
import { setCurrentLocation, useMapInstance, useSelectMode } from '@/lib/map-runtime'
import { cn } from '@/lib/cn'

/**
 * 与设计稿的偏差：设计稿把按钮组放在 left:315 / top:560，被底部卡片（top:568）压住而不可见。
 * 这里改为贴右侧、锚定在底部卡片上方，保证可点。详见 docs/ui-notes.md。
 *
 * 接高德后：缩放/定位接真实地图；新增「选点」按钮作为落点模式的入口
 * （拾取层默认放行，否则地图拖不动）。「切换图层」仍未实现，保持不可点的占位态。
 */
export default function MapControls() {
  const map = useMapInstance()
  const [selectMode, setSelectMode] = useSelectMode()

  const zoomBy = (delta: number) => {
    if (!map) return
    // 立即生效（第二个参数 true）：按钮点击要即时反馈，动画期间落点换算会读到中间值
    map.setZoom(map.getZoom() + delta, true)
  }

  const goLocate = async () => {
    const point = await locate()
    if (!point || !map) return
    setCurrentLocation(point)
    map.setCenter([point.lng, point.lat])
    map.setZoom(17)
  }

  const controls = [
    { key: 'locate', label: '定位到我的位置', Icon: Locate, onClick: goLocate },
    {
      key: 'pick',
      label: selectMode ? '退出选点模式' : '在地图上选点',
      Icon: Crosshair,
      onClick: () => setSelectMode(!selectMode),
      active: selectMode,
    },
    { key: 'layers', label: '切换图层', Icon: Layers, onClick: undefined },
    { key: 'zoom-in', label: '放大', Icon: Plus, onClick: () => zoomBy(1) },
    { key: 'zoom-out', label: '缩小', Icon: Minus, onClick: () => zoomBy(-1) },
  ]

  return (
    <div className="absolute right-4 bottom-[332px] flex flex-col gap-3">
      {controls.map(({ key, label, Icon, onClick, active }) => (
        <button
          key={key}
          type="button"
          aria-label={label}
          aria-pressed={active}
          onClick={onClick}
          className={cn(
            'glass-btn text-ink active:scale-95 transition-transform duration-240 ease-glass',
            active && 'bg-info text-white',
          )}
        >
          <Icon size={18} strokeWidth={1.8} />
        </button>
      ))}
    </div>
  )
}
