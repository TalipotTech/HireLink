import { useState, useEffect } from 'react'
import adminApi from '../../services/adminApi'

const StatCard = ({ label, value, color }) => (
  <div className={`bg-white rounded-xl p-5 shadow-sm border-t-4`} style={{ borderTopColor: color }}>
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-2xl font-bold" style={{ color }}>{value}</p>
  </div>
)

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await adminApi.get('/dashboard/stats')
      setStats(res.data.data)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading dashboard...</div>
  if (!stats) return <div className="flex items-center justify-center h-64 text-red-500">Failed to load dashboard</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Bookings" value={stats.totalBookings} color="#2563eb" />
        <StatCard label="Pending" value={stats.pendingBookings} color="#f59e0b" />
        <StatCard label="Completed" value={stats.completedBookings} color="#10b981" />
        <StatCard label="Cancelled" value={stats.cancelledBookings} color="#ef4444" />
        <StatCard label="Customers" value={stats.totalCustomers} color="#6366f1" />
        <StatCard label="Providers" value={stats.totalProviders} color="#8b5cf6" />
        <StatCard label="Services" value={stats.totalServices} color="#0891b2" />
        <StatCard label="Categories" value={stats.totalCategories} color="#059669" />
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">
            &#8377;{Number(stats.totalRevenue || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-cyan-500">
          <p className="text-sm text-gray-500">Revenue This Month</p>
          <p className="text-2xl font-bold text-cyan-600">
            &#8377;{Number(stats.revenueThisMonth || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Pending KYC Alert */}
      {stats.pendingKycApprovals > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-4 mb-6 text-amber-800 font-medium">
          {stats.pendingKycApprovals} provider(s) awaiting KYC approval
        </div>
      )}

      {/* Bookings by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Bookings by Status</h3>
          <div className="space-y-3">
            {stats.bookingsByStatus?.filter(s => s.count > 0).map((s) => (
              <div key={s.status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{s.status}</span>
                <span className="text-sm font-semibold bg-gray-100 px-3 py-1 rounded-full">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Booking Trend (Last 6 Months)</h3>
          {stats.monthlyTrend?.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Month</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Bookings</th>
                </tr>
              </thead>
              <tbody>
                {stats.monthlyTrend.map((m) => (
                  <tr key={m.month} className="border-b border-gray-50">
                    <td className="py-2 text-gray-700">{m.month}</td>
                    <td className="py-2 text-right font-semibold text-gray-800">{m.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400 text-sm">No booking data available</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
