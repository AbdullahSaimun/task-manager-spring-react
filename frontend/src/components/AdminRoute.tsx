import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Separate from ProtectedRoute deliberately: that component answers "are you logged
// in at all" (401 territory), this one answers "are you allowed to be here" (403
// territory) — the same 401-vs-403 split the backend makes between
// CustomAuthenticationEntryPoint and CustomAccessDeniedHandler. A non-admin lands
// back on the task list, not the login page — they're authenticated, just not
// authorized for this one route.
function AdminRoute() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />
}

export default AdminRoute
