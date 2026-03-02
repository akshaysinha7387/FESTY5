'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

function fmt(n: number) {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

function pct(part: number, total: number) {
  if (!total) return 0
  return Math.min(100, Math.round((part / total) * 100))
}

const STAGE_LABELS: Record<string, string> = {
  Lead: 'Lead',
  Contacted: 'Contacted',
  InDiscussion: 'In Discussion',
  Negotiation: 'Negotiation',
  ClosedWon: 'Closed Won',
  ClosedLost: 'Closed Lost',
}

const STAGE_BADGE: Record<string, string> = {
  Lead: 'badge-lead',
  Contacted: 'badge-contacted',
  InDiscussion: 'badge-discussion',
  Negotiation: 'badge-negotiation',
  ClosedWon: 'badge-won',
  ClosedLost: 'badge-lost',
}

const STAGE_COLORS: Record<string, string> = {
  Lead: 'var(--stage-lead)',
  Contacted: 'var(--stage-contacted)',
  InDiscussion: 'var(--stage-discussion)',
  Negotiation: 'var(--stage-negotiation)',
  ClosedWon: 'var(--stage-won)',
  ClosedLost: 'var(--stage-lost)',
}

const EVENT_STATUS_BADGE: Record<string, string> = {
  Planning: 'badge-planning',
  Active: 'badge-active',
  Completed: 'badge-completed',
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { setError('Failed to load dashboard'); setLoading(false) })
  }, [])

  if (loading) return <div className="empty-state"><div className="empty-state-icon">⏳</div><div className="empty-state-text">Loading dashboard...</div></div>
  if (error) return <div className="alert alert-error">{error}</div>
  if (!data || data.error) return <div className="alert alert-warning">No fest data found. Please set up a fest first.</div>

  const targetPct = pct(data.closedRevenue, data.totalSponsorshipTarget)
  const forecastPct = pct(data.forecastRevenue, data.totalSponsorshipTarget)
  const stages = ['Lead', 'Contacted', 'InDiscussion', 'Negotiation', 'ClosedWon', 'ClosedLost']

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">{data.fest?.fest_name} — Sponsorship Overview</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-label">Sponsorship Target</div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>{fmt(data.totalSponsorshipTarget)}</div>
          <div className="stat-sub">Overall fest goal</div>
          <span className="stat-icon">🎯</span>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Closed Revenue</div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>{fmt(data.closedRevenue)}</div>
          <div className="stat-sub">
            <div className="progress-bar-container" style={{ marginBottom: 4 }}>
              <div className="progress-bar" style={{ width: `${targetPct}%`, background: 'var(--accent-green)' }} />
            </div>
            {targetPct}% of target achieved
          </div>
          <span className="stat-icon">💰</span>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Forecast Revenue</div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>{fmt(data.forecastRevenue)}</div>
          <div className="stat-sub">
            <div className="progress-bar-container" style={{ marginBottom: 4 }}>
              <div className="progress-bar" style={{ width: `${forecastPct}%`, background: 'var(--accent-amber)' }} />
            </div>
            {forecastPct}% of target (probability-weighted)
          </div>
          <span className="stat-icon">📈</span>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Total Sponsors</div>
          <div className="stat-value">{data.totalSponsors}</div>
          <div className="stat-sub">Across all events</div>
          <span className="stat-icon">🤝</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--accent-red)' }}>
          <div className="stat-label">Needs Update</div>
          <div className="stat-value" style={{ color: data.needsUpdateSponsors?.length > 0 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
            {data.needsUpdateSponsors?.length || 0}
          </div>
          <div className="stat-sub">Sponsors not updated in 7+ days</div>
          <span className="stat-icon">⚠️</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--accent-orange)' }}>
          <div className="stat-label">Overdue Deliverables</div>
          <div className="stat-value" style={{ color: data.overdueDeliverables?.length > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
            {data.overdueDeliverables?.length || 0}
          </div>
          <div className="stat-sub">Past due date, not completed</div>
          <span className="stat-icon">📌</span>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Pipeline Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Pipeline by Stage</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stages.map((stage) => {
              const stageData = data.pipelineByStage?.[stage] || { count: 0, totalExpected: 0 }
              return (
                <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: STAGE_COLORS[stage], flexShrink: 0 }} />
                  <span style={{ width: 120, fontSize: '0.82rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{STAGE_LABELS[stage]}</span>
                  <div className="progress-bar-container" style={{ flex: 1 }}>
                    <div className="progress-bar" style={{ width: `${pct(stageData.count, data.totalSponsors || 1)}%`, background: STAGE_COLORS[stage] }} />
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: 20, textAlign: 'right', flexShrink: 0 }}>{stageData.count}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', width: 90, textAlign: 'right', flexShrink: 0 }}>{fmt(stageData.totalExpected)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Event Progress */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Event-wise Sponsorship</h3>
            <Link href="/events" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Status</th>
                  <th className="text-right">Target</th>
                  <th className="text-right">Closed</th>
                  <th className="text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {data.eventProgress?.map((evt: any) => (
                  <tr key={evt.id}>
                    <td><Link href={`/events/${evt.id}`}>{evt.event_name}</Link></td>
                    <td><span className={`badge ${EVENT_STATUS_BADGE[evt.status]}`}>{evt.status}</span></td>
                    <td className="text-right">{fmt(evt.sponsorship_target)}</td>
                    <td className="text-right text-green">{fmt(evt.closed_revenue)}</td>
                    <td className="text-right text-muted">{pct(evt.closed_revenue, evt.sponsorship_target)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Needs Update */}
        <div className="card section">
          <div className="card-header">
            <h3 className="card-title">⚠️ Sponsors Needing Update</h3>
            <span className="badge badge-needs-update">{data.needsUpdateSponsors?.length || 0} sponsors</span>
          </div>
          {data.needsUpdateSponsors?.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-text">All sponsors are up to date</div>
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr><th>Sponsor</th><th>Stage</th><th>Event</th><th>Last Updated</th></tr>
                </thead>
                <tbody>
                  {data.needsUpdateSponsors?.map((s: any) => {
                    const days = Math.floor((Date.now() - new Date(s.last_updated_at).getTime()) / (1000 * 60 * 60 * 24))
                    return (
                      <tr key={s.id}>
                        <td><Link href={`/sponsors/${s.id}`}>{s.sponsor_name}</Link></td>
                        <td><span className={`badge ${STAGE_BADGE[s.stage]}`}>{STAGE_LABELS[s.stage]}</span></td>
                        <td className="text-muted">{s.event_name}</td>
                        <td><span className="badge badge-needs-update">{days}d ago</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Overdue Deliverables */}
        <div className="card section">
          <div className="card-header">
            <h3 className="card-title">📌 Overdue Deliverables</h3>
            <Link href="/deliverables?filter=overdue" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          {data.overdueDeliverables?.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-text">No overdue deliverables</div>
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr><th>Task</th><th>Event</th><th>Assigned To</th><th>Due Date</th></tr>
                </thead>
                <tbody>
                  {data.overdueDeliverables?.slice(0, 5).map((d: any) => (
                    <tr key={d.id}>
                      <td>{d.title}</td>
                      <td className="text-muted">{d.event?.event_name}</td>
                      <td className="text-muted">{d.assignedTo?.name}</td>
                      <td><span className="badge badge-overdue">{new Date(d.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
