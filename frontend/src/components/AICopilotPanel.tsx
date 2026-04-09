import { useEffect, useRef, useState } from 'react'
import { generateSubjectLines } from '../api'

type AICopilotPanelProps = {
  campaignName: string
  description: string
  channel?: string
}

export default function AICopilotPanel({ campaignName, description, channel }: AICopilotPanelProps) {
  const [contextText, setContextText] = useState(description || '')
  const [subjectLines, setSubjectLines] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const copyResetTimerRef = useRef<number | null>(null)

  useEffect(() => {
    setContextText(description || '')
  }, [description])

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current)
      }
    }
  }, [])

  const handleGenerate = async () => {
    setLoading(true)
    setError('')

    try {
      const lines = await generateSubjectLines(campaignName, contextText, channel)
      setSubjectLines(lines.slice(0, 3))
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Failed to generate subject lines.'
      setError(message)
      setSubjectLines([])
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)

      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current)
      }

      copyResetTimerRef.current = window.setTimeout(() => {
        setCopiedIndex(null)
      }, 1400)
    } catch {
      setError('Unable to copy to clipboard. Please copy manually.')
    }
  }

  return (
    <section className="rounded-xl border border-violet-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700">
          <span aria-hidden="true">🪄</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-violet-900">AI Copilot</h3>
          <p className="text-xs text-violet-600">Generate email-ready subject line ideas</p>
        </div>
      </div>

      <label htmlFor="ai-context" className="mb-1 block text-xs font-medium text-slate-700">
        Extra context
      </label>
      <textarea
        id="ai-context"
        value={contextText}
        onChange={(e) => setContextText(e.target.value)}
        rows={4}
        placeholder="Add notes, audience, tone, or urgency..."
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      />

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-400"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Generating...
          </>
        ) : (
          <>✨ Generate Subject Lines</>
        )}
      </button>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {subjectLines.length > 0 && (
        <div className="mt-4 space-y-2">
          {subjectLines.map((line, index) => (
            <div
              key={`${line}-${index}`}
              className="flex items-start justify-between gap-3 rounded-lg border border-violet-100 bg-violet-50/60 p-3"
            >
              <p className="text-sm text-slate-800">{line}</p>
              <button
                type="button"
                onClick={() => handleCopy(line, index)}
                className="shrink-0 rounded-md border border-violet-200 bg-white px-2.5 py-1 text-xs font-medium text-violet-700 transition hover:bg-violet-100"
              >
                {copiedIndex === index ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
