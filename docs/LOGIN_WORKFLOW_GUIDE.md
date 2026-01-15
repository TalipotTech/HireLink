# HireLink Login Workflow - Complete Code Documentation

## For Beginners: Understanding Full-Stack Authentication

This document explains how the login process works in the HireLink application, from when a user clicks "Sign In" to when they're authenticated and can access protected features. We'll trace the journey of data through:

1. **Frontend (React)** - User interface and state management
2. **Backend (Spring Boot)** - Business logic and authentication
3. **Database (MySQL)** - Data storage and retrieval

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Visual Flow Diagrams](#2-visual-flow-diagrams)
3. [Frontend Code Explained](#3-frontend-code-explained)
4. [Backend Code Explained](#4-backend-code-explained)
5. [Database Layer](#5-database-layer)
6. [Security Concepts](#6-security-concepts)
7. [Complete Data Flow Example](#7-complete-data-flow-example)

---

## 1. Architecture Overview

### What is Full-Stack Authentication?

When you log into any application, three main things happen:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    FRONTEND     │     │     BACKEND     │     │    DATABASE     │
│   (React App)   │────▶│  (Spring Boot)  │────▶│    (MySQL)      │
│                 │◀────│                 │◀────│                 │
│  User Interface │     │  Business Logic │     │   Data Storage  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Technologies Used

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React + Vite | Build user interface |
| State Management | Zustand | Manage user session data |
| HTTP Client | Axios | Make API requests |
| Backend | Spring Boot | Handle business logic |
| Security | Spring Security + JWT | Authenticate users |
| Database | MySQL | Store user data |

---

## 2. Visual Flow Diagrams

### High-Level Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend (React)
    participant B as Backend (Spring Boot)
    participant D as Database (MySQL)

    U->>F: 1. Enter phone & password
    U->>F: 2. Click "Sign In"
    F->>F: 3. Validate form inputs
    F->>B: 4. POST /api/auth/login
    B->>D: 5. Query: Find user by phone
    D-->>B: 6. Return user record
    B->>B: 7. Verify password hash
    B->>B: 8. Generate JWT tokens
    B-->>F: 9. Return tokens + user data
    F->>F: 10. Store tokens in localStorage
    F->>F: 11. Update auth state
    F-->>U: 12. Redirect to home page
```

### Detailed Component Interaction

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React Application)                             │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────────────────┐  │
│  │   Login.jsx     │───▶│  authStore.js    │───▶│         api.js                  │  │
│  │                 │    │  (Zustand Store) │    │    (Axios HTTP Client)          │  │
│  │ - Form UI       │    │                  │    │                                 │  │
│  │ - useForm hook  │    │ - login()        │    │ - authAPI.login()               │  │
│  │ - Validation    │    │ - User state     │    │ - Request interceptors          │  │
│  │ - Submit handler│    │ - Tokens         │    │ - Response interceptors         │  │
│  └─────────────────┘    └──────────────────┘    └─────────────────────────────────┘  │
│                                                              │                        │
└──────────────────────────────────────────────────────────────│────────────────────────┘
                                                               │
                                            HTTP POST /api/auth/login
                                            { phone, password }
                                                               │
                                                               ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Spring Boot Application)                           │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────────────────┐  │
│  │ AuthController  │───▶│  AuthService     │───▶│       Security Layer            │  │
│  │                 │    │                  │    │                                 │  │
│  │ @PostMapping    │    │ - authenticate   │    │ - AuthenticationManager         │  │
│  │ /api/auth/login │    │ - generateTokens │    │ - PasswordEncoder               │  │
│  │                 │    │ - update login   │    │ - JwtService                    │  │
│  └─────────────────┘    └──────────────────┘    └─────────────────────────────────┘  │
│                                │                                                     │
│                                ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                          Data Access Layer                                       │ │
│  │  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────────────┐  │ │
│  │  │ UserRepository  │───▶│ User Entity      │───▶│ CustomUserDetails           │  │ │
│  │  │                 │    │                  │    │                             │  │ │
│  │  │ findByPhone()   │    │ JPA Entity       │    │ Spring Security wrapper     │  │ │
│  │  └─────────────────┘    └──────────────────┘    └─────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                │                                                     │
└────────────────────────────────│─────────────────────────────────────────────────────┘
                                 │
                      SQL: SELECT * FROM users WHERE phone = ?
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                             DATABASE (MySQL)                                          │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────────────┐    │
│   │                           users TABLE                                        │    │
│   ├─────────────────────────────────────────────────────────────────────────────┤    │
│   │ user_id | name  | phone      | password_hash                    | user_type │    │
│   │ --------|-------|------------|----------------------------------|-----------|    │
│   │ 1       | Priya | 9876543210 | $2a$12$b/tFjZCh... (BCrypt hash) | CUSTOMER  │    │
│   └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Code Explained

### 3.1 Login Page Component (`Login.jsx`)

This is the React component that renders the login form and handles user input.

```jsx
// ============================================================================
// FILE: frontend/src/pages/auth/Login.jsx
// PURPOSE: Renders the login form and handles user authentication
// ============================================================================

// ============================================================================
// IMPORTS - External libraries and internal modules we need
// ============================================================================

import { useState } from 'react'
// useState is a React Hook - a special function that lets you add "state" 
// (data that can change) to your component. When state changes, React 
// automatically re-renders (redraws) the component with the new data.

import { Link, useNavigate } from 'react-router-dom'
// Link: Creates clickable links that navigate without full page reload
// useNavigate: Hook that returns a function to programmatically navigate
// These are from React Router - the library that handles page navigation

import { useForm } from 'react-hook-form'
// useForm is from the 'react-hook-form' library
// It provides easy form validation and handling without writing lots of code
// Returns functions like: register (connect input), handleSubmit, formState

import { useAuthStore } from '../../context/authStore'
// This imports our custom Zustand store (explained later)
// It contains the login function and authentication state

import toast from 'react-hot-toast'
// A library for showing popup notifications (toasts)
// toast.success() shows green success message
// toast.error() shows red error message

import { 
  EyeIcon, 
  EyeSlashIcon, 
  PhoneIcon, 
  LockClosedIcon 
} from '@heroicons/react/24/outline'
// Icons from the Heroicons library (made by Tailwind CSS team)
// These are SVG icons as React components

// ============================================================================
// MAIN COMPONENT FUNCTION
// ============================================================================

export default function Login() {
  // 'export default' makes this the main export of the file
  // Other files can import it as: import Login from './Login'

  // --------------------------------------------------------------------------
  // HOOKS - Special React functions that add features to our component
  // --------------------------------------------------------------------------

  const navigate = useNavigate()
  // Returns a function we can call to navigate to different pages
  // Example: navigate('/') goes to home page

  const { login, isLoading, error, clearError } = useAuthStore()
  // DESTRUCTURING: Extracts specific values from the auth store
  // login: async function to authenticate user
  // isLoading: boolean - true while login is in progress
  // error: string - error message if login failed
  // clearError: function to clear any previous errors

  const [showPassword, setShowPassword] = useState(false)
  // useState returns an array with 2 items:
  // [0] showPassword: the current value (starts as false)
  // [1] setShowPassword: function to update the value
  // This controls whether password is visible or hidden (dots)

  const { 
    register,      // Function to register input fields for form handling
    handleSubmit,  // Function that wraps our submit handler with validation
    formState: { errors }  // Object containing validation errors
  } = useForm()
  // useForm() returns many utilities; we destructure what we need

  // --------------------------------------------------------------------------
  // EVENT HANDLERS - Functions that respond to user actions
  // --------------------------------------------------------------------------

  const onSubmit = async (data) => {
    // 'async' keyword: This function contains asynchronous operations
    // (operations that take time, like network requests)
    // 'data' parameter: Form values { phone: "...", password: "..." }
    
    clearError()  // Clear any previous error messages
    
    const result = await login(data.phone, data.password)
    // 'await' pauses execution until login() completes
    // login() makes API call and returns { success: boolean, error?: string }
    
    if (result.success) {
      toast.success('Welcome back!')  // Show success notification
      navigate('/')                   // Redirect to home page
    } else {
      toast.error(result.error)       // Show error notification
    }
  }

  // --------------------------------------------------------------------------
  // JSX RETURN - The HTML-like syntax that defines what to render
  // --------------------------------------------------------------------------

  return (
    <div className="animate-fadeIn">
      {/* className is React's version of HTML's class attribute */}
      {/* Tailwind CSS classes: animate-fadeIn adds fade-in animation */}

      {/* HEADER SECTION */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome Back
        </h2>
        <p className="text-gray-500 mt-2">Sign in to continue to HireLink</p>
      </div>

      {/* LOGIN FORM */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* handleSubmit(onSubmit) wraps our handler:
            1. Prevents default form submission (page reload)
            2. Validates all fields
            3. Only calls onSubmit if validation passes
            4. Passes form data to onSubmit */}

        {/* PHONE NUMBER INPUT */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="relative">
            {/* relative: Positions children relative to this container */}
            
            {/* PHONE ICON (decorative) */}
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
            </div>

            {/* THE ACTUAL INPUT FIELD */}
            <input
              type="tel"
              {...register('phone', { 
                // register() connects this input to react-hook-form
                // First argument: field name (used in form data)
                // Second argument: validation rules object
                
                required: 'Phone number is required',
                // If empty, show this error message
                
                pattern: {
                  value: /^[+]?[0-9]{10,15}$/,
                  // REGEX (Regular Expression) explained:
                  // ^        = start of string
                  // [+]?     = optional + character
                  // [0-9]    = any digit 0-9
                  // {10,15}  = between 10 and 15 of the previous
                  // $        = end of string
                  
                  message: 'Enter a valid phone number'
                  // Error message if pattern doesn't match
                }
              })}
              className={`input pl-12 ${errors.phone ? 'input-error' : ''}`}
              // TEMPLATE LITERAL with conditional class:
              // If errors.phone exists, add 'input-error' class (red border)
              
              placeholder="+91 9876543210"
            />
          </div>
          
          {/* VALIDATION ERROR MESSAGE */}
          {errors.phone && (
            // CONDITIONAL RENDERING: Only render if errors.phone exists
            // && is a short-circuit operator - if left side is false/null,
            // the right side (JSX) is not evaluated or rendered
            
            <p className="text-red-500 text-sm mt-1.5">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* PASSWORD INPUT */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            {/* LOCK ICON */}
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-gray-400" />
            </div>

            <input
              type={showPassword ? 'text' : 'password'}
              // TERNARY OPERATOR: condition ? valueIfTrue : valueIfFalse
              // If showPassword is true, type="text" (visible)
              // If false, type="password" (hidden with dots)
              
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                }
              })}
              className={`input pl-12 pr-12 ${errors.password ? 'input-error' : ''}`}
              placeholder="Enter your password"
            />

            {/* TOGGLE PASSWORD VISIBILITY BUTTON */}
            <button
              type="button"
              // type="button" prevents form submission when clicked
              // (default type for buttons in forms is "submit")
              
              onClick={() => setShowPassword(!showPassword)}
              // Arrow function that toggles showPassword
              // !showPassword is the logical NOT - flips true/false
              
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          
          {errors.password && (
            <p className="text-red-500 text-sm mt-1.5">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* SERVER-SIDE ERROR MESSAGE */}
        {error && (
          // This shows errors returned from the API (e.g., "Invalid credentials")
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isLoading}
          // disabled attribute prevents clicking while loading
          
          className="w-full btn-primary py-3.5 text-lg"
        >
          {isLoading ? (
            // Show spinner while loading
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                {/* SVG spinner animation */}
                <circle className="opacity-25" cx="12" cy="12" r="10" 
                        stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z..." />
              </svg>
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* REGISTER LINK */}
      <div className="mt-8">
        <div className="mt-6 text-center">
          <Link to="/register" className="btn-secondary w-full py-3">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  )
}
```

### 3.2 API Service (`api.js`)

This file configures Axios to make HTTP requests to our backend.

```javascript
// ============================================================================
// FILE: frontend/src/services/api.js
// PURPOSE: Configure HTTP client for API communication
// ============================================================================

import axios from 'axios'
// Axios is a popular HTTP client library for making API requests
// It's easier to use than the browser's built-in fetch() API
// Features: automatic JSON handling, interceptors, timeout, etc.

// ============================================================================
// BASE CONFIGURATION
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
// import.meta.env: Vite's way to access environment variables
// VITE_API_URL: Custom environment variable (set in .env file)
// || '/api': Fallback value if env variable not set
// 
// In development: might be 'http://localhost:8080/api'
// In production: '/api' (same server, handled by nginx)

const api = axios.create({
  baseURL: API_BASE_URL,
  // All requests will be prefixed with this URL
  // api.get('/users') → GET http://localhost:8080/api/users
  
  headers: {
    'Content-Type': 'application/json',
    // Tells server we're sending JSON data
    // Server will parse request body as JSON
  },
})
// axios.create() returns a new Axios instance with custom config
// This lets us have different configs for different APIs if needed

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

api.interceptors.request.use(
  // Interceptors are functions that run before/after every request
  // REQUEST interceptors run BEFORE the request is sent
  
  (config) => {
    // config: The request configuration object
    // We can modify it before the request goes out
    
    const token = localStorage.getItem('accessToken')
    // localStorage: Browser's persistent storage (survives page refresh)
    // getItem(): Retrieves a value by key (returns null if not found)
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      // Add Authorization header with JWT token
      // Format: "Bearer eyJhbGciOiJIUzI1NiIsIn..."
      // 'Bearer' is the authentication scheme (standard for JWTs)
      // The server will validate this token to identify the user
    }
    
    return config
    // Must return config for the request to proceed
  },
  
  (error) => Promise.reject(error)
  // If there's an error creating the request, reject it
  // Promise.reject() returns a rejected Promise
)

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

api.interceptors.response.use(
  // RESPONSE interceptors run AFTER receiving a response
  
  (response) => response,
  // If response is successful (2xx status), just pass it through
  
  async (error) => {
    // Handle errors (4xx, 5xx status codes)
    // 'async' because we might need to make another request
    
    const originalRequest = error.config
    // error.config contains the original request config
    // We save it to potentially retry the request
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      // error.response?.status: Optional chaining - safe access to status
      // 401 = Unauthorized (token expired or invalid)
      // _retry: Custom flag to prevent infinite retry loops
      
      originalRequest._retry = true
      // Mark this request as already retried
      
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        // Refresh tokens last longer than access tokens
        // Used to get new access tokens without re-login
        
        if (refreshToken) {
          // Try to refresh the access token
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })
          // Note: Using plain axios, not our api instance
          // This avoids infinite interceptor loops
          
          const { accessToken, refreshToken: newRefreshToken } = response.data.data
          // RENAMING during destructuring:
          // refreshToken: newRefreshToken means:
          // "get 'refreshToken' property but call it 'newRefreshToken'"
          
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)
          // Store new tokens
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
          // Retry the original request with new token
        }
      } catch (refreshError) {
        // Refresh failed - user needs to login again
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        // Hard redirect to login page
      }
    }
    
    return Promise.reject(error)
    // Pass the error to the calling code
  }
)

// ============================================================================
// API ENDPOINTS - Organized by feature
// ============================================================================

export const authAPI = {
  // Object containing all authentication-related API calls
  
  register: (data) => api.post('/auth/register', data),
  // Arrow function that calls api.post()
  // POST /api/auth/register with 'data' as request body
  // Returns a Promise
  
  login: (data) => api.post('/auth/login', data),
  // POST /api/auth/login
  // data = { phone: "...", password: "..." }
  
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  // POST /api/auth/refresh
  // Used to get new access token
  
  changePassword: (data) => api.post('/auth/change-password', data),
}

// Export the axios instance for direct use if needed
export default api
```

### 3.3 Authentication State Store (`authStore.js`)

Zustand is a simple state management library. This store holds our authentication state.

```javascript
// ============================================================================
// FILE: frontend/src/context/authStore.js
// PURPOSE: Manage authentication state across the entire application
// ============================================================================

import { create } from 'zustand'
// create: Function to create a Zustand store
// A store is a centralized place to keep data (state)
// All components can read from and write to this store

import { persist } from 'zustand/middleware'
// persist: Middleware that automatically saves state to localStorage
// When user refreshes page, their login state is preserved
// "Middleware" = code that runs between actions

import { authAPI } from '../services/api'
// Our API functions for authentication

// ============================================================================
// CREATE THE STORE
// ============================================================================

export const useAuthStore = create(
  // create() takes a function that defines the store
  // Returns a hook (useAuthStore) that components use to access the store
  
  persist(
    // persist() wraps our store with localStorage persistence
    
    (set, get) => ({
      // This function receives:
      // set: Function to update state
      // get: Function to read current state
      // Returns an object with state and actions
      
      // ======================================================================
      // STATE - The data we're storing
      // ======================================================================
      
      user: null,
      // User object after login: { userId, name, email, phone, userType, ... }
      // null when not logged in
      
      accessToken: null,
      // JWT access token for API authentication
      // Short-lived (e.g., 1 hour)
      
      refreshToken: null,
      // JWT refresh token for getting new access tokens
      // Longer-lived (e.g., 7 days)
      
      isAuthenticated: false,
      // Boolean flag: true if user is logged in
      
      isLoading: false,
      // Boolean: true while login/register is in progress
      // Used to show loading spinners
      
      error: null,
      // String: error message from failed login/register
      // null when no error
      
      // ======================================================================
      // ACTIONS - Functions that modify state
      // ======================================================================
      
      login: async (phone, password) => {
        // ASYNC FUNCTION to handle login
        // Takes phone number and password
        // Returns { success: boolean, error?: string }
        
        set({ isLoading: true, error: null })
        // Update state: start loading, clear previous errors
        // set() merges the object into current state
        // Only specified properties are updated
        
        try {
          const response = await authAPI.login({ phone, password })
          // Call the API and wait for response
          // authAPI.login returns a Promise
          // await pauses until Promise resolves
          
          const { accessToken, refreshToken, user } = response.data.data
          // API response structure:
          // {
          //   data: {
          //     success: true,
          //     message: "Login successful",
          //     data: {           ← response.data.data
          //       accessToken: "eyJ...",
          //       refreshToken: "eyJ...",
          //       user: { userId: 1, name: "Priya", ... }
          //     }
          //   }
          // }
          
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)
          // Also store in localStorage for API interceptor to use
          // This is in addition to Zustand's persist middleware
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          })
          // Update all state at once
          // isAuthenticated: true enables access to protected routes
          
          return { success: true }
          // Return success for the component to know login worked
          
        } catch (error) {
          // Catch any errors (network, 401, 500, etc.)
          
          const message = error.response?.data?.message || 'Login failed'
          // Try to get error message from API response
          // Use optional chaining (?.) to safely access nested properties
          // If any part is null/undefined, returns undefined (not error)
          // || 'Login failed' provides fallback message
          
          set({ error: message, isLoading: false })
          // Store error and stop loading
          
          return { success: false, error: message }
          // Return failure info for component
        }
      },
      
      register: async (userData) => {
        // Similar to login but for new user registration
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
          })
          
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed'
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },
      
      logout: () => {
        // Clear all authentication data
        
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        // Remove from localStorage
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
        // Reset state to logged-out state
      },
      
      updateUser: (userData) => {
        // Update user data (e.g., after profile edit)
        
        set({ user: { ...get().user, ...userData } })
        // get().user: Current user object
        // ...get().user: Spread existing properties
        // ...userData: Override with new properties
        // This merges new data into existing user object
      },
      
      clearError: () => {
        set({ error: null })
        // Simple action to clear error message
      },
    }),
    
    // ========================================================================
    // PERSIST CONFIGURATION
    // ========================================================================
    
    {
      name: 'auth-storage',
      // Key name in localStorage
      // Data stored as: localStorage['auth-storage'] = JSON.stringify(state)
      
      partialize: (state) => ({
        // partialize: Function to select which state to persist
        // We DON'T persist isLoading and error
        // (those should reset on page load)
        
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
```

---

## 4. Backend Code Explained

### 4.1 Authentication Controller (`AuthController.java`)

The controller is the entry point for HTTP requests.

```java
// ============================================================================
// FILE: backend/src/main/java/com/hirelink/controller/AuthController.java
// PURPOSE: Handle HTTP requests for authentication endpoints
// ============================================================================

package com.hirelink.controller;
// Package declaration: Organizes classes into namespaces
// Convention: reverse domain name (com.hirelink.controller)

// ============================================================================
// IMPORTS - External classes we use
// ============================================================================

import com.hirelink.dto.ApiResponse;
import com.hirelink.dto.AuthDTO;
// DTO = Data Transfer Object
// Objects that carry data between processes
// Separates API format from internal data models

import com.hirelink.security.CustomUserDetails;
import com.hirelink.service.AuthService;
// Our custom classes for security and business logic

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
// Swagger annotations for API documentation
// Automatically generates interactive API docs

import jakarta.validation.Valid;
// @Valid annotation triggers validation on request body
// Part of Java Bean Validation specification

import lombok.RequiredArgsConstructor;
// Lombok annotation - generates constructor for final fields
// Reduces boilerplate code

import org.springframework.http.ResponseEntity;
// Spring class for HTTP responses
// Includes status code, headers, and body

import org.springframework.security.core.annotation.AuthenticationPrincipal;
// Annotation to inject currently authenticated user

import org.springframework.web.bind.annotation.*;
// Spring annotations for REST controllers
// Wildcard import (*) imports all public classes from package

// ============================================================================
// CONTROLLER CLASS
// ============================================================================

@RestController
// Marks this class as a REST controller
// Combines @Controller and @ResponseBody
// All methods return data directly (not view names)
// Spring automatically converts return values to JSON

@RequestMapping("/api/auth")
// Base URL path for all endpoints in this controller
// All methods here will have URLs starting with /api/auth

@RequiredArgsConstructor
// Lombok: Generates constructor with all 'final' fields
// Spring uses this for Dependency Injection
// Equivalent to writing:
// public AuthController(AuthService authService) {
//     this.authService = authService;
// }

@Tag(name = "Authentication", description = "Authentication endpoints")
// Swagger: Groups these endpoints under "Authentication" in API docs

public class AuthController {

    private final AuthService authService;
    // DEPENDENCY INJECTION via constructor
    // Spring automatically provides an AuthService instance
    // 'final' means it must be set in constructor and can't change
    // This is the "Service layer" that contains business logic

    // ========================================================================
    // LOGIN ENDPOINT
    // ========================================================================
    
    @PostMapping("/login")
    // HTTP POST requests to /api/auth/login come here
    // @PostMapping is shorthand for @RequestMapping(method = POST)
    // POST is used for actions that create/modify data (or login)
    
    @Operation(summary = "Login with phone and password")
    // Swagger: Description shown in API documentation
    
    public ResponseEntity<ApiResponse<AuthDTO.AuthResponse>> login(
            @Valid @RequestBody AuthDTO.LoginRequest request) {
        // METHOD SIGNATURE explained:
        // - public: Accessible from anywhere
        // - ResponseEntity<...>: Return type - HTTP response wrapper
        // - ApiResponse<AuthDTO.AuthResponse>: Generic types
        //   ApiResponse wraps our response with success/message/data
        //   AuthDTO.AuthResponse is the actual data (tokens + user)
        // - login: Method name
        // - @Valid: Triggers validation on the request object
        //   If validation fails, Spring returns 400 Bad Request
        // - @RequestBody: Tells Spring to parse HTTP body as JSON
        //   Converts JSON to LoginRequest object automatically
        // - AuthDTO.LoginRequest: The type we expect
        //   Inner class of AuthDTO containing phone and password
        
        AuthDTO.AuthResponse response = authService.login(request);
        // Call service layer to perform login
        // Service returns tokens and user data
        
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
        // ResponseEntity.ok(): Creates response with 200 OK status
        // ApiResponse.success(): Wraps data in standard response format
        // Final JSON looks like:
        // {
        //   "success": true,
        //   "message": "Login successful",
        //   "data": {
        //     "accessToken": "...",
        //     "refreshToken": "...",
        //     "user": { ... }
        //   }
        // }
    }

    // ========================================================================
    // REGISTER ENDPOINT
    // ========================================================================
    
    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<ApiResponse<AuthDTO.AuthResponse>> register(
            @Valid @RequestBody AuthDTO.RegisterRequest request) {
        AuthDTO.AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    // ========================================================================
    // REFRESH TOKEN ENDPOINT
    // ========================================================================
    
    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<ApiResponse<AuthDTO.AuthResponse>> refreshToken(
            @Valid @RequestBody AuthDTO.RefreshTokenRequest request) {
        AuthDTO.AuthResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("Token refreshed", response));
    }

    // ========================================================================
    // CHANGE PASSWORD ENDPOINT
    // ========================================================================
    
    @PostMapping("/change-password")
    @Operation(summary = "Change password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            // @AuthenticationPrincipal: Injects currently logged-in user
            // Spring Security sets this from the JWT token
            // CustomUserDetails wraps our User entity
            
            @Valid @RequestBody AuthDTO.ChangePasswordRequest request) {
        
        authService.changePassword(userDetails.getUserId(), request);
        // Get user ID from authenticated user, not from request
        // This prevents users from changing other users' passwords
        
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
        // ApiResponse.success() without data returns just success message
    }
}
```

### 4.2 Authentication Service (`AuthService.java`)

The service contains the business logic for authentication.

```java
// ============================================================================
// FILE: backend/src/main/java/com/hirelink/service/AuthService.java
// PURPOSE: Business logic for authentication operations
// ============================================================================

package com.hirelink.service;

import com.hirelink.dto.AuthDTO;
import com.hirelink.entity.ServiceProvider;
import com.hirelink.entity.User;
import com.hirelink.exception.BadRequestException;
import com.hirelink.exception.ResourceNotFoundException;
import com.hirelink.exception.UnauthorizedException;
import com.hirelink.repository.ServiceProviderRepository;
import com.hirelink.repository.UserRepository;
import com.hirelink.security.CustomUserDetails;
import com.hirelink.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
// Marks this class as a Spring Service component
// Spring will create one instance (singleton) and manage its lifecycle
// Services contain business logic, separate from controllers

@RequiredArgsConstructor
// Lombok: Generates constructor for dependency injection
public class AuthService {

    // ========================================================================
    // DEPENDENCIES - Injected by Spring
    // ========================================================================
    
    private final UserRepository userRepository;
    // Repository for database operations on User table
    
    private final ServiceProviderRepository providerRepository;
    // Repository for service providers
    
    private final PasswordEncoder passwordEncoder;
    // Encrypts passwords (BCrypt algorithm)
    // Never store plain-text passwords!
    
    private final JwtService jwtService;
    // Service to create and validate JWT tokens
    
    private final AuthenticationManager authenticationManager;
    // Spring Security component that orchestrates authentication

    // ========================================================================
    // LOGIN METHOD
    // ========================================================================
    
    @Transactional
    // Marks this method as a database transaction
    // If anything fails, all database changes are rolled back
    // Ensures data consistency
    
    public AuthDTO.AuthResponse login(AuthDTO.LoginRequest request) {
        // Takes login request, returns tokens and user data
        
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                        request.getPhone(), 
                        request.getPassword()
                    )
            );
            // AUTHENTICATION PROCESS:
            // 1. Creates authentication token with credentials
            // 2. AuthenticationManager delegates to AuthenticationProvider
            // 3. Provider uses UserDetailsService to load user by phone
            // 4. Provider uses PasswordEncoder to verify password
            // 5. If valid, returns authenticated token
            // 6. If invalid, throws AuthenticationException
            
        } catch (Exception e) {
            // Authentication failed (wrong phone or password)
            throw new UnauthorizedException("Invalid phone or password");
            // Throw custom exception with generic message
            // Don't reveal if phone exists (security best practice)
        }

        // Authentication successful - get user from database
        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new UnauthorizedException("Invalid phone or password"));
        // findByPhone returns Optional<User>
        // orElseThrow: Get value or throw exception if empty

        // Update login tracking
        user.setLastLoginAt(LocalDateTime.now());
        // Record login time for audit/analytics
        
        user.setFailedLoginAttempts(0);
        // Reset failed attempts counter on successful login
        
        userRepository.save(user);
        // Persist changes to database

        // Generate JWT tokens
        CustomUserDetails userDetails = new CustomUserDetails(user);
        // Wrap User in Spring Security's UserDetails interface
        
        String accessToken = jwtService.generateAccessToken(userDetails);
        // Create short-lived token (e.g., 1 hour)
        // Contains: user phone, expiration, signature
        
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        // Create long-lived token (e.g., 7 days)
        // Used to get new access tokens without re-login

        // Build and return response
        return AuthDTO.AuthResponse.builder()
                // BUILDER PATTERN: Fluent way to construct objects
                // Each method sets a property and returns builder
                
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                // Token type tells client how to use the token
                // "Bearer" means: Authorization: Bearer <token>
                
                .expiresIn(jwtService.getAccessTokenExpiration())
                // Time in milliseconds until access token expires
                // Client can use this to refresh proactively
                
                .user(mapToUserDTO(user))
                // Convert User entity to DTO (hide sensitive fields)
                
                .build();
                // Final step: Create the AuthResponse object
    }

    // ========================================================================
    // REGISTER METHOD
    // ========================================================================
    
    @Transactional
    public AuthDTO.AuthResponse register(AuthDTO.RegisterRequest request) {
        
        // Check if phone already registered
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException("Phone number already registered");
            // Throw 400 Bad Request error
        }

        // Check if email already registered (if provided)
        if (request.getEmail() != null && !request.getEmail().isEmpty() && 
            userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        // Determine user type
        User.UserType userType = User.UserType.CUSTOMER;
        // Default to CUSTOMER
        // User.UserType is an enum defined inside User class
        
        if (request.getUserType() != null && 
            request.getUserType().equalsIgnoreCase("PROVIDER")) {
            userType = User.UserType.PROVIDER;
            // equalsIgnoreCase: Compare strings ignoring case
        }

        // Create new user using Builder pattern
        User user = User.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                // CRITICAL: Never store plain passwords!
                // BCrypt creates hash like: $2a$12$b/tFjZCh...
                // One-way: Can verify but not reverse
                
                .userType(userType)
                .accountStatus(User.AccountStatus.ACTIVE)
                .build();

        user = userRepository.save(user);
        // save() inserts new record (no ID) or updates existing
        // Returns saved entity with generated ID

        // If provider, create provider profile
        if (userType == User.UserType.PROVIDER) {
            ServiceProvider provider = ServiceProvider.builder()
                    .user(user)
                    .businessName(request.getName() + "'s Services")
                    .build();
            providerRepository.save(provider);
        }

        // Generate tokens (same as login)
        CustomUserDetails userDetails = new CustomUserDetails(user);
        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return AuthDTO.AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessTokenExpiration())
                .user(mapToUserDTO(user))
                .build();
    }

    // ========================================================================
    // HELPER METHOD - Convert entity to DTO
    // ========================================================================
    
    private AuthDTO.UserDTO mapToUserDTO(User user) {
        // Convert User entity to UserDTO
        // DTOs are safer to return - no database relationships
        // Can control exactly what data is exposed
        
        return AuthDTO.UserDTO.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .profileImageUrl(user.getProfileImageUrl())
                .userType(user.getUserType().name())
                // .name() converts enum to String
                // UserType.CUSTOMER.name() → "CUSTOMER"
                
                .accountStatus(user.getAccountStatus().name())
                .isEmailVerified(user.getIsEmailVerified())
                .isPhoneVerified(user.getIsPhoneVerified())
                .build();
    }
}
```

### 4.3 JWT Service (`JwtService.java`)

This service creates and validates JSON Web Tokens.

```java
// ============================================================================
// FILE: backend/src/main/java/com/hirelink/security/JwtService.java
// PURPOSE: Create, parse, and validate JWT tokens
// ============================================================================

package com.hirelink.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
// JJWT library for JWT operations
// io.jsonwebtoken is the package

import org.springframework.beans.factory.annotation.Value;
// @Value injects properties from application.properties

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
// Function: Functional interface for lambdas that take input and return output

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;
    // Injects value from application.properties:
    // jwt.secret=your-256-bit-secret-key-here
    // This key signs tokens - keep it SECRET!

    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration;
    // Example: 3600000 (1 hour in milliseconds)

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;
    // Example: 604800000 (7 days in milliseconds)

    // ========================================================================
    // EXTRACT INFORMATION FROM TOKEN
    // ========================================================================
    
    public String extractUsername(String token) {
        // Get username (phone) from token
        return extractClaim(token, Claims::getSubject);
        // Claims::getSubject is a method reference
        // Equivalent to: claims -> claims.getSubject()
        // "Subject" is JWT standard term for the user identifier
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        // GENERIC METHOD: <T> means return type is determined by caller
        // Function<Claims, T>: Takes Claims, returns T
        
        final Claims claims = extractAllClaims(token);
        // Parse token and get all claims
        
        return claimsResolver.apply(claims);
        // Apply the function to get specific claim
        // Example: claimsResolver = Claims::getExpiration
        // Result: Date object of expiration time
    }

    private Claims extractAllClaims(String token) {
        // Parse token and extract all claims (payload data)
        return Jwts.parser()
                .verifyWith(getSignInKey())
                // Verify signature using our secret key
                // If signature doesn't match, throws exception
                
                .build()
                .parseSignedClaims(token)
                // Parse the JWT string
                
                .getPayload();
                // Get the claims (payload) section
    }

    // ========================================================================
    // GENERATE TOKENS
    // ========================================================================
    
    public String generateAccessToken(UserDetails userDetails) {
        return generateAccessToken(new HashMap<>(), userDetails);
        // Call overloaded method with empty extra claims
    }

    public String generateAccessToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        // extraClaims: Additional data to include in token
        // Example: { "role": "ADMIN" }
        
        return buildToken(extraClaims, userDetails, accessTokenExpiration);
    }

    public String generateRefreshToken(UserDetails userDetails) {
        return buildToken(new HashMap<>(), userDetails, refreshTokenExpiration);
    }

    private String buildToken(Map<String, Object> extraClaims, UserDetails userDetails, long expiration) {
        // BUILD A JWT TOKEN
        
        return Jwts.builder()
                // Start building token
                
                .claims(extraClaims)
                // Add any extra claims to payload
                
                .subject(userDetails.getUsername())
                // Set "sub" claim to username (phone number)
                // This identifies who the token belongs to
                
                .issuedAt(new Date(System.currentTimeMillis()))
                // Set "iat" (issued at) claim
                // Current time in milliseconds since epoch
                
                .expiration(new Date(System.currentTimeMillis() + expiration))
                // Set "exp" (expiration) claim
                // Current time + expiration duration
                
                .signWith(getSignInKey(), Jwts.SIG.HS256)
                // Sign with our secret key using HMAC-SHA256 algorithm
                // Signature ensures token wasn't tampered with
                
                .compact();
                // Build and serialize to string
                // Result: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIi..."
    }

    // ========================================================================
    // VALIDATE TOKEN
    // ========================================================================
    
    public boolean isTokenValid(String token, UserDetails userDetails) {
        // Check if token is valid for this user
        
        final String username = extractUsername(token);
        // Get phone from token
        
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
        // Valid if:
        // 1. Phone in token matches user's phone
        // 2. Token hasn't expired
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
        // Compare expiration date with current date
        // before() returns true if expiration is in the past
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
        // Get "exp" claim as Date
    }

    // ========================================================================
    // CRYPTOGRAPHIC KEY
    // ========================================================================
    
    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        // Decode Base64-encoded secret key to bytes
        // Secret key should be Base64-encoded in properties
        
        return Keys.hmacShaKeyFor(keyBytes);
        // Create HMAC-SHA key from bytes
        // This key is used for both signing and verification
    }

    public long getAccessTokenExpiration() {
        return accessTokenExpiration;
        // Getter for expiration time
        // Used to tell client when token expires
    }
}
```

### 4.4 User Entity (`User.java`)

The entity maps to the database table.

```java
// ============================================================================
// FILE: backend/src/main/java/com/hirelink/entity/User.java
// PURPOSE: JPA entity mapping to 'users' table in database
// ============================================================================

package com.hirelink.entity;

import jakarta.persistence.*;
// JPA (Java Persistence API) annotations for database mapping
// jakarta.persistence is the modern package (javax.persistence is legacy)

import lombok.*;
// Lombok annotations to reduce boilerplate code

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
// Spring Data JPA auditing - automatic timestamps

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
// Marks this class as a JPA entity
// JPA will manage instances of this class as database records

@Table(name = "users")
// Specifies the database table name
// Without this, table name would be "user" (class name)

@EntityListeners(AuditingEntityListener.class)
// Enables automatic auditing (created_at, updated_at)
// AuditingEntityListener handles @CreatedDate and @LastModifiedDate

@Data
// Lombok: Generates getters, setters, equals, hashCode, toString
// Equivalent to writing all these methods manually

@NoArgsConstructor
// Lombok: Generates no-argument constructor
// Required by JPA for entity instantiation

@AllArgsConstructor
// Lombok: Generates constructor with all fields

@Builder
// Lombok: Generates builder pattern
// Usage: User.builder().name("John").phone("123").build()

public class User {

    @Id
    // Marks this field as the primary key
    
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // Auto-generate ID values
    // IDENTITY: Database auto-increment (MySQL: AUTO_INCREMENT)
    
    @Column(name = "user_id")
    // Maps to column 'user_id' in database
    // Without this, column name would match field name
    private Long userId;

    @Column(nullable = false, length = 100)
    // nullable = false: NOT NULL constraint
    // length = 100: VARCHAR(100)
    private String name;

    @Column(unique = true, length = 150)
    // unique = true: UNIQUE constraint
    // Ensures no two users have same email
    private String email;

    @Column(nullable = false, unique = true, length = 15)
    // Phone is required and must be unique
    private String phone;

    @Column(name = "password_hash", nullable = false)
    // Maps to 'password_hash' column
    // Stores BCrypt hash, not plain password
    private String passwordHash;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;
    // LocalDate: Date without time (year-month-day)

    @Enumerated(EnumType.STRING)
    // Store enum as STRING in database
    // Without this, stores as INTEGER (ordinal)
    // STRING is safer - enum order changes don't break data
    private Gender gender;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_type", nullable = false)
    @Builder.Default
    // @Builder.Default: Sets default value when using builder
    // Without this, builder would set null
    private UserType userType = UserType.CUSTOMER;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_status")
    @Builder.Default
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    @Column(name = "is_email_verified")
    @Builder.Default
    private Boolean isEmailVerified = false;

    @Column(name = "is_phone_verified")
    @Builder.Default
    private Boolean isPhoneVerified = false;

    @Column(name = "failed_login_attempts")
    @Builder.Default
    private Integer failedLoginAttempts = 0;
    // Track failed attempts for security
    // Can lock account after too many failures

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;
    // If set, account is locked until this time

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;
    // Track for audit and analytics

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    // @CreatedDate: Automatically set on insert
    // updatable = false: Never change after insert
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    // @LastModifiedDate: Automatically updated on every save
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    // Soft delete: Set this instead of actually deleting
    // Allows data recovery and audit trails

    // ========================================================================
    // RELATIONSHIPS
    // ========================================================================
    
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // One user can have one service provider profile
    // mappedBy = "user": The ServiceProvider entity owns the relationship
    // cascade = ALL: Operations propagate to related entity
    // fetch = LAZY: Don't load until accessed (performance)
    
    @ToString.Exclude
    // Lombok: Exclude from toString() to prevent infinite loops
    private ServiceProvider serviceProvider;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // One user can have many addresses
    @ToString.Exclude
    private List<UserAddress> addresses;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // One user can have many bookings
    @ToString.Exclude
    private List<Booking> bookings;

    // ========================================================================
    // ENUMS - Defined as inner classes
    // ========================================================================
    
    public enum Gender {
        MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY
    }
    // Enum: Fixed set of constants
    // Safer than strings - compiler catches typos

    public enum UserType {
        CUSTOMER, PROVIDER, ADMIN, SUPER_ADMIN
    }
    // Different roles in the system

    public enum AccountStatus {
        ACTIVE, INACTIVE, SUSPENDED, BANNED, PENDING_VERIFICATION
    }

    public enum Language {
        EN, HI, TA, TE, BN, MR, GU, KN, ML
    }
    // Supported languages (Indian languages)
}
```

### 4.5 User Repository (`UserRepository.java`)

Repository provides database operations.

```java
// ============================================================================
// FILE: backend/src/main/java/com/hirelink/repository/UserRepository.java
// PURPOSE: Data access layer for User entity
// ============================================================================

package com.hirelink.repository;

import com.hirelink.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
// Marks this as a Spring Data repository component
// Spring creates implementation automatically at runtime

public interface UserRepository extends JpaRepository<User, Long> {
    // INTERFACE: Defines what methods are available
    // Spring Data JPA generates implementation automatically
    
    // JpaRepository<User, Long>:
    // - User: The entity type this repository manages
    // - Long: The type of the entity's primary key (userId)
    
    // JpaRepository provides standard methods:
    // - save(entity): Insert or update
    // - findById(id): Find by primary key
    // - findAll(): Get all records
    // - delete(entity): Remove record
    // - count(): Count records
    
    // ========================================================================
    // CUSTOM QUERY METHODS
    // ========================================================================
    
    Optional<User> findByPhone(String phone);
    // SPRING DATA MAGIC: Method name becomes query!
    // "findBy" + "Phone" → SELECT * FROM users WHERE phone = ?
    // Returns Optional: May or may not find a user
    // Optional.empty() if not found, Optional.of(user) if found
    
    Optional<User> findByEmail(String email);
    // SELECT * FROM users WHERE email = ?
    
    boolean existsByPhone(String phone);
    // "existsBy" + "Phone" → SELECT COUNT(*) > 0 FROM users WHERE phone = ?
    // Returns true if at least one record matches
    // Used to check if phone is already registered
    
    boolean existsByEmail(String email);
    // Check if email is already registered
    
    Optional<User> findByPhoneAndDeletedAtIsNull(String phone);
    // More complex query:
    // "findBy" + "Phone" + "And" + "DeletedAt" + "IsNull"
    // SELECT * FROM users WHERE phone = ? AND deleted_at IS NULL
    // Only find non-deleted users (soft delete pattern)
}
```

### 4.6 Security Configuration (`SecurityConfig.java`)

Configures Spring Security for the application.

```java
// ============================================================================
// FILE: backend/src/main/java/com/hirelink/config/SecurityConfig.java
// PURPOSE: Configure Spring Security - authentication, authorization, CORS
// ============================================================================

package com.hirelink.config;

import com.hirelink.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
// Marks this as a configuration class
// Spring processes this at startup to configure the application

@EnableWebSecurity
// Enables Spring Security's web security features
// Required for all Spring Security configurations

@EnableMethodSecurity
// Enables method-level security annotations
// Allows @PreAuthorize, @Secured on controller methods

@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    // Our custom filter that validates JWT tokens
    
    private final UserDetailsService userDetailsService;
    // Service to load user data (UserDetailsServiceImpl)

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;
    // CORS allowed origins from properties
    // Example: "http://localhost:5173,https://hirelink.in"

    // ========================================================================
    // SECURITY FILTER CHAIN - Main security configuration
    // ========================================================================
    
    @Bean
    // @Bean: Method that creates and configures a Spring-managed object
    // Spring calls this at startup and manages the returned object
    
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // HttpSecurity: Builder for security configuration
        // SecurityFilterChain: The chain of security filters
        
        http
            .csrf(AbstractHttpConfigurer::disable)
            // DISABLE CSRF (Cross-Site Request Forgery) protection
            // CSRF tokens are for session-based auth
            // We use JWT tokens, so CSRF isn't needed
            // AbstractHttpConfigurer::disable is a method reference
            
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // ENABLE CORS with custom configuration
            // CORS allows frontend on different origin to call our API
            // Lambda: cors -> configure using our cors configuration
            
            .authorizeHttpRequests(auth -> auth
                // AUTHORIZATION RULES - Who can access what
                
                .requestMatchers(
                    "/api/auth/**",      // All auth endpoints (login, register)
                    "/api/categories/**", // Public category data
                    "/api/services/**",   // Public service listings
                    "/api/providers/**",  // Public provider profiles
                    "/swagger-ui/**",     // API documentation
                    "/api-docs/**"        // API documentation
                ).permitAll()
                // permitAll(): No authentication required
                // Anyone can access these endpoints
                
                .requestMatchers("/api/admin/**")
                    .hasAnyRole("ADMIN", "SUPER_ADMIN")
                // Admin endpoints require ADMIN or SUPER_ADMIN role
                // hasAnyRole adds "ROLE_" prefix automatically
                
                .requestMatchers("/api/provider/**")
                    .hasAnyRole("PROVIDER", "ADMIN", "SUPER_ADMIN")
                // Provider endpoints require PROVIDER+ role
                
                .anyRequest().authenticated()
                // ALL OTHER REQUESTS require authentication
                // If not matched above, must have valid JWT
            )
            
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            // STATELESS: Don't create HTTP sessions
            // Each request is independent, authenticated by JWT
            // This is how REST APIs work - no server-side session
            
            .authenticationProvider(authenticationProvider())
            // Register our authentication provider
            
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
            // ADD JWT FILTER before standard authentication
            // Our filter runs first to extract and validate JWT
            // If valid, sets authentication in SecurityContext

        return http.build();
        // Build and return the security filter chain
    }

    // ========================================================================
    // CORS CONFIGURATION
    // ========================================================================
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        // Which origins (domains) can call our API
        // Split comma-separated string into list
        
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));
        // Which HTTP methods are allowed
        
        configuration.setAllowedHeaders(List.of("*"));
        // Which headers client can send
        // * = all headers
        
        configuration.setAllowCredentials(true);
        // Allow cookies/auth headers
        
        configuration.setMaxAge(3600L);
        // Cache CORS preflight response for 1 hour
        // Reduces OPTIONS requests
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        // Apply to all endpoints
        
        return source;
    }

    // ========================================================================
    // AUTHENTICATION PROVIDER
    // ========================================================================
    
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        // DAO = Data Access Object
        // Uses UserDetailsService to load users from database
        
        authProvider.setUserDetailsService(userDetailsService);
        // How to load user data
        
        authProvider.setPasswordEncoder(passwordEncoder());
        // How to verify passwords
        
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) 
            throws Exception {
        return config.getAuthenticationManager();
        // Get Spring's default AuthenticationManager
        // Needed by AuthService.login()
    }

    // ========================================================================
    // PASSWORD ENCODER
    // ========================================================================
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
        // BCRYPT: Secure password hashing algorithm
        // 12 = strength (work factor)
        // Higher = more secure but slower
        // 12 is good balance for web applications
        // 
        // BCrypt features:
        // - Automatic salt generation (prevents rainbow tables)
        // - Slow computation (prevents brute force)
        // - Same password = different hash each time
    }
}
```

---

## 5. Database Layer

### 5.1 Users Table Schema

```sql
-- ============================================================================
-- Database: MySQL
-- Table: users
-- Purpose: Store user account information
-- ============================================================================

CREATE TABLE users (
    -- PRIMARY KEY
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    -- BIGINT: Large integer (up to 9 quintillion)
    -- AUTO_INCREMENT: Database automatically assigns next number
    -- PRIMARY KEY: Unique identifier for each row
    
    -- USER INFORMATION
    name VARCHAR(100) NOT NULL,
    -- VARCHAR(100): Variable-length string, max 100 chars
    -- NOT NULL: This field is required
    
    email VARCHAR(150) UNIQUE,
    -- UNIQUE: No two rows can have same email
    -- (NULL values don't count for uniqueness)
    
    phone VARCHAR(15) NOT NULL UNIQUE,
    -- Phone is required and must be unique
    -- Used as login identifier
    
    password_hash VARCHAR(255) NOT NULL,
    -- Stores BCrypt hash, not actual password
    -- BCrypt hashes are 60 chars, 255 gives headroom
    
    profile_image_url VARCHAR(500),
    -- URL to profile picture
    -- 500 chars for long URLs
    
    date_of_birth DATE,
    -- DATE: Year-month-day (no time component)
    
    gender ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'),
    -- ENUM: Restricts values to listed options
    -- More efficient than VARCHAR for fixed options
    
    -- ACCOUNT STATUS
    user_type ENUM('CUSTOMER', 'PROVIDER', 'ADMIN', 'SUPER_ADMIN') 
        NOT NULL DEFAULT 'CUSTOMER',
    -- DEFAULT: Value used if not specified in INSERT
    
    account_status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED', 
        'PENDING_VERIFICATION') DEFAULT 'ACTIVE',
    
    -- VERIFICATION FLAGS
    is_email_verified BOOLEAN DEFAULT FALSE,
    -- BOOLEAN: TRUE/FALSE value
    
    is_phone_verified BOOLEAN DEFAULT FALSE,
    
    -- SECURITY
    failed_login_attempts INT DEFAULT 0,
    -- Track failed attempts for account lockout
    
    locked_until DATETIME,
    -- If set, account is locked until this time
    
    last_login_at DATETIME,
    -- For audit and analytics
    
    -- TIMESTAMPS
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- CURRENT_TIMESTAMP: Current date/time when row inserted
    
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- ON UPDATE: Automatically updates when row changes
    
    deleted_at DATETIME
    -- Soft delete marker - NULL means not deleted
);

-- INDEX for fast lookups
CREATE INDEX idx_users_phone ON users(phone);
-- Creates B-tree index on phone column
-- Makes WHERE phone = ? queries much faster
-- Essential for login performance
```

### 5.2 Sample User Data

```sql
-- Insert a test customer user
-- Password: password123
-- BCrypt hash generated with strength 12

INSERT INTO users (
    user_id, 
    name, 
    email, 
    phone, 
    password_hash, 
    user_type, 
    account_status, 
    is_email_verified, 
    is_phone_verified,
    created_at
) VALUES (
    1,
    'Priya Sharma',
    'priya.sharma@email.com',
    '9876543210',
    '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK',
    -- This is BCrypt hash of 'password123'
    -- $2a$ = BCrypt identifier
    -- $12$ = cost factor (strength)
    -- Rest is salt + hash
    'CUSTOMER',
    'ACTIVE',
    TRUE,
    TRUE,
    '2025-06-15 10:30:00'
);
```

---

## 6. Security Concepts

### 6.1 What is JWT (JSON Web Token)?

JWT is a secure way to transmit information between parties as a JSON object.

```
A JWT looks like this:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ODc2NTQzMjEwIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE2MTYyNDI2MjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

It has 3 parts separated by dots:

┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER.PAYLOAD.SIGNATURE                                                 │
└─────────────────────────────────────────────────────────────────────────┘

1. HEADER (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9)
   Base64 encoded JSON:
   {
     "alg": "HS256",    // Signing algorithm (HMAC-SHA256)
     "typ": "JWT"       // Token type
   }

2. PAYLOAD (eyJzdWIiOiI5ODc2NTQzMjEwIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE2MTYyNDI2MjJ9)
   Base64 encoded JSON:
   {
     "sub": "9876543210",    // Subject (user's phone)
     "iat": 1616239022,      // Issued at (timestamp)
     "exp": 1616242622       // Expires at (timestamp)
   }

3. SIGNATURE (SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c)
   Created by:
   HMACSHA256(
     base64UrlEncode(header) + "." + base64UrlEncode(payload),
     secret_key
   )
```

### 6.2 Password Hashing with BCrypt

```
Plain Password:  password123

BCrypt Process:
1. Generate random salt (22 characters)
2. Combine password + salt
3. Apply BCrypt algorithm (multiple rounds based on cost factor)
4. Produce hash

BCrypt Hash: $2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK
             ─┬─ ─┬─ ────────────────────┬──────────────── ────────────┬────────
              │   │                       │                            │
              │   │                       └── Salt (22 chars)          │
              │   │                                                    │
              │   └── Cost factor (12 rounds = 2^12 iterations)       │
              │                                                        │
              └── Algorithm identifier ($2a$ = BCrypt)                │
                                                                       │
                                    Hash result ──────────────────────┘

WHY BCRYPT?
- Salt prevents rainbow table attacks
- Cost factor makes brute force impractical
- Same password produces different hash each time
```

### 6.3 Authentication Flow Security

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY MEASURES IN LOGIN FLOW                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. TRANSPORT SECURITY                                                          │
│     └─ HTTPS encrypts all data in transit                                       │
│        (Password never travels as plain text)                                   │
│                                                                                 │
│  2. PASSWORD STORAGE                                                            │
│     └─ BCrypt hash stored, not plain password                                   │
│        (If database leaked, passwords are safe)                                 │
│                                                                                 │
│  3. AUTHENTICATION                                                              │
│     └─ Spring Security validates credentials                                    │
│        (Centralized, well-tested security logic)                                │
│                                                                                 │
│  4. TOKEN-BASED AUTH                                                            │
│     └─ JWT tokens instead of sessions                                           │
│        (Stateless, scalable, no session storage)                                │
│                                                                                 │
│  5. TOKEN EXPIRATION                                                            │
│     └─ Access tokens expire quickly (1 hour)                                    │
│        (Limits damage if token stolen)                                          │
│                                                                                 │
│  6. REFRESH TOKENS                                                              │
│     └─ Long-lived tokens to get new access tokens                               │
│        (User doesn't re-enter password often)                                   │
│                                                                                 │
│  7. ACCOUNT LOCKOUT                                                             │
│     └─ Lock after too many failed attempts                                      │
│        (Prevents brute force attacks)                                           │
│                                                                                 │
│  8. CORS PROTECTION                                                             │
│     └─ Only allowed origins can call API                                        │
│        (Prevents malicious websites from calling API)                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Complete Data Flow Example

Let's trace what happens when user "Priya" logs in with phone "9876543210" and password "password123".

### Step-by-Step Flow

```
STEP 1: USER ACTION
───────────────────
Priya opens the login page and enters:
- Phone: 9876543210
- Password: password123
- Clicks "Sign In"


STEP 2: FRONTEND FORM HANDLING (Login.jsx)
──────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│ const onSubmit = async (data) => {                              │
│   // data = { phone: "9876543210", password: "password123" }    │
│   clearError()                                                  │
│   const result = await login(data.phone, data.password)         │
│   // Calls authStore.login()                                    │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘


STEP 3: STATE MANAGEMENT (authStore.js)
───────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│ login: async (phone, password) => {                             │
│   set({ isLoading: true, error: null })                         │
│   // UI shows loading spinner                                   │
│                                                                 │
│   const response = await authAPI.login({ phone, password })     │
│   // Calls api.js                                               │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘


STEP 4: HTTP REQUEST (api.js)
─────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│ HTTP POST http://localhost:8080/api/auth/login                  │
│ Headers:                                                        │
│   Content-Type: application/json                                │
│ Body:                                                           │
│   {                                                             │
│     "phone": "9876543210",                                      │
│     "password": "password123"                                   │
│   }                                                             │
└─────────────────────────────────────────────────────────────────┘


STEP 5: BACKEND CONTROLLER (AuthController.java)
────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│ @PostMapping("/login")                                          │
│ public ResponseEntity<...> login(@Valid @RequestBody request) { │
│   // Spring automatically:                                      │
│   // 1. Parses JSON body to LoginRequest object                 │
│   // 2. Validates fields (@NotBlank, etc.)                      │
│                                                                 │
│   AuthDTO.AuthResponse response = authService.login(request);   │
│   return ResponseEntity.ok(ApiResponse.success(..., response)); │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘


STEP 6: AUTHENTICATION SERVICE (AuthService.java)
─────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│ authenticationManager.authenticate(                             │
│     new UsernamePasswordAuthenticationToken(                    │
│         "9876543210",      // username (phone)                  │
│         "password123"      // password                          │
│     )                                                           │
│ );                                                              │
│                                                                 │
│ // AuthenticationManager delegates to DaoAuthenticationProvider │
│ // which uses UserDetailsServiceImpl to load user               │
└─────────────────────────────────────────────────────────────────┘


STEP 7: LOAD USER (UserDetailsServiceImpl.java)
───────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│ public UserDetails loadUserByUsername(String phone) {           │
│   User user = userRepository.findByPhone(phone)                 │
│       .orElseThrow(() -> new UsernameNotFoundException(...));   │
│   return new CustomUserDetails(user);                           │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘


STEP 8: DATABASE QUERY (UserRepository.java → MySQL)
────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│ SQL: SELECT * FROM users WHERE phone = '9876543210'             │
│                                                                 │
│ Result:                                                         │
│ ┌────────┬──────────────┬────────────────────────────────────┐  │
│ │user_id │ name         │ password_hash                      │  │
│ ├────────┼──────────────┼────────────────────────────────────┤  │
│ │ 1      │ Priya Sharma │ $2a$12$b/tFjZChShbX...             │  │
│ └────────┴──────────────┴────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘


STEP 9: PASSWORD VERIFICATION (BCryptPasswordEncoder)
─────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│ passwordEncoder.matches("password123", stored_hash)             │
│                                                                 │
│ Process:                                                        │
│ 1. Extract salt from stored hash                                │
│ 2. Hash "password123" with same salt                            │
│ 3. Compare result with stored hash                              │
│                                                                 │
│ Result: TRUE (passwords match!)                                 │
└─────────────────────────────────────────────────────────────────┘


STEP 10: GENERATE JWT TOKENS (JwtService.java)
──────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│ Access Token:                                                   │
│ {                                                               │
│   "sub": "9876543210",                                          │
│   "iat": 1737000000,        // Issued now                       │
│   "exp": 1737003600         // Expires in 1 hour                │
│ }                                                               │
│ + Signature with secret key                                     │
│                                                                 │
│ Result: eyJhbGciOiJIUzI1NiIs...                                 │
└─────────────────────────────────────────────────────────────────┘


STEP 11: BACKEND RESPONSE
─────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│ HTTP 200 OK                                                     │
│ {                                                               │
│   "success": true,                                              │
│   "message": "Login successful",                                │
│   "data": {                                                     │
│     "accessToken": "eyJhbGciOiJIUzI1NiIs...",                   │
│     "refreshToken": "eyJhbGciOiJIUzI1NiIs...",                  │
│     "tokenType": "Bearer",                                      │
│     "expiresIn": 3600000,                                       │
│     "user": {                                                   │
│       "userId": 1,                                              │
│       "name": "Priya Sharma",                                   │
│       "phone": "9876543210",                                    │
│       "userType": "CUSTOMER"                                    │
│     }                                                           │
│   }                                                             │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘


STEP 12: FRONTEND STORES DATA (authStore.js)
────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│ localStorage.setItem('accessToken', accessToken)                │
│ localStorage.setItem('refreshToken', refreshToken)              │
│                                                                 │
│ set({                                                           │
│   user: { userId: 1, name: "Priya Sharma", ... },               │
│   accessToken: "eyJ...",                                        │
│   refreshToken: "eyJ...",                                       │
│   isAuthenticated: true,                                        │
│   isLoading: false                                              │
│ })                                                              │
└─────────────────────────────────────────────────────────────────┘


STEP 13: UI UPDATE (Login.jsx)
──────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│ if (result.success) {                                           │
│   toast.success('Welcome back!')  // Green notification         │
│   navigate('/')                   // Redirect to home           │
│ }                                                               │
│                                                                 │
│ Priya sees "Welcome back!" and is taken to the home page.       │
│ She is now logged in and can access protected features.         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

The login workflow demonstrates how modern web applications handle authentication:

1. **Frontend** collects credentials and manages UI state
2. **Backend** validates credentials and issues tokens
3. **Database** stores user data securely with hashed passwords
4. **JWT tokens** provide stateless authentication for subsequent requests

Key technologies and concepts:
- **React Hooks**: useState, useForm for state management
- **Zustand**: Global state management with persistence
- **Axios**: HTTP client with interceptors
- **Spring Boot**: REST API framework
- **Spring Security**: Authentication and authorization
- **JPA/Hibernate**: Database ORM
- **BCrypt**: Password hashing
- **JWT**: Token-based authentication

---

*Document created for HireLink Academic Project - ENSATE 2026*
