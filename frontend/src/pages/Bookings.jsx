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
  WrenchScrewdriverIcon,
  MagnifyingGlassIcon,
  XMarkIcon
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
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const { user, activeRole } = useAuthStore()
  
  const viewRole = activeRole || 'CUSTOMER'
  const isProvider = viewRole === 'PROVIDER'
  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN') || user?.userType === 'ADMIN' || user?.userType === 'SUPER_ADMIN'
  const isCustomer = viewRole === 'CUSTOMER'

  // Regular bookings query -- reset on role switch
  const { data, isLoading } = useQuery(
    ['myBookings', statusFilter, viewRole],
    () => bookingsAPI.getMyBookings({
      status: statusFilter || undefined,
      role: viewRole,
      page: 0,
      size: 20,
    }),
    { enabled: !isSearching, keepPreviousData: false, staleTime: 0 }
  )

  // Search query
  const { data: searchData, isLoading: searchLoading } = useQuery(
    ['searchBookings', searchQuery, viewRole],
    () => bookingsAPI.search(searchQuery, { role: viewRole, page: 0, size: 20 }),
    { enabled: isSearching && searchQuery.length > 0, keepPreviousData: false, staleTime: 0 }
  )

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setIsSearching(true)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setIsSearching(false)
  }

  const bookings = isSearching 
    ? (searchData?.data?.data?.bookings || [])
    : (data?.data?.data?.bookings || [])
  
  const loading = isSearching ? searchLoading : isLoading
  
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
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (!e.target.value) {
                    setIsSearching(false)
                  }
                }}
                placeholder={isProvider ? "Search by service, customer name, or booking #..." : "Search by service, provider, or booking #..."}
                className="input pl-12 pr-10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            <button type="submit" className="btn-primary px-6">
              Search
            </button>
          </div>
          {isSearching && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <span>Showing results for "{searchQuery}"</span>
              <button onClick={clearSearch} className="text-primary-600 hover:underline">
                Clear search
              </button>
            </div>
          )}
        </form>

        {/* Filters - only show when not searching */}
        {!isSearching && (
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
        )}

        {/* Loading State */}
        {loading && (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-2xl"></div>
            ))}
          </div>
        )}

        {/* Bookings List */}
        {!loading && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((booking, index) => {
              const iAmCustomer = booking.customer?.userId === user?.userId
              const iAmProvider = !iAmCustomer && !isAdmin
              return (
              <Link
                key={booking.bookingId}
                to={`/bookings/${booking.bookingId}`}
                className={`card p-5 block hover:shadow-lg transition-all animate-slideUp stagger-${(index % 3) + 1}`}
                style={{ animationFillMode: 'both' }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${iAmProvider ? 'from-emerald-400 to-emerald-600' : 'from-primary-400 to-primary-600'} rounded-xl flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                      {booking.service?.categoryName?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{booking.service?.serviceName}</h3>
                        <span className={`badge ${statusColors[booking.bookingStatus]}`}>
                          {booking.bookingStatus?.replace('_', ' ')}
                        </span>
                      </div>
                      
                      {/* Show the other party's info based on actual booking relationship */}
                      {isAdmin ? (
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
                      ) : iAmProvider ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <UserIcon className="h-4 w-4" />
                          <span>Customer: <span className="font-medium text-gray-700">{booking.customer?.name}</span></span>
                        </div>
                      ) : (
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
                      <div className={`flex items-center ${iAmProvider ? 'text-emerald-600' : 'text-primary-600'}`}>
                        <CurrencyRupeeIcon className="h-4 w-4" />
                        <span className="font-bold">{booking.finalAmount || booking.estimatedAmount}</span>
                      </div>
                      <p className="text-xs text-gray-400">#{booking.bookingNumber}</p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </Link>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && bookings.length === 0 && (
          <div className="text-center py-16">
            {isSearching ? (
              <>
                <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-500 mb-6">
                  No bookings match "{searchQuery}"
                </p>
                <button onClick={clearSearch} className="btn-secondary">
                  Clear Search
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
