import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function requireRole(...roles: string[]) {
  const session = await requireAuth()
  if (!roles.includes(session.user.role)) throw new Error('Forbidden')
  return session
}
