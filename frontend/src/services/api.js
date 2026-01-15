import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })

          const { accessToken, refreshToken: newRefreshToken } = response.data.data
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)

          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  changePassword: (data) => api.post('/auth/change-password', data),
}

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getBySlug: (slug) => api.get(`/categories/${slug}`),
  getFeatured: () => api.get('/categories/featured'),
  getRoot: () => api.get('/categories/root'),
}

// Services API
export const servicesAPI = {
  getByCategory: (categoryId, params) => api.get(`/services/category/${categoryId}`, { params }),
  getByCategorySlug: (slug, params) => api.get(`/services/category/slug/${slug}`, { params }),
  getById: (id) => api.get(`/services/${id}`),
  search: (query, params) => api.get('/services/search', { params: { query, ...params } }),
  getPopular: (params) => api.get('/services/popular', { params }),
  getFeatured: () => api.get('/services/featured'),
}

// Providers API
export const providersAPI = {
  getById: (id) => api.get(`/providers/${id}`),
  getServices: (id, params) => api.get(`/providers/${id}/services`, { params }),
  getNearby: (pincode) => api.get('/providers/nearby', { params: { pincode } }),
  getFeatured: () => api.get('/providers/featured'),
  getTopRated: (params) => api.get('/providers/top-rated', { params }),
  getByCategory: (categoryId, params) => api.get(`/providers/category/${categoryId}`, { params }),
}

// Bookings API
export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: (params) => api.get('/bookings/my-bookings', { params }),
  getRecent: (limit = 3) => api.get('/bookings/recent', { params: { limit } }),
  getById: (id) => api.get(`/bookings/${id}`),
  getByNumber: (number) => api.get(`/bookings/number/${number}`),
  updateStatus: (id, data) => api.patch(`/bookings/${id}/status`, data),
  cancel: (id, reason) => api.patch(`/bookings/${id}/status`, { 
    status: 'CANCELLED', 
    reason 
  }),
  addReview: (id, data) => api.post(`/bookings/${id}/review`, data),
}

// User API
export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  getAddresses: () => api.get('/users/me/addresses'),
  addAddress: (data) => api.post('/users/me/addresses', data),
  updateAddress: (id, data) => api.put(`/users/me/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/users/me/addresses/${id}`),
}

export default api
