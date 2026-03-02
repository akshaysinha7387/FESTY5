import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sponsorId = searchParams.get('sponsor_id')
  if (!sponsorId) return NextResponse.json({ error: 'sponsor_id required' }, { status: 400 })

  const user = session.user as any

  // Role check - verify access to that sponsor
  const sponsor = await prisma.sponsor.findUnique({ where: { id: sponsorId } })
  if (!sponsor) return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })

  if (user.role === 'SponsorshipLead' && sponsor.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updates = await prisma.weeklyUpdate.findMany({
    where: { sponsor_id: sponsorId },
    include: { updatedBy: { select: { id: true, name: true } } },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json(updates)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const body = await req.json()
  const { sponsor_id, update_summary, blockers, next_steps } = body

  // Verify access to sponsor
  const sponsor = await prisma.sponsor.findUnique({ where: { id: sponsor_id } })
  if (!sponsor) return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })

  if (user.role === 'EventHead') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (user.role === 'SponsorshipLead' && sponsor.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const update = await prisma.weeklyUpdate.create({
    data: {
      sponsor_id,
      updated_by_user_id: user.id,
      update_summary,
      blockers: blockers || '',
      next_steps: next_steps || '',
    },
    include: { updatedBy: { select: { id: true, name: true } } },
  })

  // Also update sponsor's last_updated_at
  await prisma.sponsor.update({
    where: { id: sponsor_id },
    data: { last_updated_at: new Date() },
  })

  return NextResponse.json(update, { status: 201 })
}
