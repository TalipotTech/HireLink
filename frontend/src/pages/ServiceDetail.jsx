import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { servicesAPI } from '../services/api'
import { useAuthStore } from '../context/authStore'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { 
  ClockIcon, 
  CurrencyRupeeIcon, 
  ChevronRightIcon,
  MapPinIcon,
  CheckCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export default function ServiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()

  const { data, isLoading } = useQuery(
    ['service', id],
    () => servicesAPI.getById(id)
  )

  const service = data?.data?.data

  // Only customers can book services
  const canBook = !isAuthenticated || user?.userType === 'CUSTOMER'

  const handleBookNow = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    navigate(`/book/${id}`)
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gray-200 h-48 rounded-2xl"></div>
              <div className="bg-gray-200 h-32 rounded-2xl"></div>
            </div>
            <div className="bg-gray-200 h-64 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Service not found</h2>
        <Link to="/categories" className="btn-primary">Browse Services</Link>
      </div>
    )
  }

  const provider = service.provider
  const category = service.category

  return (
    <div className="animate-fadeIn">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/categories" className="hover:text-primary-600">Services</Link>
            <ChevronRightIcon className="h-4 w-4" />
            <Link to={`/categories/${category?.categorySlug}`} className="hover:text-primary-600">{category?.categoryName}</Link>
            <ChevronRightIcon className="h-4 w-4" />
            <span className="text-gray-900">{service.serviceName}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Header */}
            <div className="card p-6 lg:p-8">
              <div className="flex items-center gap-2 text-sm text-primary-600 mb-3">
                <span className="badge-primary">{category?.categoryName}</span>
                {service.isFeatured && <span className="badge bg-amber-100 text-amber-800">Featured</span>}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">{service.serviceName}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-500 mb-6">
                <div className="flex items-center gap-1">
                  <StarIconSolid className="h-5 w-5 text-amber-400" />
                  <span className="font-medium text-gray-900">{service.averageRating?.toFixed(1) || '5.0'}</span>
                  <span>({service.totalReviews || 0} reviews)</span>
                </div>
                {service.estimatedDurationMinutes && (
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-5 w-5" />
                    <span>{service.estimatedDurationMinutes} minutes</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>{service.timesBooked || 0} bookings</span>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed">{service.serviceDescription}</p>

              {/* Highlights */}
              {service.serviceHighlights?.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold text-gray-900 mb-3">Service Highlights</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {service.serviceHighlights.map((highlight, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-600">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Materials */}
              {service.materialsIncluded && (
                <div className="mt-6 p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-2 text-green-700 font-medium">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>Materials Included</span>
                  </div>
                  {service.materialsDescription && (
                    <p className="mt-2 text-green-600 text-sm">{service.materialsDescription}</p>
                  )}
                </div>
              )}
            </div>

            {/* Provider Info */}
            <div className="card p-6 lg:p-8">
              <h2 className="font-semibold text-gray-900 text-lg mb-4">About the Provider</h2>
              <Link to={`/providers/${provider?.providerId}`} className="flex items-center gap-4 group">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {provider?.providerName?.charAt(0) || 'P'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {provider?.businessName || provider?.providerName}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <StarIconSolid className="h-4 w-4 text-amber-400" />
                      <span>{provider?.averageRating?.toFixed(1) || '5.0'}</span>
                    </div>
                    <span>•</span>
                    <span>{provider?.completedBookings || 0} jobs completed</span>
                  </div>
                </div>
              </Link>
              
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <ShieldCheckIcon className="h-5 w-5 text-green-500" />
                <span>Verified Professional</span>
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <div className="mb-6">
                <span className="text-sm text-gray-500 uppercase">Starting from</span>
                <div className="flex items-center text-primary-600 mt-1">
                  <CurrencyRupeeIcon className="h-6 w-6" />
                  <span className="text-3xl font-bold">{service.basePrice}</span>
                </div>
                {service.priceType !== 'FIXED' && (
                  <span className="text-sm text-gray-500">{service.priceType?.toLowerCase()}</span>
                )}
              </div>

              <div className="space-y-3 mb-6 text-sm">
                {service.estimatedDurationMinutes && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-medium">{service.estimatedDurationMinutes} mins</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Advance booking</span>
                  <span className="font-medium">{service.advanceBookingHours || 2} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cancellation</span>
                  <span className="font-medium">{service.cancellationHours || 4} hours notice</span>
                </div>
              </div>

              {canBook ? (
                <>
                  <button 
                    onClick={handleBookNow}
                    className="w-full btn-primary py-3.5 text-lg"
                  >
                    Book Now
                  </button>
                  <p className="text-center text-xs text-gray-500 mt-4">
                    Free cancellation up to {service.cancellationHours || 4} hours before
                  </p>
                </>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-600 text-sm">
                    {user?.userType === 'PROVIDER' ? 'Service providers cannot book services' : 'Only customers can book services'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
