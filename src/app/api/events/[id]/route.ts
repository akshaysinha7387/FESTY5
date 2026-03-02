import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      eventHead: { select: { id: true, name: true, email: true } },
      fest: true,
      sponsors: {
        include: { owner: { select: { id: true, name: true } } },
      },
      deliverables: {
        include: { assignedTo: { select: { id: true, name: true } } },
      },
    },
  })

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Role check
  if (user.role === 'EventHead' && event.event_head_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (user.role === 'SponsorshipLead') {
    const hasSponsors = event.sponsors.some((s) => s.owner_id === user.id)
    if (!hasSponsors) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(event)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (user.role === 'SponsorshipLead') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (user.role === 'EventHead' && event.event_head_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const updated = await prisma.event.update({
    where: { id: params.id },
    data: {
      ...(body.event_name && { event_name: body.event_name }),
      ...(body.event_head_id && user.role === 'FestHead' && { event_head_id: body.event_head_id }),
      ...(body.sponsorship_target !== undefined && { sponsorship_target: Number(body.sponsorship_target) }),
      ...(body.status && { status: body.status }),
    },
    include: { eventHead: { select: { id: true, name: true } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'FestHead') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.event.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
