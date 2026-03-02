import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  let events

  if (user.role === 'FestHead') {
    events = await prisma.event.findMany({
      include: { eventHead: { select: { id: true, name: true, email: true } }, fest: true },
      orderBy: { createdAt: 'desc' },
    })
  } else if (user.role === 'EventHead') {
    events = await prisma.event.findMany({
      where: { event_head_id: user.id },
      include: { eventHead: { select: { id: true, name: true, email: true } }, fest: true },
      orderBy: { createdAt: 'desc' },
    })
  } else {
    // SponsorshipLead - see events linked to their sponsors
    const sponsorEvents = await prisma.sponsor.findMany({
      where: { owner_id: user.id },
      select: { linked_event_id: true },
      distinct: ['linked_event_id'],
    })
    const eventIds = sponsorEvents.map((s) => s.linked_event_id)
    events = await prisma.event.findMany({
      where: { id: { in: eventIds } },
      include: { eventHead: { select: { id: true, name: true, email: true } }, fest: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'FestHead') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { fest_id, event_name, event_head_id, sponsorship_target, status } = body

  const event = await prisma.event.create({
    data: {
      fest_id,
      event_name,
      event_head_id,
      sponsorship_target: Number(sponsorship_target),
      status: status || 'Planning',
    },
    include: { eventHead: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json(event, { status: 201 })
}
