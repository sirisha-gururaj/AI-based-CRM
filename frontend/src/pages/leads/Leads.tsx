import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import * as api from '../../api'

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'LOST', label: 'Lost' },
]

const SOURCE_OPTIONS = [
  { value: '', label: 'All Sources' },
  { value: 'web', label: 'Web form' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'referral', label: 'Referral' },
  { value: 'partner', label: 'Partner' },
  { value: 'other', label: 'Other' },
]

const STATUS_STYLE: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-700',
  CONTACTED: 'bg-blue-100 text-blue-700',
  QUALIFIED: 'bg-green-100 text-green-700',
  CONVERTED: 'bg-emerald-100 text-emerald-700',
  LOST: 'bg-red-100 text-red-700',
}

const RATING_STYLE: Record<string, string> = {
  hot: 'bg-red-100 text-red-700',
  warm: 'bg-amber-100 text-amber-700',
  cold: 'bg-blue-100 text-blue-700',
}

const RESPONSE_STYLE: Record<string, string> = {
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  PENDING: 'bg-amber-100 text-amber-700',
}

function formatDate(value?: string | null) {
  return value ? String(value).slice(0, 10) : '-'
}

function formatDateTime(value?: string | null) {
  return value ? String(value).slice(0, 16).replace('T', ' ') : '-'
}

export default function Leads() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [source, setSource] = useState('')
  const [owner, setOwner] = useState('')

  useEffect(() => {
    const loadLeads = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await api.getLeads({ search, status, source, owner })
        setLeads(data)
      } catch (err: any) {
        if (err.response?.status === 401) navigate('/login')
        else setError('Failed to load leads')
      } finally {
        setLoading(false)
      }
    }

    loadLeads()
  }, [navigate, owner, search, source, status])

  const handleDelete = async (leadId: number) => {
    if (!confirm('Delete this lead?')) return
    try {
      await api.deleteLead(leadId)
      setLeads((current) => current.filter((lead) => lead.id !== leadId))
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete lead')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-primary">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{loading ? 'Loading...' : `${leads.length} lead${leads.length !== 1 ? 's' : ''}`}</p>
        </div>
        <button
          onClick={() => navigate('/leads/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          New Lead
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, company, email, owner"
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
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SOURCE_OPTIONS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="Owner"
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => {
            setSearch('')
            setStatus('')
            setSource('')
            setOwner('')
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
        ) : leads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Lead</th>
                  <th className="px-5 py-3 text-left font-medium">Company</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Rating</th>
                  <th className="px-5 py-3 text-left font-medium">Source</th>
                  <th className="px-5 py-3 text-left font-medium">Owner</th>
                  <th className="px-5 py-3 text-left font-medium">Offer</th>
                  <th className="px-5 py-3 text-left font-medium">Campaign Response</th>
                  <th className="px-5 py-3 text-left font-medium">Updated</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-800">{lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim()}</div>
                      {lead.job_title && <div className="text-xs text-gray-500">{lead.job_title}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{lead.company || '-'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[lead.status] || STATUS_STYLE.NEW}`}>
                        {lead.status_label || lead.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${RATING_STYLE[lead.rating] || RATING_STYLE.cold}`}>
                        {lead.rating_label || lead.rating}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{lead.source_label || lead.source || '-'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{lead.owner || 'Unassigned'}</td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {lead.offer ? (
                        <Link to={`/offers/${lead.offer}`} className="text-blue-600 hover:underline">
                          {lead.offer_code ? `${lead.offer_code} - ` : ''}
                          {lead.offer_name || 'View offer'}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {lead.last_campaign_response_status ? (
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              RESPONSE_STYLE[lead.last_campaign_response_status] || 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {lead.last_campaign_response_status}
                          </span>
                          <div className="text-xs text-gray-500 truncate max-w-[220px]">
                            {lead.last_campaign_name || 'Campaign'}
                          </div>
                          <div className="text-xs text-gray-400">{formatDateTime(lead.last_campaign_response_date)}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No campaign response</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{formatDate(lead.updated_at)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/leads/${lead.id}`}
                          title="View lead"
                          aria-label="View lead"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-700 border border-blue-200 hover:bg-blue-50 transition-colors"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          to={`/leads/${lead.id}/edit`}
                          title="Edit lead"
                          aria-label="Edit lead"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          title="Delete lead"
                          aria-label="Delete lead"
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
          </div>
        ) : (
          <div className="px-5 py-8 text-center text-gray-500">No leads found</div>
        )}
      </div>
    </div>
  )
}
