import { useState, useEffect } from 'react'
import adminApi from '../../services/adminApi'

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-cyan-100 text-cyan-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REJECTED: 'bg-orange-100 text-orange-700',
  DISPUTED: 'bg-purple-100 text-purple-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
  PAUSED: 'bg-gray-100 text-gray-600',
}

const BOOKING_STATUSES = ['PENDING', 'ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED']

const BookingManagement = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [auditTrail, setAuditTrail] = useState(null)
  const [auditBookingId, setAuditBookingId] = useState(null)

  useEffect(() => {
    fetchBookings()
  }, [statusFilter, page])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const params = { page, size: 20 }
      if (statusFilter) params.status = statusFilter
      if (searchTerm) params.search = searchTerm
      const res = await adminApi.get('/bookings', { params })
      const data = res.data.data
      setBookings(data.content || [])
      setTotalPages(data.totalPages || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
    fetchBookings()
  }

  const handleOverrideStatus = async (bookingId, currentStatus) => {
    const newStatus = prompt(`Current: ${currentStatus}\nEnter new status (${BOOKING_STATUSES.join(', ')}):`)
    if (!newStatus || !BOOKING_STATUSES.includes(newStatus)) return
    const note = prompt('Admin note (optional):') || ''
    try {
      await adminApi.patch(`/bookings/${bookingId}/status`, { status: newStatus, adminNote: note })
      fetchBookings()
    } catch (err) {
      alert('Failed to override status')
    }
  }

  const handleViewAudit = async (bookingId) => {
    try {
      const res = await adminApi.get(`/bookings/${bookingId}/audit`)
      setAuditTrail(res.data.data)
      setAuditBookingId(bookingId)
    } catch (err) {
      alert('Failed to load audit trail')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Booking Management</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[250px]">
          <input
            type="text"
            placeholder="Search booking number, service, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 bg-white"
          />
          <button type="submit" className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            Search
          </button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">All Statuses</option>
          {BOOKING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading bookings...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100">
                {['Booking #', 'Customer', 'Provider', 'Service', 'Status', 'Date', 'Amount', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold bg-gray-50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.bookingId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{b.bookingNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{b.customerName}</p>
                    <p className="text-xs text-gray-400">{b.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.providerBusinessName}</td>
                  <td className="px-4 py-3 text-gray-600">{b.serviceName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[b.bookingStatus] || 'bg-gray-100 text-gray-700'}`}>
                      {b.bookingStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{b.scheduledDate}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    {b.finalAmount != null ? `₹${Number(b.finalAmount).toLocaleString()}` : b.estimatedAmount != null ? `~₹${Number(b.estimatedAmount).toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleOverrideStatus(b.bookingId, b.bookingStatus)} className="px-3 py-1.5 bg-primary-500 text-white text-xs rounded-lg hover:bg-primary-600 transition-colors">
                        Status
                      </button>
                      <button onClick={() => handleViewAudit(b.bookingId)} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 transition-colors">
                        Audit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No bookings found</td></tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg disabled:opacity-50">Previous</button>
              <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      )}

      {/* Audit Trail Modal */}
      {auditTrail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setAuditTrail(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Audit Trail - Booking #{auditBookingId}</h3>
              <button onClick={() => setAuditTrail(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            {auditTrail.length === 0 ? (
              <p className="text-gray-400 text-sm">No audit records found</p>
            ) : (
              <div className="space-y-3">
                {auditTrail.map((a, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded">{a.actionType}</span>
                      <span className="text-xs text-gray-400">{new Date(a.performedAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-700">{a.actionDescription}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingManagement
