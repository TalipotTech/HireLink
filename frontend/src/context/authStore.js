import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      activeRole: 'CUSTOMER',

      login: async (phone, email, password) => {
        set({ isLoading: true, error: null })
        try {
          const data = phone ? { phone, password } : { email, password }
          const response = await authAPI.login(data)
          const { accessToken, refreshToken, user } = response.data.data

          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)

          const defaultRole = user.roles?.includes('PROVIDER') ? 'PROVIDER' : 'CUSTOMER'

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            activeRole: defaultRole,
          })

          return { success: true }
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed'
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authAPI.register(userData)
          const { accessToken, refreshToken, user } = response.data.data

          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            activeRole: 'CUSTOMER',
          })

          return { success: true }
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed'
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          activeRole: 'CUSTOMER',
        })
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } })
      },

      clearError: () => {
        set({ error: null })
      },

      switchRole: (role) => {
        const { user } = get()
        if (user?.roles?.includes(role)) {
          set({ activeRole: role })
        }
      },

      // ============================================
      // OTP Authentication
      // ============================================

      sendOtp: async (phone, email) => {
        set({ isLoading: true, error: null })
        try {
          const data = phone ? { phone } : { email }
          await authAPI.sendOtp(data)
          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to send OTP'
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },

      verifyOtp: async (phone, email, otp, name = null) => {
        set({ isLoading: true, error: null })
        try {
          const data = phone
            ? { phone, otp, name }
            : { email, otp, name }

          const response = await authAPI.verifyOtp(data)
          const { accessToken, refreshToken, user } = response.data.data

          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)

          const defaultRole = user.roles?.includes('PROVIDER') ? 'PROVIDER' : 'CUSTOMER'

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            activeRole: defaultRole,
          })

          return { success: true }
        } catch (error) {
          const message = error.response?.data?.message || 'Invalid OTP'
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },

      // ============================================
      // Google OAuth Authentication
      // ============================================

      googleLogin: async (googleData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authAPI.googleLogin(googleData)
          const { accessToken, refreshToken, user } = response.data.data

          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)

          const defaultRole = user.roles?.includes('PROVIDER') ? 'PROVIDER' : 'CUSTOMER'

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            activeRole: defaultRole,
          })

          return { success: true }
        } catch (error) {
          const message = error.response?.data?.message || 'Google login failed'
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },

      // ============================================
      // Become Provider
      // ============================================

      becomeProvider: async (providerData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authAPI.becomeProvider(providerData)
          const { accessToken, refreshToken, user } = response.data.data

          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            activeRole: 'PROVIDER',
          })

          return { success: true }
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to become a provider'
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },

      // ============================================
      // Password Management
      // ============================================

      setPassword: async (password) => {
        set({ isLoading: true, error: null })
        try {
          await authAPI.setPassword({ password })
          const currentUser = get().user
          if (currentUser) {
            set({
              user: { ...currentUser, hasPassword: true },
              isLoading: false
            })
          } else {
            set({ isLoading: false })
          }
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to set password'
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        activeRole: state.activeRole,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const { user, activeRole } = state
        if (user?.roles && !user.roles.includes(activeRole)) {
          const correctedRole = user.roles.includes('PROVIDER') ? 'PROVIDER' : 'CUSTOMER'
          useAuthStore.setState({ activeRole: correctedRole })
        }
      },
    }
  )
)
