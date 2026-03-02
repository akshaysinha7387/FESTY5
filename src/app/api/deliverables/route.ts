import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const assignedTo = searchParams.get('assigned_to')
  const eventId = searchParams.get('event_id')

  const where: any = {}
  if (status) where.status = status
  if (assignedTo) where.assigned_to_user_id = assignedTo
  if (eventId) where.event_id = eventId

  if (user.role === 'SponsorshipLead') {
    const ownedSponsors = await prisma.sponsor.findMany({
      where: { owner_id: user.id },
      select: { id: true },
    })
    where.sponsor_id = { in: ownedSponsors.map((s) => s.id) }
  } else if (user.role === 'EventHead') {
    const userEvents = await prisma.event.findMany({
      where: { event_head_id: user.id },
      select: { id: true },
    })
    where.event_id = { in: userEvents.map((e) => e.id) }
  }

  const deliverables = await prisma.deliverable.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true } },
      event: { select: { id: true, event_name: true } },
      sponsor: { select: { id: true, sponsor_name: true } },
    },
    orderBy: { due_date: 'asc' },
  })

  const now = new Date()
  const withOverdue = deliverables.map((d) => ({
    ...d,
    isOverdue: d.status !== 'Completed' && d.due_date < now,
  }))

  return NextResponse.json(withOverdue)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const body = await req.json()
  const { sponsor_id, event_id, title, description, assigned_to_user_id, due_date, status } = body

  // SponsorshipLead can only add deliverables to their sponsors
  if (user.role === 'SponsorshipLead' && sponsor_id) {
    const sponsor = await prisma.sponsor.findUnique({ where: { id: sponsor_id } })
    if (!sponsor || sponsor.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  // EventHead can only add deliverables to their events
  if (user.role === 'EventHead') {
    const event = await prisma.event.findUnique({ where: { id: event_id } })
    if (!event || event.event_head_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const deliverable = await prisma.deliverable.create({
    data: {
      sponsor_id: sponsor_id || null,
      event_id,
      title,
      description: description || '',
      assigned_to_user_id,
      due_date: new Date(due_date),
      status: status || 'Pending',
    },
    include: {
      assignedTo: { select: { id: true, name: true } },
      event: { select: { id: true, event_name: true } },
    },
  })

  return NextResponse.json(deliverable, { status: 201 })
}
