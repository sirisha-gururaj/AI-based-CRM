import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import * as api from '../../api'

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  DRAFT: 'bg-gray-100 text-gray-500',
  PLANNED: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
}

export default function Plans() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'DRAFT',
    start_date: '',
    end_date: '',
    total_budget: '',
  })

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true)
      try {
        const params: any = {}
        if (search) params.search = search
        if (status) params.status = status
        const data = await api.getPlans(params)
        setPlans(data)
      } catch (err: any) {
        if (err.response?.status === 401) window.location.href = '/login'
        else setError('Failed to load plans')
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [search, status])

  const formatBudget = (amount: number) => '₹' + (amount / 100000).toFixed(1) + 'L'

  const handleAddClick = () => {
    setEditingPlanId(null)
    setFormData({ name: '', description: '', status: 'DRAFT', start_date: '', end_date: '', total_budget: '' })
    setFormError('')
    setShowForm(true)
  }

  const handleEditClick = (plan: any) => {
    setEditingPlanId(plan.id)
    setFormError('')
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      status: plan.status || 'DRAFT',
      start_date: plan.start_date || '',
      end_date: plan.end_date || '',
      total_budget: plan.total_budget?.toString?.() || '',
    })
    setShowForm(true)
  }

  const handleDeleteClick = async (planId: number) => {
    if (!confirm('Delete this plan?')) return
    try {
      await api.deletePlan(planId)
      setPlans((current) => current.filter((plan) => plan.id !== planId))
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete plan')
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)
    setFormError('')
    try {
      const payload = {
        ...formData,
        total_budget: parseInt(formData.total_budget as any) || 0,
      }

      if (editingPlanId) {
        const updatedPlan = await api.updatePlan(editingPlanId, payload)
        setPlans((current) => current.map((plan) => (plan.id === editingPlanId ? updatedPlan : plan)))
      } else {
        const newPlan = await api.createPlan(payload)
        setPlans([newPlan, ...plans])
      }

      setShowForm(false)
      setEditingPlanId(null)
      setFormData({ name: '', description: '', status: 'DRAFT', start_date: '', end_date: '', total_budget: '' })
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.response?.data?.detail || (editingPlanId ? 'Failed to update plan' : 'Failed to create plan'))
    } finally {
      setFormSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Plans</h1>
          <p className="text-sm text-gray-500 mt-0.5">{loading ? 'Loading...' : `${plans.length} planning plan${plans.length !== 1 ? 's' : ''}`}</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: '#2563eb' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1d4ed8')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2563eb')}
        >
          <Plus size={16} />
          New Plan
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PLANNED">Planned</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-primary">{editingPlanId ? 'Edit Plan' : 'New Plan'}</h2>
            <p className="text-sm text-gray-500 mt-0.5 mb-5">Capture planning details and budget in one place.</p>
            {formError && <div className="bg-red-50 border border-red-200 rounded p-2 text-red-700 text-sm mb-4">{formError}</div>}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Plan Basics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PLANNED">Planned</option>
                      <option value="ACTIVE">Active</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Total Budget</label>
                  <input
                    type="number"
                    value={formData.total_budget}
                    onChange={(e) => setFormData({ ...formData, total_budget: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    min="0"
                    onFocus={(e) => {
                      if (formData.total_budget === '0') {
                        setFormData({ ...formData, total_budget: '' })
                      }
                      e.currentTarget.select()
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editingPlanId ? 'Save' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingPlanId(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  {['Plan Name', 'Status', 'Budget', 'Start', 'End', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plans.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-gray-800">{p.name}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[p.status]}`}>
                        {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-700">{formatBudget(p.total_budget || 0)}</td>
                    <td className="px-5 py-3.5 text-gray-500">{p.start_date || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500">{p.end_date || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/plans/${p.id}`}
                          title="View plan"
                          aria-label="View plan"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-700 border border-blue-200 hover:bg-blue-50 transition-colors"
                        >
                          <Eye size={14} />
                        </Link>
                        <button
                          onClick={() => handleEditClick(p)}
                          title="Edit plan"
                          aria-label="Edit plan"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(p.id)}
                          title="Delete plan"
                          aria-label="Delete plan"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-700 border border-red-200 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {plans.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-500">No plans found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
