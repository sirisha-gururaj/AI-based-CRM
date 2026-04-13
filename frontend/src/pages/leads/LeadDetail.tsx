import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import * as api from '../../api'

const STATUS_BADGE: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-700',
  CONTACTED: 'bg-blue-100 text-blue-700',
  QUALIFIED: 'bg-green-100 text-green-700',
  CONVERTED: 'bg-emerald-100 text-emerald-700',
  LOST: 'bg-red-100 text-red-700',
}

const RATING_BADGE: Record<string, string> = {
  hot: 'bg-red-100 text-red-700',
  warm: 'bg-amber-100 text-amber-700',
  cold: 'bg-blue-100 text-blue-700',
}

function formatDateTime(value?: string | null) {
  return value ? String(value).slice(0, 16).replace('T', ' ') : '-'
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesError, setNotesError] = useState('')

  useEffect(() => {
    const loadLead = async () => {
      try {
        const data = await api.getLead(Number(id))
        setLead(data)
        setNotesDraft(data?.notes || '')
      } catch (err: any) {
        if (err.response?.status === 401) navigate('/login')
        else setError('Failed to load lead')
      } finally {
        setLoading(false)
      }
    }

    if (id) loadLead()
  }, [id, navigate])

  const handleDelete = async () => {
    if (!lead) return
    if (!confirm('Delete this lead?')) return
    try {
      await api.deleteLead(lead.id)
      navigate('/leads')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete lead')
    }
  }

  const handleSaveNotes = async () => {
    if (!lead) return
    setNotesSaving(true)
    setNotesError('')
    try {
      const payload = {
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        job_title: lead.job_title || '',
        company: lead.company || '',
        industry: lead.industry || '',
        company_size: lead.company_size || '',
        email: lead.email || '',
        phone: lead.phone || '',
        city: lead.city || '',
        country: lead.country || '',
        status: lead.status || 'NEW',
        source: lead.source || 'web',
        rating: lead.rating || 'warm',
        owner: lead.owner || '',
        offer: lead.offer || null,
        notes: notesDraft,
      }
      const updated = await api.updateLead(lead.id, payload)
      setLead(updated)
      setIsEditingNotes(false)
    } catch (err: any) {
      setNotesError(err.response?.data?.detail || err.response?.data?.error || 'Failed to save notes')
    } finally {
      setNotesSaving(false)
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>
  if (!lead) return <div className="text-center py-8 text-red-600">Lead not found</div>

  return (
    <div className="space-y-6">
      <Link to="/leads" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
        <ArrowLeft size={15} />
        Back to Leads
      </Link>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>}

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-primary">{lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim()}</h1>
          <p className="text-sm text-gray-500">{[lead.job_title, lead.company ? `at ${lead.company}` : ''].filter(Boolean).join(' · ') || 'Lead details'}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/leads/${lead.id}/edit?returnTo=${encodeURIComponent(`/leads/${lead.id}`)}`} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Edit</Link>
          <button onClick={handleDelete} className="px-4 py-2 rounded-lg border border-red-200 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors">Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:col-span-2 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Lead Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status</p>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[lead.status] || STATUS_BADGE.NEW}`}>{lead.status_label || lead.status || 'NEW'}</span>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Rating</p>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${RATING_BADGE[lead.rating] || RATING_BADGE.warm}`}>{lead.rating_label || lead.rating || 'warm'}</span>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Source</p>
                <p className="font-medium text-gray-700">{lead.source_label || lead.source || '-'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div><p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Company</p><p className="font-medium text-gray-700">{lead.company || '-'}</p></div>
            <div><p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Industry</p><p className="font-medium text-gray-700">{lead.industry || '-'}</p></div>
            <div><p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Company Size</p><p className="font-medium text-gray-700">{lead.company_size || '-'}</p></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</p>
              <a href={lead.email ? `mailto:${lead.email}` : undefined} className="font-medium text-blue-600 hover:underline">{lead.email || '-'}</a>
            </div>
            <div><p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Phone</p><p className="font-medium text-gray-700">{lead.phone || '-'}</p></div>
            <div><p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Location</p><p className="font-medium text-gray-700">{[lead.city, lead.country].filter(Boolean).join(', ') || '-'}</p></div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Notes</h2>
              {!isEditingNotes ? (
                <button
                  type="button"
                  onClick={() => setIsEditingNotes(true)}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  +
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={notesSaving}
                    className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingNotes(false)
                      setNotesDraft(lead.notes || '')
                      setNotesError('')
                    }}
                    className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {isEditingNotes ? (
              <div>
                <textarea
                  rows={5}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Add notes about qualification and next action."
                />
                {notesError && <p className="mt-2 text-sm text-red-600">{notesError}</p>}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-800 whitespace-pre-wrap min-h-24">{lead.notes || 'No notes yet.'}</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Offer and Routing</h2>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Related Offer</p>
              {lead.offer ? (
                <Link to={`/offers/${lead.offer}`} className="font-medium text-blue-600 hover:underline">
                  {lead.offer_code ? `${lead.offer_code} - ` : ''}
                  {lead.offer_name || 'View offer'}
                </Link>
              ) : (
                <p className="font-medium text-gray-700">-</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Owner</p>
              <p className="font-medium text-gray-700">{lead.owner || 'Unassigned'}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">System Information</h2>
            <div><p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Lead ID</p><p className="font-medium text-gray-700">{lead.id}</p></div>
            <div><p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Created At</p><p className="font-medium text-gray-700">{formatDateTime(lead.created_at)}</p></div>
            <div><p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Updated At</p><p className="font-medium text-gray-700">{formatDateTime(lead.updated_at)}</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}
