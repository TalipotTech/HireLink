import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authAPI } from '../../services/api'
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setError('')
    setIsLoading(true)
    try {
      await authAPI.forgotPassword({ email: data.email })
      setEmailSent(true)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Something went wrong. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="animate-fadeIn">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
          <p className="text-gray-500 mb-6">
            If an account exists with that email, we've sent a link to reset your password. The link expires in 1 hour.
          </p>
          <Link to="/login" className="inline-block w-full btn-primary py-3 text-lg">
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <Link to="/login" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Sign In
        </Link>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Forgot Password</h2>
        <p className="text-gray-500 mt-2">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Za-z0-9+_.-]+@(.+)$/,
                  message: 'Enter a valid email address',
                },
              })}
              className={`input pl-12 ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm mt-1.5">{errors.email.message}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <button type="submit" disabled={isLoading} className="w-full btn-primary py-3.5 text-lg">
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending...
            </span>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>
    </div>
  )
}
