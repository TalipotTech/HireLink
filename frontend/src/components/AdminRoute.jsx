import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../context/authStore'

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const isAdmin = user?.roles?.includes('ADMIN') ||
                  user?.roles?.includes('SUPER_ADMIN') ||
                  user?.userType === 'ADMIN' ||
                  user?.userType === 'SUPER_ADMIN'

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

export default AdminRoute
