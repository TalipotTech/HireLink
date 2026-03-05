import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery } from 'react-query'
import { useAuthStore } from '../../context/authStore'
import { categoriesAPI } from '../../services/api'
import LocationPicker from '../../components/LocationPicker'
import toast from 'react-hot-toast'
import { 
  EyeIcon, 
  EyeSlashIcon, 
  PhoneIcon, 
  LockClosedIcon, 
  UserIcon,
  EnvelopeIcon,
  WrenchScrewdriverIcon,
  MapPinIcon,
  TagIcon
} from '@heroicons/react/24/outline'

export default function ProviderRegister() {
  const navigate = useNavigate()
  const { register: registerUser, isLoading, error, clearError } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm()

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery(
    'categories',
    categoriesAPI.getAll
  )

  const categories = categoriesData?.data?.data || []

  const handleLocationSelect = (location) => {
    setSelectedLocation(location)
    if (location) {
      setValue('baseAddress', location.address || '')
      setValue('basePincode', location.pincode || '')
    }
  }

  const onSubmit = async (data) => {
    clearError()
    
    const payload = {
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      password: data.password,
      userType: 'PROVIDER',
      categoryId: data.categoryId ? Number(data.categoryId) : undefined,
      baseAddress: data.baseAddress || undefined,
      basePincode: data.basePincode || undefined,
      baseLatitude: selectedLocation?.lat || undefined,
      baseLongitude: selectedLocation?.lng || undefined,
      serviceCity: data.serviceCity || undefined,
      serviceState: data.serviceState || undefined,
    }

    const result = await registerUser(payload)
    if (result.success) {
      toast.success('Provider account created successfully!')
      navigate('/')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <WrenchScrewdriverIcon className="h-4 w-4" />
          Service Provider
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Create Provider Account</h2>
        <p className="text-gray-500 mt-2">Start offering your services on HireLink</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Basic Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text"
              {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } })}
              className={`input pl-12 ${errors.name ? 'input-error' : ''}`}
              placeholder="Your full name" />
          </div>
          {errors.name && <p className="text-red-500 text-sm mt-1.5">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input type="tel"
              {...register('phone', { required: 'Phone number is required', pattern: { value: /^[+]?[0-9]{10,15}$/, message: 'Enter a valid phone number' } })}
              className={`input pl-12 ${errors.phone ? 'input-error' : ''}`}
              placeholder="+91 9876543210" />
          </div>
          {errors.phone && <p className="text-red-500 text-sm mt-1.5">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input type="email"
              {...register('email', { pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Enter a valid email address' } })}
              className={`input pl-12 ${errors.email ? 'input-error' : ''}`}
              placeholder="provider@example.com" />
          </div>
          {errors.email && <p className="text-red-500 text-sm mt-1.5">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input type={showPassword ? 'text' : 'password'}
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } })}
              className={`input pl-12 pr-12 ${errors.password ? 'input-error' : ''}`}
              placeholder="Create a password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-1.5">{errors.password.message}</p>}
        </div>

        {/* Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-emerald-600 font-medium">Service Details</span>
          </div>
        </div>

        {/* Service Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <TagIcon className="h-4 w-4 inline mr-1 -mt-0.5 text-emerald-600" />
            Service Category
          </label>
          <select
            {...register('categoryId', { required: 'Please select a service category' })}
            className={`input ${errors.categoryId ? 'input-error' : ''}`}
            disabled={categoriesLoading}
          >
            <option value="">
              {categoriesLoading ? 'Loading categories...' : 'Select your service category'}
            </option>
            {categories.map((cat) => (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.categoryName}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="text-red-500 text-sm mt-1.5">{errors.categoryId.message}</p>}
        </div>

        {/* Working Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPinIcon className="h-4 w-4 inline mr-1 -mt-0.5 text-emerald-600" />
            Working Location
          </label>
          
          <LocationPicker
            onLocationSelect={handleLocationSelect}
            initialLocation={selectedLocation}
            className="mb-3"
          />

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Base Address</label>
              <textarea
                {...register('baseAddress', { required: 'Working address is required' })}
                className={`input ${errors.baseAddress ? 'input-error' : ''}`}
                rows={2}
                placeholder="Your base/working area address"
              />
              {errors.baseAddress && <p className="text-red-500 text-sm mt-1">{errors.baseAddress.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">City</label>
                <input type="text"
                  {...register('serviceCity')}
                  className="input"
                  placeholder="City" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Pincode</label>
                <input type="text"
                  {...register('basePincode', {
                    required: 'Pincode is required',
                    pattern: { value: /^[0-9]{6}$/, message: 'Invalid 6-digit pincode' }
                  })}
                  className={`input ${errors.basePincode ? 'input-error' : ''}`}
                  placeholder="6-digit pincode" />
                {errors.basePincode && <p className="text-red-500 text-sm mt-1">{errors.basePincode.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">State</label>
              <input type="text"
                {...register('serviceState')}
                className="input"
                placeholder="State" />
            </div>
          </div>
        </div>

        <div className="flex items-start">
          <input type="checkbox"
            {...register('terms', { required: 'You must accept the terms' })}
            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
          <label className="ml-2 text-sm text-gray-600">
            I agree to the <a href="#" className="text-emerald-600 hover:underline">Terms of Service</a> and <a href="#" className="text-emerald-600 hover:underline">Privacy Policy</a>
          </label>
        </div>
        {errors.terms && <p className="text-red-500 text-sm">{errors.terms.message}</p>}

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">{error}</div>}

        <button type="submit" disabled={isLoading}
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl py-3.5 text-lg font-medium transition-all mt-6">
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating account...
            </span>
          ) : 'Create Provider Account'}
        </button>
      </form>

      <p className="text-center text-gray-600 mt-8">
        Already have an account?{' '}
        <Link to="/provider/login" className="text-emerald-600 font-medium hover:underline">Sign in</Link>
      </p>

      <div className="mt-4 text-center">
        <Link to="/customer/register" className="text-sm text-primary-600 font-medium hover:underline">
          Looking for services? Register as a customer
        </Link>
      </div>
    </div>
  )
}
