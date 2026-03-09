import { useState, useEffect } from 'react'
import adminApi from '../../services/adminApi'

const PRICE_UNITS = ['PER_HOUR', 'PER_VISIT', 'PER_SQFT', 'FIXED']
const PRICE_TYPES = ['FIXED', 'HOURLY', 'PER_SQFT', 'STARTING_FROM', 'NEGOTIABLE']

const emptyCatForm = {
  categoryName: '', categorySlug: '', categoryDescription: '',
  categoryIcon: '', displayOrder: 0, isFeatured: false,
  minBasePrice: '', maxBasePrice: '', priceUnit: 'PER_VISIT'
}

const emptySvcForm = {
  serviceName: '', serviceDescription: '', basePrice: '',
  priceType: 'FIXED', estimatedDurationMinutes: '',
  categoryId: '', providerId: '', isFeatured: false
}

const ServiceManagement = () => {
  const [activeTab, setActiveTab] = useState('categories')
  const [categories, setCategories] = useState([])
  const [services, setServices] = useState([])
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCatModal, setShowCatModal] = useState(false)
  const [showSvcModal, setShowSvcModal] = useState(false)
  const [catForm, setCatForm] = useState(emptyCatForm)
  const [svcForm, setSvcForm] = useState(emptySvcForm)
  const [editingCatId, setEditingCatId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [catRes, svcRes, provRes] = await Promise.all([
        adminApi.get('/services/categories'),
        adminApi.get('/services'),
        adminApi.get('/providers'),
      ])
      setCategories(catRes.data.data || [])
      setServices(svcRes.data.data || [])
      setProviders(provRes.data.data || [])
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  // ---- Category handlers ----
  const openAddCategory = () => {
    setCatForm(emptyCatForm)
    setEditingCatId(null)
    setShowCatModal(true)
  }

  const openEditCategory = (cat) => {
    setCatForm({
      categoryName: cat.categoryName || '',
      categorySlug: cat.categorySlug || '',
      categoryDescription: cat.categoryDescription || '',
      categoryIcon: cat.categoryIcon || '',
      displayOrder: cat.displayOrder || 0,
      isFeatured: cat.isFeatured || false,
      minBasePrice: cat.minBasePrice || '',
      maxBasePrice: cat.maxBasePrice || '',
      priceUnit: cat.priceUnit || 'PER_VISIT'
    })
    setEditingCatId(cat.categoryId)
    setShowCatModal(true)
  }

  const handleSaveCategory = async (e) => {
    e.preventDefault()
    if (!catForm.categoryName.trim()) return alert('Category name is required')
    setSaving(true)
    try {
      if (editingCatId) {
        await adminApi.put(`/services/categories/${editingCatId}`, catForm)
      } else {
        await adminApi.post('/services/categories', catForm)
      }
      setShowCatModal(false)
      fetchData()
    } catch (err) {
      alert('Failed to save category: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleCategoryActive = async (cat) => {
    try {
      await adminApi.put(`/services/categories/${cat.categoryId}/toggle-active`)
      fetchData()
    } catch (err) {
      alert('Failed to update category')
    }
  }

  // ---- Service handlers ----
  const openAddService = () => {
    setSvcForm(emptySvcForm)
    setShowSvcModal(true)
  }

  const handleSaveService = async (e) => {
    e.preventDefault()
    if (!svcForm.serviceName.trim()) return alert('Service name is required')
    if (!svcForm.basePrice) return alert('Base price is required')
    if (!svcForm.categoryId) return alert('Category is required')
    if (!svcForm.providerId) return alert('Provider is required')
    setSaving(true)
    try {
      await adminApi.post('/services', {
        ...svcForm,
        basePrice: Number(svcForm.basePrice),
        estimatedDurationMinutes: svcForm.estimatedDurationMinutes ? Number(svcForm.estimatedDurationMinutes) : null,
        categoryId: Number(svcForm.categoryId),
        providerId: svcForm.providerId ? Number(svcForm.providerId) : null
      })
      setShowSvcModal(false)
      fetchData()
    } catch (err) {
      alert('Failed to save service: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleServiceActive = async (svc) => {
    try {
      await adminApi.put(`/services/${svc.serviceId}/toggle-active`)
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

      {/* Tabs + Add Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
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
        <button
          onClick={activeTab === 'categories' ? openAddCategory : openAddService}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add {activeTab === 'categories' ? 'Category' : 'Service'}
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          {categories.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg mb-2">No categories yet</p>
              <p className="text-sm">Click "Add Category" to create your first category</p>
            </div>
          ) : (
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
                      <div className="flex gap-2">
                        <button onClick={() => openEditCategory(cat)} className="px-3 py-1.5 text-xs rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium">
                          Edit
                        </button>
                        <button onClick={() => handleToggleCategoryActive(cat)} className={`px-3 py-1.5 text-xs rounded-lg text-white transition-colors ${cat.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                          {cat.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          {services.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg mb-2">No services yet</p>
              <p className="text-sm">Click "Add Service" to create your first service</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  {['ID', 'Name', 'Category', 'Provider', 'Base Price', 'Duration', 'Active', 'Rating', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold bg-gray-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map(svc => (
                  <tr key={svc.serviceId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{svc.serviceId}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{svc.serviceName}</td>
                    <td className="px-4 py-3 text-gray-600">{svc.categoryName || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{svc.providerBusinessName || '-'}</td>
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
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editingCatId ? 'Edit Category' : 'Add Category'}</h2>
            </div>
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text" required value={catForm.categoryName}
                  onChange={e => setCatForm(f => ({ ...f, categoryName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  placeholder="e.g. Home Cleaning"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text" value={catForm.categorySlug}
                  onChange={e => setCatForm(f => ({ ...f, categorySlug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  placeholder="auto-generated if blank"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={catForm.categoryDescription} rows={3}
                  onChange={e => setCatForm(f => ({ ...f, categoryDescription: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  placeholder="Brief description of this category"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon (CSS class / emoji)</label>
                  <input
                    type="text" value={catForm.categoryIcon}
                    onChange={e => setCatForm(f => ({ ...f, categoryIcon: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number" value={catForm.displayOrder}
                    onChange={e => setCatForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                  <input
                    type="number" step="0.01" value={catForm.minBasePrice}
                    onChange={e => setCatForm(f => ({ ...f, minBasePrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                  <input
                    type="number" step="0.01" value={catForm.maxBasePrice}
                    onChange={e => setCatForm(f => ({ ...f, maxBasePrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Unit</label>
                  <select
                    value={catForm.priceUnit}
                    onChange={e => setCatForm(f => ({ ...f, priceUnit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  >
                    {PRICE_UNITS.map(u => <option key={u} value={u}>{u.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox" checked={catForm.isFeatured}
                    onChange={e => setCatForm(f => ({ ...f, isFeatured: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600"
                  />
                  Featured
                </label>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowCatModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : (editingCatId ? 'Update Category' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showSvcModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Add Service</h2>
            </div>
            <form onSubmit={handleSaveService} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
                <input
                  type="text" required value={svcForm.serviceName}
                  onChange={e => setSvcForm(f => ({ ...f, serviceName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  placeholder="e.g. Deep Home Cleaning"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={svcForm.serviceDescription} rows={3}
                  onChange={e => setSvcForm(f => ({ ...f, serviceDescription: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  required value={svcForm.categoryId}
                  onChange={e => setSvcForm(f => ({ ...f, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="">Select a category</option>
                  {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹) *</label>
                  <input
                    type="number" step="0.01" required value={svcForm.basePrice}
                    onChange={e => setSvcForm(f => ({ ...f, basePrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Type</label>
                  <select
                    value={svcForm.priceType}
                    onChange={e => setSvcForm(f => ({ ...f, priceType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  >
                    {PRICE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number" value={svcForm.estimatedDurationMinutes}
                    onChange={e => setSvcForm(f => ({ ...f, estimatedDurationMinutes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    placeholder="e.g. 60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider *</label>
                  <select
                    required value={svcForm.providerId}
                    onChange={e => setSvcForm(f => ({ ...f, providerId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select a provider</option>
                    {providers.filter(p => p.kycStatus === 'VERIFIED').map(p => (
                      <option key={p.providerId} value={p.providerId}>
                        {p.businessName || p.userName || `Provider #${p.providerId}`}
                      </option>
                    ))}
                    {providers.filter(p => p.kycStatus === 'VERIFIED').length === 0 && (
                      <option value="" disabled>No verified providers available</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox" checked={svcForm.isFeatured}
                    onChange={e => setSvcForm(f => ({ ...f, isFeatured: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600"
                  />
                  Featured
                </label>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowSvcModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceManagement
