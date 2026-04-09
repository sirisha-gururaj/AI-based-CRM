import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import * as api from '../../api'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const TAB_OPTIONS = ['overview', 'initiatives', 'tactics', 'budget', 'calendar'] as const

type TabKey = (typeof TAB_OPTIONS)[number]
type IniStatus = 'ACTIVE' | 'DRAFT'

const STATUS_STYLE: Record<IniStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  DRAFT: 'bg-gray-100 text-gray-500',
}

const TAB_LABELS: Record<TabKey, string> = {
  overview: 'Overview',
  initiatives: 'Initiatives',
  tactics: 'Tactics',
  budget: 'Budget',
  calendar: 'Calendar',
}

const fmt = (value: unknown) => `₹${Number(value || 0).toFixed(2)}`

const toNumber = (value: unknown) => Number(value || 0)

const formatDate = (value?: string) => {
  if (!value) return 'N/A'
  const [yearText, monthText, dayText] = value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  if (!year || !month || !day) return value
  return `${String(day).padStart(2, '0')}-${MONTHS[month - 1]}-${year}`
}

const formatMonthYear = (value: Date) => `${MONTHS[value.getMonth()]} ${value.getFullYear()}`

const formatMonthParam = (value: Date) => {
  const month = String(value.getMonth() + 1).padStart(2, '0')
  return `${value.getFullYear()}-${month}`
}

const parseMonthParam = (value?: string | null) => {
  if (!value) return null
  const [yearText, monthText] = value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  if (!year || !month) return null
  return new Date(year, month - 1, 1)
}

const parseDate = (value?: string | null) => {
  if (!value) return null
  const [yearText, monthText, dayText] = value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

const dateKey = (value: Date) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const buildCalendarWeeks = (monthStart: Date) => {
  const firstOfMonth = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1)
  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay())

  const weeks: Date[][] = []
  for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
    const week: Date[] = []
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const current = new Date(gridStart)
      current.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex)
      week.push(current)
    }
    weeks.push(week)
  }

  return weeks
}

export default function PlanDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [plan, setPlan] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInitiativeForm, setShowInitiativeForm] = useState(false)
  const [editingInitiative, setEditingInitiative] = useState<any>(null)
  const [initiativeFormData, setInitiativeFormData] = useState({
    name: '',
    description: '',
    status: 'DRAFT',
    start_date: '',
    end_date: '',
    planned_amount: '',
    actual_amount: '',
  })
  const [showTacticForm, setShowTacticForm] = useState(false)
  const [editingTactic, setEditingTactic] = useState<any>(null)
  const [tacticFormData, setTacticFormData] = useState({
    name: '',
    description: '',
    status: 'DRAFT',
    initiative: '',
    start_date: '',
    end_date: '',
    planned_amount: '',
    actual_amount: '',
  })
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchPlan = async (showLoader = true) => {
    if (!id) return
    if (showLoader) setLoading(true)
    try {
      const [planData, campaignData] = await Promise.all([api.getPlan(parseInt(id)), api.getCampaigns({})])
      setPlan(planData)
      setCampaigns(campaignData || [])
      setError('')
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/login')
      else setError('Failed to load plan')
    } finally {
      if (showLoader) setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlan()
  }, [id, navigate])

  const initiatives = plan?.initiatives || []
  const allTactics = useMemo(
    () =>
      initiatives.flatMap((initiative: any) =>
        (initiative.tactics || []).map((tactic: any) => ({
          ...tactic,
          initiative_name: initiative.name,
          initiative_id: initiative.id,
        }))
      ),
    [initiatives]
  )

  const totalPlanned = toNumber(plan?.initiatives_planned_total ?? initiatives.reduce((sum: number, initiative: any) => sum + toNumber(initiative.planned_amount), 0))
  const totalActual = toNumber(plan?.initiatives_actual_total ?? initiatives.reduce((sum: number, initiative: any) => sum + toNumber(initiative.actual_amount), 0))
  const totalVariance = toNumber(plan?.initiatives_variance ?? totalPlanned - totalActual)

  const activeTabParam = searchParams.get('tab')
  const activeTab: TabKey = TAB_OPTIONS.includes(activeTabParam as TabKey) ? (activeTabParam as TabKey) : 'overview'

  const calendarStart = useMemo(() => {
    const selectedMonth = parseMonthParam(searchParams.get('month'))
    if (selectedMonth) return selectedMonth
    const planMonth = parseDate(plan?.start_date)
    if (planMonth) return new Date(planMonth.getFullYear(), planMonth.getMonth(), 1)
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  }, [plan?.start_date, searchParams])

  const calendarWeeks = useMemo(() => buildCalendarWeeks(calendarStart), [calendarStart])
  const dayTactics = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    const calendarDays = calendarWeeks.flat()

    for (const tactic of allTactics) {
      const start = parseDate(tactic.start_date)
      const end = parseDate(tactic.end_date)
      if (!start || !end) continue

      for (const day of calendarDays) {
        if (day >= start && day <= end) {
          const key = dateKey(day)
          if (!grouped[key]) grouped[key] = []
          grouped[key].push(tactic)
        }
      }
    }

    return grouped
  }, [allTactics, calendarWeeks])

  const dayCampaignMarkers = useMemo(() => {
    const grouped: Record<string, Array<{ id: number; name: string; type: 'start' | 'end' }>> = {}

    for (const campaign of campaigns) {
      const start = parseDate(campaign.start_date)
      const end = parseDate(campaign.end_date)

      if (start) {
        const key = dateKey(start)
        if (!grouped[key]) grouped[key] = []
        grouped[key].push({ id: campaign.id, name: campaign.name, type: 'start' })
      }
      if (end) {
        const key = dateKey(end)
        if (!grouped[key]) grouped[key] = []
        grouped[key].push({ id: campaign.id, name: campaign.name, type: 'end' })
      }
    }

    return grouped
  }, [campaigns])

  const setTab = (tab: TabKey) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    if (tab !== 'calendar') next.delete('month')
    if (tab === 'calendar' && !next.get('month')) {
      next.set('month', formatMonthParam(calendarStart))
    }
    setSearchParams(next)
  }

  const handleAddInitiative = () => {
    setEditingInitiative(null)
    setInitiativeFormData({
      name: '',
      description: '',
      status: 'DRAFT',
      start_date: '',
      end_date: '',
      planned_amount: '',
      actual_amount: '',
    })
    setFormError('')
    setShowInitiativeForm(true)
  }

  const handleEditInitiative = (initiative: any) => {
    setEditingInitiative(initiative)
    setInitiativeFormData({
      ...initiative,
      planned_amount: initiative.planned_amount?.toString?.() ?? '',
      actual_amount: initiative.actual_amount?.toString?.() ?? '',
    })
    setFormError('')
    setShowInitiativeForm(true)
  }

  const handleAddTactic = (initiativeId?: number) => {
    setEditingTactic(null)
    setTacticFormData({
      name: '',
      description: '',
      status: 'DRAFT',
      initiative: initiativeId ? String(initiativeId) : String(initiatives[0]?.id || ''),
      start_date: '',
      end_date: '',
      planned_amount: '',
      actual_amount: '',
    })
    setFormError('')
    setShowTacticForm(true)
    setTab('tactics')
  }

  const handleEditTactic = (tactic: any) => {
    setEditingTactic(tactic)
    setTacticFormData({
      ...tactic,
      initiative: String(tactic.initiative || tactic.initiative_id || ''),
      planned_amount: tactic.planned_amount?.toString?.() ?? '',
      actual_amount: tactic.actual_amount?.toString?.() ?? '',
    })
    setFormError('')
    setShowTacticForm(true)
    setTab('tactics')
  }

  const handleDeleteInitiative = async (initiativeId: number) => {
    if (!confirm('Delete this initiative?')) return
    try {
      await api.deleteInitiative(initiativeId)
      await fetchPlan(false)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete initiative')
    }
  }

  const handleDeleteTactic = async (tacticId: number) => {
    if (!confirm('Delete this tactic?')) return
    try {
      await api.deleteTactic(tacticId)
      await fetchPlan(false)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete tactic')
    }
  }

  const handleInitiativeFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)
    setFormError('')
    try {
      if (editingInitiative) {
        await api.updateInitiative(editingInitiative.id, {
          ...initiativeFormData,
          planned_amount: parseInt(initiativeFormData.planned_amount as any) || 0,
          actual_amount: parseInt(initiativeFormData.actual_amount as any) || 0,
        })
      } else {
        await api.createInitiative({
          ...initiativeFormData,
          plan: plan.id,
          planned_amount: parseInt(initiativeFormData.planned_amount as any) || 0,
          actual_amount: parseInt(initiativeFormData.actual_amount as any) || 0,
        })
      }
      setShowInitiativeForm(false)
      setEditingInitiative(null)
      await fetchPlan(false)
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to submit form')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleTacticFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)
    setFormError('')
    try {
      const payload = {
        ...tacticFormData,
        initiative: parseInt(tacticFormData.initiative as any) || 0,
        planned_amount: parseInt(tacticFormData.planned_amount as any) || 0,
        actual_amount: parseInt(tacticFormData.actual_amount as any) || 0,
      }

      if (editingTactic) {
        await api.updateTactic(editingTactic.id, payload)
      } else {
        await api.createTactic(payload)
      }
      setShowTacticForm(false)
      setEditingTactic(null)
      await fetchPlan(false)
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to submit form')
    } finally {
      setFormSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>
  if (!plan) return <div className="text-center py-8 text-red-600">Plan not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-primary">{plan.name}</h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                plan.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-700'
                  : plan.status === 'DRAFT'
                    ? 'bg-gray-100 text-gray-600'
                    : plan.status === 'PLANNED'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              {plan.status.charAt(0) + plan.status.slice(1).toLowerCase()}
            </span>
          </div>
          <p className="text-sm text-gray-500">{plan.description || 'No description provided.'}</p>
          <p className="text-sm text-gray-500">
            {formatDate(plan.start_date)} – {formatDate(plan.end_date)} · Total budget:{' '}
            <span className="font-semibold text-gray-700">{fmt(plan.total_budget)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`http://127.0.0.1:8000/plans/${id}/edit/`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-lg border border-blue-500 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            Edit Plan
          </a>
          <Link
            to="/plans"
            className="px-4 py-2 rounded-lg border border-gray-400 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Back
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>}

      <div className="border-b border-gray-200">
        <nav className="flex flex-wrap gap-2" aria-label="Plan tabs">
          {TAB_OPTIONS.map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setTab(tab)}
                className={`rounded-t-lg border px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-gray-200 border-b-white bg-white text-gray-900'
                    : 'border-transparent bg-transparent text-blue-600 hover:text-blue-800'
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            )
          })}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Status</p>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[plan.status as IniStatus] || 'bg-gray-100 text-gray-600'}`}>
                {plan.status.charAt(0) + plan.status.slice(1).toLowerCase()}
              </span>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-4 mb-1">Dates</p>
              <p className="text-sm text-gray-800">{formatDate(plan.start_date)} – {formatDate(plan.end_date)}</p>
            </div>

            <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Planned Budget</p>
                  <p className="text-2xl font-bold text-gray-800">{fmt(plan.total_budget)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Actual Spend</p>
                  <p className="text-2xl font-bold text-gray-800">{fmt(totalActual)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Variance</p>
                  <p className="text-2xl font-bold text-gray-800">{fmt(totalVariance)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'initiatives' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-700">Initiatives</h2>
            <button
              onClick={handleAddInitiative}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              <Plus size={14} />
              Add Initiative
            </button>
          </div>

          {showInitiativeForm && (
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              {formError && <div className="bg-red-50 border border-red-200 rounded p-2 text-red-700 text-sm mb-4">{formError}</div>}
              <form onSubmit={handleInitiativeFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={initiativeFormData.name}
                    onChange={(e) => setInitiativeFormData({ ...initiativeFormData, name: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={initiativeFormData.status}
                    onChange={(e) => setInitiativeFormData({ ...initiativeFormData, status: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={initiativeFormData.start_date}
                    onChange={(e) => setInitiativeFormData({ ...initiativeFormData, start_date: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={initiativeFormData.end_date}
                    onChange={(e) => setInitiativeFormData({ ...initiativeFormData, end_date: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Planned Amount</label>
                  <input
                    type="number"
                    value={initiativeFormData.planned_amount}
                    onChange={(e) => setInitiativeFormData({ ...initiativeFormData, planned_amount: e.target.value as any })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    min="0"
                    onFocus={(e) => {
                      if (initiativeFormData.planned_amount === '0') {
                        setInitiativeFormData({ ...initiativeFormData, planned_amount: '' })
                      }
                      e.currentTarget.select()
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Actual Amount</label>
                  <input
                    type="number"
                    value={initiativeFormData.actual_amount}
                    onChange={(e) => setInitiativeFormData({ ...initiativeFormData, actual_amount: e.target.value as any })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    min="0"
                    onFocus={(e) => {
                      if (initiativeFormData.actual_amount === '0') {
                        setInitiativeFormData({ ...initiativeFormData, actual_amount: '' })
                      }
                      e.currentTarget.select()
                    }}
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button type="submit" disabled={formSubmitting} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                    {formSubmitting ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setShowInitiativeForm(false)} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm font-semibold hover:bg-gray-300">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  {['Initiative Name', 'Status', 'Planned Budget', 'Actual Spend', 'Variance', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {initiatives.map((initiative: any) => {
                  const variance = toNumber(initiative.planned_amount) - toNumber(initiative.actual_amount)
                  return (
                    <tr key={initiative.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-800">{initiative.name}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[initiative.status as IniStatus] || 'bg-gray-100 text-gray-600'}`}>
                          {initiative.status.charAt(0) + initiative.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 font-medium">{fmt(initiative.planned_amount)}</td>
                      <td className="px-5 py-3.5 text-gray-700 font-medium">{fmt(initiative.actual_amount)}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-green-700 font-semibold">✅ {fmt(variance)}</span>
                      </td>
                      <td className="px-5 py-3.5 flex items-center gap-2 flex-wrap">
                        <button onClick={() => handleEditInitiative(initiative)} className="p-1.5 hover:bg-yellow-50 rounded text-yellow-600" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteInitiative(initiative.id)} className="p-1.5 hover:bg-red-50 rounded text-red-600" title="Delete">
                          <Trash2 size={14} />
                        </button>
                        <button onClick={() => handleAddTactic(initiative.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-blue-600 hover:bg-blue-50">
                          <Plus size={12} />
                          Add Tactic
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {initiatives.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td className="px-5 py-3.5 font-bold text-gray-700" colSpan={2}>
                      Total
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-800">{fmt(totalPlanned)}</td>
                    <td className="px-5 py-3.5 font-bold text-gray-800">{fmt(totalActual)}</td>
                    <td className="px-5 py-3.5 font-bold text-green-700">✅ {fmt(totalVariance)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {initiatives.length === 0 && <div className="text-center py-8 text-gray-500">No initiatives yet</div>}
        </div>
      )}

      {activeTab === 'tactics' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Tactics</h2>
            {initiatives.length > 0 ? (
              <button onClick={() => handleAddTactic()} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                <Plus size={14} />
                Add Tactic
              </button>
            ) : (
              <span className="text-sm text-gray-500">Create an initiative first.</span>
            )}
          </div>

          {showTacticForm && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              {formError && <div className="bg-red-50 border border-red-200 rounded p-2 text-red-700 text-sm mb-4">{formError}</div>}
              <form onSubmit={handleTacticFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={tacticFormData.name}
                    onChange={(e) => setTacticFormData({ ...tacticFormData, name: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Initiative</label>
                  <select
                    value={tacticFormData.initiative}
                    onChange={(e) => setTacticFormData({ ...tacticFormData, initiative: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  >
                    <option value="">Select initiative</option>
                    {initiatives.map((initiative: any) => (
                      <option key={initiative.id} value={initiative.id}>
                        {initiative.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={tacticFormData.status}
                    onChange={(e) => setTacticFormData({ ...tacticFormData, status: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={tacticFormData.description}
                    onChange={(e) => setTacticFormData({ ...tacticFormData, description: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={tacticFormData.start_date}
                    onChange={(e) => setTacticFormData({ ...tacticFormData, start_date: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={tacticFormData.end_date}
                    onChange={(e) => setTacticFormData({ ...tacticFormData, end_date: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Planned Amount</label>
                  <input
                    type="number"
                    value={tacticFormData.planned_amount}
                    onChange={(e) => setTacticFormData({ ...tacticFormData, planned_amount: e.target.value as any })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    min="0"
                    onFocus={(e) => {
                      if (tacticFormData.planned_amount === '0') {
                        setTacticFormData({ ...tacticFormData, planned_amount: '' })
                      }
                      e.currentTarget.select()
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Actual Amount</label>
                  <input
                    type="number"
                    value={tacticFormData.actual_amount}
                    onChange={(e) => setTacticFormData({ ...tacticFormData, actual_amount: e.target.value as any })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    min="0"
                    onFocus={(e) => {
                      if (tacticFormData.actual_amount === '0') {
                        setTacticFormData({ ...tacticFormData, actual_amount: '' })
                      }
                      e.currentTarget.select()
                    }}
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button type="submit" disabled={formSubmitting} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                    {formSubmitting ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setShowTacticForm(false)} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm font-semibold hover:bg-gray-300">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    {['Name', 'Initiative', 'Status', 'Dates', 'Planned', 'Actual', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allTactics.map((tactic: any) => {
                    const variance = toNumber(tactic.planned_amount) - toNumber(tactic.actual_amount)
                    return (
                      <tr key={tactic.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-gray-800">{tactic.name}</td>
                        <td className="px-5 py-3.5 text-gray-600">{tactic.initiative_name || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[tactic.status as IniStatus] || 'bg-gray-100 text-gray-600'}`}>
                            {tactic.status.charAt(0) + tactic.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">{formatDate(tactic.start_date)} – {formatDate(tactic.end_date)}</td>
                        <td className="px-5 py-3.5 text-gray-700 font-medium">{fmt(tactic.planned_amount)}</td>
                        <td className="px-5 py-3.5 text-gray-700 font-medium">{fmt(tactic.actual_amount)}</td>
                        <td className="px-5 py-3.5 flex items-center gap-2 flex-wrap">
                          <button onClick={() => handleEditTactic(tactic)} className="p-1.5 hover:bg-yellow-50 rounded text-yellow-600" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDeleteTactic(tactic.id)} className="p-1.5 hover:bg-red-50 rounded text-red-600" title="Delete">
                            <Trash2 size={14} />
                          </button>
                          <span className="text-xs font-semibold text-green-700">✅ {fmt(variance)}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {allTactics.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td className="px-5 py-3.5 font-bold text-gray-700" colSpan={4}>
                        Total
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-800">{fmt(allTactics.reduce((sum: number, tactic: any) => sum + toNumber(tactic.planned_amount), 0))}</td>
                      <td className="px-5 py-3.5 font-bold text-gray-800">{fmt(allTactics.reduce((sum: number, tactic: any) => sum + toNumber(tactic.actual_amount), 0))}</td>
                      <td className="px-5 py-3.5 font-bold text-green-700">✅ {fmt(allTactics.reduce((sum: number, tactic: any) => sum + (toNumber(tactic.planned_amount) - toNumber(tactic.actual_amount)), 0))}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            {allTactics.length === 0 && <div className="text-center py-8 text-gray-500">No tactics yet</div>}
          </div>
        </div>
      )}

      {activeTab === 'budget' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Total Planned</p>
              <p className="text-2xl font-bold text-gray-800">{fmt(totalPlanned)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Total Actual</p>
              <p className="text-2xl font-bold text-gray-800">{fmt(totalActual)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Variance</p>
              <p className="text-2xl font-bold text-gray-800">{fmt(totalVariance)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    {['Initiative', 'Planned', 'Actual', 'Variance', 'Tactics Planned', 'Tactics Actual'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {initiatives.map((initiative: any) => (
                    <tr key={initiative.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-800">{initiative.name}</td>
                      <td className="px-5 py-3.5 text-gray-700 font-medium">{fmt(initiative.planned_amount)}</td>
                      <td className="px-5 py-3.5 text-gray-700 font-medium">{fmt(initiative.actual_amount)}</td>
                      <td className="px-5 py-3.5 text-green-700 font-semibold">✅ {fmt(toNumber(initiative.planned_amount) - toNumber(initiative.actual_amount))}</td>
                      <td className="px-5 py-3.5 text-gray-700 font-medium">{fmt(initiative.tactics_planned_total)}</td>
                      <td className="px-5 py-3.5 text-gray-700 font-medium">{fmt(initiative.tactics_actual_total)}</td>
                    </tr>
                  ))}
                </tbody>
                {initiatives.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td className="px-5 py-3.5 font-bold text-gray-700">Total</td>
                      <td className="px-5 py-3.5 font-bold text-gray-800">{fmt(totalPlanned)}</td>
                      <td className="px-5 py-3.5 font-bold text-gray-800">{fmt(totalActual)}</td>
                      <td className="px-5 py-3.5 font-bold text-green-700">✅ {fmt(totalVariance)}</td>
                      <td className="px-5 py-3.5 font-bold text-gray-800">{fmt(initiatives.reduce((sum: number, initiative: any) => sum + toNumber(initiative.tactics_planned_total), 0))}</td>
                      <td className="px-5 py-3.5 font-bold text-gray-800">{fmt(initiatives.reduce((sum: number, initiative: any) => sum + toNumber(initiative.tactics_actual_total), 0))}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            {initiatives.length === 0 && <div className="text-center py-8 text-gray-500">No initiatives yet</div>}
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{formatMonthYear(calendarStart)}</h2>
            <div className="text-sm text-gray-500">Tactics plus campaign start/end markers.</div>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Campaign start
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Campaign end
            </span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <th key={day} className="border border-gray-200 px-3 py-2 text-left font-medium">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calendarWeeks.map((week, weekIndex) => (
                    <tr key={weekIndex}>
                      {week.map((day) => {
                        const inMonth = day.getMonth() === calendarStart.getMonth()
                        const tacticsForDay = dayTactics[dateKey(day)] || []
                        const campaignMarkers = dayCampaignMarkers[dateKey(day)] || []
                        return (
                          <td
                            key={dateKey(day)}
                            className={`border border-gray-200 align-top p-2 h-28 ${inMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}`}
                          >
                            <div className="text-xs font-semibold mb-1">{String(day.getDate()).padStart(2, '0')}</div>
                            <div className="space-y-1">
                              {campaignMarkers.map((marker) => (
                                <div
                                  key={`${marker.type}-${marker.id}-${dateKey(day)}`}
                                  className={`rounded-md px-2 py-1 text-xs font-semibold truncate ${
                                    marker.type === 'start' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                  }`}
                                >
                                  {marker.type === 'start' ? 'Start' : 'End'}: {marker.name}
                                </div>
                              ))}
                              {tacticsForDay.map((tactic: any) => (
                                <div key={`${tactic.id}-${dateKey(day)}`} className="rounded-md bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 truncate">
                                  {tactic.name}
                                </div>
                              ))}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
