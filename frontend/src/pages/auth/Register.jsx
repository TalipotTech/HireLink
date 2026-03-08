import { useState, useEffect } from 'react'
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
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const STEPS = { INFO: 1, OTP: 2, PASSWORD: 3 }

export default function UnifiedRegister() {
  const navigate = useNavigate()
  const { register: registerUser, sendOtp, isLoading, error, clearError } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(STEPS.INFO)
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [verifiedOtp, setVerifiedOtp] = useState('')

  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleStep1 = async (data) => {
    clearError()
    setName(data.name)
    setPhone(data.phone)

    const result = await sendOtp(data.phone, null)
    if (result.success) {
      setCurrentStep(STEPS.OTP)
      setCountdown(60)
      reset()
      toast.success('OTP sent to your phone!')
    } else {
      toast.error(result.error)
    }
  }

  const handleStep2 = async (data) => {
    clearError()
    setVerifiedOtp(data.otp)
    setCurrentStep(STEPS.PASSWORD)
    reset()
  }

  const handleStep3 = async (data) => {
    clearError()
    const result = await registerUser({
      name,
      phone,
      otp: verifiedOtp,
      password: data.password,
      email: data.email || undefined,
    })

    if (result.success) {
      toast.success('Account created successfully!')
      navigate('/')
    } else {
      toast.error(result.error)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    clearError()
    const result = await sendOtp(phone, null)
    if (result.success) {
      setCountdown(60)
      toast.success('OTP resent!')
    } else {
      toast.error(result.error)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[
        { step: STEPS.INFO, label: 'Your Info' },
        { step: STEPS.OTP, label: 'Verify Phone' },
        { step: STEPS.PASSWORD, label: 'Set Password' },
      ].map(({ step, label }, idx) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              currentStep > step
                ? 'bg-green-500 text-white'
                : currentStep === step
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > step ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : step}
            </div>
            <span className={`text-xs mt-1 ${
              currentStep >= step ? 'text-primary-600 font-medium' : 'text-gray-400'
            }`}>{label}</span>
          </div>
          {idx < 2 && (
            <div className={`w-12 h-0.5 mx-2 mb-5 ${
              currentStep > step ? 'bg-green-500' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStep1 = () => (
    <form onSubmit={handleSubmit(handleStep1)} className="space-y-4">
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
        <p className="text-xs text-gray-500 mt-2">We'll send a verification code to this number</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">{error}</div>}

      <button type="submit" disabled={isLoading} className="w-full btn-primary py-3.5 text-lg mt-2">
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Sending OTP...
          </span>
        ) : 'Send Verification Code'}
      </button>
    </form>
  )

  const renderStep2 = () => (
    <form onSubmit={handleSubmit(handleStep2)} className="space-y-5">
      <button type="button" onClick={() => { setCurrentStep(STEPS.INFO); clearError(); reset() }}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeftIcon className="h-4 w-4 mr-1" /> Change phone number
      </button>

      <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-sm">
        <p className="font-medium">Verification code sent to {phone}</p>
        <p className="text-blue-600 text-xs mt-1">Hi {name}, please enter the 6-digit code</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
        <input type="text" maxLength={6}
          {...register('otp', { required: 'OTP is required', pattern: { value: /^[0-9]{6}$/, message: 'Enter a valid 6-digit OTP' } })}
          className={`input text-center text-2xl tracking-[0.5em] font-mono ${errors.otp ? 'input-error' : ''}`}
          placeholder="------"
          autoFocus />
        {errors.otp && <p className="text-red-500 text-sm mt-1.5">{errors.otp.message}</p>}
      </div>

      <div className="text-center">
        <button type="button" onClick={handleResendOtp} disabled={countdown > 0 || isLoading}
          className={`text-sm ${countdown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-primary-600 hover:text-primary-700'}`}>
          {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">{error}</div>}

      <button type="submit" disabled={isLoading} className="w-full btn-primary py-3.5 text-lg">
        Verify & Continue
      </button>
    </form>
  )

  const renderStep3 = () => (
    <form onSubmit={handleSubmit(handleStep3)} className="space-y-4">
      <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-2">
        <p className="font-medium flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5" />
          Phone verified successfully!
        </p>
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
        <label className="block text-sm font-medium text-gray-700 mb-2">Create Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <LockClosedIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input type={showPassword ? 'text' : 'password'}
            {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } })}
            className={`input pl-12 pr-12 ${errors.password ? 'input-error' : ''}`}
            placeholder="Minimum 8 characters" />
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

      <button type="submit" disabled={isLoading} className="w-full btn-primary py-3.5 text-lg mt-2">
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
  )

  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
        <p className="text-gray-500 mt-2">Join HireLink in 3 easy steps</p>
      </div>

      {renderStepIndicator()}

      {currentStep === STEPS.INFO && renderStep1()}
      {currentStep === STEPS.OTP && renderStep2()}
      {currentStep === STEPS.PASSWORD && renderStep3()}

      <p className="text-center text-gray-600 mt-8">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
