import { Outlet, Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../context/authStore'

export default function AuthLayout({ variant = 'customer' }) {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const isProvider = variant === 'provider'

  return (
    <div className={`min-h-screen bg-gradient-to-br ${
      isProvider
        ? 'from-emerald-50 via-white to-emerald-100'
        : 'from-primary-50 via-white to-primary-100'
    } flex flex-col`}>
      <header className="p-6">
        <Link to="/" className="flex items-center space-x-2 w-fit">
          <div className={`w-10 h-10 bg-gradient-to-br ${
            isProvider
              ? 'from-emerald-500 to-emerald-700 shadow-emerald-500/30'
              : 'from-primary-500 to-primary-700 shadow-primary-500/30'
          } rounded-xl flex items-center justify-center shadow-lg`}>
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <span className={`text-xl font-bold bg-gradient-to-r ${
            isProvider
              ? 'from-emerald-600 to-emerald-800'
              : 'from-primary-600 to-primary-800'
          } bg-clip-text text-transparent`}>HireLink</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
            <Outlet />
          </div>
          
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>Academic Project - ENSATE 2026</p>
          </div>
        </div>
      </main>

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 ${
          isProvider ? 'bg-emerald-200/30' : 'bg-primary-200/30'
        } rounded-full blur-3xl`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 ${
          isProvider ? 'bg-teal-200/30' : 'bg-accent-200/30'
        } rounded-full blur-3xl`}></div>
      </div>
    </div>
  )
}
