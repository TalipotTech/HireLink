import { useState } from 'react'
import adminApi from '../../services/adminApi'

const Reports = () => {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [revenueReport, setRevenueReport] = useState(null)
  const [topProviders, setTopProviders] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchRevenueReport = async () => {
    if (!fromDate || !toDate) {
      alert('Please select both dates')
      return
    }
    setLoading(true)
    try {
      const res = await adminApi.get('/reports/revenue', { params: { from: fromDate, to: toDate } })
      setRevenueReport(res.data.data)
    } catch (err) {
      console.error(err)
      alert('Failed to load revenue report')
    } finally {
      setLoading(false)
    }
  }

  const fetchTopProviders = async () => {
    setLoading(true)
    try {
      const res = await adminApi.get('/reports/top-providers')
      setTopProviders(res.data.data)
    } catch (err) {
      console.error(err)
      alert('Failed to load top providers')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports & Analytics</h1>

      {/* Revenue Report */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue Report</h2>
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
          </div>
          <button onClick={fetchRevenueReport} disabled={loading}
            className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50">
            Generate Report
          </button>
        </div>

        {revenueReport && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Total Revenue</p>
                <p className="text-xl font-bold text-green-700">&#8377;{Number(revenueReport.totalRevenue || 0).toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Avg Booking Value</p>
                <p className="text-xl font-bold text-blue-700">&#8377;{Number(revenueReport.averageBookingValue || 0).toLocaleString()}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600">Completed Bookings</p>
                <p className="text-xl font-bold text-purple-700">{revenueReport.totalCompletedBookings}</p>
              </div>
            </div>

            {revenueReport.revenueByService?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Revenue by Service</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">Service</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">Bookings</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueReport.revenueByService.map((sr, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 px-3 text-gray-700">{sr.serviceName}</td>
                        <td className="py-2 px-3 text-right text-gray-600">{sr.bookingCount}</td>
                        <td className="py-2 px-3 text-right font-medium text-gray-800">&#8377;{Number(sr.revenue || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top Providers */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Top Providers</h2>
          <button onClick={fetchTopProviders} disabled={loading}
            className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50">
            Load
          </button>
        </div>

        {topProviders && (
          topProviders.length === 0 ? (
            <p className="text-gray-400 text-sm">No provider data available</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">#</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Business Name</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Completed</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Earnings</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Rating</th>
                </tr>
              </thead>
              <tbody>
                {topProviders.map((tp, i) => (
                  <tr key={tp.providerId} className="border-b border-gray-50">
                    <td className="py-2 px-3 text-gray-500 font-medium">{i + 1}</td>
                    <td className="py-2 px-3 font-medium text-gray-800">{tp.businessName || 'N/A'}</td>
                    <td className="py-2 px-3 text-right text-gray-600">{tp.completedBookings}</td>
                    <td className="py-2 px-3 text-right font-medium text-green-600">&#8377;{Number(tp.totalEarnings || 0).toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-gray-600">{tp.averageRating || '0.0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  )
}

export default Reports
