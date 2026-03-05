import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './context/authStore'

// Layouts
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'

// Pages
import Home from './pages/Home'
import CustomerLogin from './pages/auth/CustomerLogin'
import CustomerRegister from './pages/auth/CustomerRegister'
import ProviderLogin from './pages/auth/ProviderLogin'
import ProviderRegister from './pages/auth/ProviderRegister'
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

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/customer/login" replace />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      {/* Customer Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/register" element={<CustomerRegister />} />
      </Route>

      {/* Provider Auth Routes */}
      <Route element={<AuthLayout variant="provider" />}>
        <Route path="/provider/login" element={<ProviderLogin />} />
        <Route path="/provider/register" element={<ProviderRegister />} />
      </Route>

      {/* Legacy redirects */}
      <Route path="/login" element={<Navigate to="/customer/login" replace />} />
      <Route path="/register" element={<Navigate to="/customer/register" replace />} />

      {/* Main Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/:slug" element={<CategoryServices />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/providers/:id" element={<ProviderProfile />} />
        
        {/* Protected Routes */}
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
