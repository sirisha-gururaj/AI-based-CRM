import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import * as api from '../../api'

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  RETIRED: 'bg-red-100 text-red-700',
}

const CHANNEL_STYLE: Record<string, string> = {
  EMAIL: 'bg-blue-100 text-blue-700',
  WEB: 'bg-indigo-100 text-indigo-700',
  SMS: 'bg-emerald-100 text-emerald-700',
  PHONE: 'bg-amber-100 text-amber-700',
  DIRECT_MAIL: 'bg-gray-100 text-gray-700',
}

function formatDate(value?: string | null) {
  return value ? String(value).slice(0, 10) : 'N/A'
}

export default function OfferDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [offer, setOffer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadOffer = async () => {
      try {
        const data = await api.getOffer(Number(id))
        setOffer(data)
      } catch (err: any) {
        if (err.response?.status === 401) navigate('/login')
        else setError('Failed to load offer')
      } finally {
        setLoading(false)
      }
    }

    if (id) loadOffer()
  }, [id, navigate])

  if (loading) return <div className="text-center py-8">Loading...</div>
  if (!offer) return <div className="text-center py-8 text-red-600">Offer not found</div>

  const treatments = offer.treatments || []

  return (
    <div className="space-y-6">
      <Link to="/offers" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
        <ArrowLeft size={15} />
        Back to Offers
      </Link>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>}

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-primary">{offer.name}</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${STATUS_STYLE[offer.status] || STATUS_STYLE.DRAFT}`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              {offer.status.charAt(0) + offer.status.slice(1).toLowerCase()}
            </span>
          </div>
          <p className="text-sm text-gray-500">Code: {offer.code}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/offers/${offer.id}/edit?returnTo=${encodeURIComponent(`/offers/${offer.id}`)}`)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Edit Offer
          </button>
          <button
            onClick={() => navigate(`/offers/${offer.id}/treatments/new`)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            <Plus size={14} />
            Add Treatment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Offer Summary</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{offer.description || 'No description provided.'}</p>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-gray-500">Active</span><span className="font-medium text-gray-700">{offer.is_active ? 'Yes' : 'No'}</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-500">Start Date</span><span className="font-medium text-gray-700">{formatDate(offer.start_date)}</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-500">End Date</span><span className="font-medium text-gray-700">{formatDate(offer.end_date)}</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-500">Treatments</span><span className="font-medium text-gray-700">{offer.treatments_count ?? treatments.length}</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-500">Leads</span><span className="font-medium text-gray-700">{offer.leads_count ?? 0}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Treatments</h2>
            <button
              onClick={() => navigate(`/offers/${offer.id}/treatments/new`)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          {treatments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Name</th>
                    <th className="px-5 py-3 text-left font-medium">Channel</th>
                    <th className="px-5 py-3 text-left font-medium">Subject</th>
                    <th className="px-5 py-3 text-left font-medium">Active</th>
                    <th className="px-5 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {treatments.map((treatment: any) => (
                    <tr key={treatment.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5 font-medium text-gray-800">{treatment.name}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${CHANNEL_STYLE[treatment.channel] || 'bg-gray-100 text-gray-600'}`}>
                          {treatment.channel_label || treatment.channel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{treatment.subject || '-'}</td>
                      <td className="px-5 py-3.5 text-gray-600">{treatment.is_active ? 'Yes' : 'No'}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/offers/${offer.id}/treatments/${treatment.id}`}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-700 border border-blue-200 hover:bg-blue-50"
                        >
                          Preview
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-gray-500">No treatments available.</div>
          )}
        </div>
      </div>
    </div>
  )
}
