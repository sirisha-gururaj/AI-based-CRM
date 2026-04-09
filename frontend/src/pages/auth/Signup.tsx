import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Check, Eye, EyeOff } from 'lucide-react'

const FEATURES = [
  'Multi-tenant architecture with RLS',
  'AI Copilot powered by local LLM',
  'Predictive lead scoring',
]

export default function Signup() {
  const navigate = useNavigate()
  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showPwd, setShowPwd]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError]             = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name || !email || !password || !confirm) {
      setError('Please fill in all fields.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    // In demo mode, just navigate to login after "sign up"
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      {/* ── LEFT panel ── */}
      <div
        className="hidden md:flex md:w-5/12 flex-col justify-between p-12 text-white"
        style={{ backgroundColor: '#0f2744' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: '#2563eb' }}
          >
            AI
          </div>
          <span className="text-lg font-semibold tracking-wide">BlueRose CRM</span>
        </div>

        {/* Headline */}
        <div>
          <h1 className="text-3xl font-bold mb-4 leading-snug">
            Join AI CRM Platform
          </h1>
          <p className="text-blue-200 text-sm mb-8 leading-relaxed">
            Get instant access to AI-driven marketing intelligence, predictive
            analytics and automated campaign management.
          </p>
          <ul className="flex flex-col gap-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-blue-100">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#2563eb' }}
                >
                  <Check size={12} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-xs text-blue-400">© 2025 BlueRose Technologies</p>
      </div>

      {/* ── RIGHT panel ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h2>
          <p className="text-gray-500 text-sm mb-8">Start your free workspace today</p>

          {/* Error banner */}
          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
                className="border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: '#2563eb' }}
              onMouseEnter={(e) =>
                ((e.target as HTMLButtonElement).style.backgroundColor = '#1d4ed8')
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLButtonElement).style.backgroundColor = '#2563eb')
              }
            >
              Create Account
            </button>
          </form>

          {/* Sign-in link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
