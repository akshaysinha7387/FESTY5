import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Festy5 — Fest Visibility Platform',
  description: 'Centralized visibility and accountability system for college fest preparation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
