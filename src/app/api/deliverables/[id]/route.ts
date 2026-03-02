import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const body = await req.json()

  const existing = await prisma.deliverable.findUnique({
    where: { id: params.id },
    include: { sponsor: true, event: true },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Access control
  if (user.role === 'SponsorshipLead' && existing.sponsor?.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (user.role === 'EventHead' && existing.event.event_head_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.deliverable.update({
    where: { id: params.id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status && { status: body.status }),
      ...(body.due_date && { due_date: new Date(body.due_date) }),
      ...(body.assigned_to_user_id && { assigned_to_user_id: body.assigned_to_user_id }),
    },
    include: {
      assignedTo: { select: { id: true, name: true } },
      event: { select: { id: true, event_name: true } },
      sponsor: { select: { id: true, sponsor_name: true } },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'FestHead') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.deliverable.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
