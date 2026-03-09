import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/authStore'
import {
  ChartBarIcon,
  UsersIcon,
  CalendarDaysIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  DocumentChartBarIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
} from '@heroicons/react/24/outline'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: ChartBarIcon, exact: true },
  { to: '/admin/users', label: 'Users', icon: UsersIcon },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarDaysIcon },
  { to: '/admin/services', label: 'Services', icon: WrenchScrewdriverIcon },
  { to: '/admin/providers', label: 'Provider Approvals', icon: ShieldCheckIcon },
  { to: '/admin/reports', label: 'Reports', icon: DocumentChartBarIcon },
]

const AdminLayout = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="px-5 py-6 border-b border-gray-700">
          <h2 className="text-xl font-bold tracking-tight">HireLink</h2>
          <span className="text-xs text-gray-400">Admin Panel</span>
        </div>

        <nav className="flex-1 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white bg-gray-800 border-l-3 border-primary-500'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-gray-700 space-y-3">
          <NavLink
            to="/"
            className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <HomeIcon className="h-5 w-5" />
            Back to Site
          </NavLink>
          <div>
            <p className="font-medium text-sm">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
