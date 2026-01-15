import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { bookingsAPI } from '../services/api'
import { useAuthStore } from '../context/authStore'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { 
  CalendarDaysIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  MapPinIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  UserIcon,
  EnvelopeIcon,
  PlayIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ACCEPTED: 'bg-blue-100 text-blue-800 border-blue-200',
  CONFIRMED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  REJECTED: 'bg-gray-100 text-gray-800 border-gray-200',
}

export default function BookingDetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [workSummary, setWorkSummary] = useState('')

  const isProvider = user?.userType === 'PROVIDER'
  const isAdmin = user?.userType === 'ADMIN' || user?.userType === 'SUPER_ADMIN'
  const isCustomer = user?.userType === 'CUSTOMER'

  const { data, isLoading } = useQuery(
    ['booking', id],
    () => bookingsAPI.getById(id)
  )

  const cancelMutation = useMutation(
    () => bookingsAPI.cancel(id, cancelReason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['booking', id])
        toast.success('Booking cancelled successfully')
        setShowCancelModal(false)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to cancel booking')
      }
    }
  )

  const statusUpdateMutation = useMutation(
    (data) => bookingsAPI.updateStatus(id, data),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['booking', id])
        const statusMessages = {
          ACCEPTED: 'Booking accepted!',
          REJECTED: 'Booking rejected',
          CONFIRMED: 'Booking confirmed!',
          IN_PROGRESS: 'Service started!',
          COMPLETED: 'Service completed!'
        }
        toast.success(statusMessages[variables.status] || 'Status updated')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update status')
      }
    }
  )

  const reviewMutation = useMutation(
    (data) => bookingsAPI.addReview(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['booking', id])
        toast.success('Review submitted successfully')
        setShowReviewModal(false)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit review')
      }
    }
  )

  const booking = data?.data?.data

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="bg-gray-200 h-64 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking not found</h2>
        <Link to="/bookings" className="btn-primary">View All Bookings</Link>
      </div>
    )
  }

  const canCancel = ['PENDING', 'ACCEPTED', 'CONFIRMED'].includes(booking.bookingStatus)
  const canReview = booking.bookingStatus === 'COMPLETED' && !booking.userRating && isCustomer
  
  // Provider actions based on current status
  const canAccept = isProvider && booking.bookingStatus === 'PENDING'
  const canReject = isProvider && booking.bookingStatus === 'PENDING'
  const canConfirm = isProvider && booking.bookingStatus === 'ACCEPTED'
  const canStart = isProvider && booking.bookingStatus === 'CONFIRMED'
  const canComplete = isProvider && booking.bookingStatus === 'IN_PROGRESS'

  return (
    <div className="animate-fadeIn">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/bookings" className="text-sm text-primary-600 hover:underline mb-2 block">&larr; Back to Bookings</Link>
            <h1 className="text-2xl font-bold text-gray-900">Booking #{booking.bookingNumber}</h1>
          </div>
          <span className={`badge px-4 py-2 text-sm font-medium border ${statusColors[booking.bookingStatus]}`}>
            {booking.bookingStatus?.replace('_', ' ')}
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Details */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Service Details</h2>
              <Link to={`/services/${booking.service?.serviceId}`} className="flex items-center gap-4 group">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                  {booking.service?.categoryName?.charAt(0) || 'S'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {booking.service?.serviceName}
                  </h3>
                  <p className="text-sm text-gray-500">{booking.service?.categoryName}</p>
                </div>
              </Link>

              {booking.issueDescription && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Issue Description</h4>
                  <p className="text-gray-600">{booking.issueDescription}</p>
                </div>
              )}
            </div>

            {/* Schedule & Location */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Schedule & Location</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{format(new Date(booking.scheduledDate), 'EEEE, MMMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">{booking.scheduledTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Service Address</p>
                    <p className="font-medium">{booking.serviceAddress}</p>
                    {booking.serviceLandmark && (
                      <p className="text-sm text-gray-500">Near {booking.serviceLandmark}</p>
                    )}
                    <p className="text-sm text-gray-500">{booking.servicePincode}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Show Provider Details for Customers, Customer Details for Providers */}
            {isProvider ? (
              // Provider sees Customer Details
              <div className="card p-6 border-2 border-emerald-200 bg-emerald-50/50">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-emerald-600" />
                  Customer Details
                </h2>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {booking.customer?.name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {booking.customer?.name}
                    </h3>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {booking.customer?.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <PhoneIcon className="h-4 w-4" />
                      <a href={`tel:${booking.customer.phone}`} className="hover:text-emerald-600">{booking.customer.phone}</a>
                    </div>
                  )}
                  {booking.customer?.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <EnvelopeIcon className="h-4 w-4" />
                      <a href={`mailto:${booking.customer.email}`} className="hover:text-emerald-600">{booking.customer.email}</a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Customer/Admin sees Provider Details
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Service Provider</h2>
                <Link to={`/providers/${booking.provider?.providerId}`} className="flex items-center gap-4 group">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {booking.provider?.providerName?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {booking.provider?.businessName || booking.provider?.providerName}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <StarIconSolid className="h-4 w-4 text-amber-400" />
                      <span>{booking.provider?.averageRating?.toFixed(1) || '5.0'}</span>
                      <span>• {booking.provider?.completedBookings || 0} jobs</span>
                    </div>
                  </div>
                </Link>
                {booking.provider?.phone && (
                  <div className="mt-4 flex items-center gap-2 text-gray-600">
                    <PhoneIcon className="h-4 w-4" />
                    <span>{booking.provider.phone}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Admin also sees Customer Details */}
            {isAdmin && (
              <div className="card p-6 border-2 border-purple-200 bg-purple-50/50">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-purple-600" />
                  Customer Details
                </h2>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {booking.customer?.name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{booking.customer?.name}</h3>
                    {booking.customer?.phone && (
                      <p className="text-sm text-gray-500">{booking.customer.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Work Summary (if completed) */}
            {booking.workSummary && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Work Summary</h2>
                <p className="text-gray-600">{booking.workSummary}</p>
              </div>
            )}

            {/* Cancellation Info */}
            {booking.bookingStatus === 'CANCELLED' && booking.cancellationReason && (
              <div className="card p-6 bg-red-50 border-red-200">
                <h2 className="font-semibold text-red-800 mb-2">Cancellation Reason</h2>
                <p className="text-red-700">{booking.cancellationReason}</p>
                <p className="text-sm text-red-600 mt-2">
                  Cancelled by {booking.cancelledBy?.toLowerCase()} on {format(new Date(booking.cancelledAt), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4">Payment Summary</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Service Charge</span>
                  <div className="flex items-center">
                    <CurrencyRupeeIcon className="h-4 w-4" />
                    <span>{booking.estimatedAmount}</span>
                  </div>
                </div>
                {booking.materialCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Materials</span>
                    <div className="flex items-center">
                      <CurrencyRupeeIcon className="h-4 w-4" />
                      <span>{booking.materialCost}</span>
                    </div>
                  </div>
                )}
                {booking.travelCharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Travel</span>
                    <div className="flex items-center">
                      <CurrencyRupeeIcon className="h-4 w-4" />
                      <span>{booking.travelCharge}</span>
                    </div>
                  </div>
                )}
                {booking.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <div className="flex items-center">
                      -<CurrencyRupeeIcon className="h-4 w-4" />
                      <span>{booking.discountAmount}</span>
                    </div>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>Total</span>
                  <div className="flex items-center text-primary-600">
                    <CurrencyRupeeIcon className="h-4 w-4" />
                    <span>{booking.finalAmount || booking.estimatedAmount}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                {/* Provider Actions */}
                {canAccept && (
                  <button
                    onClick={() => statusUpdateMutation.mutate({ status: 'ACCEPTED' })}
                    disabled={statusUpdateMutation.isLoading}
                    className="w-full btn bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    Accept Request
                  </button>
                )}
                {canReject && (
                  <button
                    onClick={() => statusUpdateMutation.mutate({ status: 'REJECTED', reason: 'Service unavailable' })}
                    disabled={statusUpdateMutation.isLoading}
                    className="w-full btn-secondary text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-2"
                  >
                    <XCircleIcon className="h-5 w-5" />
                    Reject Request
                  </button>
                )}
                {canConfirm && (
                  <button
                    onClick={() => statusUpdateMutation.mutate({ status: 'CONFIRMED' })}
                    disabled={statusUpdateMutation.isLoading}
                    className="w-full btn bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    Confirm Booking
                  </button>
                )}
                {canStart && (
                  <button
                    onClick={() => statusUpdateMutation.mutate({ status: 'IN_PROGRESS' })}
                    disabled={statusUpdateMutation.isLoading}
                    className="w-full btn bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <PlayIcon className="h-5 w-5" />
                    Start Service
                  </button>
                )}
                {canComplete && (
                  <button
                    onClick={() => statusUpdateMutation.mutate({ status: 'COMPLETED', workSummary: 'Service completed successfully' })}
                    disabled={statusUpdateMutation.isLoading}
                    className="w-full btn bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <CheckIcon className="h-5 w-5" />
                    Complete Service
                  </button>
                )}
                
                {/* Customer Actions */}
                {canReview && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <StarIcon className="h-5 w-5" />
                    Write a Review
                  </button>
                )}
                {canCancel && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-slideUp">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Booking</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to cancel this booking?</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              className="input mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 btn-secondary"
              >
                Keep Booking
              </button>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isLoading}
                className="flex-1 btn bg-red-600 text-white hover:bg-red-700"
              >
                {cancelMutation.isLoading ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-slideUp">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Write a Review</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    {star <= rating ? (
                      <StarIconSolid className="h-8 w-8 text-amber-400" />
                    ) : (
                      <StarIcon className="h-8 w-8 text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience..."
              className="input mb-4"
              rows={4}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => reviewMutation.mutate({ overallRating: rating, reviewText })}
                disabled={reviewMutation.isLoading}
                className="flex-1 btn-primary"
              >
                {reviewMutation.isLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
