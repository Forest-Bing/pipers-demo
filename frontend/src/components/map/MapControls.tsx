import { Layers, Locate, Minus, Plus } from 'lucide-react'

const controls = [
  { key: 'locate', label: '定位到我的位置', Icon: Locate },
  { key: 'layers', label: '切换图层', Icon: Layers },
  { key: 'zoom-in', label: '放大', Icon: Plus },
  { key: 'zoom-out', label: '缩小', Icon: Minus },
]

/**
 * 与设计稿的偏差：设计稿把按钮组放在 left:315 / top:560，被底部卡片（top:568）压住而不可见。
 * 这里改为贴右侧、锚定在底部卡片上方，保证可点。详见 docs/ui-notes.md。
 */
export default function MapControls() {
  return (
    <div className="absolute right-4 bottom-[332px] flex flex-col gap-3">
      {controls.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          aria-label={label}
          className="glass-btn text-ink active:scale-95 transition-transform duration-240 ease-glass"
        >
          <Icon size={18} strokeWidth={1.8} />
        </button>
      ))}
    </div>
  )
}
