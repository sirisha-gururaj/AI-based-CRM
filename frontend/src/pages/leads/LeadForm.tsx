import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import * as api from '../../api'

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'LOST', label: 'Lost' },
]

const SOURCE_OPTIONS = [
  { value: 'web', label: 'Web form' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'referral', label: 'Referral' },
  { value: 'partner', label: 'Partner' },
  { value: 'other', label: 'Other' },
]

const RATING_OPTIONS = [
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
]

export default function LeadForm() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const returnTo = new URLSearchParams(location.search).get('returnTo')

  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    job_title: '',
    company: '',
    industry: '',
    company_size: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    status: 'NEW',
    source: 'web',
    rating: 'warm',
    owner: 'Unassigned',
    offer: '',
    notes: '',
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [offerData, leadData] = await Promise.all([
          api.getOffers(),
          isEditing && id ? api.getLead(Number(id)) : Promise.resolve(null),
        ])

        setOffers(offerData)

        if (leadData) {
          setFormData({
            first_name: leadData.first_name || '',
            last_name: leadData.last_name || '',
            job_title: leadData.job_title || '',
            company: leadData.company || '',
            industry: leadData.industry || '',
            company_size: leadData.company_size || '',
            email: leadData.email || '',
            phone: leadData.phone || '',
            city: leadData.city || '',
            country: leadData.country || '',
            status: leadData.status || 'NEW',
            source: leadData.source || 'web',
            rating: leadData.rating || 'warm',
            owner: leadData.owner || '',
            offer: leadData.offer ? String(leadData.offer) : '',
            notes: leadData.notes || '',
          })
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load lead form')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, isEditing])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const payload = {
      ...formData,
      offer: formData.offer ? Number(formData.offer) : null,
    }

    try {
      const saved = isEditing ? await api.updateLead(Number(id), payload) : await api.createLead(payload)
      navigate(returnTo || `/leads/${saved.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to save lead')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-xl p-6 space-y-6">
        <div>
          <Link to="/leads" className="inline-flex text-sm text-gray-500 hover:text-blue-600 transition-colors">Back to Leads</Link>
          <h1 className="text-2xl font-bold text-primary mt-2">{isEditing ? 'Edit Lead' : 'New Lead'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Capture lead details for qualification and routing.</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Lead Basics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
              <input type="text" value={formData.first_name} onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
              <input type="text" value={formData.last_name} onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Job Title</label>
              <input type="text" value={formData.job_title} onChange={(e) => setFormData((prev) => ({ ...prev, job_title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Company</label>
              <input type="text" value={formData.company} onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Industry</label>
              <input type="text" value={formData.industry} onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Company Size</label>
              <input type="text" value={formData.company_size} onChange={(e) => setFormData((prev) => ({ ...prev, company_size: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="1-10, 11-50, 51-200" />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Contact Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
              <input type="text" value={formData.city} onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
              <input type="text" value={formData.country} onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Sales Context</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Rating</label>
              <select value={formData.rating} onChange={(e) => setFormData((prev) => ({ ...prev, rating: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                {RATING_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Source</label>
              <select value={formData.source} onChange={(e) => setFormData((prev) => ({ ...prev, source: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                {SOURCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Owner</label>
              <input type="text" value={formData.owner} onChange={(e) => setFormData((prev) => ({ ...prev, owner: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Offer and Notes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Related Offer</label>
              <select value={formData.offer} onChange={(e) => setFormData((prev) => ({ ...prev, offer: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">None</option>
                {offers.map((offer) => (
                  <option key={offer.id} value={offer.id}>{offer.code} - {offer.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
            <textarea rows={5} value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Add notes about qualification and next action." />
          </div>
        </section>

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save Lead'}
          </button>
          <button type="button" onClick={() => navigate(returnTo || '/leads')} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50">
            Cancel
          </button>
        </div>
        </form>
      </div>
    </div>
  )
}
