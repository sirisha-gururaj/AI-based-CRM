import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, Pencil, Plus } from 'lucide-react'
import * as api from '../../api'

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'RETIRED', label: 'Retired' },
]

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  RETIRED: 'bg-red-100 text-red-700',
}

function formatDate(value?: string | null) {
  return value ? String(value).slice(0, 10) : '-'
}

export default function Offers() {
  const navigate = useNavigate()
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const loadOffers = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await api.getOffers({ search, status })
        setOffers(data)
      } catch (err: any) {
        if (err.response?.status === 401) navigate('/login')
        else setError('Failed to load offers')
      } finally {
        setLoading(false)
      }
    }

    loadOffers()
  }, [navigate, search, status])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-primary">Offers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{loading ? 'Loading...' : `${offers.length} offer${offers.length !== 1 ? 's' : ''}`}</p>
        </div>
        <button
          onClick={() => navigate('/offers/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          New Offer
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, code, or description"
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setSearch('')
            setStatus('')
          }}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : offers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Name</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Dates</th>
                  <th className="px-5 py-3 text-left font-medium">Treatments</th>
                  <th className="px-5 py-3 text-left font-medium">Leads</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-800">{offer.name}</div>
                      <div className="text-xs text-gray-500">{offer.code}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[offer.status] || STATUS_STYLE.DRAFT}`}>
                        {offer.status.charAt(0) + offer.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                      {formatDate(offer.start_date)} - {formatDate(offer.end_date)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{offer.treatments_count ?? 0}</td>
                    <td className="px-5 py-3.5 text-gray-600">{offer.leads_count ?? 0}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/offers/${offer.id}`}
                          title="View offer"
                          aria-label="View offer"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-700 border border-blue-200 hover:bg-blue-50 transition-colors"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          to={`/offers/${offer.id}/edit`}
                          title="Edit offer"
                          aria-label="Edit offer"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          <Pencil size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-8 text-center text-gray-500">No offers found</div>
        )}
      </div>
    </div>
  )
}
