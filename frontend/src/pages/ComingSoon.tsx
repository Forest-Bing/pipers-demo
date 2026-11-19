import { useNavigate } from 'react-router'
import { Construction } from 'lucide-react'
import { MobileShell, NavText } from '@/components/layout/MobileShell'
import { EmptyState, Button } from '@/components/ui'

/** 尚未实现页面的占位。批次表见 docs/handoff-frontend.md §7 */
export default function ComingSoon({ title }: { title: string }) {
  const navigate = useNavigate()
  return (
    <MobileShell
      title={title}
      left={
        <NavText tone="ink" onClick={() => navigate(-1)}>
          返回
        </NavText>
      }
    >
      <EmptyState
        icon={Construction}
        title="功能建设中"
        description="该页面将在后续批次实现，当前为占位。"
        action={
          <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
            回到地图
          </Button>
        }
      />
    </MobileShell>
  )
}
