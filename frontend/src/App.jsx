import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './context/authStore'

// Layouts
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'
import AdminLayout from './layouts/AdminLayout'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Pages
import Home from './pages/Home'
import BecomeProvider from './pages/BecomeProvider'
import Categories from './pages/Categories'
import CategoryServices from './pages/CategoryServices'
import ServiceDetail from './pages/ServiceDetail'
import ProviderProfile from './pages/ProviderProfile'
import Bookings from './pages/Bookings'
import BookingDetail from './pages/BookingDetail'
import Profile from './pages/Profile'
import BookService from './pages/BookService'
import SearchResults from './pages/SearchResults'
import NotFound from './pages/NotFound'

// Admin Pages
import AdminRoute from './components/AdminRoute'
import AdminDashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import BookingManagement from './pages/admin/BookingManagement'
import ServiceManagement from './pages/admin/ServiceManagement'
import ProviderApprovals from './pages/admin/ProviderApprovals'
import Reports from './pages/admin/Reports'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Backward-compatible redirects for old auth routes */}
      <Route path="/customer/login" element={<Navigate to="/login" replace />} />
      <Route path="/customer/register" element={<Navigate to="/register" replace />} />
      <Route path="/provider/login" element={<Navigate to="/login" replace />} />
      <Route path="/provider/register" element={<Navigate to="/register" replace />} />

      {/* Admin Routes - Protected by AdminRoute guard */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="bookings" element={<BookingManagement />} />
        <Route path="services" element={<ServiceManagement />} />
        <Route path="providers" element={<ProviderApprovals />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Main Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/:slug" element={<CategoryServices />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/providers/:id" element={<ProviderProfile />} />

        {/* Protected Routes */}
        <Route path="/become-provider" element={
          <ProtectedRoute>
            <BecomeProvider />
          </ProtectedRoute>
        } />
        <Route path="/book/:serviceId" element={
          <ProtectedRoute>
            <BookService />
          </ProtectedRoute>
        } />
        <Route path="/bookings" element={
          <ProtectedRoute>
            <Bookings />
          </ProtectedRoute>
        } />
        <Route path="/bookings/:id" element={
          <ProtectedRoute>
            <BookingDetail />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
