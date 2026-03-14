import { useState, useEffect } from 'react'
import adminApi from '../../services/adminApi'

const roleBadgeClass = (role) => {
  switch (role) {
    case 'ADMIN': case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-700'
    case 'PROVIDER': return 'bg-blue-100 text-blue-700'
    default: return 'bg-green-100 text-green-700'
  }
}

const statusBadgeClass = (status, isDeleted) => {
  if (isDeleted) return 'bg-gray-200 text-gray-500 line-through'
  switch (status) {
    case 'ACTIVE': return 'bg-green-100 text-green-700'
    case 'BANNED': return 'bg-red-100 text-red-700'
    case 'SUSPENDED': return 'bg-orange-100 text-orange-700'
    case 'INACTIVE': return 'bg-gray-100 text-gray-500'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [roleFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (roleFilter) params.role = roleFilter
      if (searchTerm) params.search = searchTerm
      const res = await adminApi.get('/users', { params })
      setUsers(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchUsers()
  }

  const handleBan = async (id) => {
    const reason = prompt('Reason for banning:')
    if (!reason) return
    try {
      await adminApi.post(`/users/${id}/ban`, { reason })
      fetchUsers()
    } catch (err) {
      alert('Failed to ban user')
    }
  }

  const handleUnban = async (id) => {
    try {
      await adminApi.post(`/users/${id}/unban`)
      fetchUsers()
    } catch (err) {
      alert('Failed to unban user')
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action will deactivate the account.`)) return
    try {
      await adminApi.delete(`/users/${id}`)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleRestore = async (id) => {
    if (!confirm('Restore this user account?')) return
    try {
      await adminApi.post(`/users/${id}/restore`)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restore user')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">User Management</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[250px]">
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 bg-white"
          />
          <button type="submit" className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            Search
          </button>
        </form>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">All Types</option>
          <option value="CUSTOMER">Customers</option>
          <option value="PROVIDER">Providers</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading users...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100">
                {['ID', 'Name', 'Email', 'Phone', 'Type', 'Status', 'Verified', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold bg-gray-50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.userId} className={`border-b border-gray-50 hover:bg-gray-50 ${u.isDeleted ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 text-gray-600">{u.userId}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {u.name}
                    {u.isDeleted && <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-200 text-gray-500 uppercase">Deleted</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{u.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleBadgeClass(u.userType)}`}>
                      {u.userType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(u.accountStatus, u.isDeleted)}`}>
                      {u.isDeleted ? 'DELETED' : u.accountStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {u.isPhoneVerified ? 'Phone' : ''}{u.isPhoneVerified && u.isEmailVerified ? ', ' : ''}{u.isEmailVerified ? 'Email' : ''}
                    {!u.isPhoneVerified && !u.isEmailVerified && '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {u.isDeleted ? (
                        <button onClick={() => handleRestore(u.userId)} className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors">
                          Restore
                        </button>
                      ) : (
                        <>
                          {u.accountStatus === 'BANNED' ? (
                            <button onClick={() => handleUnban(u.userId)} className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors">
                              Unban
                            </button>
                          ) : u.userType !== 'ADMIN' && u.userType !== 'SUPER_ADMIN' ? (
                            <button onClick={() => handleBan(u.userId)} className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors">
                              Ban
                            </button>
                          ) : null}
                          {u.userType !== 'ADMIN' && u.userType !== 'SUPER_ADMIN' && (
                            <button onClick={() => handleDelete(u.userId, u.name)} className="px-3 py-1.5 bg-gray-700 text-white text-xs rounded-lg hover:bg-gray-800 transition-colors">
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default UserManagement
