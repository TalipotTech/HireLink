import { useAuthStore } from '../context/authStore'
import { useLocation } from 'react-router-dom'
import {
  UserIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'

export default function RoleSwitcher() {
  const { user, activeRole, switchRole } = useAuthStore()
  const location = useLocation()

  const hasMultipleRoles = user?.roles?.includes('CUSTOMER') && user?.roles?.includes('PROVIDER')

  if (!hasMultipleRoles) {
    return null
  }

  const isBookingsPage = location.pathname.startsWith('/bookings')

  if (!isBookingsPage) {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <WrenchScrewdriverIcon className="h-3.5 w-3.5" />
        Also a Provider
      </span>
    )
  }

  return (
    <div className="flex bg-gray-100 rounded-lg p-0.5">
      <button
        onClick={() => switchRole('CUSTOMER')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          activeRole === 'CUSTOMER'
            ? 'bg-white text-primary-700 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <UserIcon className="h-3.5 w-3.5" />
        Customer
      </button>
      <button
        onClick={() => switchRole('PROVIDER')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          activeRole === 'PROVIDER'
            ? 'bg-white text-emerald-700 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <WrenchScrewdriverIcon className="h-3.5 w-3.5" />
        Provider
      </button>
    </div>
  )
}
