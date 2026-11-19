import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router'

export default function Fab() {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      aria-label="添加标记"
      onClick={() => navigate('/mark/new')}
      className="absolute right-4 bottom-[264px] flex size-14 items-center justify-center rounded-[28px] bg-info text-white shadow-fab active:scale-95 transition-transform duration-240 ease-glass"
    >
      <Plus size={26} strokeWidth={2.2} />
    </button>
  )
}
