'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

function fmt(n: number) {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

const EVENT_STATUS_BADGE: Record<string, string> = {
  Planning: 'badge-planning',
  Active: 'badge-active',
  Completed: 'badge-completed',
}

const ROLE_BADGE: Record<string, string> = {
  FestHead: 'badge-festhead',
  EventHead: 'badge-eventhead',
  SponsorshipLead: 'badge-sponsorlead',
}

export default function EventsPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [events, setEvents] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [fests, setFests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ fest_id: '', event_name: '', event_head_id: '', sponsorship_target: '', status: 'Planning' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/events').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
      fetch('/api/fest').then(r => r.json()),
    ]).then(([ev, us, fs]) => {
      setEvents(Array.isArray(ev) ? ev : [])
      setUsers(Array.isArray(us) ? us : [])
      setFests(Array.isArray(fs) ? fs : [])
      if (Array.isArray(fs) && fs.length > 0) setForm(f => ({ ...f, fest_id: fs[0].id }))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sponsorship_target: Number(form.sponsorship_target) }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const newEvent = await res.json()
      setEvents(prev => [newEvent, ...prev])
      setShowModal(false)
      setForm({ fest_id: fests[0]?.id || '', event_name: '', event_head_id: '', sponsorship_target: '', status: 'Planning' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="empty-state"><div className="empty-state-icon">⏳</div><div className="empty-state-text">Loading events...</div></div>

  const eventHeads = users.filter(u => u.role === 'EventHead')

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">{events.length} events in this fest</p>
        </div>
        {user?.role === 'FestHead' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Event
          </button>
        )}
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Fest</th>
              <th>Event Head</th>
              <th>Status</th>
              <th className="text-right">Sponsorship Target</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">📅</div><div className="empty-state-text">No events yet</div></div></td></tr>
            ) : events.map((evt: any) => (
              <tr key={evt.id}>
                <td>
                  <Link href={`/events/${evt.id}`} style={{ fontWeight: 600 }}>{evt.event_name}</Link>
                </td>
                <td className="text-muted">{evt.fest?.fest_name}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {evt.eventHead?.name?.[0] || '?'}
                    </div>
                    {evt.eventHead?.name}
                  </div>
                </td>
                <td><span className={`badge ${EVENT_STATUS_BADGE[evt.status]}`}>{evt.status}</span></td>
                <td className="text-right">{fmt(evt.sponsorship_target)}</td>
                <td>
                  <Link href={`/events/${evt.id}`} className="btn btn-ghost btn-sm">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Event</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Event Name</label>
                  <input className="form-input" value={form.event_name} onChange={e => setForm(f => ({...f, event_name: e.target.value}))} placeholder="e.g. National Hackathon" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Event Head</label>
                  <select className="form-select" value={form.event_head_id} onChange={e => setForm(f => ({...f, event_head_id: e.target.value}))} required>
                    <option value="">Select Event Head</option>
                    {eventHeads.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Sponsorship Target (₹)</label>
                  <input type="number" className="form-input" value={form.sponsorship_target} onChange={e => setForm(f => ({...f, sponsorship_target: e.target.value}))} placeholder="500000" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                {error && <p className="error-msg">{error}</p>}
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Event'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
