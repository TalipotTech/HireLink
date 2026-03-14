import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../../context/authStore'
import toast from 'react-hot-toast'
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

const REG_METHODS = {
  PHONE: 'phone',
  EMAIL: 'email',
}

const STEPS = {
  INFO: 0,
  OTP: 1,
  PASSWORD: 2,
}

export default function UnifiedRegister() {
  const navigate = useNavigate()
  const {
    register: registerUser,
    registerEmail,
    sendOtp,
    resendVerification,
    isLoading,
    error,
    clearError,
  } = useAuthStore()

  const [method, setMethod] = useState(REG_METHODS.PHONE)
  const [step, setStep] = useState(STEPS.INFO)
  const [showPassword, setShowPassword] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [registeredEmail, setRegisteredEmail] = useState(null)
  const [resendCountdown, setResendCountdown] = useState(0)

  const { register, handleSubmit, formState: { errors }, watch, reset, getValues } = useForm()
  const password = watch('password')

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  useEffect(() => {
    setStep(STEPS.INFO)
    setRegisteredEmail(null)
    clearError()
    reset()
  }, [method, clearError, reset])

  const startResendCountdown = () => {
    setResendCountdown(60)
    const interval = setInterval(() => {
      setResendCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  // ===== Phone+OTP flow =====

  const handleSendOtp = async (data) => {
    clearError()
    const result = await sendOtp(data.phone, data.email || null)
    if (result.success) {
      setStep(STEPS.OTP)
      setCountdown(60)
      toast.success(data.email ? 'OTP sent to your phone and email!' : 'OTP sent to your phone!')
    } else {
      toast.error(result.error)
    }
  }

  const handleVerifyOtp = async (data) => {
    clearError()
    setStep(STEPS.PASSWORD)
  }

  const handlePhoneRegister = async (data) => {
    clearError()
    const result = await registerUser({
      name: getValues('name'),
      phone: getValues('phone'),
      otp: getValues('otp'),
      email: getValues('email') || undefined,
      password: data.password,
    })
    if (result.success) {
      toast.success('Registration successful!')
      navigate('/')
    } else {
      toast.error(result.error)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    clearError()
    const result = await sendOtp(getValues('phone'), getValues('email') || null)
    if (result.success) {
      setCountdown(60)
      toast.success('OTP resent!')
    } else {
      toast.error(result.error)
    }
  }

  // ===== Email+Password flow =====

  const handleEmailRegister = async (data) => {
    clearError()
    const result = await registerEmail({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone || undefined,
    })
    if (result.success) {
      setRegisteredEmail(data.email)
      startResendCountdown()
      toast.success('Registration successful! Check your email.')
    } else {
      toast.error(result.error)
    }
  }

  const handleResendVerification = async () => {
    if (resendCountdown > 0 || !registeredEmail) return
    clearError()
    const result = await resendVerification(registeredEmail)
    if (result.success) {
      startResendCountdown()
      toast.success('Verification email resent!')
    } else {
      toast.error(result.error)
    }
  }

  // ===== Email "check your inbox" screen =====
  if (registeredEmail) {
    return (
      <div className="animate-fadeIn">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <EnvelopeIcon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
          <p className="text-gray-500 mt-3">We've sent a verification link to</p>
          <p className="text-primary-600 font-semibold mt-1">{registeredEmail}</p>
        </div>

        <div className="bg-blue-50 text-blue-700 p-5 rounded-xl text-sm mb-6 space-y-2">
          <p className="font-medium">What to do next:</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-600">
            <li>Open your email inbox</li>
            <li>Click the verification link in the email from HireLink</li>
            <li>Come back and sign in</li>
          </ol>
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500">Didn't receive the email?</p>
          <button onClick={handleResendVerification} disabled={resendCountdown > 0 || isLoading}
            className={`inline-flex items-center gap-2 text-sm font-medium ${
              resendCountdown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-primary-600 hover:text-primary-700'
            }`}>
            <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend verification email'}
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 mt-4">{error}</div>}

        <p className="text-center text-gray-600 mt-8">
          Already verified?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    )
  }

  // ===== Method selector tabs =====
  const renderMethodTabs = () => (
    <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
      {[
        { key: REG_METHODS.PHONE, icon: PhoneIcon, label: 'Phone + OTP' },
        { key: REG_METHODS.EMAIL, icon: EnvelopeIcon, label: 'Email + Password' },
      ].map(({ key, icon: Icon, label }) => (
        <button key={key} type="button" onClick={() => setMethod(key)}
          className={`flex-1 py-2.5 px-2 rounded-lg text-sm font-medium transition-all ${
            method === key
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}>
          <Icon className="h-4 w-4 inline mr-1 -mt-0.5" />
          {label}
        </button>
      ))}
    </div>
  )

  // ===== Phone+OTP registration steps =====
  const renderPhoneFlow = () => {
    if (step === STEPS.INFO) {
      return (
        <form onSubmit={handleSubmit(handleSendOtp)} className="space-y-4">
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
            <p className="text-xs text-gray-500 mt-2">We'll send a 6-digit OTP to verify this number</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input type="email"
                {...register('email', { pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Enter a valid email' } })}
                className={`input pl-12 ${errors.email ? 'input-error' : ''}`}
                placeholder="john@example.com" />
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1.5">{errors.email.message}</p>}
          </div>

          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">{error}</div>}

          <button type="submit" disabled={isLoading} className="w-full btn-primary py-3.5 text-lg">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending OTP...
              </span>
            ) : 'Send OTP'}
          </button>
        </form>
      )
    }

    if (step === STEPS.OTP) {
      return (
        <form onSubmit={handleSubmit(handleVerifyOtp)} className="space-y-5">
          <button type="button" onClick={() => { setStep(STEPS.INFO); clearError() }}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeftIcon className="h-4 w-4 mr-1" /> Change phone number
          </button>
          <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-sm mb-4">
            <p className="font-medium">OTP sent to {getValues('phone')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
            <input type="text" maxLength={6}
              {...register('otp', { required: 'OTP is required', pattern: { value: /^[0-9]{6}$/, message: 'Enter a valid 6-digit OTP' } })}
              className={`input text-center text-2xl tracking-[0.5em] font-mono ${errors.otp ? 'input-error' : ''}`}
              placeholder="------" />
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
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      )
    }

    // STEPS.PASSWORD
    return (
      <form onSubmit={handleSubmit(handlePhoneRegister)} className="space-y-4">
        <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-2">
          <p className="font-medium">Phone verified! Now set your password.</p>
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
              placeholder="Minimum 8 characters" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-1.5">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <CheckCircleIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input type={showPassword ? 'text' : 'password'}
              {...register('confirmPassword', { required: 'Please confirm your password', validate: value => value === password || 'Passwords do not match' })}
              className={`input pl-12 ${errors.confirmPassword ? 'input-error' : ''}`}
              placeholder="Re-enter your password" />
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-sm mt-1.5">{errors.confirmPassword.message}</p>}
        </div>

        <div className="flex items-start">
          <input type="checkbox"
            {...register('terms', { required: 'You must accept the terms' })}
            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          <label className="ml-2 text-sm text-gray-600">
            I agree to the <a href="#" className="text-primary-600 hover:underline">Terms of Service</a> and{' '}
            <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
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
  }

  // ===== Email+Password registration form =====
  const renderEmailFlow = () => (
    <form onSubmit={handleSubmit(handleEmailRegister)} className="space-y-4">
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
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Enter a valid email address' }
            })}
            className={`input pl-12 ${errors.email ? 'input-error' : ''}`}
            placeholder="john@example.com" />
        </div>
        {errors.email && <p className="text-red-500 text-sm mt-1.5">{errors.email.message}</p>}
        <p className="text-xs text-gray-500 mt-2">We'll send a verification link to this email</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number (Optional)</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <PhoneIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input type="tel"
            {...register('phone', { pattern: { value: /^[+]?[0-9]{10,15}$/, message: 'Enter a valid phone number' } })}
            className={`input pl-12 ${errors.phone ? 'input-error' : ''}`}
            placeholder="+91 9876543210" />
        </div>
        {errors.phone && <p className="text-red-500 text-sm mt-1.5">{errors.phone.message}</p>}
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
            placeholder="Minimum 8 characters" />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-sm mt-1.5">{errors.password.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <CheckCircleIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input type={showPassword ? 'text' : 'password'}
            {...register('confirmPassword', { required: 'Please confirm your password', validate: value => value === password || 'Passwords do not match' })}
            className={`input pl-12 ${errors.confirmPassword ? 'input-error' : ''}`}
            placeholder="Re-enter your password" />
        </div>
        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1.5">{errors.confirmPassword.message}</p>}
      </div>

      <div className="flex items-start">
        <input type="checkbox"
          {...register('terms', { required: 'You must accept the terms' })}
          className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
        <label className="ml-2 text-sm text-gray-600">
          I agree to the <a href="#" className="text-primary-600 hover:underline">Terms of Service</a> and{' '}
          <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
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
        <p className="text-gray-500 mt-2">Join HireLink to get started</p>
      </div>

      {renderMethodTabs()}

      {method === REG_METHODS.PHONE && renderPhoneFlow()}
      {method === REG_METHODS.EMAIL && renderEmailFlow()}

      <p className="text-center text-gray-600 mt-8">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
