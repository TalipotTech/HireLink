import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { bookingsAPI } from '../services/api'
import { useAuthStore } from '../context/authStore'
import { format } from 'date-fns'
import { 
  CalendarDaysIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  ChevronRightIcon,
  FunnelIcon,
  UserIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-indigo-100 text-indigo-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REJECTED: 'bg-gray-100 text-gray-800',
}

const statusFilters = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

export default function Bookings() {
  const [statusFilter, setStatusFilter] = useState('')
  const { user } = useAuthStore()
  
  const isProvider = user?.userType === 'PROVIDER'
  const isAdmin = user?.userType === 'ADMIN' || user?.userType === 'SUPER_ADMIN'
  const isCustomer = user?.userType === 'CUSTOMER'

  const { data, isLoading } = useQuery(
    ['myBookings', statusFilter],
    () => bookingsAPI.getMyBookings({ status: statusFilter, page: 0, size: 20 })
  )

  const bookings = data?.data?.data?.bookings || []
  
  // Get page title and description based on user type
  const getPageContent = () => {
    if (isProvider) {
      return {
        title: 'Service Requests',
        description: 'View and manage bookings from customers'
      }
    }
    if (isAdmin) {
      return {
        title: 'All Bookings',
        description: 'View and manage all system bookings'
      }
    }
    return {
      title: 'My Bookings',
      description: 'View and manage your service bookings'
    }
  }
  
  const pageContent = getPageContent()

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-2xl"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className={`bg-gradient-to-r ${isProvider ? 'from-emerald-600 to-emerald-800' : isAdmin ? 'from-purple-600 to-purple-800' : 'from-primary-600 to-primary-800'} text-white py-12`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">{pageContent.title}</h1>
          <p className={`${isProvider ? 'text-emerald-100' : isAdmin ? 'text-purple-100' : 'text-primary-100'}`}>{pageContent.description}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <FunnelIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === filter.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <Link
                key={booking.bookingId}
                to={`/bookings/${booking.bookingId}`}
                className={`card p-5 block hover:shadow-lg transition-all animate-slideUp stagger-${(index % 3) + 1}`}
                style={{ animationFillMode: 'both' }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${isProvider ? 'from-emerald-400 to-emerald-600' : 'from-primary-400 to-primary-600'} rounded-xl flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                      {booking.service?.categoryName?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{booking.service?.serviceName}</h3>
                        <span className={`badge ${statusColors[booking.bookingStatus]}`}>
                          {booking.bookingStatus?.replace('_', ' ')}
                        </span>
                      </div>
                      
                      {/* Show different info based on user type */}
                      {isProvider ? (
                        // Provider sees customer info
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <UserIcon className="h-4 w-4" />
                          <span>Customer: <span className="font-medium text-gray-700">{booking.customer?.name}</span></span>
                          {booking.customer?.phone && <span>• {booking.customer.phone}</span>}
                        </div>
                      ) : isAdmin ? (
                        // Admin sees both customer and provider info
                        <div className="space-y-1 mt-1">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <UserIcon className="h-4 w-4" />
                            <span>Customer: <span className="font-medium text-gray-700">{booking.customer?.name}</span></span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <WrenchScrewdriverIcon className="h-4 w-4" />
                            <span>Provider: <span className="font-medium text-gray-700">{booking.provider?.businessName || booking.provider?.providerName}</span></span>
                          </div>
                        </div>
                      ) : (
                        // Customer sees provider info
                        <p className="text-sm text-gray-500 mt-1">
                          {booking.provider?.businessName || booking.provider?.providerName}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <CalendarDaysIcon className="h-4 w-4" />
                          <span>{format(new Date(booking.scheduledDate), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>{booking.scheduledTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`flex items-center ${isProvider ? 'text-emerald-600' : 'text-primary-600'}`}>
                        <CurrencyRupeeIcon className="h-4 w-4" />
                        <span className="font-bold">{booking.finalAmount || booking.estimatedAmount}</span>
                      </div>
                      <p className="text-xs text-gray-400">#{booking.bookingNumber}</p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <CalendarDaysIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isProvider ? 'No service requests yet' : 'No bookings found'}
            </h3>
            <p className="text-gray-500 mb-6">
              {statusFilter 
                ? 'No bookings match the selected filter' 
                : isProvider 
                  ? "You don't have any service requests yet"
                  : "You haven't made any bookings yet"
              }
            </p>
            {isCustomer && (
              <Link to="/categories" className="btn-primary">
                Browse Services
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
