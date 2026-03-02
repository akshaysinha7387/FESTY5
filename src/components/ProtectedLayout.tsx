'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Providers from '@/components/Providers'

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <ProtectedLayout>{children}</ProtectedLayout>
    </Providers>
  )
}
