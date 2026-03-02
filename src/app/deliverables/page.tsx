'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const DEL_STATUS_BADGE: Record<string, string> = {
  Pending: 'badge-pending', InProgress: 'badge-inprogress', Completed: 'badge-completed',
}
const STATUS_LABELS: Record<string, string> = {
  Pending: 'Pending', InProgress: 'In Progress', Completed: 'Completed',
}

export default function DeliverablesPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const searchParams = useSearchParams()
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState(searchParams.get('filter') === 'overdue' ? '' : '')
  const [filterUser, setFilterUser] = useState('')
  const [showOverdueOnly, setShowOverdueOnly] = useState(searchParams.get('filter') === 'overdue')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ sponsor_id: '', event_id: '', title: '', description: '', assigned_to_user_id: '', due_date: '', status: 'Pending' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [sponsors, setSponsors] = useState<any[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchDeliverables = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterUser) params.set('assigned_to', filterUser)
    const res = await fetch('/api/deliverables?' + params.toString())
    const data = await res.json()
    setDeliverables(Array.isArray(data) ? data : [])
  }, [filterStatus, filterUser])

  useEffect(() => {
    Promise.all([
      fetchDeliverables(),
      fetch('/api/events').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
      fetch('/api/sponsors').then(r => r.json()),
    ]).then(([, ev, us, sp]) => {
      setEvents(Array.isArray(ev) ? ev : [])
      setUsers(Array.isArray(us) ? us : [])
      setSponsors(Array.isArray(sp) ? sp : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [fetchDeliverables])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sponsor_id: form.sponsor_id || undefined }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      const newDel = await res.json()
      setDeliverables(prev => [newDel, ...prev])
      setShowModal(false)
      setForm({ sponsor_id: '', event_id: '', title: '', description: '', assigned_to_user_id: '', due_date: '', status: 'Pending' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    setUpdatingId(id)
    await fetch(`/api/deliverables/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    await fetchDeliverables()
    setUpdatingId(null)
  }

  if (loading) return <div className="empty-state"><div className="empty-state-icon">⏳</div><div className="empty-state-text">Loading deliverables...</div></div>

  const filteredDeliverables = showOverdueOnly
    ? deliverables.filter(d => d.isOverdue)
    : deliverables

  const overdueCount = deliverables.filter(d => d.isOverdue).length

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Deliverables</h1>
          <p className="page-subtitle">{filteredDeliverables.length} items{overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Deliverable</button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="InProgress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        {user?.role === 'FestHead' && (
          <select className="form-select" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
            <option value="">All Assignees</option>
            {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={showOverdueOnly} onChange={e => setShowOverdueOnly(e.target.checked)} />
          Overdue only {overdueCount > 0 && <span className="badge badge-overdue">{overdueCount}</span>}
        </label>
        {(filterStatus || filterUser || showOverdueOnly) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus(''); setFilterUser(''); setShowOverdueOnly(false); }}>Clear ✕</button>
        )}
      </div>

      {/* Status Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        {[
          { label: 'Total', value: deliverables.length, color: 'blue' },
          { label: 'Pending', value: deliverables.filter(d => d.status === 'Pending').length, color: '' },
          { label: 'In Progress', value: deliverables.filter(d => d.status === 'InProgress').length, color: 'amber' },
          { label: 'Completed', value: deliverables.filter(d => d.status === 'Completed').length, color: 'green' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`stat-card ${color}`} style={{ padding: '14px 16px' }}>
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Event</th>
              <th>Sponsor</th>
              <th>Assigned To</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeliverables.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-text">No deliverables found</div></div></td></tr>
            ) : filteredDeliverables.map((d: any) => (
              <tr key={d.id} style={{ background: d.isOverdue && d.status !== 'Completed' ? 'rgba(239,68,68,0.04)' : undefined }}>
                <td>
                  {d.title}
                  {d.description && <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: 2 }}>{d.description.slice(0, 60)}{d.description.length > 60 ? '...' : ''}</div>}
                </td>
                <td className="text-muted"><Link href={`/events/${d.event?.id}`}>{d.event?.event_name}</Link></td>
                <td className="text-muted">{d.sponsor ? <Link href={`/sponsors/${d.sponsor_id}`}>{d.sponsor.sponsor_name}</Link> : '—'}</td>
                <td className="text-muted">{d.assignedTo?.name}</td>
                <td>
                  <div style={{ fontWeight: d.isOverdue && d.status !== 'Completed' ? 600 : 400, color: d.isOverdue && d.status !== 'Completed' ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                    {new Date(d.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {d.isOverdue && d.status !== 'Completed' && <span className="badge badge-overdue" style={{ marginLeft: 6 }}>Overdue</span>}
                  </div>
                </td>
                <td><span className={`badge ${DEL_STATUS_BADGE[d.status]}`}>{STATUS_LABELS[d.status]}</span></td>
                <td>
                  <select
                    className="form-select"
                    style={{ padding: '4px 8px', fontSize: '0.78rem', width: 'auto', minWidth: 100 }}
                    value={d.status}
                    onChange={e => updateStatus(d.id, e.target.value)}
                    disabled={updatingId === d.id}
                  >
                    <option value="Pending">Pending</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Deliverable Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Deliverable</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Send branding kit to sponsor" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="More details..." />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Event *</label>
                    <select className="form-select" value={form.event_id} onChange={e => setForm(f => ({...f, event_id: e.target.value}))} required>
                      <option value="">Select Event</option>
                      {events.map((ev: any) => <option key={ev.id} value={ev.id}>{ev.event_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Linked Sponsor (optional)</label>
                    <select className="form-select" value={form.sponsor_id} onChange={e => setForm(f => ({...f, sponsor_id: e.target.value}))}>
                      <option value="">None</option>
                      {sponsors.filter(s => !form.event_id || s.linked_event_id === form.event_id).map((s: any) => <option key={s.id} value={s.id}>{s.sponsor_name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Assigned To *</label>
                    <select className="form-select" value={form.assigned_to_user_id} onChange={e => setForm(f => ({...f, assigned_to_user_id: e.target.value}))} required>
                      <option value="">Select User</option>
                      {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date *</label>
                    <input type="date" className="form-input" value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))} required />
                  </div>
                </div>
                {error && <div className="alert alert-error">{error}</div>}
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add Deliverable'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
