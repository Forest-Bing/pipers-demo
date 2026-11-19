import { createBrowserRouter, Navigate } from 'react-router'
import type { ReactNode } from 'react'
import MapPage from '@/pages/map/MapPage'
import LoginPage from '@/pages/LoginPage'
import MePage from '@/pages/MePage'
import NewMarkPage from '@/pages/mark/NewMarkPage'
import KeypointPickerPage from '@/pages/mark/KeypointPickerPage'
import MarkDetailPage from '@/pages/mark/MarkDetailPage'
import AdminPlaceholder from '@/pages/admin/AdminPlaceholder'
import UsersPage from '@/pages/admin/UsersPage'
import MarksPage from '@/pages/admin/MarksPage'
import { useAuth } from '@/lib/auth'

/**
 * 角色守卫（PRD 硬约束）：
 * - 普通用户不得进入 /admin/*
 * - 管理员不进地图页（决策 D5），登录后落 /admin/users
 */
function Guard({ area, children }: { area: 'user' | 'admin'; children: ReactNode }) {
  const { role } = useAuth()
  if (!role) return <Navigate to="/login" replace />
  if (area === 'admin' && role !== 'admin') return <Navigate to="/" replace />
  if (area === 'user' && role === 'admin') return <Navigate to="/admin/users" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },

  // 手机端 / 地图
  {
    path: '/',
    element: (
      <Guard area="user">
        <MapPage />
      </Guard>
    ),
  },
  {
    path: '/me',
    element: (
      <Guard area="user">
        <MePage />
      </Guard>
    ),
  },
  {
    path: '/mark/new',
    element: (
      <Guard area="user">
        <NewMarkPage />
      </Guard>
    ),
  },
  {
    path: '/mark/new/keypoint',
    element: (
      <Guard area="user">
        <KeypointPickerPage />
      </Guard>
    ),
  },
  {
    path: '/marks/:id',
    element: (
      <Guard area="user">
        <MarkDetailPage />
      </Guard>
    ),
  },

  // 管理后台
  {
    path: '/admin',
    element: <Navigate to="/admin/users" replace />,
  },
  {
    path: '/admin/users',
    element: (
      <Guard area="admin">
        <UsersPage />
      </Guard>
    ),
  },
  {
    path: '/admin/marks',
    element: (
      <Guard area="admin">
        <MarksPage />
      </Guard>
    ),
  },
  {
    path: '/admin/overview',
    element: (
      <Guard area="admin">
        <AdminPlaceholder title="概览" breadcrumb={['系统管理', '概览']} />
      </Guard>
    ),
  },
  {
    path: '/admin/keypoints',
    element: (
      <Guard area="admin">
        <AdminPlaceholder title="关键点台账" breadcrumb={['系统管理', '关键点台账']} />
      </Guard>
    ),
  },
  {
    path: '/admin/audit',
    element: (
      <Guard area="admin">
        <AdminPlaceholder title="审计日志" breadcrumb={['系统管理', '审计日志']} />
      </Guard>
    ),
  },
])
