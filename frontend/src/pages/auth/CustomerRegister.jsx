import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../../context/authStore'
import toast from 'react-hot-toast'
import { 
  EyeIcon, 
  EyeSlashIcon, 
  PhoneIcon, 
  LockClosedIcon, 
  UserIcon,
  EnvelopeIcon 
} from '@heroicons/react/24/outline'

export default function CustomerRegister() {
  const navigate = useNavigate()
  const { register: registerUser, isLoading, error, clearError } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    clearError()
    const result = await registerUser({
      ...data,
      userType: 'CUSTOMER',
    })
    if (result.success) {
      toast.success('Account created successfully!')
      navigate('/')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Create Customer Account</h2>
        <p className="text-gray-500 mt-2">Join HireLink to book services</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text"
              {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } })}
              className={`input pl-12 ${errors.name ? 'input-error' : ''}`}
              placeholder="John Doe" />
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
              placeholder="john@example.com" />
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

        <div className="flex items-start">
          <input type="checkbox"
            {...register('terms', { required: 'You must accept the terms' })}
            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          <label className="ml-2 text-sm text-gray-600">
            I agree to the <a href="#" className="text-primary-600 hover:underline">Terms of Service</a> and <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
          </label>
        </div>
        {errors.terms && <p className="text-red-500 text-sm">{errors.terms.message}</p>}

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">{error}</div>}

        <button type="submit" disabled={isLoading} className="w-full btn-primary py-3.5 text-lg mt-6">
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating account...
            </span>
          ) : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-gray-600 mt-8">
        Already have an account?{' '}
        <Link to="/customer/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
      </p>

      <div className="mt-4 text-center">
        <Link to="/provider/register" className="text-sm text-emerald-600 font-medium hover:underline">
          Want to offer services? Register as a provider
        </Link>
      </div>
    </div>
  )
}
