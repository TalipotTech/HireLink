import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { categoriesAPI, servicesAPI, providersAPI, bookingsAPI } from '../services/api'
import { useAuthStore } from '../context/authStore'
import { format } from 'date-fns'
import { 
  MagnifyingGlassIcon, 
  BoltIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  HomeModernIcon,
  ShieldCheckIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  StarIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ACCEPTED: 'bg-blue-100 text-blue-800 border-blue-200',
  CONFIRMED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
}

const categoryIcons = {
  electrical: BoltIcon,
  plumbing: WrenchScrewdriverIcon,
  cleaning: SparklesIcon,
  carpentry: HomeModernIcon,
}

const categoryColors = {
  electrical: 'bg-amber-100 text-amber-600',
  plumbing: 'bg-blue-100 text-blue-600',
  cleaning: 'bg-emerald-100 text-emerald-600',
  carpentry: 'bg-orange-100 text-orange-600',
}

const features = [
  { 
    title: 'Verified Professionals', 
    description: 'All service providers are KYC verified and background checked',
    icon: ShieldCheckIcon,
    color: 'bg-green-100 text-green-600'
  },
  { 
    title: 'On-Time Service', 
    description: 'Guaranteed punctual arrival at your scheduled time',
    icon: ClockIcon,
    color: 'bg-blue-100 text-blue-600'
  },
  { 
    title: 'Transparent Pricing', 
    description: 'No hidden charges, know the cost upfront',
    icon: CurrencyRupeeIcon,
    color: 'bg-purple-100 text-purple-600'
  },
  { 
    title: 'Quality Assurance', 
    description: 'Satisfaction guaranteed with every service',
    icon: StarIcon,
    color: 'bg-amber-100 text-amber-600'
  },
]

export default function Home() {
  const { isAuthenticated, user } = useAuthStore()
  const { data: categoriesData } = useQuery('categories', categoriesAPI.getAll)
  const { data: featuredProviders } = useQuery('featuredProviders', providersAPI.getFeatured)
  const { data: recentBookingsData } = useQuery(
    'recentBookings', 
    () => bookingsAPI.getRecent(3),
    { enabled: isAuthenticated && (user?.userType === 'CUSTOMER' || user?.userType === 'PROVIDER') }
  )
  
  const categories = categoriesData?.data?.data?.slice(0, 8) || []
  const providers = featuredProviders?.data?.data?.slice(0, 4) || []
  const recentBookings = recentBookingsData?.data?.data || []
  
  const isProvider = user?.userType === 'PROVIDER'
  const isCustomer = user?.userType === 'CUSTOMER'

  return (
    <div className="animate-fadeIn">
      {/* Recent Bookings Section - for logged in users */}
      {isAuthenticated && (isCustomer || isProvider) && recentBookings.length > 0 && (
        <section className={`py-6 ${isProvider ? 'bg-emerald-50' : 'bg-primary-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${isProvider ? 'text-emerald-900' : 'text-primary-900'}`}>
                {isProvider ? '📋 Recent Service Requests' : '📋 Your Recent Bookings'}
              </h2>
              <Link 
                to="/bookings" 
                className={`text-sm font-medium ${isProvider ? 'text-emerald-600 hover:text-emerald-700' : 'text-primary-600 hover:text-primary-700'} flex items-center gap-1`}
              >
                View all <ChevronRightIcon className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {recentBookings.map((booking) => (
                <Link
                  key={booking.bookingId}
                  to={`/bookings/${booking.bookingId}`}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 ${isProvider ? 'bg-emerald-100' : 'bg-primary-100'} rounded-lg flex items-center justify-center`}>
                        <CalendarDaysIcon className={`h-5 w-5 ${isProvider ? 'text-emerald-600' : 'text-primary-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">{booking.service?.serviceName}</h3>
                        <p className="text-xs text-gray-500">
                          {format(new Date(booking.scheduledDate), 'MMM d')} • {booking.scheduledTime}
                        </p>
                      </div>
                    </div>
                    <span className={`badge text-xs ${statusColors[booking.bookingStatus]}`}>
                      {booking.bookingStatus?.replace('_', ' ')}
                    </span>
                  </div>
                  {isProvider ? (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                      <UserIcon className="h-3 w-3" />
                      <span>{booking.customer?.name}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">
                      {booking.provider?.businessName || booking.provider?.providerName}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900"></div>
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Expert Home Services at Your 
              <span className="block text-accent-400">Doorstep</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-10 leading-relaxed">
              Connect with verified local professionals for electrical, plumbing, cleaning, 
              and more. Book instantly, pay securely, get it done right.
            </p>
            
            {/* Search Bar */}
            <div className="bg-white rounded-2xl p-2 shadow-2xl shadow-black/10 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
              <div className="flex-1 flex items-center px-4">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="What service do you need?"
                  className="w-full px-3 py-3 text-gray-900 placeholder-gray-400 focus:outline-none text-lg"
                />
              </div>
              <button className="btn-accent px-8 py-3 text-lg">
                Search
              </button>
            </div>

            {/* Quick stats */}
            <div className="mt-12 grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">500+</p>
                <p className="text-primary-200 text-sm">Providers</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">10K+</p>
                <p className="text-primary-200 text-sm">Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">4.8★</p>
                <p className="text-primary-200 text-sm">Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto fill-gray-50">
            <path d="M0,96L60,90.7C120,85,240,75,360,74.7C480,75,600,85,720,90.7C840,96,960,96,1080,90.7C1200,85,1320,75,1380,69.3L1440,64L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path>
          </svg>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">Popular Services</h2>
            <p className="section-subtitle">Choose from our wide range of home services</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            {categories.map((category, index) => {
              const Icon = categoryIcons[category.categorySlug] || Squares2X2Icon
              const colorClass = categoryColors[category.categorySlug] || 'bg-gray-100 text-gray-600'
              
              return (
                <Link 
                  key={category.categoryId}
                  to={`/categories/${category.categorySlug}`}
                  className={`card-hover p-6 text-center animate-slideUp stagger-${index + 1}`}
                  style={{ animationFillMode: 'both' }}
                >
                  <div className={`w-16 h-16 mx-auto rounded-2xl ${colorClass} flex items-center justify-center mb-4`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{category.categoryName}</h3>
                  {category.serviceCount > 0 && (
                    <p className="text-sm text-gray-500 mt-1">{category.serviceCount} services</p>
                  )}
                </Link>
              )
            })}
          </div>
          
          <div className="text-center mt-10">
            <Link to="/categories" className="btn-secondary inline-flex items-center gap-2">
              View All Services
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">Why Choose HireLink?</h2>
            <p className="section-subtitle">We ensure quality service every time</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`text-center p-6 animate-slideUp stagger-${index + 1}`}
                style={{ animationFillMode: 'both' }}
              >
                <div className={`w-16 h-16 mx-auto ${feature.color} rounded-2xl flex items-center justify-center mb-4`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Providers */}
      {providers.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="section-title">Top Rated Providers</h2>
              <p className="section-subtitle">Trusted professionals with excellent reviews</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {providers.map((provider, index) => (
                <Link 
                  key={provider.providerId}
                  to={`/providers/${provider.providerId}`}
                  className={`card-hover p-6 animate-slideUp stagger-${index + 1}`}
                  style={{ animationFillMode: 'both' }}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {provider.providerName?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{provider.businessName || provider.providerName}</h3>
                      <div className="flex items-center gap-1 text-sm">
                        <StarIconSolid className="h-4 w-4 text-amber-400" />
                        <span className="font-medium">{provider.averageRating?.toFixed(1) || '5.0'}</span>
                        <span className="text-gray-400">({provider.totalReviews || 0})</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">{provider.completedBookings || 0} jobs completed</p>
                  {provider.serviceCategories?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {provider.serviceCategories.slice(0, 2).map((cat, i) => (
                        <span key={i} className="badge-primary">{cat}</span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary-50 to-primary-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Book a service in 3 easy steps</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              { step: '1', title: 'Choose a Service', desc: 'Browse our categories and select the service you need' },
              { step: '2', title: 'Book a Time', desc: 'Pick a convenient date and time for the service' },
              { step: '3', title: 'Get It Done', desc: 'Our verified professional arrives and completes the job' },
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-primary-500/30">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
                
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-primary-300"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-gradient-to-r from-accent-500 to-accent-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '30px 30px'}}></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-accent-100 mb-8 text-lg">
            Join thousands of satisfied customers who trust HireLink for their home service needs.
          </p>
          <Link to="/register" className="btn bg-white text-accent-600 hover:bg-accent-50 px-8 py-3 text-lg shadow-xl">
            Sign Up Now - It's Free
          </Link>
        </div>
      </section>
    </div>
  )
}

import { Squares2X2Icon } from '@heroicons/react/24/outline'
