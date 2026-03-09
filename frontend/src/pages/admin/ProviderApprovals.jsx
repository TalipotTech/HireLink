import { useState, useEffect } from 'react'
import adminApi from '../../services/adminApi'

const kycBadgeClass = (status) => {
  switch (status) {
    case 'VERIFIED': return 'bg-green-100 text-green-700'
    case 'PENDING': return 'bg-yellow-100 text-yellow-700'
    case 'REJECTED': return 'bg-red-100 text-red-700'
    case 'EXPIRED': return 'bg-gray-100 text-gray-600'
    default: return 'bg-gray-100 text-gray-500'
  }
}

const ProviderApprovals = () => {
  const [providers, setProviders] = useState([])
  const [pendingOnly, setPendingOnly] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProviders()
  }, [pendingOnly])

  const fetchProviders = async () => {
    setLoading(true)
    try {
      const endpoint = pendingOnly ? '/providers/pending' : '/providers'
      const res = await adminApi.get(endpoint)
      setProviders(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    if (!confirm('Approve this provider?')) return
    try {
      await adminApi.post(`/providers/${id}/approve`)
      fetchProviders()
    } catch (err) {
      alert('Failed to approve provider')
    }
  }

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection:')
    if (!reason) return
    try {
      await adminApi.post(`/providers/${id}/reject`, { reason })
      fetchProviders()
    } catch (err) {
      alert('Failed to reject provider')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Provider Approvals</h1>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setPendingOnly(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${pendingOnly ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setPendingOnly(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${!pendingOnly ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600'}`}
          >
            All Providers
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading providers...</div>
      ) : providers.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
          {pendingOnly ? 'No pending approvals' : 'No providers found'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map(p => (
            <div key={p.providerId} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{p.businessName || 'Unnamed Business'}</h3>
                  <p className="text-sm text-gray-500">{p.user?.name || 'N/A'}</p>
                  <p className="text-xs text-gray-400">{p.user?.email || p.user?.phone || 'N/A'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${kycBadgeClass(p.kycStatus)}`}>
                  {p.kycStatus}
                </span>
              </div>

              <div className="text-sm text-gray-600 space-y-1 mb-4">
                <p><span className="font-medium">Experience:</span> {p.experienceYears || 0} years</p>
                <p><span className="font-medium">Location:</span> {p.baseAddress || p.basePincode || 'N/A'}</p>
                <p><span className="font-medium">Rating:</span> {p.averageRating || '0.0'} ({p.totalReviews || 0} reviews)</p>
                <p><span className="font-medium">Completed:</span> {p.completedBookings || 0} bookings</p>
              </div>

              {p.kycRejectionReason && (
                <div className="bg-red-50 text-red-700 text-xs p-2 rounded-lg mb-3">
                  Rejection reason: {p.kycRejectionReason}
                </div>
              )}

              {p.kycStatus === 'PENDING' && (
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(p.providerId)} className="flex-1 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors font-medium">
                    Approve
                  </button>
                  <button onClick={() => handleReject(p.providerId)} className="flex-1 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors font-medium">
                    Reject
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
