import { useRef, useState } from 'react'
import { launchClaimCost, launchRebate, launchTacticEfficiency } from '../../api/index'

type PredictionKey = 'claim-cost' | 'rebate' | 'tactic-efficiency'

type PredictionCardProps = {
  title: string
  description: string
  metrics: string[]
  loading: boolean
  onLaunch: () => void
}

function PredictionCard({ title, description, metrics, loading, onLaunch }: PredictionCardProps) {
  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600 max-w-3xl">{description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {metrics.map((metric) => (
          <span
            key={metric}
            className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
          >
            {metric}
          </span>
        ))}
      </div>

      <button
        onClick={onLaunch}
        disabled={loading}
        className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Starting...
          </span>
        ) : (
          'Launch Dashboard →'
        )}
      </button>

      {loading && (
        <p className="mt-2 text-xs font-medium text-blue-700">Status: Starting...</p>
      )}
    </div>
  )
}

export default function Predictions() {
  const [loading, setLoading] = useState<Record<PredictionKey, boolean>>({
    'claim-cost': false,
    rebate: false,
    'tactic-efficiency': false,
  })
  const launchLocks = useRef<Record<PredictionKey, boolean>>({
    'claim-cost': false,
    rebate: false,
    'tactic-efficiency': false,
  })
  const timeoutRefs = useRef<Partial<Record<PredictionKey, number>>>({})

  const handleLaunch = async (key: PredictionKey, url: string) => {
    if (launchLocks.current[key]) return
    launchLocks.current[key] = true

    if (timeoutRefs.current[key]) {
      window.clearTimeout(timeoutRefs.current[key])
      delete timeoutRefs.current[key]
    }

    setLoading((prev) => ({ ...prev, [key]: true }))

    try {
      if (key === 'claim-cost') {
        await launchClaimCost()
      } else if (key === 'rebate') {
        await launchRebate()
      } else {
        await launchTacticEfficiency()
      }

      timeoutRefs.current[key] = window.setTimeout(() => {
        window.open(url, '_blank')
        setLoading((prev) => ({ ...prev, [key]: false }))
        launchLocks.current[key] = false
        delete timeoutRefs.current[key]
      }, 2000)
    } catch (error) {
      console.error('Error launching prediction dashboard:', error)
      setLoading((prev) => ({ ...prev, [key]: false }))
      launchLocks.current[key] = false
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Predictions & Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          AI-powered forecasting models integrated with the CRM platform
        </p>
      </div>

      <div className="space-y-4">
        <PredictionCard
          title="Claim Cost Forecasting"
          description="Predicts 2024 claim costs using Random Forest with 42 engineered features and rolling median approach."
          metrics={["R² = 0.9991", "MAPE: 9.62%", "MAE: $8,672"]}
          loading={loading['claim-cost']}
          onLaunch={() => handleLaunch('claim-cost', 'http://localhost:8501')}
        />

        <PredictionCard
          title="Rebate Prediction"
          description="Predicts 2025 customer rebate amounts using XGBoost trained on 2022–2024 contract history."
          metrics={["Algorithm: XGBoost", "Trained on: 2022–2024 data"]}
          loading={loading.rebate}
          onLaunch={() => handleLaunch('rebate', 'http://localhost:8502')}
        />

        <PredictionCard
          title="Tactic Efficiency Prediction"
          description="Ranks tactic types per product group using Random Forest to guide data-driven planning decisions."
          metrics={["R² = 0.74", "Coverage: 100% plan coverage"]}
          loading={loading['tactic-efficiency']}
          onLaunch={() => handleLaunch('tactic-efficiency', 'http://localhost:8503')}
        />
      </div>
    </div>
  )
}
