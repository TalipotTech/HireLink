import { useState, useEffect } from 'react'
import adminApi from '../../services/adminApi'

const kycBadgeClass = (status) => {
  switch (status) {
    case 'VERIFIED': return 'bg-green-100 text-green-700'
    case 'PENDING': return 'bg-yellow-100 text-yellow-700'
    case 'REJECTED': return 'bg-red-100 text-red-700'
    case 'EXPIRED': return 'bg-gray-100 text-gray-600'
    case 'NOT_SUBMITTED': return 'bg-gray-100 text-gray-400'
    default: return 'bg-gray-100 text-gray-500'
  }
}

const ProviderApprovals = () => {
  const [providers, setProviders] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProviders()
  }, [filter])

  const fetchProviders = async () => {
    setLoading(true)
    try {
      const endpoint = filter === 'pending' ? '/providers/pending' : '/providers'
      const res = await adminApi.get(endpoint)
      setProviders(res.data.data || [])
    } catch (err) {
      console.error('Failed to load providers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    if (!confirm('Approve this provider? Their KYC status will be set to VERIFIED.')) return
    try {
      await adminApi.post(`/providers/${id}/approve`)
      fetchProviders()
    } catch (err) {
      alert('Failed to approve provider: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection:')
    if (!reason) return
    try {
      await adminApi.post(`/providers/${id}/reject`, { reason })
      fetchProviders()
    } catch (err) {
      alert('Failed to reject provider: ' + (err.response?.data?.message || err.message))
    }
  }

  const filteredProviders = filter === 'all' ? providers
    : filter === 'pending' ? providers
    : providers.filter(p => p.kycStatus === filter)

  const pendingCount = filter === 'all' ? providers.filter(p => p.kycStatus === 'PENDING').length : null

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Provider Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {providers.length} provider{providers.length !== 1 ? 's' : ''} total
            {pendingCount != null && pendingCount > 0 && (
              <span className="ml-2 text-yellow-600 font-medium">({pendingCount} pending approval)</span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'VERIFIED', label: 'Verified' },
          { key: 'REJECTED', label: 'Rejected' },
          { key: 'NOT_SUBMITTED', label: 'Not Submitted' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === f.key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading providers...</div>
      ) : filteredProviders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
          {filter === 'pending' ? 'No pending approvals' : 'No providers found'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProviders.map(p => (
            <div key={p.providerId} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{p.businessName || 'Unnamed Business'}</h3>
                  <p className="text-sm text-gray-500">{p.userName || 'N/A'}</p>
                  <p className="text-xs text-gray-400">{p.userEmail || p.userPhone || 'N/A'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${kycBadgeClass(p.kycStatus)}`}>
                  {p.kycStatus?.replace(/_/g, ' ') || 'UNKNOWN'}
                </span>
              </div>

              <div className="text-sm text-gray-600 space-y-1 mb-4 flex-1">
                <p><span className="font-medium">Experience:</span> {p.experienceYears || 0} years</p>
                <p><span className="font-medium">Location:</span> {p.baseAddress || p.basePincode || 'N/A'}</p>
                <p><span className="font-medium">Rating:</span> {p.averageRating || '0.0'} ({p.totalReviews || 0} reviews)</p>
                <p><span className="font-medium">Bookings:</span> {p.completedBookings || 0} completed / {p.totalBookings || 0} total</p>
                {p.primaryCategoryName && (
                  <p><span className="font-medium">Category:</span> {p.primaryCategoryName}</p>
                )}
                {p.availabilityStatus && (
                  <p><span className="font-medium">Status:</span>
                    <span className={`ml-1 inline-block px-2 py-0.5 rounded text-xs font-medium ${p.availabilityStatus === 'ONLINE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.availabilityStatus}
                    </span>
                  </p>
                )}
                {p.userAccountStatus && p.userAccountStatus !== 'ACTIVE' && (
                  <p className="text-red-600 font-medium">Account: {p.userAccountStatus}</p>
                )}
              </div>

              {p.kycRejectionReason && (
                <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded-lg mb-3">
                  <span className="font-semibold">Rejection reason:</span> {p.kycRejectionReason}
                </div>
              )}

              {p.kycVerifiedAt && p.kycStatus === 'VERIFIED' && (
                <div className="bg-green-50 text-green-700 text-xs p-2.5 rounded-lg mb-3">
                  Verified on {new Date(p.kycVerifiedAt).toLocaleDateString()}
                </div>
              )}

              {p.kycStatus === 'PENDING' && (
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => handleApprove(p.providerId)} className="flex-1 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors font-medium">
                    Approve
                  </button>
                  <button onClick={() => handleReject(p.providerId)} className="flex-1 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors font-medium">
                    Reject
                  </button>
                </div>
              )}

              {p.kycStatus === 'REJECTED' && (
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => handleApprove(p.providerId)} className="flex-1 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors font-medium">
                    Re-approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProviderApprovals
