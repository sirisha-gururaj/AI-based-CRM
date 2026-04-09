import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import * as api from '../../api'

type Status = 'ACTIVE' | 'COMPLETED' | 'DRAFT' | 'PLANNED'
type Channel = 'EMAIL' | 'WEB' | 'SMS' | 'PHONE' | 'DIRECT_MAIL'

const STATUS_STYLES: Record<Status, { badge: string; dot: string }> = {
  ACTIVE: { badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  COMPLETED: { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  DRAFT: { badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  PLANNED: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
}

const CHANNEL_ICON: Record<Channel, string> = {
  EMAIL: '📧',
  SMS: '📱',
  WEB: '🌐',
  PHONE: '📞',
  DIRECT_MAIL: '📮',
}

const TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Planned', value: 'PLANNED' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
]

const LEAD_STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'LOST', label: 'Lost' },
]

function CampaignCard({
  c,
  navigate,
}: {
  c: any
  navigate: any
}) {
  const s = STATUS_STYLES[c.status as Status]
  const isLaunched = c.status === 'ACTIVE' || c.status === 'COMPLETED' || Number(c.response_count || 0) > 0
  const targetListLabel = c.target_list_label || c.target_list?.toString?.().trim?.() || c.target_list || 'No target list linked'
  const channel = (c.treatment_channel || c.channel || 'EMAIL') as Channel
  const channelLabel = c.treatment_channel_label || c.channel_label || (channel.charAt(0) + channel.slice(1).toLowerCase())

  return (
    <button
      type="button"
      onClick={() => navigate(`/campaigns/${c.id}`)}
      className="w-full text-left bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col p-5 gap-4 hover:shadow-md hover:border-blue-300 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-gray-800 text-base leading-snug">{c.name}</h3>
        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <span>{CHANNEL_ICON[channel] || '📧'}</span>
          <span className="font-medium text-gray-600">{channelLabel}</span>
        </span>
        <span className="text-xs text-gray-400">{c.start_date || 'N/A'} - {c.end_date || 'N/A'}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="uppercase tracking-wide font-semibold">Target List</span>
          <span className="text-gray-600 font-medium text-right max-w-[65%] truncate">{targetListLabel}</span>
        </div>
        {c.offer_name ? (
          <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">
            🏷 {c.offer_code ? `${c.offer_code} - ` : ''}{c.offer_name}
          </span>
        ) : (
          <span className="inline-block px-2.5 py-1 bg-gray-50 text-gray-400 text-xs rounded-lg italic">
            No offer linked
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{c.response_count || 0} responses</span>
          <span className="font-semibold text-blue-600 truncate max-w-[65%]">{targetListLabel}</span>
        </div>
      </div>

      <p className="text-xs text-gray-400">{isLaunched ? 'Launched campaign: view only' : 'Click anywhere on card to view details'}</p>
    </button>
  )
}

export default function Campaigns() {
  const navigate = useNavigate()
  const location = useLocation()

  const [campaigns, setCampaigns] = useState<any[]>([])
  const [offers, setOffers] = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])
  const [treatmentsLoading, setTreatmentsLoading] = useState(false)
  const [leadStatusCounts, setLeadStatusCounts] = useState<Record<string, number>>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('ALL')

  const [showForm, setShowForm] = useState(false)
  const [editingCampaignId, setEditingCampaignId] = useState<number | null>(null)
  const [targetMode, setTargetMode] = useState<'status' | 'import'>('status')
  const [targetStatus, setTargetStatus] = useState('NEW')
  const [importedContacts, setImportedContacts] = useState<Array<{ name: string; email: string }>>([])
  const [importFileName, setImportFileName] = useState('')

  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [returnToAfterEdit, setReturnToAfterEdit] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'DRAFT',
    start_date: '',
    end_date: '',
    target_list: '',
    offer: '',
    treatment: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campaignData, offerData, leadsData] = await Promise.all([api.getCampaigns({}), api.getOffers(), api.getLeads()])
        setCampaigns(campaignData)
        setOffers(offerData)

        const counts: Record<string, number> = {}
        for (const lead of leadsData || []) {
          const key = lead.status || 'NEW'
          counts[key] = (counts[key] || 0) + 1
        }
        setLeadStatusCounts(counts)
      } catch (err: any) {
        if (err.response?.status === 401) window.location.href = '/login'
        else setError('Failed to load campaigns')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('openCampaignForm') !== '1') return

    const editCampaignId = params.get('editCampaignId')
    const returnTo = params.get('returnTo')
    if (returnTo) setReturnToAfterEdit(decodeURIComponent(returnTo))
    if (editCampaignId) {
      const campaign = campaigns.find((item) => item.id === Number(editCampaignId))
      if (!campaign) return
      handleEditClick(campaign)
      navigate('/campaigns', { replace: true })
      return
    }

    const draftRaw = sessionStorage.getItem('campaignFormDraft')
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw)
        if (draft?.formData) setFormData(draft.formData)
        if (draft?.targetMode) setTargetMode(draft.targetMode)
        if (draft?.targetStatus) setTargetStatus(draft.targetStatus)
        if (Array.isArray(draft?.importedContacts)) setImportedContacts(draft.importedContacts)
        if (draft?.importFileName) setImportFileName(draft.importFileName)
      } catch {
        // Ignore malformed draft
      }
    }

    const offerFromQuery = params.get('offer')
    const treatmentFromQuery = params.get('treatment')
    if (offerFromQuery) {
      setFormData((prev) => ({ ...prev, offer: offerFromQuery, treatment: treatmentFromQuery || prev.treatment }))
    }
    if (treatmentFromQuery) {
      setFormData((prev) => ({ ...prev, treatment: treatmentFromQuery }))
    }

    setShowForm(true)
    navigate('/campaigns', { replace: true })
  }, [location.search, navigate, campaigns])

  useEffect(() => {
    const loadTreatments = async () => {
      if (!showForm || !formData.offer) {
        setTreatments([])
        return
      }

      setTreatmentsLoading(true)
      try {
        const data = await api.getOfferTreatments(Number(formData.offer))
        setTreatments(data || [])
      } catch {
        setTreatments([])
      } finally {
        setTreatmentsLoading(false)
      }
    }

    loadTreatments()
  }, [showForm, formData.offer])

  const resetForm = () => {
    setEditingCampaignId(null)
    setFormError('')
    setReturnToAfterEdit('')
    setFormData({
      name: '',
      description: '',
      status: 'DRAFT',
      start_date: '',
      end_date: '',
      target_list: '',
      offer: '',
      treatment: '',
    })
    setTargetMode('status')
    setTargetStatus('NEW')
    setImportedContacts([])
    setImportFileName('')
    setTreatments([])
    sessionStorage.removeItem('campaignFormDraft')
  }

  const handleCreateClick = () => {
    resetForm()
    setShowForm(true)
  }

  const handleEditClick = (campaign: any) => {
    const isLaunched = campaign.status === 'ACTIVE' || campaign.status === 'COMPLETED' || Number(campaign.response_count || 0) > 0
    if (isLaunched) {
      setError('Launched campaigns are view-only and cannot be edited.')
      return
    }

    setEditingCampaignId(campaign.id)
    setFormError('')
    setFormData({
      name: campaign.name || '',
      description: campaign.description || '',
      status: campaign.status || 'DRAFT',
      start_date: campaign.start_date || '',
      end_date: campaign.end_date || '',
      target_list: campaign.target_list?.toString?.() || '',
      offer: campaign.offer?.id?.toString?.() || campaign.offer?.toString?.() || '',
      treatment: campaign.treatment?.id?.toString?.() || campaign.treatment?.toString?.() || '',
    })

    const listValue = campaign.target_list || ''
    if (listValue.startsWith('STATUS:')) {
      setTargetMode('status')
      setTargetStatus(listValue.split(':')[1] || 'NEW')
      setImportedContacts([])
      setImportFileName('')
    } else if (listValue.startsWith('IMPORT:')) {
      setTargetMode('import')
      setTargetStatus('NEW')
      setImportFileName(listValue.split(':')[1] || '')
      setImportedContacts(Array.isArray(campaign.import_contacts) ? campaign.import_contacts : [])
    } else {
      setTargetMode('status')
      setTargetStatus('NEW')
      setImportedContacts([])
      setImportFileName('')
    }

    setShowForm(true)
  }

  const handleImportFile = async (file: File | null) => {
    if (!file) return

    try {
      const text = await file.text()
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)

      const parsed: Array<{ name: string; email: string }> = []
      for (const line of lines) {
        const cols = line.split(',').map((v) => v.trim())
        if (!cols.length) continue

        const email = cols.find((v) => v.includes('@')) || ''
        if (!email) continue

        const name = cols[0] && cols[0] !== email ? cols[0] : 'Imported Contact'
        parsed.push({ name, email })
      }

      if (parsed.length === 0) {
        setFormError('No valid contacts found in file. Use CSV/TXT lines containing at least an email.')
        return
      }

      setImportedContacts(parsed)
      setImportFileName(file.name)
      setFormError('')
    } catch {
      setFormError('Failed to read import file.')
    }
  }

  const handleOpenTreatmentCreate = () => {
    if (!formData.offer) {
      setFormError('Select offer first.')
      return
    }

    sessionStorage.setItem(
      'campaignFormDraft',
      JSON.stringify({ formData, targetMode, targetStatus, importedContacts, importFileName })
    )

    navigate(`/offers/${formData.offer}/treatments/new?fromCampaign=1`)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)
    setFormError('')

    try {
      if (targetMode === 'status' && !targetStatus) {
        setFormError('Select lead status for target list.')
        setFormSubmitting(false)
        return
      }

      if (targetMode === 'import' && importedContacts.length === 0) {
        setFormError('Import contacts file first for target list.')
        setFormSubmitting(false)
        return
      }

      const payload = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        target_list: targetMode === 'status' ? `STATUS:${targetStatus}` : `IMPORT:${importFileName || 'uploaded-file'}`,
        offer: formData.offer ? parseInt(formData.offer) : null,
        treatment: formData.treatment ? parseInt(formData.treatment) : null,
        import_contacts: targetMode === 'import' ? importedContacts : [],
      }

      if (editingCampaignId) {
        const updatedCampaign = await api.updateCampaign(editingCampaignId, payload)
        setCampaigns((current) => current.map((campaign) => (campaign.id === editingCampaignId ? updatedCampaign : campaign)))
        if (returnToAfterEdit) {
          setShowForm(false)
          const goTo = returnToAfterEdit
          resetForm()
          navigate(goTo)
          return
        }
      } else {
        const newCampaign = await api.createCampaign(payload)
        setCampaigns([newCampaign, ...campaigns])
      }

      setShowForm(false)
      resetForm()
    } catch (err: any) {
      const data = err.response?.data
      const validationError =
        typeof data === 'string'
          ? data
          : data?.detail ||
            data?.error ||
            (data && typeof data === 'object'
              ? Object.entries(data)
                  .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
                  .join(' | ')
              : '')

      setFormError(validationError || (editingCampaignId ? 'Failed to update campaign' : 'Failed to create campaign'))
    } finally {
      setFormSubmitting(false)
    }
  }

  const visible = activeTab === 'ALL' ? campaigns : campaigns.filter((c) => c.status === activeTab)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-0.5">{loading ? 'Loading...' : `${visible.length} campaign${visible.length !== 1 ? 's' : ''}`}</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: '#2563eb' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1d4ed8')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2563eb')}
        >
          <Plus size={16} />
          New Campaign
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-primary">{editingCampaignId ? 'Edit Campaign' : 'New Campaign'}</h2>
            <p className="text-sm text-gray-500 mt-0.5 mb-5">Create campaign details and audience targeting.</p>
            {formError && <div className="bg-red-50 border border-red-200 rounded p-2 text-red-700 text-sm mb-4">{formError}</div>}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Campaign Basics</h3>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Target Leads</label>
                  <select
                    value={targetMode}
                    onChange={(e) => setTargetMode(e.target.value as 'status' | 'import')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="status">By Lead Status</option>
                    <option value="import">Import File</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Offer</label>
                  <select
                    value={formData.offer}
                    onChange={(e) => {
                      const nextOffer = e.target.value
                      setFormData({ ...formData, offer: nextOffer, treatment: '' })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">-- Select Offer --</option>
                    {offers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                {targetMode === 'status' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Target Status</label>
                    <select
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {LEAD_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} ({leadStatusCounts[option.value] || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {targetMode === 'import' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Import Target List</label>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={(e) => handleImportFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {importedContacts.length > 0
                        ? `${importedContacts.length} contacts loaded from ${importFileName}`
                        : 'Upload CSV/TXT with contact emails.'}
                    </p>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-semibold text-gray-700">Treatment</label>
                    {formData.offer && treatments.length === 0 && !treatmentsLoading && (
                      <button
                        type="button"
                        onClick={handleOpenTreatmentCreate}
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md text-blue-700 border border-blue-200 hover:bg-blue-50"
                        title="Add treatment"
                        aria-label="Add treatment"
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>
                  <select
                    value={formData.treatment}
                    onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                    disabled={!formData.offer || treatmentsLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    {!formData.offer ? (
                      <option value="">Select offer first</option>
                    ) : treatmentsLoading ? (
                      <option value="">Loading treatments...</option>
                    ) : treatments.length === 0 ? (
                      <option value="">No treatments available</option>
                    ) : (
                      <>
                        <option value="">-- Select Treatment --</option>
                        {treatments.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.channel_label || t.channel})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {!formData.offer && <p className="text-xs text-gray-500 mt-1">Select offer first.</p>}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editingCampaignId ? 'Save' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    if (returnToAfterEdit) {
                      const goTo = returnToAfterEdit
                      resetForm()
                      navigate(goTo)
                      return
                    }
                    resetForm()
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

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value
          const count = tab.value === 'ALL' ? campaigns.length : campaigns.filter((c) => c.status === tab.value).length
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap
                ${isActive
                  ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent -mb-px'
                }`}
            >
              {tab.label}
              {tab.value !== 'ALL' && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium
                  ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">No campaigns in this category.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((c) => (
            <CampaignCard key={c.id} c={c} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  )
}
