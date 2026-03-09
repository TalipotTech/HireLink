import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { userAPI } from '../services/api'
import { useAuthStore } from '../context/authStore'
import toast from 'react-hot-toast'
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  WrenchScrewdriverIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import LocationPicker from '../components/LocationPicker'

export default function Profile() {
  const { user, updateUser, setPassword } = useAuthStore()
  const queryClient = useQueryClient()
  const [editMode, setEditMode] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSettingPassword, setIsSettingPassword] = useState(false)
  const [addressLocation, setAddressLocation] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name,
      email: user?.email,
    }
  })

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, watch: watchPassword, formState: { errors: passwordErrors } } = useForm()

  const { register: registerAddress, handleSubmit: handleAddressSubmit, reset: resetAddress, setValue: setAddressValue, formState: { errors: addressErrors } } = useForm()

  // Handle location selection for address form
  const handleAddressLocationSelect = (location) => {
    setAddressLocation(location)
    if (location) {
      if (location.address) {
        setAddressValue('addressLine1', location.address.split(',')[0] || '')
      }
      if (location.city) {
        setAddressValue('city', location.city)
      }
      if (location.state) {
        setAddressValue('state', location.state)
      }
      if (location.pincode) {
        setAddressValue('pincode', location.pincode)
      }
    }
  }

  const { data: addressData, isLoading: addressLoading } = useQuery(
    'addresses',
    userAPI.getAddresses
  )

  const updateMutation = useMutation(
    (data) => userAPI.updateProfile(data),
    {
      onSuccess: (response) => {
        updateUser(response.data.data)
        toast.success('Profile updated successfully')
        setEditMode(false)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile')
      }
    }
  )

  const addAddressMutation = useMutation(
    (data) => userAPI.addAddress(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('addresses')
        toast.success('Address added successfully')
        setShowAddressForm(false)
        resetAddress()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add address')
      }
    }
  )

  const deleteAddressMutation = useMutation(
    (id) => userAPI.deleteAddress(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('addresses')
        toast.success('Address deleted')
      }
    }
  )

  const addresses = addressData?.data?.data || []

  const onSubmit = (data) => {
    updateMutation.mutate(data)
  }

  const onAddAddress = (data) => {
    addAddressMutation.mutate(data)
  }

  const onSetPassword = async (data) => {
    setIsSettingPassword(true)
    const result = await setPassword(data.password)
    setIsSettingPassword(false)
    
    if (result.success) {
      toast.success('Password set successfully! You can now login with your phone/email and password.')
      setShowPasswordForm(false)
      resetPassword()
    } else {
      toast.error(result.error)
    }
  }

  // Check if user is verified (can set password)
  const isVerified = user?.isPhoneVerified || user?.isEmailVerified
  const hasPassword = user?.hasPassword
  const isGoogleUser = user?.authProvider === 'GOOGLE'

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary-600 text-2xl font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user?.name}</h1>
              <p className="text-primary-100">{user?.userType?.toLowerCase()} account</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile Info */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="btn-ghost text-sm"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </button>
            )}
          </div>

          {editMode ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className={`input pl-12 ${errors.name ? 'input-error' : ''}`}
                  />
                </div>
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Email</label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    {...register('email')}
                    className="input pl-12"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={updateMutation.isLoading} className="btn-primary">
                  {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setEditMode(false); reset(); }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{user?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <PhoneIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{user?.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user?.email || 'Not provided'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Addresses */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Saved Addresses</h2>
            {!showAddressForm && (
              <button
                onClick={() => setShowAddressForm(true)}
                className="btn-primary text-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Address
              </button>
            )}
          </div>

          {showAddressForm && (
            <form onSubmit={handleAddressSubmit(onAddAddress)} className="mb-6 p-4 bg-gray-50 rounded-xl space-y-4">
              {/* Location Picker */}
              <LocationPicker 
                onLocationSelect={handleAddressLocationSelect}
                showManualEntry={false}
                className="mb-4"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Address Label</label>
                  <input
                    {...registerAddress('addressLabel')}
                    className="input"
                    placeholder="e.g., Home, Office"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Address Line 1 *</label>
                  <input
                    {...registerAddress('addressLine1', { required: true })}
                    className={`input ${addressErrors.addressLine1 ? 'input-error' : ''}`}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Address Line 2</label>
                  <input {...registerAddress('addressLine2')} className="input" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">City *</label>
                  <input
                    {...registerAddress('city', { required: true })}
                    className={`input ${addressErrors.city ? 'input-error' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">State *</label>
                  <input
                    {...registerAddress('state', { required: true })}
                    className={`input ${addressErrors.state ? 'input-error' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Pincode *</label>
                  <input
                    {...registerAddress('pincode', { required: true, pattern: /^[0-9]{6}$/ })}
                    className={`input ${addressErrors.pincode ? 'input-error' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Landmark</label>
                  <input {...registerAddress('landmark')} className="input" />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...registerAddress('isDefault')} className="rounded" />
                <span className="text-sm text-gray-600">Set as default address</span>
              </label>
              <div className="flex gap-3">
                <button type="submit" disabled={addAddressMutation.isLoading} className="btn-primary">
                  {addAddressMutation.isLoading ? 'Saving...' : 'Save Address'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowAddressForm(false); resetAddress(); }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {addressLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
              ))}
            </div>
          ) : addresses.length > 0 ? (
            <div className="space-y-3">
              {addresses.map((address) => (
                <div key={address.addressId} className="flex items-start justify-between p-4 border rounded-xl">
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{address.addressLabel || address.addressType}</span>
                        {address.isDefault && (
                          <span className="badge-primary text-xs">Default</span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mt-1">
                        {address.addressLine1}
                        {address.addressLine2 && `, ${address.addressLine2}`}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {address.city}, {address.state} - {address.pincode}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAddressMutation.mutate(address.addressId)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No saved addresses</p>
          )}
        </div>

        {/* Security - Set/Change Password */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
            </div>
          </div>

          {/* Google OAuth User */}
          {isGoogleUser && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
              <svg className="h-8 w-8" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <div>
                <p className="font-medium text-blue-900">Signed in with Google</p>
                <p className="text-sm text-blue-700">Your account is secured by Google authentication</p>
              </div>
            </div>
          )}

          {/* Verified user without password */}
          {!isGoogleUser && isVerified && !hasPassword && (
            <>
              {!showPasswordForm ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <LockClosedIcon className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Set up password login</p>
                      <p className="text-sm text-amber-700 mt-1">
                        You're currently using OTP to login. Set a password for faster access in the future.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="btn-primary"
                  >
                    <LockClosedIcon className="h-4 w-4 mr-2" />
                    Set Password
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit(onSetPassword)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...registerPassword('password', {
                          required: 'Password is required',
                          minLength: {
                            value: 8,
                            message: 'Password must be at least 8 characters'
                          }
                        })}
                        className={`input pl-12 pr-12 ${passwordErrors.password ? 'input-error' : ''}`}
                        placeholder="Enter a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.password && (
                      <p className="text-red-500 text-sm mt-1">{passwordErrors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...registerPassword('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: (value) =>
                            value === watchPassword('password') || 'Passwords do not match'
                        })}
                        className={`input pl-12 pr-12 ${passwordErrors.confirmPassword ? 'input-error' : ''}`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSettingPassword}
                      className="btn-primary"
                    >
                      {isSettingPassword ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Setting Password...
                        </>
                      ) : (
                        'Set Password'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false)
                        resetPassword()
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* Verified user with password */}
          {!isGoogleUser && hasPassword && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Password is set</p>
                <p className="text-sm text-green-700">
                  You can login using your {user?.phone ? 'phone' : 'email'} and password
                </p>
              </div>
            </div>
          )}

          {/* Not verified user */}
          {!isGoogleUser && !isVerified && (
            <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <LockClosedIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-700">Verify your account first</p>
                <p className="text-sm text-gray-500 mt-1">
                  Please verify your phone or email via OTP before setting a password.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Account Type</span>
              <span className="font-medium capitalize">{user?.userType?.toLowerCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account Status</span>
              <span className="badge-success">{user?.accountStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Login Method</span>
              <span className="font-medium">
                {isGoogleUser ? 'Google' : hasPassword ? 'Password / OTP' : 'OTP'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone Verified</span>
              <span className={user?.isPhoneVerified ? 'text-green-600' : 'text-gray-400'}>
                {user?.isPhoneVerified ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email Verified</span>
              <span className={user?.isEmailVerified ? 'text-green-600' : 'text-gray-400'}>
                {user?.isEmailVerified ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Become a Provider CTA - only for customers who aren't providers yet */}
        {user?.roles?.includes('CUSTOMER') && !user?.roles?.includes('PROVIDER') && !user?.hasProviderProfile && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-6 text-white shadow-lg">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            <div className="relative flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold mb-1">Become a Service Provider</h3>
                <p className="text-emerald-100 text-sm leading-relaxed mb-4">
                  Start earning by offering your skills on HireLink. Set up your provider profile, list your services, and connect with customers in your area.
                </p>
                <Link
                  to="/become-provider"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-colors shadow-sm"
                >
                  Get Started
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
