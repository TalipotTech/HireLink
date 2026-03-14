import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '../../context/authStore'
import NearbyProvidersPanel from '../NearbyProvidersPanel'
import RoleSwitcher from '../RoleSwitcher'
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  HomeIcon,
  Squares2X2Icon,
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  const isAdmin = isAuthenticated && (
    user?.roles?.includes('ADMIN') ||
    user?.roles?.includes('SUPER_ADMIN') ||
    user?.userType === 'ADMIN' ||
    user?.userType === 'SUPER_ADMIN'
  )

  const providerStatus = user?.providerApplicationStatus
  const isCustomerOnly = isAuthenticated &&
    user?.roles?.includes('CUSTOMER') &&
    !user?.roles?.includes('PROVIDER') &&
    !providerStatus

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleHeaderSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setSearchOpen(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b border-gray-100 sticky-header">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 group">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:shadow-xl group-hover:shadow-primary-500/40 transition-all">
                  <span className="text-white font-bold text-xl">H</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">HireLink</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <NavLink to="/" end className={({ isActive }) => `px-4 py-2 rounded-lg font-medium transition-all ${isActive ? 'text-primary-700 bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'}`}>
                Home
              </NavLink>
              <NavLink to="/categories" className={({ isActive }) => `px-4 py-2 rounded-lg font-medium transition-all ${isActive ? 'text-primary-700 bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'}`}>
                Services
              </NavLink>
              {isAuthenticated && (
                <NavLink to="/bookings" className={({ isActive }) => `px-4 py-2 rounded-lg font-medium transition-all ${isActive ? 'text-primary-700 bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'}`}>
                  My Bookings
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/admin" className={({ isActive }) => `px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 ${isActive ? 'text-amber-700 bg-amber-50' : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'}`}>
                  <Cog6ToothIcon className="h-4 w-4" />
                  Admin Panel
                </NavLink>
              )}
            </div>

            {/* Auth Buttons / User Menu */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Expandable Search */}
              <div className="relative">
                {searchOpen ? (
                  <form onSubmit={handleHeaderSearch} className="flex items-center animate-slideInRight">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search services..."
                      autoFocus
                      className="w-64 px-4 py-2 border border-gray-200 rounded-l-lg bg-gray-50 text-sm focus:outline-none focus:bg-white focus:border-primary-500 transition-all"
                      onBlur={() => {
                        if (!searchQuery) {
                          setTimeout(() => setSearchOpen(false), 200)
                        }
                      }}
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-primary-600 text-white rounded-r-lg hover:bg-primary-700 transition-colors"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-all"
                    title="Search"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <RoleSwitcher />
                  <NavLink 
                    to="/profile" 
                    className={({ isActive }) => `flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <UserCircleIcon className="h-5 w-5 text-primary-600" />
                    </div>
                    <span className="font-medium">{user?.name?.split(' ')[0]}</span>
                  </NavLink>
                  <button 
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                    title="Logout"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t animate-slideDown">
            <div className="px-4 py-4 space-y-2">
              {/* Mobile Search */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  if (searchQuery.trim()) {
                    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                    setSearchQuery('')
                    setMobileMenuOpen(false)
                  }
                }}
                className="pb-3 mb-2 border-b"
              >
                <div className="relative flex">
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search services..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:bg-white focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>
              </form>
              
              <NavLink 
                to="/" end
                className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-xl transition-all ${isActive ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <HomeIcon className="h-5 w-5" />
                <span className="font-medium">Home</span>
              </NavLink>
              <NavLink 
                to="/categories"
                className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-xl transition-all ${isActive ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Squares2X2Icon className="h-5 w-5" />
                <span className="font-medium">Services</span>
              </NavLink>
              {isAuthenticated ? (
                <>
                  <NavLink 
                    to="/bookings"
                    className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-xl transition-all ${isActive ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <CalendarDaysIcon className="h-5 w-5" />
                    <span className="font-medium">My Bookings</span>
                  </NavLink>
                  {isAdmin && (
                    <NavLink 
                      to="/admin"
                      className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-xl transition-all ${isActive ? 'bg-amber-50 text-amber-700' : 'text-amber-600 hover:bg-amber-50'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Cog6ToothIcon className="h-5 w-5" />
                      <span className="font-medium">Admin Panel</span>
                    </NavLink>
                  )}
                  {isCustomerOnly && (
                    <NavLink
                      to="/become-provider"
                      className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-xl transition-all ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-emerald-600 hover:bg-emerald-50'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <SparklesIcon className="h-5 w-5" />
                      <span className="font-medium">Become a Provider</span>
                    </NavLink>
                  )}
                  {providerStatus === 'PENDING' && (
                    <NavLink
                      to="/become-provider"
                      className="flex items-center space-x-3 p-3 rounded-xl text-amber-600 bg-amber-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <ClockIcon className="h-5 w-5" />
                      <span className="font-medium">Approval Pending</span>
                    </NavLink>
                  )}
                  {providerStatus === 'REJECTED' && !user?.roles?.includes('PROVIDER') && (
                    <NavLink
                      to="/become-provider"
                      className="flex items-center space-x-3 p-3 rounded-xl text-red-600 hover:bg-red-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <SparklesIcon className="h-5 w-5" />
                      <span className="font-medium">Reapply as Provider</span>
                    </NavLink>
                  )}
                  <NavLink 
                    to="/profile"
                    className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-xl transition-all ${isActive ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserCircleIcon className="h-5 w-5" />
                    <span className="font-medium">Profile</span>
                  </NavLink>
                  <div className="pt-2 border-t">
                    <button 
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 w-full text-red-600 transition-all"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2 pt-4 border-t">
                  <Link 
                    to="/login" 
                    className="block w-full btn-secondary text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="block w-full btn-primary text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-primary-700 font-bold text-xl">H</span>
                </div>
                <span className="text-xl font-bold">HireLink</span>
              </div>
              <p className="text-primary-200 text-sm leading-relaxed">
                Connecting you with trusted local service providers for all your home needs. Quality service, every time.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
              <ul className="space-y-2 text-primary-200 text-sm">
                <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/categories" className="hover:text-white transition-colors">Services</Link></li>
                <li><Link to="/bookings" className="hover:text-white transition-colors">My Bookings</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Popular Services</h4>
              <ul className="space-y-2 text-primary-200 text-sm">
                <li><Link to="/categories/electrical" className="hover:text-white transition-colors">Electrical</Link></li>
                <li><Link to="/categories/plumbing" className="hover:text-white transition-colors">Plumbing</Link></li>
                <li><Link to="/categories/cleaning" className="hover:text-white transition-colors">Cleaning</Link></li>
                <li><Link to="/categories/carpentry" className="hover:text-white transition-colors">Carpentry</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Contact</h4>
              <ul className="space-y-2 text-primary-200 text-sm">
                <li>support@hirelink.com</li>
                <li>1800-XXX-XXXX</li>
                <li className="pt-2 text-xs">Academic Project - ENSATE</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-600/50 mt-10 pt-8 text-center text-primary-300 text-sm">
            <p>&copy; 2026 HireLink. All rights reserved. Academic Project.</p>
          </div>
        </div>
      </footer>

      {/* Floating Nearby Providers Panel - accessible from anywhere */}
      <NearbyProvidersPanel />
    </div>
  )
}
