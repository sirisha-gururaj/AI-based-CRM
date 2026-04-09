import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import * as api from '../../api'

type OfferFormState = {
  name: string
  code: string
  description: string
  status: string
  start_date: string
  end_date: string
  is_active: boolean
}

const EMPTY_FORM: OfferFormState = {
  name: '',
  code: '',
  description: '',
  status: 'DRAFT',
  start_date: '',
  end_date: '',
  is_active: true,
}

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'RETIRED', label: 'Retired' },
]

function toDateInput(value?: string | null) {
  return value ? String(value).slice(0, 10) : ''
}

export default function OfferForm() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const returnTo = new URLSearchParams(location.search).get('returnTo')

  const [formData, setFormData] = useState<OfferFormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadOffer = async () => {
      if (!id) return
      try {
        const data = await api.getOffer(Number(id))
        setFormData({
          name: data.name || '',
          code: data.code || '',
          description: data.description || '',
          status: data.status || 'DRAFT',
          start_date: toDateInput(data.start_date),
          end_date: toDateInput(data.end_date),
          is_active: Boolean(data.is_active),
        })
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load offer')
      } finally {
        setLoading(false)
      }
    }

    if (isEditing) loadOffer()
  }, [id, isEditing])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const payload = {
      ...formData,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    }

    try {
      const saved = isEditing ? await api.updateOffer(Number(id), payload) : await api.createOffer(payload)
      navigate(returnTo || `/offers/${saved.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to save offer')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-xl p-6 space-y-4">
        <div>
          <Link to="/offers" className="inline-flex text-sm text-gray-500 hover:text-blue-600 transition-colors">Back to Offers</Link>
          <h1 className="text-2xl font-bold text-primary mt-2">{isEditing ? 'Edit Offer' : 'New Offer'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage reusable offer records.</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Offer Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Offer Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <textarea
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Describe the offer proposition."
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700 font-semibold">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Active
        </label>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Offer'}
          </button>
          <button
            type="button"
            onClick={() => navigate(returnTo || '/offers')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
        </form>
      </div>
    </div>
  )
}
