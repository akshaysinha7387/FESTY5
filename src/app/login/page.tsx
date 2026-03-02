'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-name">Festy5</div>
          <div className="logo-tagline">Visibility &amp; Accountability Platform</div>
        </div>

        <h2 className="login-title">Sign in to your account</h2>
        <p className="login-sub">Enter your credentials to access the platform</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Email address</label>
            <input
              id="email-input"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@techfest.edu"
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Password</label>
            <input
              id="password-input"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '18px', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: '24px', padding: '14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo Credentials</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { label: 'Fest Head', email: 'arjun@techfest.edu', pass: 'festhead123' },
              { label: 'Event Head', email: 'priya@techfest.edu', pass: 'eventhead123' },
              { label: 'Spons. Lead', email: 'kavya@techfest.edu', pass: 'sponsorlead123' },
            ].map((u) => (
              <button
                key={u.email}
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '4px 0', display: 'flex', gap: '8px', alignItems: 'center' }}
                onClick={() => { setEmail(u.email); setPassword(u.pass); }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', fontWeight: 600, width: '80px' }}>{u.label}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{u.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
