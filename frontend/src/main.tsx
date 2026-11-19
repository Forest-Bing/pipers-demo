import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import './index.css'
import { router } from './routes'
import { AuthProvider } from './lib/auth'
import { StoreProvider } from './lib/store'
import { ToastHost } from './components/ui/Toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <StoreProvider>
        <RouterProvider router={router} />
        <ToastHost />
      </StoreProvider>
    </AuthProvider>
  </StrictMode>,
)
