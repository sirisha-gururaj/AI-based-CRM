import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'
import { Megaphone, Users, PieChart, Tag } from 'lucide-react'
import * as api from '../../api'

// ── Data ──────────────────────────────────────────────────────────────────────

// ── Sub-components ─────────────────────────────────────────────────────────────
type MetricCardProps = {
  label: string
  value: string | number
  icon: React.ElementType
  colorClass: string
  textClass: string
}

function MetricCard({ label, value, icon: Icon, colorClass, textClass }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`${colorClass} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
        <Icon size={22} className={textClass} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-3xl font-bold ${textClass} leading-tight`}>{value}</p>
      </div>
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  PLANNED: 'bg-amber-100 text-amber-700',
}

const BAR_COLORS = ['#2563eb', '#1e4fd8', '#1a42be', '#1e3a5f']

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [responseData, setResponseData] = useState<any[]>([])
  const [funnelData, setFunnelData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await api.getDashboard()
        setDashboardData(data)
        setFunnelData(Array.isArray(data?.lead_funnel) ? data.lead_funnel : [])
        setResponseData(Array.isArray(data?.response_trend) ? data.response_trend : [])
      } catch (err: any) {
        if (err.response?.status === 401) {
          window.location.href = '/login'
        } else {
          setError('Failed to load dashboard')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()

    // Keep dashboard synced with latest records while user stays on the page.
    const intervalId = window.setInterval(fetchDashboard, 15000)
    return () => window.clearInterval(intervalId)
  }, [])

  if (loading) return <div className="text-center py-8">Loading...</div>
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>

  // Safely destructure dashboard data with defaults
  const {
    total_plans = 0,
    total_campaigns = 0,
    total_leads = 0,
    total_budget = 0,
    total_offers = 0,
    recent_campaigns = [],
  } = dashboardData || {}

  // Ensure data arrays are always arrays (guard against null/undefined from API)
  const safeResponseData = Array.isArray(responseData) ? responseData : []
  const safeFunnelData = Array.isArray(funnelData) ? funnelData : []
  const safeRecentCampaigns = Array.isArray(recent_campaigns) ? recent_campaigns : []
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Welcome to AI CRM — your marketing intelligence hub.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="Total Plans" value={total_plans || 0} icon={Tag} colorClass="bg-blue-50" textClass="text-blue-600" />
        <MetricCard label="Total Campaigns" value={total_campaigns || 0} icon={Megaphone} colorClass="bg-purple-50" textClass="text-purple-600" />
        <MetricCard label="Total Leads" value={total_leads || 0} icon={Users} colorClass="bg-green-50" textClass="text-green-600" />
        <MetricCard label="Total Budget" value={`₹${((total_budget || 0) / 100000).toFixed(1)}L`} icon={PieChart} colorClass="bg-amber-50" textClass="text-amber-600" />
        <MetricCard label="Total Offers" value={total_offers || 0} icon={Tag} colorClass="bg-pink-50" textClass="text-pink-600" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT — Line chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Campaign Response Rate</h2>
          {safeResponseData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={safeResponseData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Response Rate']} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400">
              <p>No campaign response data available</p>
            </div>
          )}
        </div>

        {/* RIGHT — Bar chart (horizontal) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Lead Funnel</h2>
          {safeFunnelData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              layout="vertical"
              data={safeFunnelData}
              margin={{ top: 4, right: 24, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="stage"
                width={72}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={(v: number) => [v, 'Leads']} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                {safeFunnelData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400">
              <p>No funnel data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Campaigns table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Recent Campaigns</h2>
        </div>
        {safeRecentCampaigns.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                {['Name', 'Status', 'Start Date', 'Response Count'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {safeRecentCampaigns.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-800">{c.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[c.status]}`}>
                      {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{c.start_date || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-700">{c.response_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="px-5 py-8 text-center text-gray-400">
            <p>No recent campaigns</p>
          </div>
        )}
      </div>
    </div>
  )
}
