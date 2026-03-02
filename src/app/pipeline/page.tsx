'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

function fmt(n: number) { return '₹' + Math.round(n).toLocaleString('en-IN') }

const STAGES = ['Lead', 'Contacted', 'InDiscussion', 'Negotiation', 'ClosedWon', 'ClosedLost']
const STAGE_LABELS: Record<string, string> = {
  Lead: 'Lead', Contacted: 'Contacted', InDiscussion: 'In Discussion',
  Negotiation: 'Negotiation', ClosedWon: 'Closed Won', ClosedLost: 'Closed Lost',
}
const STAGE_COLORS: Record<string, string> = {
  Lead: 'var(--stage-lead)', Contacted: 'var(--stage-contacted)', InDiscussion: 'var(--stage-discussion)',
  Negotiation: 'var(--stage-negotiation)', ClosedWon: 'var(--stage-won)', ClosedLost: 'var(--stage-lost)',
}
const STAGE_BADGE: Record<string, string> = {
  Lead: 'badge-lead', Contacted: 'badge-contacted', InDiscussion: 'badge-discussion',
  Negotiation: 'badge-negotiation', ClosedWon: 'badge-won', ClosedLost: 'badge-lost',
}

export default function PipelinePage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const router = useRouter()
  const [sponsors, setSponsors] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEvent, setFilterEvent] = useState('')
  const [filterOwner, setFilterOwner] = useState('')
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ sponsor_name: '', linked_event_id: '', owner_id: '', expected_amount: '', probability_percentage: '50', stage: 'Lead', notes: '' })
  const [addError, setAddError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchSponsors = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterEvent) params.set('event_id', filterEvent)
    if (filterOwner) params.set('owner_id', filterOwner)
    const res = await fetch('/api/sponsors?' + params.toString())
    const data = await res.json()
    setSponsors(Array.isArray(data) ? data : [])
  }, [filterEvent, filterOwner])

  useEffect(() => {
    Promise.all([
      fetchSponsors(),
      fetch('/api/events').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([, ev, us]) => {
      setEvents(Array.isArray(ev) ? ev : [])
      setUsers(Array.isArray(us) ? us : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [fetchSponsors])

  async function handleAddSponsor(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setAddError('')
    try {
      const res = await fetch('/api/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addForm, expected_amount: Number(addForm.expected_amount), probability_percentage: Number(addForm.probability_percentage) }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to create sponsor'); }
      const newSponsor = await res.json()
      setSponsors(prev => [newSponsor, ...prev])
      setShowAddModal(false)
      setAddForm({ sponsor_name: '', linked_event_id: '', owner_id: '', expected_amount: '', probability_percentage: '50', stage: 'Lead', notes: '' })
    } catch (err: any) {
      setAddError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="empty-state"><div className="empty-state-icon">⏳</div><div className="empty-state-text">Loading pipeline...</div></div>

  const sponsorLeads = users.filter(u => u.role === 'SponsorshipLead')
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Sponsorship Pipeline</h1>
          <p className="page-subtitle">{sponsors.length} sponsor{sponsors.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button className={`btn btn-ghost btn-sm ${viewMode === 'board' ? 'active' : ''}`} style={{ borderRadius: 0, ...(viewMode === 'board' ? {background:'var(--accent-blue)',color:'white'} : {}) }} onClick={() => setViewMode('board')}>Board</button>
            <button className={`btn btn-ghost btn-sm ${viewMode === 'table' ? 'active' : ''}`} style={{ borderRadius: 0, ...(viewMode === 'table' ? {background:'var(--accent-blue)',color:'white'} : {}) }} onClick={() => setViewMode('table')}>Table</button>
          </div>
          {(user?.role === 'FestHead' || user?.role === 'SponsorshipLead') && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add Sponsor</button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select className="form-select" value={filterEvent} onChange={e => setFilterEvent(e.target.value)}>
          <option value="">All Events</option>
          {events.map((evt: any) => <option key={evt.id} value={evt.id}>{evt.event_name}</option>)}
        </select>
        {user?.role === 'FestHead' && (
          <select className="form-select" value={filterOwner} onChange={e => setFilterOwner(e.target.value)}>
            <option value="">All Owners</option>
            {sponsorLeads.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        {(filterEvent || filterOwner) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterEvent(''); setFilterOwner(''); }}>Clear Filters ✕</button>
        )}
      </div>

      {/* BOARD VIEW */}
      {viewMode === 'board' && (
        <div className="pipeline-grid">
          {STAGES.map(stage => {
            const stageSponsors = sponsors.filter(s => s.stage === stage)
            return (
              <div key={stage} className="pipeline-col">
                <div className="pipeline-col-header">
                  <span className="pipeline-col-title" style={{ color: STAGE_COLORS[stage] }}>{STAGE_LABELS[stage]}</span>
                  <span className="pipeline-col-count">{stageSponsors.length}</span>
                </div>
                {stageSponsors.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Empty</div>
                ) : stageSponsors.map((s: any) => {
                  const needsUpdate = new Date(s.last_updated_at) < sevenDaysAgo && s.stage !== 'ClosedWon' && s.stage !== 'ClosedLost'
                  return (
                    <Link href={`/sponsors/${s.id}`} key={s.id} style={{ textDecoration: 'none' }}>
                      <div className="pipeline-card">
                        <div className="pipeline-card-name">{s.sponsor_name}</div>
                        <div className="pipeline-card-meta">{s.linkedEvent?.event_name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                          <span className="pipeline-card-amount">{fmt(s.expected_amount)}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.probability_percentage}%</span>
                        </div>
                        {needsUpdate && <div style={{ marginTop: 6 }}><span className="badge badge-needs-update" style={{ fontSize: '0.65rem' }}>Needs Update</span></div>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Sponsor</th>
                <th>Stage</th>
                <th>Event</th>
                <th>Owner</th>
                <th className="text-right">Expected</th>
                <th className="text-right">Probability</th>
                <th className="text-right">Forecast</th>
                <th>Last Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sponsors.length === 0 ? (
                <tr><td colSpan={9}><div className="empty-state"><div className="empty-state-icon">🤝</div><div className="empty-state-text">No sponsors found</div></div></td></tr>
              ) : sponsors.map((s: any) => {
                const needsUpdate = new Date(s.last_updated_at) < sevenDaysAgo && s.stage !== 'ClosedWon' && s.stage !== 'ClosedLost'
                const daysAgo = Math.floor((Date.now() - new Date(s.last_updated_at).getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <tr key={s.id}>
                    <td><Link href={`/sponsors/${s.id}`}>{s.sponsor_name}</Link></td>
                    <td><span className={`badge ${STAGE_BADGE[s.stage]}`}>{STAGE_LABELS[s.stage]}</span></td>
                    <td className="text-muted">{s.linkedEvent?.event_name}</td>
                    <td className="text-muted">{s.owner?.name}</td>
                    <td className="text-right">{fmt(s.expected_amount)}</td>
                    <td className="text-right">{s.probability_percentage}%</td>
                    <td className="text-right text-amber">{fmt(s.forecastRevenue)}</td>
                    <td>{needsUpdate ? <span className="badge badge-needs-update">{daysAgo}d ago</span> : <span className="text-muted" style={{fontSize:'0.78rem'}}>{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</span>}</td>
                    <td><Link href={`/sponsors/${s.id}`} className="btn btn-ghost btn-sm">View →</Link></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Sponsor Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Sponsor</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddSponsor}>
                <div className="form-group">
                  <label className="form-label">Sponsor Name</label>
                  <input className="form-input" value={addForm.sponsor_name} onChange={e => setAddForm(f => ({...f, sponsor_name: e.target.value}))} placeholder="e.g. Google India" required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Linked Event</label>
                    <select className="form-select" value={addForm.linked_event_id} onChange={e => setAddForm(f => ({...f, linked_event_id: e.target.value}))} required>
                      <option value="">Select Event</option>
                      {events.map((ev: any) => <option key={ev.id} value={ev.id}>{ev.event_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Owner</label>
                    <select className="form-select" value={addForm.owner_id} onChange={e => setAddForm(f => ({...f, owner_id: e.target.value}))}>
                      <option value="">Assign to me</option>
                      {sponsorLeads.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Expected Amount (₹)</label>
                    <input type="number" className="form-input" value={addForm.expected_amount} onChange={e => setAddForm(f => ({...f, expected_amount: e.target.value}))} placeholder="100000" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Probability % (0–100)</label>
                    <input type="number" min="0" max="100" className="form-input" value={addForm.probability_percentage} onChange={e => setAddForm(f => ({...f, probability_percentage: e.target.value}))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Stage</label>
                  <select className="form-select" value={addForm.stage} onChange={e => setAddForm(f => ({...f, stage: e.target.value}))}>
                    {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={addForm.notes} onChange={e => setAddForm(f => ({...f, notes: e.target.value}))} placeholder="Key context, contact info, etc." />
                </div>
                {addError && <div className="alert alert-error">{addError}</div>}
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add Sponsor'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
