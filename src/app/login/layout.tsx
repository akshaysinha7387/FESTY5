import type { Metadata } from 'next'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Login — Festy5',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}
