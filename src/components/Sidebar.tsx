'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

const navItems = [
  { href: '/dashboard', icon: '⬛', label: 'Dashboard', roles: ['FestHead', 'EventHead', 'SponsorshipLead'] },
  { href: '/events', icon: '📅', label: 'Events', roles: ['FestHead', 'EventHead', 'SponsorshipLead'] },
  { href: '/pipeline', icon: '🔀', label: 'Pipeline', roles: ['FestHead', 'EventHead', 'SponsorshipLead'] },
  { href: '/deliverables', icon: '✅', label: 'Deliverables', roles: ['FestHead', 'EventHead', 'SponsorshipLead'] },
]

const roleLabel: Record<string, string> = {
  FestHead: 'Fest Head',
  EventHead: 'Event Head',
  SponsorshipLead: 'Sponsorship Lead',
}

const roleColors: Record<string, string> = {
  FestHead: 'badge-festhead',
  EventHead: 'badge-eventhead',
  SponsorshipLead: 'badge-sponsorlead',
}

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user as any

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')
    : '?'

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-name">Festy5</div>
        <div className="logo-sub">Visibility Platform</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">Navigation</div>
        {navItems
          .filter((item) => !user || item.roles.includes(user.role))
          .map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div className="user-details">
            <div className="user-name">{user?.name || 'Loading...'}</div>
            <div className="user-role">
              <span className={`badge ${roleColors[user?.role] || ''}`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                {roleLabel[user?.role] || user?.role}
              </span>
            </div>
          </div>
          <button className="signout-btn" onClick={() => signOut({ callbackUrl: '/login' })} title="Sign out">
            ⇥
          </button>
        </div>
      </div>
    </aside>
  )
}
