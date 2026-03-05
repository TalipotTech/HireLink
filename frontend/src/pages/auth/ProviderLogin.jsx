import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../../context/authStore'
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import toast from 'react-hot-toast'
import { 
  PhoneIcon, 
  EnvelopeIcon,
  LockClosedIcon, 
  ArrowLeftIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'

const LOGIN_METHODS = {
  PHONE: 'phone',
  EMAIL: 'email',
  PASSWORD: 'password',
  GOOGLE: 'google',
}

export default function ProviderLogin() {
  const navigate = useNavigate()
  const { login, sendOtp, verifyOtp, googleLogin, isLoading, error, clearError } = useAuthStore()
  
  const [activeMethod, setActiveMethod] = useState(LOGIN_METHODS.PHONE)
  const [otpSent, setOtpSent] = useState(false)
  const [otpIdentifier, setOtpIdentifier] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [passwordLoginType, setPasswordLoginType] = useState('phone')
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  useEffect(() => {
    setOtpSent(false)
    setOtpIdentifier('')
    clearError()
    reset()
  }, [activeMethod, clearError, reset])

  const handleSendOtp = async (data) => {
    clearError()
    const identifier = activeMethod === LOGIN_METHODS.PHONE ? data.phone : data.email
    const result = await sendOtp(
      activeMethod === LOGIN_METHODS.PHONE ? identifier : null,
      activeMethod === LOGIN_METHODS.EMAIL ? identifier : null
    )
    if (result.success) {
      setOtpSent(true)
      setOtpIdentifier(identifier)
      setCountdown(60)
      toast.success(`OTP sent to ${activeMethod === LOGIN_METHODS.PHONE ? 'phone' : 'email'}!`)
    } else {
      toast.error(result.error)
    }
  }

  const handleVerifyOtp = async (data) => {
    clearError()
    const result = await verifyOtp(
      activeMethod === LOGIN_METHODS.PHONE ? otpIdentifier : null,
      activeMethod === LOGIN_METHODS.EMAIL ? otpIdentifier : null,
      data.otp,
      null,
      'PROVIDER'
    )
    if (result.success) {
      toast.success('Login successful!')
      navigate('/')
    } else {
      toast.error(result.error)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    clearError()
    const result = await sendOtp(
      activeMethod === LOGIN_METHODS.PHONE ? otpIdentifier : null,
      activeMethod === LOGIN_METHODS.EMAIL ? otpIdentifier : null
    )
    if (result.success) {
      setCountdown(60)
      toast.success('OTP resent!')
    } else {
      toast.error(result.error)
    }
  }

  const handlePasswordLogin = async (data) => {
    clearError()
    const result = await login(
      passwordLoginType === 'phone' ? data.identifier : null,
      passwordLoginType === 'email' ? data.identifier : null,
      data.password
    )
    if (result.success) {
      toast.success('Login successful!')
      navigate('/')
    } else {
      toast.error(result.error)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential)
      const result = await googleLogin({
        googleId: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        imageUrl: decoded.picture,
        userType: 'PROVIDER',
      })
      if (result.success) {
        toast.success('Login successful!')
        navigate('/')
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Google login failed. Please try again.')
    }
  }

  const renderMethodTabs = () => (
    <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
      {[
        { key: LOGIN_METHODS.PHONE, icon: PhoneIcon, label: 'Phone' },
        { key: LOGIN_METHODS.EMAIL, icon: EnvelopeIcon, label: 'Email' },
        { key: LOGIN_METHODS.PASSWORD, icon: LockClosedIcon, label: 'Password' },
      ].map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => setActiveMethod(key)}
          className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-all ${
            activeMethod === key
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Icon className="h-4 w-4 inline mr-1 -mt-0.5" />
          {label}
        </button>
      ))}
    </div>
  )

  const renderOtpForm = () => {
    const isPhone = activeMethod === LOGIN_METHODS.PHONE
    return (
      <form onSubmit={handleSubmit(otpSent ? handleVerifyOtp : handleSendOtp)} className="space-y-5">
        {!otpSent ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isPhone ? 'Phone Number' : 'Email Address'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                {isPhone ? <PhoneIcon className="h-5 w-5 text-gray-400" /> : <EnvelopeIcon className="h-5 w-5 text-gray-400" />}
              </div>
              <input
                type={isPhone ? 'tel' : 'email'}
                {...register(isPhone ? 'phone' : 'email', {
                  required: `${isPhone ? 'Phone number' : 'Email'} is required`,
                  pattern: isPhone
                    ? { value: /^[+]?[0-9]{10,15}$/, message: 'Enter a valid phone number' }
                    : { value: /^[A-Za-z0-9+_.-]+@(.+)$/, message: 'Enter a valid email address' }
                })}
                className={`input pl-12 ${errors[isPhone ? 'phone' : 'email'] ? 'input-error' : ''}`}
                placeholder={isPhone ? '+91 9876543210' : 'you@example.com'}
              />
            </div>
            {errors[isPhone ? 'phone' : 'email'] && (
              <p className="text-red-500 text-sm mt-1.5">{errors[isPhone ? 'phone' : 'email'].message}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              We'll send a 6-digit OTP to this {isPhone ? 'number' : 'email'}
            </p>
          </div>
        ) : (
          <>
            <button type="button" onClick={() => { setOtpSent(false); setOtpIdentifier(''); clearError() }}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
              <ArrowLeftIcon className="h-4 w-4 mr-1" /> Change {isPhone ? 'phone number' : 'email address'}
            </button>
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm mb-4">
              <p className="font-medium">OTP sent to {otpIdentifier}</p>
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
                className={`text-sm ${countdown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-emerald-600 hover:text-emerald-700'}`}>
                {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
              </button>
            </div>
          </>
        )}
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">{error}</div>}
        <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl py-3.5 text-lg font-medium transition-all">
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {otpSent ? 'Verifying...' : 'Sending OTP...'}
            </span>
          ) : (otpSent ? 'Verify & Sign In' : 'Send OTP')}
        </button>
      </form>
    )
  }

  const renderPasswordForm = () => (
    <form onSubmit={handleSubmit(handlePasswordLogin)} className="space-y-5">
      <div className="flex justify-center gap-4 mb-4">
        {['phone', 'email'].map((type) => (
          <button key={type} type="button" onClick={() => setPasswordLoginType(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              passwordLoginType === type ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
            {type === 'phone' ? <PhoneIcon className="h-4 w-4 inline mr-1 -mt-0.5" /> : <EnvelopeIcon className="h-4 w-4 inline mr-1 -mt-0.5" />}
            {type === 'phone' ? 'Phone' : 'Email'}
          </button>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {passwordLoginType === 'phone' ? 'Phone Number' : 'Email Address'}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {passwordLoginType === 'phone' ? <PhoneIcon className="h-5 w-5 text-gray-400" /> : <EnvelopeIcon className="h-5 w-5 text-gray-400" />}
          </div>
          <input
            type={passwordLoginType === 'phone' ? 'tel' : 'email'}
            {...register('identifier', {
              required: `${passwordLoginType === 'phone' ? 'Phone number' : 'Email'} is required`,
              pattern: passwordLoginType === 'phone'
                ? { value: /^[+]?[0-9]{10,15}$/, message: 'Enter a valid phone number' }
                : { value: /^[A-Za-z0-9+_.-]+@(.+)$/, message: 'Enter a valid email address' }
            })}
            className={`input pl-12 ${errors.identifier ? 'input-error' : ''}`}
            placeholder={passwordLoginType === 'phone' ? '+91 9876543210' : 'you@example.com'} />
        </div>
        {errors.identifier && <p className="text-red-500 text-sm mt-1.5">{errors.identifier.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <LockClosedIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input type="password"
            {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } })}
            className={`input pl-12 ${errors.password ? 'input-error' : ''}`}
            placeholder="Enter your password" />
        </div>
        {errors.password && <p className="text-red-500 text-sm mt-1.5">{errors.password.message}</p>}
      </div>
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">{error}</div>}
      <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl py-3.5 text-lg font-medium transition-all">
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Signing in...
          </span>
        ) : 'Sign In'}
      </button>
    </form>
  )

  const renderGoogleLogin = () => (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <p className="text-gray-600">Sign in with your Google account</p>
      </div>
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => toast.error('Google login failed. Please try again.')}
          size="large" width="350" text="signin_with" shape="rectangular" logo_alignment="left"
        />
      </div>
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 mt-4">{error}</div>}
      {isLoading && (
        <div className="flex justify-center mt-4">
          <svg className="animate-spin h-6 w-6 text-emerald-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}
    </div>
  )

  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <WrenchScrewdriverIcon className="h-4 w-4" />
          Service Provider
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Provider Sign In</h2>
        <p className="text-gray-500 mt-2">Sign in to manage your services</p>
      </div>

      {renderMethodTabs()}

      {activeMethod === LOGIN_METHODS.PHONE && renderOtpForm()}
      {activeMethod === LOGIN_METHODS.EMAIL && renderOtpForm()}
      {activeMethod === LOGIN_METHODS.PASSWORD && renderPasswordForm()}
      {activeMethod === LOGIN_METHODS.GOOGLE && renderGoogleLogin()}

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500">New provider?</span></div>
        </div>
        <div className="mt-6 text-center">
          <Link to="/provider/register" className="w-full inline-block py-3 px-6 border-2 border-emerald-200 text-emerald-700 rounded-xl font-medium hover:bg-emerald-50 transition-all">
            Create Provider Account
          </Link>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link to="/customer/login" className="text-sm text-primary-600 font-medium hover:underline">
          Looking for services? Sign in as customer
        </Link>
      </div>
    </div>
  )
}
