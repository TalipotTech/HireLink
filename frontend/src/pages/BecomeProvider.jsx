import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery } from 'react-query'
import { useAuthStore } from '../context/authStore'
import { categoriesAPI } from '../services/api'
import LocationPicker from '../components/LocationPicker'
import toast from 'react-hot-toast'
import {
  WrenchScrewdriverIcon,
  MapPinIcon,
  TagIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

export default function BecomeProvider() {
  const navigate = useNavigate()
  const { becomeProvider, user, isLoading, error, clearError } = useAuthStore()
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm()

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery(
    'categories',
    categoriesAPI.getAll
  )

  const categories = categoriesData?.data?.data || []

  const providerStatus = user?.providerApplicationStatus

  if (user?.roles?.includes('PROVIDER') && providerStatus === 'VERIFIED') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're Already a Provider!</h2>
          <p className="text-gray-600 mb-6">Your provider profile is active. You can manage it from your dashboard.</p>
          <button onClick={() => navigate('/profile')} className="btn-primary px-8 py-3">
            Go to Profile
          </button>
        </div>
      </div>
    )
  }

  if (providerStatus === 'PENDING' || submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
          <ClockIcon className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Under Review</h2>
          <p className="text-gray-600 mb-6">
            Your provider application has been submitted and is pending admin approval.
            You will be able to offer services once approved.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary px-8 py-3">
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const isRejected = providerStatus === 'REJECTED'

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
      categoryId: data.categoryId ? Number(data.categoryId) : undefined,
      baseAddress: data.baseAddress,
      basePincode: data.basePincode,
      baseLatitude: selectedLocation?.lat || undefined,
      baseLongitude: selectedLocation?.lng || undefined,
      serviceCity: data.serviceCity || undefined,
      serviceState: data.serviceState || undefined,
    }

    const result = await becomeProvider(payload)
    if (result.success) {
      toast.success(result.message || 'Application submitted for review!')
      setSubmitted(true)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 sm:p-8 border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 ${
            isRejected ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {isRejected ? <XCircleIcon className="h-4 w-4" /> : <WrenchScrewdriverIcon className="h-4 w-4" />}
            {isRejected ? 'Reapply as Provider' : 'Become a Provider'}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isRejected ? 'Resubmit Your Application' : 'Start Offering Your Services'}
          </h2>
          <p className="text-gray-500 mt-2">
            {isRejected
              ? 'Your previous application was rejected. Update your details and try again.'
              : `Hi ${user?.name}, set up your provider profile to start earning on HireLink`}
          </p>
        </div>

        {isRejected && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
            <p className="text-sm text-red-700 font-medium">Your previous application was rejected. Please review your details and resubmit.</p>
          </div>
        )}

        {/* Benefits */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 mb-8">
          <h3 className="font-semibold text-emerald-800 mb-3">What you get as a provider:</h3>
          <ul className="space-y-2 text-sm text-emerald-700">
            {[
              'Get bookings from customers in your area',
              'Set your own prices and availability',
              'Build your reputation with reviews',
              'Keep using HireLink as a customer too!',
            ].map((benefit, i) => (
              <li key={i} className="flex items-center gap-2">
                <ArrowRightIcon className="h-3.5 w-3.5 flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">{error}</div>}

          <button type="submit" disabled={isLoading}
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl py-3.5 text-lg font-medium transition-all mt-4">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting application...
              </span>
            ) : isRejected ? 'Resubmit Application' : 'Submit Application'}
          </button>

          <p className="text-center text-xs text-gray-400 mt-3">
            Your application will be reviewed by our team. You'll be notified once approved.
          </p>
        </form>
      </div>
    </div>
  )
}
