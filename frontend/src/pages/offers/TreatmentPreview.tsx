import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import * as api from '../../api'

export default function TreatmentPreview() {
  const { offerId, treatmentId } = useParams<{ offerId: string; treatmentId: string }>()
  const navigate = useNavigate()
  const [treatment, setTreatment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadPreview = async () => {
      if (!treatmentId) return
      try {
        const data = await api.previewTreatment(Number(treatmentId))
        setTreatment(data)
      } catch (err: any) {
        if (err.response?.status === 401) navigate('/login')
        else setError('Failed to load treatment preview')
      } finally {
        setLoading(false)
      }
    }

    loadPreview()
  }, [navigate, treatmentId])

  if (loading) return <div className="text-center py-8">Loading...</div>
  if (!treatment) return <div className="text-center py-8 text-red-600">Treatment not found</div>

  return (
    <div className="space-y-6">
      <Link to={`/offers/${offerId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
        <ArrowLeft size={15} />
        Back to Offer
      </Link>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>}

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-primary">Treatment Preview</h1>
        <p className="text-sm text-gray-500">{treatment.offer_name || 'Offer'} / {treatment.name} ({treatment.channel_label || treatment.channel})</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Sample Contact</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span className="text-gray-500">Name</span><span className="font-medium text-gray-700">Asha Nair</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-500">Email</span><span className="font-medium text-gray-700">asha@example.com</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-500">City</span><span className="font-medium text-gray-700">Bengaluru</span></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:col-span-2 space-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Subject</p>
            <p className="text-sm text-gray-800 mt-1">{treatment.subject || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Rendered Content</p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-800 whitespace-pre-wrap">
              {String(treatment.body || '') || 'No body content provided.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
