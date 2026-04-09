import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Map,
  Megaphone,
  Tag,
  Users,
  Shield,
  TrendingUp,
  LogOut,
} from 'lucide-react'
import { logout as apiLogout } from '../api/index'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard',  icon: <LayoutDashboard size={18} /> },
  { label: 'Plans',     to: '/plans',      icon: <Map size={18} /> },
  { label: 'Campaigns', to: '/campaigns',  icon: <Megaphone size={18} /> },
  { label: 'Offers',    to: '/offers',     icon: <Tag size={18} /> },
  { label: 'Leads',     to: '/leads',      icon: <Users size={18} /> },
  { label: 'Users',     to: '/users',      icon: <Shield size={18} /> },
  { label: 'Predictions', to: '/predictions', icon: <TrendingUp size={18} /> },
]

export default function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await apiLogout()
    } catch {}
    localStorage.removeItem('crm_token')
    localStorage.removeItem('crm_username')
    navigate('/login')
  }

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-60 flex flex-col z-20"
      style={{ backgroundColor: '#0f2744' }}
    >
      {/* App name */}
      <div className="px-6 py-5 border-b border-white/10">
        <span className="text-white font-bold text-lg tracking-wide">AI CRM</span>
        <span className="ml-2 text-xs text-blue-300 font-medium">v0.1</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ label, to, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-white'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white',
              ].join(' ')
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-blue-300 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  )
}
