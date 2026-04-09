import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import * as api from '../../api'

const CHANNEL_OPTIONS = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'WEB', label: 'Web' },
  { value: 'SMS', label: 'SMS' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'DIRECT_MAIL', label: 'Direct Mail' },
]

const CHANNEL_FIELD_META: Record<string, { showSubject: boolean; subjectLabel: string; bodyLabel: string; bodyPlaceholder: string }> = {
  EMAIL: {
    showSubject: true,
    subjectLabel: 'Subject',
    bodyLabel: 'Email Body',
    bodyPlaceholder: 'Write a simple email body.',
  },
  WEB: {
    showSubject: true,
    subjectLabel: 'Page Title',
    bodyLabel: 'Web Message',
    bodyPlaceholder: 'Short web message or CTA copy.',
  },
  SMS: {
    showSubject: false,
    subjectLabel: '',
    bodyLabel: 'SMS Text',
    bodyPlaceholder: 'Short SMS text (keep it concise).',
  },
  PHONE: {
    showSubject: false,
    subjectLabel: '',
    bodyLabel: 'Call Script',
    bodyPlaceholder: 'Basic call opening/script notes.',
  },
  DIRECT_MAIL: {
    showSubject: true,
    subjectLabel: 'Mail Title',
    bodyLabel: 'Mail Content',
    bodyPlaceholder: 'Basic direct-mail content.',
  },
}

export default function TreatmentForm() {
  const { offerId } = useParams<{ offerId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [offer, setOffer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    channel: 'EMAIL',
    subject: '',
    body: '',
    is_active: true,
  })
  const [copilotContext, setCopilotContext] = useState('')
  const [copilotLoading, setCopilotLoading] = useState(false)
  const [copilotError, setCopilotError] = useState('')
  const [copilotSuggestions, setCopilotSuggestions] = useState<string[]>([])
  const channelMeta = CHANNEL_FIELD_META[formData.channel] || CHANNEL_FIELD_META.EMAIL

  const copilotSubtitleMap: Record<string, string> = {
    EMAIL: 'Generate subject line suggestions',
    WEB: 'Generate page headline suggestions',
    SMS: 'Generate SMS copy suggestions',
    PHONE: 'Generate call script openers',
    DIRECT_MAIL: 'Generate mail headline suggestions',
  }
  const copilotSubtitle = copilotSubtitleMap[formData.channel] || copilotSubtitleMap.EMAIL

  const handleCopilotGenerate = async () => {
    setCopilotLoading(true)
    setCopilotError('')

    try {
      const token = localStorage.getItem('crm_token') || ''
      const response = await fetch('/api/ai/subject-lines/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          campaign_name: formData.name || 'Untitled',
          description: copilotContext,
          channel: formData.channel,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || data?.detail || 'Failed to generate suggestions')
      }

      setCopilotSuggestions(Array.isArray(data?.subject_lines) ? data.subject_lines.slice(0, 3) : [])
    } catch (err: any) {
      setCopilotSuggestions([])
      setCopilotError(err?.message || 'Failed to generate suggestions')
    } finally {
      setCopilotLoading(false)
    }
  }

  const handleCopilotUse = (suggestion: string) => {
    if (channelMeta.showSubject) {
      setFormData((prev) => ({ ...prev, subject: suggestion }))
    } else {
      setFormData((prev) => ({ ...prev, body: suggestion }))
    }
  }

  useEffect(() => {
    const loadOffer = async () => {
      if (!offerId) return
      try {
        const data = await api.getOffer(Number(offerId))
        setOffer(data)
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load offer')
      } finally {
        setLoading(false)
      }
    }

    loadOffer()
  }, [offerId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const created = await api.createTreatment(Number(offerId), formData)
      const params = new URLSearchParams(location.search)
      const fromCampaign = params.get('fromCampaign') === '1'

      if (fromCampaign) {
        navigate(`/campaigns?openCampaignForm=1&offer=${offerId}&treatment=${created.id}`)
      } else {
        navigate(`/offers/${offerId}`)
      }
    } catch (err: any) {
      const apiError = err.response?.data
      if (typeof apiError === 'string') {
        setError(apiError)
      } else if (apiError?.detail || apiError?.error) {
        setError(apiError.detail || apiError.error)
      } else if (apiError && typeof apiError === 'object') {
        const firstKey = Object.keys(apiError)[0]
        const firstValue = firstKey ? apiError[firstKey] : null
        setError(Array.isArray(firstValue) ? String(firstValue[0]) : 'Failed to save treatment')
      } else {
        setError('Failed to save treatment')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-xl p-6 space-y-4">
        <div>
          <Link to={`/offers/${offerId}`} className="inline-flex text-sm text-gray-500 hover:text-blue-600 transition-colors">Back to Offer</Link>
          <h1 className="text-2xl font-bold text-primary mt-2">Add Treatment</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create a treatment for {offer?.name || 'this offer'}.</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Treatment Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Channel</label>
            <select
              value={formData.channel}
              onChange={(e) => setFormData((prev) => ({ ...prev, channel: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {CHANNEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 space-y-3">
          <div>
            <div className="text-sm font-semibold text-violet-900">✨ AI Copilot</div>
            <p className="text-xs text-violet-700 mt-0.5">{copilotSubtitle}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Campaign context</label>
            <textarea
              rows={3}
              value={copilotContext}
              onChange={(e) => setCopilotContext(e.target.value)}
              className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
              placeholder="Briefly describe what this treatment is for"
            />
          </div>

          <button
            type="button"
            onClick={handleCopilotGenerate}
            disabled={copilotLoading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60"
          >
            {copilotLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </button>

          {copilotError && <div className="text-sm text-red-600">{copilotError}</div>}

          {copilotSuggestions.length > 0 && (
            <div className="space-y-2">
              {copilotSuggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion}-${index}`}
                  className="flex items-start justify-between gap-3 rounded-lg border border-violet-100 bg-white px-3 py-2"
                >
                  <p className="text-sm text-gray-800 flex-1 leading-snug">{suggestion}</p>
                  <button
                    type="button"
                    onClick={() => handleCopilotUse(suggestion)}
                    className="shrink-0 rounded-md border border-violet-200 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50"
                  >
                    Use
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {channelMeta.showSubject && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{channelMeta.subjectLabel}</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter a short title"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">{channelMeta.bodyLabel}</label>
          <textarea
            rows={8}
            value={formData.body}
            onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder={channelMeta.bodyPlaceholder}
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
            {submitting ? 'Saving...' : 'Save Treatment'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/offers/${offerId}`)}
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
