import { useState, useEffect } from 'react'
import adminApi from '../../services/adminApi'

const ServiceManagement = () => {
  const [activeTab, setActiveTab] = useState('categories')
  const [categories, setCategories] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCat, setEditingCat] = useState(null)
  const [editingSvc, setEditingSvc] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [catRes, svcRes] = await Promise.all([
        adminApi.get('/services/categories'),
        adminApi.get('/services'),
      ])
      setCategories(catRes.data.data || [])
      setServices(svcRes.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCategoryActive = async (cat) => {
    try {
      await adminApi.put(`/services/categories/${cat.categoryId}`, { isActive: !cat.isActive })
      fetchData()
    } catch (err) {
      alert('Failed to update category')
    }
  }

  const handleToggleServiceActive = async (svc) => {
    try {
      await adminApi.put(`/services/${svc.serviceId}`, { isActive: !svc.isActive })
      fetchData()
    } catch (err) {
      alert('Failed to update service')
    }
  }

  const handleDeleteService = async (id) => {
    if (!confirm('Deactivate this service?')) return
    try {
      await adminApi.delete(`/services/${id}`)
      fetchData()
    } catch (err) {
      alert('Failed to deactivate service')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Service & Category Management</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'categories' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
        >
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'services' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
        >
          Services ({services.length})
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100">
                {['ID', 'Name', 'Slug', 'Level', 'Order', 'Active', 'Featured', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold bg-gray-50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.categoryId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{cat.categoryId}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{cat.categoryName}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{cat.categorySlug}</td>
                  <td className="px-4 py-3 text-gray-600">{cat.categoryLevel}</td>
                  <td className="px-4 py-3 text-gray-600">{cat.displayOrder}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {cat.isActive ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cat.isFeatured ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      {cat.isFeatured ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleCategoryActive(cat)} className={`px-3 py-1.5 text-xs rounded-lg text-white transition-colors ${cat.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                      {cat.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100">
                {['ID', 'Name', 'Category', 'Base Price', 'Duration', 'Active', 'Rating', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold bg-gray-50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map(svc => (
                <tr key={svc.serviceId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{svc.serviceId}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{svc.serviceName}</td>
                  <td className="px-4 py-3 text-gray-600">{svc.category?.categoryName || '-'}</td>
                  <td className="px-4 py-3 text-gray-800">&#8377;{Number(svc.basePrice || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{svc.estimatedDurationMinutes ? `${svc.estimatedDurationMinutes} min` : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${svc.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {svc.isActive ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{svc.averageRating || '0.0'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleToggleServiceActive(svc)} className={`px-3 py-1.5 text-xs rounded-lg text-white transition-colors ${svc.isActive ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}`}>
                        {svc.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No services found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ServiceManagement
