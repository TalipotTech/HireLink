import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'react-query'
import { useForm } from 'react-hook-form'
import { servicesAPI, bookingsAPI, userAPI } from '../services/api'
import { format, addDays } from 'date-fns'
import toast from 'react-hot-toast'
import { 
  CalendarDaysIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  MapPinIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import LocationPicker from '../components/LocationPicker'

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'
]

const urgencyLevels = [
  { value: 'LOW', label: 'Low', description: 'Can wait a few days' },
  { value: 'MEDIUM', label: 'Medium', description: 'Prefer soon' },
  { value: 'HIGH', label: 'High', description: 'Need it quickly' },
  { value: 'EMERGENCY', label: 'Emergency', description: 'Urgent issue' },
]

export default function BookService() {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm()

  const { data: serviceData, isLoading: serviceLoading } = useQuery(
    ['service', serviceId],
    () => servicesAPI.getById(serviceId)
  )

  const { data: addressData } = useQuery('addresses', userAPI.getAddresses)

  const bookMutation = useMutation(
    (data) => bookingsAPI.create(data),
    {
      onSuccess: (response) => {
        toast.success('Booking created successfully!')
        navigate(`/bookings/${response.data.data.bookingId}`)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create booking')
      }
    }
  )

  const service = serviceData?.data?.data
  const addresses = addressData?.data?.data || []

  // Handle location selection from LocationPicker
  const handleLocationSelect = (location) => {
    setSelectedLocation(location)
    if (location) {
      // Auto-populate address fields
      if (location.address) {
        setValue('address', location.address)
      }
      if (location.pincode) {
        setValue('pincode', location.pincode)
      }
    }
  }

  // Generate next 14 days
  const dateOptions = [...Array(14)].map((_, i) => {
    const date = addDays(new Date(), i + 1)
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEE'),
      date: format(date, 'd'),
      month: format(date, 'MMM'),
    }
  })

  const onSubmit = (data) => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select a date and time')
      return
    }

    const bookingData = {
      serviceId: parseInt(serviceId),
      providerId: service.provider.providerId,
      scheduledDate: selectedDate,
      scheduledTime: selectedTime + ':00',
      serviceAddress: data.address,
      serviceLandmark: data.landmark,
      servicePincode: data.pincode,
      // Include location coordinates if available
      serviceLatitude: selectedLocation?.latitude || null,
      serviceLongitude: selectedLocation?.longitude || null,
      serviceCity: selectedLocation?.city || null,
      serviceState: selectedLocation?.state || null,
      issueTitle: data.issueTitle,
      issueDescription: data.issueDescription,
      urgencyLevel: data.urgencyLevel,
    }

    bookMutation.mutate(bookingData)
  }

  if (serviceLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="bg-gray-200 h-64 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Service not found</h2>
        <Link to="/categories" className="btn-primary">Browse Services</Link>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to={`/services/${serviceId}`} className="hover:text-primary-600">Service</Link>
            <ChevronRightIcon className="h-4 w-4" />
            <span className="text-gray-900">Book Service</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Book Service</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Date Selection */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CalendarDaysIcon className="h-5 w-5 text-primary-600" />
                  Select Date
                </h2>
                <div className="grid grid-cols-7 gap-2">
                  {dateOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedDate(option.value)}
                      className={`p-3 rounded-xl text-center transition-all ${
                        selectedDate === option.value
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <p className="text-xs">{option.label}</p>
                      <p className="text-lg font-semibold">{option.date}</p>
                      <p className="text-xs">{option.month}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-primary-600" />
                  Select Time
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`p-3 rounded-xl text-center font-medium transition-all ${
                        selectedTime === time
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-primary-600" />
                  Service Address
                </h2>
                
                {/* Location Picker */}
                <LocationPicker 
                  onLocationSelect={handleLocationSelect}
                  initialLocation={selectedLocation}
                  className="mb-4"
                />
                
                {addresses.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-2">Or select from saved addresses</label>
                    <select 
                      className="input"
                      onChange={(e) => {
                        const addr = addresses.find(a => a.addressId === parseInt(e.target.value))
                        if (addr) {
                          setValue('address', `${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}`)
                          setValue('pincode', addr.pincode)
                          setValue('landmark', addr.landmark || '')
                          // Clear location picker selection when using saved address
                          setSelectedLocation(null)
                        }
                      }}
                    >
                      <option value="">Select saved address</option>
                      {addresses.map((addr) => (
                        <option key={addr.addressId} value={addr.addressId}>
                          {addr.addressLine1}, {addr.city} - {addr.pincode}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Full Address *</label>
                    <textarea
                      {...register('address', { required: 'Address is required' })}
                      className={`input ${errors.address ? 'input-error' : ''}`}
                      rows={2}
                      placeholder="Enter your complete address"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Landmark</label>
                      <input
                        {...register('landmark')}
                        className="input"
                        placeholder="Near..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Pincode *</label>
                      <input
                        {...register('pincode', { 
                          required: 'Pincode is required',
                          pattern: { value: /^[0-9]{6}$/, message: 'Invalid pincode' }
                        })}
                        className={`input ${errors.pincode ? 'input-error' : ''}`}
                        placeholder="6-digit pincode"
                      />
                      {errors.pincode && (
                        <p className="text-red-500 text-sm mt-1">{errors.pincode.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Issue Details */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Issue Details (Optional)</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Issue Title</label>
                    <input
                      {...register('issueTitle')}
                      className="input"
                      placeholder="Brief description of the issue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Detailed Description</label>
                    <textarea
                      {...register('issueDescription')}
                      className="input"
                      rows={3}
                      placeholder="Provide more details about the issue..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Urgency Level</label>
                    <div className="grid grid-cols-2 gap-2">
                      {urgencyLevels.map((level) => (
                        <label
                          key={level.value}
                          className="flex items-center p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100"
                        >
                          <input
                            type="radio"
                            {...register('urgencyLevel')}
                            value={level.value}
                            className="mr-3"
                            defaultChecked={level.value === 'MEDIUM'}
                          />
                          <div>
                            <p className="font-medium text-sm">{level.label}</p>
                            <p className="text-xs text-gray-500">{level.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={bookMutation.isLoading || !selectedDate || !selectedTime}
                className="w-full btn-primary py-4 text-lg"
              >
                {bookMutation.isLoading ? 'Creating Booking...' : 'Confirm Booking'}
              </button>
            </form>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4">Booking Summary</h2>
              
              {/* Service */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-semibold">
                  {service.category?.categoryName?.charAt(0) || 'S'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{service.serviceName}</p>
                  <p className="text-sm text-gray-500">{service.category?.categoryName}</p>
                </div>
              </div>

              {/* Provider */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {service.provider?.providerName?.charAt(0) || 'P'}
                </div>
                <div>
                  <p className="text-sm font-medium">{service.provider?.businessName || service.provider?.providerName}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <StarIconSolid className="h-3 w-3 text-amber-400" />
                    <span>{service.provider?.averageRating?.toFixed(1) || '5.0'}</span>
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-2 mb-4 pb-4 border-b text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">
                    {selectedDate ? format(new Date(selectedDate), 'MMM d, yyyy') : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time</span>
                  <span className="font-medium">{selectedTime || '-'}</span>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Service Price</span>
                  <div className="flex items-center text-gray-700">
                    <CurrencyRupeeIcon className="h-5 w-5" />
                    <span className="text-xl font-bold">{service.basePrice}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Paid directly to the provider
                </p>
                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Booking Charge</span>
                  <div className="flex items-center text-primary-600">
                    <CurrencyRupeeIcon className="h-5 w-5" />
                    <span className="text-2xl font-bold">8</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Platform fee collected at confirmation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
