import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event_id')
  const ownerId = searchParams.get('owner_id')

  const where: any = {}
  if (eventId) where.linked_event_id = eventId
  if (ownerId) where.owner_id = ownerId

  // Role-based filtering
  if (user.role === 'SponsorshipLead') {
    where.owner_id = user.id
  } else if (user.role === 'EventHead') {
    const userEvents = await prisma.event.findMany({
      where: { event_head_id: user.id },
      select: { id: true },
    })
    const eventIds = userEvents.map((e) => e.id)
    where.linked_event_id = { in: eventIds }
  }

  const sponsors = await prisma.sponsor.findMany({
    where,
    include: {
      linkedEvent: { select: { id: true, event_name: true, fest_id: true } },
      owner: { select: { id: true, name: true } },
    },
    orderBy: { last_updated_at: 'asc' },
  })

  // Add "needsUpdate" flag: last_updated_at > 7 days ago
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const sponsorsWithFlags = sponsors.map((s) => ({
    ...s,
    needsUpdate: s.last_updated_at < sevenDaysAgo,
    forecastRevenue: s.expected_amount * (s.probability_percentage / 100),
  }))

  return NextResponse.json(sponsorsWithFlags)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  if (user.role === 'EventHead') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { sponsor_name, linked_event_id, owner_id, expected_amount, probability_percentage, stage, notes } = body

  // Check for duplicate sponsor name within same fest
  const event = await prisma.event.findUnique({ where: { id: linked_event_id } })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const existingSponsors = await prisma.sponsor.findMany({
    where: {
      linkedEvent: { fest_id: event.fest_id },
      sponsor_name: { equals: sponsor_name, mode: 'insensitive' },
    },
  })

  if (existingSponsors.length > 0) {
    return NextResponse.json(
      { error: `Sponsor "${sponsor_name}" already exists in this fest` },
      { status: 409 }
    )
  }

  const sponsor = await prisma.sponsor.create({
    data: {
      sponsor_name,
      linked_event_id,
      owner_id: owner_id || user.id,
      expected_amount: Number(expected_amount),
      probability_percentage: Number(probability_percentage ?? 50),
      stage: stage || 'Lead',
      notes: notes || '',
      last_updated_at: new Date(),
    },
    include: {
      linkedEvent: { select: { id: true, event_name: true } },
      owner: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(sponsor, { status: 201 })
}
