import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import * as api from '../../api'

const getTargetListLabel = (value: unknown) => value?.toString?.().trim?.() || value || 'No target list linked'

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [launching, setLaunching] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const data = await api.getCampaign(parseInt(id!))
        setCampaign(data)
      } catch (err: any) {
        if (err.response?.status === 401) navigate('/login')
        else setError('Failed to load campaign')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchCampaign()
  }, [id, navigate])

  const handleLaunch = async () => {
    if (!confirm('Are you sure you want to launch this campaign?')) return
    setLaunching(true)
    try {
      await api.launchCampaign(parseInt(id!))
      const updated = await api.getCampaign(parseInt(id!))
      setCampaign(updated)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to launch campaign')
    } finally {
      setLaunching(false)
    }
  }

  const handleEdit = () => {
    const returnTo = encodeURIComponent(`/campaigns/${campaign.id}`)
    navigate(`/campaigns?openCampaignForm=1&editCampaignId=${campaign.id}&returnTo=${returnTo}`)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this campaign?')) return
    setDeleting(true)
    try {
      await api.deleteCampaign(campaign.id)
      navigate('/campaigns')
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to delete campaign')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>
  if (!campaign) return <div className="text-center py-8 text-red-600">Campaign not found</div>

  const responses = campaign.responses || []
  const accepted = responses.filter((r: any) => r.status === 'ACCEPTED').length
  const rejected = responses.filter((r: any) => r.status === 'REJECTED').length
  const pending = responses.filter((r: any) => r.status === 'PENDING').length
  const isLaunched = campaign.status === 'ACTIVE' || campaign.status === 'COMPLETED' || Number(campaign.response_count || 0) > 0

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link to="/campaigns" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
        <ArrowLeft size={15} />
        Back to Campaigns
      </Link>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>}

      {/* Page title + badge */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-primary">{campaign.name}</h1>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
              campaign.status === 'ACTIVE'
                ? 'bg-green-100 text-green-700'
                : campaign.status === 'COMPLETED'
                  ? 'bg-blue-100 text-blue-700'
                  : campaign.status === 'DRAFT'
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-amber-100 text-amber-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            {campaign.status.charAt(0) + campaign.status.slice(1).toLowerCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div title={isLaunched ? 'Campaign launched: editing is disabled' : 'Edit campaign'}>
            <button
              onClick={handleEdit}
              disabled={isLaunched}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 ${isLaunched ? 'pointer-events-none' : ''}`}
            >
              Edit Campaign
            </button>
          </div>
          <div title={isLaunched ? 'Campaign launched: deletion is disabled' : 'Delete campaign'}>
            <button
              onClick={handleDelete}
              disabled={isLaunched || deleting}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 ${(isLaunched || deleting) ? 'pointer-events-none' : ''}`}
            >
              {deleting ? 'Deleting...' : 'Delete Campaign'}
            </button>
          </div>
          {!isLaunched && (
            <button
              onClick={handleLaunch}
              disabled={launching}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              🚀 {launching ? 'Launching...' : 'Launch Campaign'}
            </button>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start flex-col xl:flex-row">
        {/* ── LEFT COLUMN (60%) ──────────────────────────────── */}
        <div className="flex-[3] space-y-6 min-w-0">
          {/* Info grid */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Campaign Details</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Channel</p>
                <p className="font-medium text-gray-700">{campaign.treatment_channel_label || campaign.treatment_channel || campaign.channel || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Start Date</p>
                <p className="font-medium text-gray-700">{campaign.start_date || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">End Date</p>
                <p className="font-medium text-gray-700">{campaign.end_date || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Linked Offer</p>
                <p className="font-medium text-gray-700">
                  {campaign.offer_name ? `${campaign.offer_code ? `${campaign.offer_code} - ` : ''}${campaign.offer_name}` : 'None'}
                </p>
              </div>
            </div>

            {/* Description */}
            {campaign.description && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-gray-600 leading-relaxed">{campaign.description}</p>
              </div>
            )}
          </div>

          {/* Responses Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Responses Summary</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total', value: campaign.response_count || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Accepted', value: accepted, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Rejected', value: rejected, color: 'text-red-600', bg: 'bg-red-50' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
                  <p className={`text-3xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
                </div>
              ))}
            </div>

            {/* Response table */}
            {responses.length > 0 && (
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      {['Lead', 'Email', 'Status', 'Created'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {responses.map((r: any) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{r.contact_name}</td>
                        <td className="px-4 py-3 text-gray-500">{r.contact_email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              r.status === 'ACCEPTED'
                                ? 'bg-green-100 text-green-700'
                                : r.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.response_date?.split('T')[0] || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {responses.length === 0 && <div className="text-center py-8 text-gray-500">No responses yet</div>}
          </div>
        </div>

        {/* ── RIGHT COLUMN (40%) ─────────────────────────────── */}
        <div className="flex-[2] min-w-0 w-full xl:w-auto space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Quick Stats</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Target List</span>
                <span className="font-bold text-blue-600 text-right max-w-[70%] truncate">{campaign.target_list_label || getTargetListLabel(campaign.target_list)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">Accepted</span>
                <span className="font-bold text-green-600">{accepted}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-red-50 rounded-lg">
                <span className="text-sm text-gray-600">Rejected</span>
                <span className="font-bold text-red-600">{rejected}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-amber-50 rounded-lg">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-bold text-amber-600">{pending}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 leading-relaxed">
                Campaign created on: <span className="font-semibold text-gray-700">{campaign.created_at?.split('T')[0] || 'N/A'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

}
