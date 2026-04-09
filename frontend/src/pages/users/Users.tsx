import { Pencil, Ban, Plus } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
type Role   = 'Admin' | 'Marketing Manager' | 'Marketing Ops' | 'Sales Rep' | 'CXO'
type Status = 'Active' | 'Inactive'

interface User {
  id: number
  name: string
  email: string
  role: Role
  orgUnit: string
  status: Status
  lastLogin: string
}

// ── Data ──────────────────────────────────────────────────────────────────────
const USERS: User[] = [
  { id: 1, name: 'Kavitha R',  email: 'kavitha@bluerose.com', role: 'Admin',             orgUnit: 'Head Office', status: 'Active',   lastLogin: 'Today, 9:00 AM'  },
  { id: 2, name: 'Riya Menon', email: 'riya@bluerose.com',    role: 'Marketing Manager', orgUnit: 'APAC Team',   status: 'Active',   lastLogin: 'Today, 8:45 AM'  },
  { id: 3, name: 'Karan Seth', email: 'karan@bluerose.com',   role: 'Sales Rep',         orgUnit: 'APAC Team',   status: 'Active',   lastLogin: 'Yesterday'       },
  { id: 4, name: 'Divya T',    email: 'divya@bluerose.com',   role: 'Marketing Ops',     orgUnit: 'North Team',  status: 'Active',   lastLogin: 'Dec 9'           },
  { id: 5, name: 'Suresh L',   email: 'suresh@bluerose.com',  role: 'Sales Rep',         orgUnit: 'North Team',  status: 'Inactive', lastLogin: 'Dec 5'           },
  { id: 6, name: 'Anita M',    email: 'anita@bluerose.com',   role: 'CXO',               orgUnit: 'Head Office', status: 'Active',   lastLogin: 'Today, 10:00 AM' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const ROLE_STYLE: Record<Role, string> = {
  'Admin':             'bg-[#1e3a5f] text-white',
  'Marketing Manager': 'bg-blue-100 text-blue-700',
  'Marketing Ops':     'bg-indigo-100 text-indigo-700',
  'Sales Rep':         'bg-green-100 text-green-700',
  'CXO':               'bg-purple-100 text-purple-700',
}

// Palette of background colors cycled per user for avatar circles
const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-purple-600',
  'bg-green-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-indigo-600',
]

function initials(name: string) {
  const parts = name.trim().split(' ')
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

function Avatar({ name, index }: { name: string; index: number }) {
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0
        ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
    >
      {initials(name)}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Users() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{USERS.length} users</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: '#2563eb' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1d4ed8')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2563eb')}
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                {['Avatar', 'Name', 'Email', 'Role', 'Org Unit', 'Status', 'Last Login', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {USERS.map((u, i) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  {/* Avatar */}
                  <td className="px-4 py-3">
                    <Avatar name={u.name} index={i} />
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">{u.name}</td>

                  {/* Email */}
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${ROLE_STYLE[u.role]}`}>
                      {u.role}
                    </span>
                  </td>

                  {/* Org unit */}
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{u.orgUnit}</td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                      <span className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className={u.status === 'Active' ? 'text-green-700' : 'text-gray-500'}>
                        {u.status}
                      </span>
                    </span>
                  </td>

                  {/* Last login */}
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.lastLogin}</td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        title="Edit"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        title="Deactivate"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Ban size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
