import { Link, useSearchParams } from 'react-router-dom'
import {
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

export default function EmailVerified() {
  const [searchParams] = useSearchParams()
  const status = searchParams.get('status')
  const message = searchParams.get('message')

  const isSuccess = status === 'success'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {isSuccess ? (
          <>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-500 mb-6">
              Your email has been verified successfully. You can now sign in.
            </p>
            <Link
              to="/login"
              className="inline-block w-full btn-primary py-3 text-lg"
            >
              Sign In
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircleIcon className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-500 mb-6">
              {message
                ? decodeURIComponent(message)
                : 'The verification link may be invalid or expired. Please try registering again.'}
            </p>
            <div className="space-y-3">
              <Link
                to="/register"
                className="inline-block w-full btn-secondary py-3"
              >
                Back to Register
              </Link>
              <Link
                to="/login"
                className="inline-block w-full text-primary-600 font-medium hover:underline py-2"
              >
                Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
