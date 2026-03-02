import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any

  // Only Fest Head gets full dashboard
  const fest = await prisma.fest.findFirst({ orderBy: { createdAt: 'desc' } })
  if (!fest) return NextResponse.json({ error: 'No fest configured' }, { status: 404 })

  const allSponsors = await prisma.sponsor.findMany({
    include: { linkedEvent: { select: { id: true, event_name: true, fest_id: true } } },
  })

  // Filter to current fest sponsors
  const festSponsors = allSponsors.filter((s) => s.linkedEvent.fest_id === fest.id)

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const now = new Date()

  // Revenue calculations
  const closedRevenue = festSponsors
    .filter((s) => s.stage === 'ClosedWon')
    .reduce((sum, s) => sum + s.expected_amount, 0)

  const forecastRevenue = festSponsors.reduce(
    (sum, s) => sum + s.expected_amount * (s.probability_percentage / 100),
    0
  )

  // Pipeline breakdown
  const pipelineByStage: Record<string, { count: number; totalExpected: number }> = {}
  for (const s of festSponsors) {
    if (!pipelineByStage[s.stage]) pipelineByStage[s.stage] = { count: 0, totalExpected: 0 }
    pipelineByStage[s.stage].count++
    pipelineByStage[s.stage].totalExpected += s.expected_amount
  }

  // Sponsors needing update
  const needsUpdateSponsors = festSponsors
    .filter((s) => s.last_updated_at < sevenDaysAgo && s.stage !== 'ClosedWon' && s.stage !== 'ClosedLost')
    .map((s) => ({
      id: s.id,
      sponsor_name: s.sponsor_name,
      stage: s.stage,
      event_name: s.linkedEvent.event_name,
      last_updated_at: s.last_updated_at,
    }))

  // Event-wise progress
  const events = await prisma.event.findMany({
    where: { fest_id: fest.id },
    include: { eventHead: { select: { id: true, name: true } } },
  })

  const eventProgress = events.map((evt) => {
    const evtSponsors = festSponsors.filter((s) => s.linked_event_id === evt.id)
    const evtClosed = evtSponsors
      .filter((s) => s.stage === 'ClosedWon')
      .reduce((sum, s) => sum + s.expected_amount, 0)
    const evtForecast = evtSponsors.reduce(
      (sum, s) => sum + s.expected_amount * (s.probability_percentage / 100),
      0
    )
    return {
      id: evt.id,
      event_name: evt.event_name,
      event_head: evt.eventHead.name,
      sponsorship_target: evt.sponsorship_target,
      closed_revenue: evtClosed,
      forecast_revenue: evtForecast,
      sponsor_count: evtSponsors.length,
      status: evt.status,
    }
  })

  // Overdue deliverables
  const overdueDeliverables = await prisma.deliverable.findMany({
    where: {
      status: { not: 'Completed' },
      due_date: { lt: now },
      event: { fest_id: fest.id },
    },
    include: {
      assignedTo: { select: { id: true, name: true } },
      event: { select: { id: true, event_name: true } },
      sponsor: { select: { id: true, sponsor_name: true } },
    },
    orderBy: { due_date: 'asc' },
  })

  return NextResponse.json({
    fest,
    totalSponsorshipTarget: fest.total_sponsorship_target,
    closedRevenue,
    forecastRevenue,
    pipelineByStage,
    eventProgress,
    needsUpdateSponsors,
    overdueDeliverables,
    totalSponsors: festSponsors.length,
  })
}
