import { createBrowserRouter } from 'react-router'
import MapPage from '@/pages/map/MapPage'

export const router = createBrowserRouter([
  { path: '/', element: <MapPage /> },
  // 后续：/login、/mark/new、/me、/admin/users、/admin/marks
])
