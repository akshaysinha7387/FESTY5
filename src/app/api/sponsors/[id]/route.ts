import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const sponsor = await prisma.sponsor.findUnique({
    where: { id: params.id },
    include: {
      linkedEvent: { select: { id: true, event_name: true, fest_id: true } },
      owner: { select: { id: true, name: true, email: true } },
      weeklyUpdates: {
        include: { updatedBy: { select: { id: true, name: true } } },
        orderBy: { created_at: 'desc' },
      },
      deliverables: {
        include: { assignedTo: { select: { id: true, name: true } } },
        orderBy: { due_date: 'asc' },
      },
    },
  })

  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Role access check
  if (user.role === 'SponsorshipLead' && sponsor.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (user.role === 'EventHead') {
    const event = await prisma.event.findUnique({ where: { id: sponsor.linked_event_id } })
    if (!event || event.event_head_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return NextResponse.json({
    ...sponsor,
    needsUpdate: sponsor.last_updated_at < sevenDaysAgo,
    forecastRevenue: sponsor.expected_amount * (sponsor.probability_percentage / 100),
  })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const existing = await prisma.sponsor.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (user.role === 'EventHead') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (user.role === 'SponsorshipLead' && existing.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  const updated = await prisma.sponsor.update({
    where: { id: params.id },
    data: {
      ...(body.sponsor_name && { sponsor_name: body.sponsor_name }),
      ...(body.expected_amount !== undefined && { expected_amount: Number(body.expected_amount) }),
      ...(body.probability_percentage !== undefined && { probability_percentage: Number(body.probability_percentage) }),
      ...(body.stage && { stage: body.stage }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.linked_event_id && user.role === 'FestHead' && { linked_event_id: body.linked_event_id }),
      ...(body.owner_id && user.role === 'FestHead' && { owner_id: body.owner_id }),
      last_updated_at: new Date(),
    },
    include: {
      linkedEvent: { select: { id: true, event_name: true } },
      owner: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'FestHead') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.sponsor.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
