import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fests = await prisma.fest.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(fests)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'FestHead') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { fest_name, prep_start_date, fest_start_date, fest_end_date, total_sponsorship_target } = body

  const fest = await prisma.fest.create({
    data: {
      fest_name,
      prep_start_date: new Date(prep_start_date),
      fest_start_date: new Date(fest_start_date),
      fest_end_date: new Date(fest_end_date),
      total_sponsorship_target: Number(total_sponsorship_target),
    },
  })

  return NextResponse.json(fest, { status: 201 })
}
