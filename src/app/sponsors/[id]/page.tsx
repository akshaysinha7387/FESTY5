'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

function fmt(n: number) { return '₹' + Math.round(n).toLocaleString('en-IN') }

const STAGES = ['Lead', 'Contacted', 'InDiscussion', 'Negotiation', 'ClosedWon', 'ClosedLost']
const STAGE_LABELS: Record<string, string> = {
  Lead: 'Lead', Contacted: 'Contacted', InDiscussion: 'In Discussion',
  Negotiation: 'Negotiation', ClosedWon: 'Closed Won', ClosedLost: 'Closed Lost',
}
const STAGE_BADGE: Record<string, string> = {
  Lead: 'badge-lead', Contacted: 'badge-contacted', InDiscussion: 'badge-discussion',
  Negotiation: 'badge-negotiation', ClosedWon: 'badge-won', ClosedLost: 'badge-lost',
}
const DEL_STATUS_BADGE: Record<string, string> = {
  Pending: 'badge-pending', InProgress: 'badge-inprogress', Completed: 'badge-completed',
}

export default function SponsorDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const user = session?.user as any
  const [sponsor, setSponsor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updateForm, setUpdateForm] = useState({ update_summary: '', blockers: '', next_steps: '' })
  const [addingUpdate, setAddingUpdate] = useState(false)

  async function loadSponsor() {
    const res = await fetch(`/api/sponsors/${params.id}`)
    const d = await res.json()
    setSponsor(d)
    setEditForm({
      sponsor_name: d.sponsor_name,
      expected_amount: d.expected_amount,
      probability_percentage: d.probability_percentage,
      stage: d.stage,
      notes: d.notes,
    })
    setLoading(false)
  }

  useEffect(() => { if (params.id) loadSponsor() }, [params.id])

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/sponsors/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    await loadSponsor()
    setEditing(false)
    setSaving(false)
  }

  async function handleAddUpdate(e: React.FormEvent) {
    e.preventDefault()
    setAddingUpdate(true)
    await fetch('/api/weekly-updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sponsor_id: params.id, ...updateForm }),
    })
    setUpdateForm({ update_summary: '', blockers: '', next_steps: '' })
    setShowUpdateModal(false)
    await loadSponsor()
    setAddingUpdate(false)
  }

  if (loading) return <div className="empty-state"><div className="empty-state-icon">⏳</div><div className="empty-state-text">Loading sponsor...</div></div>
  if (!sponsor || sponsor.error) return <div className="alert alert-error">Sponsor not found or access denied.</div>

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const needsUpdate = new Date(sponsor.last_updated_at) < sevenDaysAgo && sponsor.stage !== 'ClosedWon' && sponsor.stage !== 'ClosedLost'
  const daysAgo = Math.floor((Date.now() - new Date(sponsor.last_updated_at).getTime()) / (1000 * 60 * 60 * 24))
  const now = new Date()
  const canEdit = user?.role === 'FestHead' || (user?.role === 'SponsorshipLead' && sponsor.owner_id === user?.id)

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Link href="/pipeline" className="text-muted" style={{ fontSize: '0.8rem' }}>← Pipeline</Link>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>·</span>
            <Link href={`/events/${sponsor.linked_event_id}`} className="text-muted" style={{ fontSize: '0.8rem' }}>{sponsor.linkedEvent?.event_name}</Link>
          </div>
          <h1 className="page-title">{sponsor.sponsor_name}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
            <span className={`badge ${STAGE_BADGE[sponsor.stage]}`}>{STAGE_LABELS[sponsor.stage]}</span>
            {needsUpdate && <span className="badge badge-needs-update">⚠ Needs Update ({daysAgo}d ago)</span>}
          </div>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8 }}>
            {editing ? (
              <>
                <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit Sponsor</button>
            )}
          </div>
        )}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Sponsor Info / Edit */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">Sponsor Info</h3></div>
          {editing ? (
            <div>
              <div className="form-group">
                <label className="form-label">Sponsor Name</label>
                <input className="form-input" value={editForm.sponsor_name} onChange={e => setEditForm((f: any) => ({...f, sponsor_name: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Stage</label>
                <select className="form-select" value={editForm.stage} onChange={e => setEditForm((f: any) => ({...f, stage: e.target.value}))}>
                  {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Expected Amount (₹)</label>
                  <input type="number" className="form-input" value={editForm.expected_amount} onChange={e => setEditForm((f: any) => ({...f, expected_amount: Number(e.target.value)}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Probability %</label>
                  <input type="number" min="0" max="100" className="form-input" value={editForm.probability_percentage} onChange={e => setEditForm((f: any) => ({...f, probability_percentage: Number(e.target.value)}))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={editForm.notes} onChange={e => setEditForm((f: any) => ({...f, notes: e.target.value}))} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Event', value: sponsor.linkedEvent?.event_name },
                { label: 'Owner', value: sponsor.owner?.name },
                { label: 'Expected Amount', value: fmt(sponsor.expected_amount) },
                { label: 'Probability', value: `${sponsor.probability_percentage}%` },
                { label: 'Forecast Revenue', value: <strong className="text-amber">{fmt(sponsor.forecastRevenue)}</strong> },
                { label: 'Last Updated', value: daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo>1?'s':''} ago` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>{label}</span>
                  <span style={{ fontSize: '0.875rem' }}>{value}</span>
                </div>
              ))}
              {sponsor.notes && (
                <div>
                  <div className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Notes</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{sponsor.notes}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Deliverables */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Deliverables ({sponsor.deliverables?.length || 0})</h3>
          </div>
          {!sponsor.deliverables?.length ? (
            <div className="empty-state" style={{ padding: '20px 0' }}><div className="empty-state-text">No deliverables linked</div></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sponsor.deliverables?.map((d: any) => {
                const isOverdue = d.status !== 'Completed' && new Date(d.due_date) < now
                return (
                  <div key={d.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{d.title}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: 2 }}>{d.assignedTo?.name} · Due {new Date(d.due_date).toLocaleDateString('en-IN', {day:'numeric',month:'short'})}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {isOverdue && <span className="badge badge-overdue">Overdue</span>}
                      <span className={`badge ${DEL_STATUS_BADGE[d.status]}`}>{d.status}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Weekly Updates */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Weekly Updates ({sponsor.weeklyUpdates?.length || 0})</h2>
          {(user?.role === 'FestHead' || (user?.role === 'SponsorshipLead' && sponsor.owner_id === user?.id)) && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowUpdateModal(true)}>+ Log Update</button>
          )}
        </div>

        {!sponsor.weeklyUpdates?.length ? (
          <div className="empty-state"><div className="empty-state-icon">📝</div><div className="empty-state-text">No updates logged yet</div></div>
        ) : (
          <div className="update-list">
            {sponsor.weeklyUpdates?.map((u: any) => (
              <div key={u.id} className="update-item">
                <div className="update-meta">
                  by <strong>{u.updatedBy?.name}</strong> · {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div className="update-summary">{u.update_summary}</div>
                {u.blockers && <div className="update-detail"><strong>🚧 Blockers</strong>{u.blockers}</div>}
                {u.next_steps && <div className="update-detail"><strong>▶ Next Steps</strong>{u.next_steps}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Update Modal */}
      {showUpdateModal && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Log Weekly Update</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowUpdateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddUpdate}>
                <div className="form-group">
                  <label className="form-label">Update Summary *</label>
                  <textarea className="form-textarea" value={updateForm.update_summary} onChange={e => setUpdateForm(f => ({...f, update_summary: e.target.value}))} placeholder="What happened this week? Key progress made..." required style={{ minHeight: 100 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Blockers (if any)</label>
                  <textarea className="form-textarea" value={updateForm.blockers} onChange={e => setUpdateForm(f => ({...f, blockers: e.target.value}))} placeholder="Anything blocking progress?" />
                </div>
                <div className="form-group">
                  <label className="form-label">Next Steps</label>
                  <textarea className="form-textarea" value={updateForm.next_steps} onChange={e => setUpdateForm(f => ({...f, next_steps: e.target.value}))} placeholder="What's planned for next week?" />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowUpdateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={addingUpdate}>{addingUpdate ? 'Logging...' : 'Log Update'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
