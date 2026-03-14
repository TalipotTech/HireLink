import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../context/authStore'
import {
  UserIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

export default function RoleSwitcher() {
  const { user, activeRole, switchRole } = useAuthStore()
  const location = useLocation()

  const hasCustomer = user?.roles?.includes('CUSTOMER')
  const hasProvider = user?.roles?.includes('PROVIDER')
  const hasMultipleRoles = hasCustomer && hasProvider
  const providerStatus = user?.providerApplicationStatus

  if (providerStatus === 'PENDING') {
    return (
      <Link
        to="/become-provider"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all"
      >
        <ClockIcon className="h-3.5 w-3.5" />
        Approval Pending
      </Link>
    )
  }

  if (providerStatus === 'REJECTED' && !hasProvider) {
    return (
      <Link
        to="/become-provider"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all"
      >
        <SparklesIcon className="h-3.5 w-3.5" />
        Reapply as Provider
      </Link>
    )
  }

  if (hasCustomer && !hasProvider && !providerStatus) {
    return (
      <Link
        to="/become-provider"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200 hover:from-emerald-100 hover:to-teal-100 hover:border-emerald-300 transition-all"
      >
        <SparklesIcon className="h-3.5 w-3.5" />
        Become a Provider
      </Link>
    )
  }

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
