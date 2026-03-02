'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

function fmt(n: number) { return '₹' + Math.round(n).toLocaleString('en-IN') }

const STAGE_LABELS: Record<string, string> = {
  Lead: 'Lead', Contacted: 'Contacted', InDiscussion: 'In Discussion',
  Negotiation: 'Negotiation', ClosedWon: 'Closed Won', ClosedLost: 'Closed Lost',
}
const STAGE_BADGE: Record<string, string> = {
  Lead: 'badge-lead', Contacted: 'badge-contacted', InDiscussion: 'badge-discussion',
  Negotiation: 'badge-negotiation', ClosedWon: 'badge-won', ClosedLost: 'badge-lost',
}
const EVENT_STATUS_BADGE: Record<string, string> = {
  Planning: 'badge-planning', Active: 'badge-active', Completed: 'badge-completed',
}
const DEL_STATUS_BADGE: Record<string, string> = {
  Pending: 'badge-pending', InProgress: 'badge-inprogress', Completed: 'badge-completed',
}

export default function EventDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const user = session?.user as any
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetch(`/api/events/${params.id}`)
        .then(r => r.json())
        .then(d => { setEvent(d); setLoading(false) })
        .catch(() => setLoading(false))
    }
  }, [params.id])

  if (loading) return <div className="empty-state"><div className="empty-state-icon">⏳</div><div className="empty-state-text">Loading event...</div></div>
  if (!event || event.error) return <div className="alert alert-error">Event not found or access denied.</div>

  const now = new Date()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const closedRevenue = event.sponsors?.filter((s: any) => s.stage === 'ClosedWon').reduce((sum: number, s: any) => sum + s.expected_amount, 0) || 0
  const forecastRevenue = event.sponsors?.reduce((sum: number, s: any) => sum + s.expected_amount * (s.probability_percentage / 100), 0) || 0

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Link href="/events" className="text-muted" style={{ fontSize: '0.8rem' }}>← Events</Link>
          </div>
          <h1 className="page-title">{event.event_name}</h1>
          <p className="page-subtitle">{event.fest?.fest_name}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className={`badge ${EVENT_STATUS_BADGE[event.status]}`}>{event.status}</span>
        </div>
      </div>

      {/* Event Meta */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="stat-card blue">
          <div className="stat-label">Sponsorship Target</div>
          <div className="stat-value" style={{ fontSize: '1.2rem' }}>{fmt(event.sponsorship_target)}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Closed Revenue</div>
          <div className="stat-value" style={{ fontSize: '1.2rem' }}>{fmt(closedRevenue)}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Forecast Revenue</div>
          <div className="stat-value" style={{ fontSize: '1.2rem' }}>{fmt(forecastRevenue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Event Head</div>
          <div className="stat-value" style={{ fontSize: '1rem' }}>{event.eventHead?.name}</div>
          <div className="stat-sub">{event.eventHead?.email}</div>
        </div>
      </div>

      {/* Sponsors */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Linked Sponsors ({event.sponsors?.length || 0})</h2>
          {(user?.role === 'FestHead' || user?.role === 'SponsorshipLead') && (
            <Link href={`/pipeline?event_id=${event.id}`} className="btn btn-secondary btn-sm">View in Pipeline</Link>
          )}
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Sponsor</th>
                <th>Stage</th>
                <th>Owner</th>
                <th className="text-right">Expected</th>
                <th className="text-right">Probability</th>
                <th className="text-right">Forecast</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {!event.sponsors?.length ? (
                <tr><td colSpan={7}><div className="empty-state" style={{padding:'16px 0'}}><div className="empty-state-text">No sponsors linked yet</div></div></td></tr>
              ) : event.sponsors?.map((s: any) => {
                const needsUpdate = new Date(s.last_updated_at) < sevenDaysAgo && s.stage !== 'ClosedWon' && s.stage !== 'ClosedLost'
                const daysAgo = Math.floor((Date.now() - new Date(s.last_updated_at).getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <tr key={s.id}>
                    <td><Link href={`/sponsors/${s.id}`}>{s.sponsor_name}</Link></td>
                    <td><span className={`badge ${STAGE_BADGE[s.stage]}`}>{STAGE_LABELS[s.stage]}</span></td>
                    <td className="text-muted">{s.owner?.name}</td>
                    <td className="text-right">{fmt(s.expected_amount)}</td>
                    <td className="text-right">{s.probability_percentage}%</td>
                    <td className="text-right text-amber">{fmt(s.expected_amount * s.probability_percentage / 100)}</td>
                    <td>
                      {needsUpdate 
                        ? <span className="badge badge-needs-update">{daysAgo}d ago</span>
                        : <span className="text-muted" style={{fontSize:'0.78rem'}}>{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deliverables */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Deliverables ({event.deliverables?.length || 0})</h2>
          <Link href="/deliverables" className="btn btn-ghost btn-sm">Manage →</Link>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Title</th><th>Sponsor</th><th>Assigned To</th><th>Due Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {!event.deliverables?.length ? (
                <tr><td colSpan={5}><div className="empty-state" style={{padding:'16px 0'}}><div className="empty-state-text">No deliverables yet</div></div></td></tr>
              ) : event.deliverables?.map((d: any) => {
                const isOverdue = d.status !== 'Completed' && new Date(d.due_date) < now
                return (
                  <tr key={d.id}>
                    <td>{d.title}</td>
                    <td className="text-muted">{d.sponsor?.sponsor_name || '—'}</td>
                    <td className="text-muted">{d.assignedTo?.name}</td>
                    <td>{isOverdue ? <span className="badge badge-overdue">{new Date(d.due_date).toLocaleDateString('en-IN', {day:'numeric',month:'short'})}</span> : <span className="text-muted" style={{fontSize:'0.8rem'}}>{new Date(d.due_date).toLocaleDateString('en-IN', {day:'numeric',month:'short'})}</span>}</td>
                    <td><span className={`badge ${DEL_STATUS_BADGE[d.status]}`}>{d.status}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
