import { useEffect, useState } from 'react'
import './App.css'

const SESSION_STORAGE_KEY = 'prodmag.admin.session'
const SESSION_TTL_MS = 30 * 60 * 1000

const ADMIN_CREDENTIALS = {
  email: 'admin@prodmag.local',
  password: 'password123',
  name: 'Store Admin',
}

function readStoredSession() {
  const rawSession = localStorage.getItem(SESSION_STORAGE_KEY)

  if (!rawSession) {
    return null
  }

  try {
    const session = JSON.parse(rawSession)

    if (!session?.expiresAt || Number(session.expiresAt) <= Date.now()) {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }

    return session
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

function createSession() {
  return {
    email: ADMIN_CREDENTIALS.email,
    name: ADMIN_CREDENTIALS.name,
    expiresAt: Date.now() + SESSION_TTL_MS,
  }
}

function formatRemainingTime(expiresAt) {
  const msLeft = Math.max(expiresAt - Date.now(), 0)
  const minutes = Math.floor(msLeft / 60000)
  const seconds = Math.floor((msLeft % 60000) / 1000)

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function App() {
  const [session, setSession] = useState(() => readStoredSession())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!session) {
      return undefined
    }

    const timeoutMs = Math.max(session.expiresAt - Date.now(), 0)
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)
    const timeoutId = window.setTimeout(() => {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      setSession(null)
      setPassword('')
      setErrorMessage('Session timed out. Sign in again to continue.')
    }, timeoutMs)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [session])
  const sessionExpiresIn = session ? formatRemainingTime(session.expiresAt) : null

  function handleSubmit(event) {
    event.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()

    if (
      normalizedEmail !== ADMIN_CREDENTIALS.email ||
      password !== ADMIN_CREDENTIALS.password
    ) {
      setErrorMessage('Invalid email or password.')
      return
    }

    const nextSession = createSession()
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    setErrorMessage('')
    setPassword('')
  }

  function handleSignOut() {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    setSession(null)
    setPassword('')
    setErrorMessage('')
  }

  if (session) {
    return (
      <main className="shell">
        <header className="app-header">
          <div className="brand-block">
            <p className="eyebrow">ProdMag administration</p>
            <strong className="brand-title">ProdMag Admin</strong>
          </div>

          <nav className="header-nav" aria-label="Primary navigation">
            <a href="/" aria-current="page">
              Dashboard
            </a>
            <a href="/">Catalog</a>
            <a href="/">Orders</a>
          </nav>

          <div className="profile-block">
            <div className="profile-copy">
              <strong>{session.name}</strong>
              <span>{session.email}</span>
            </div>
            <button className="secondary-button" type="button" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </header>

        <section className="hero-panel">
          <p className="eyebrow">PM-2</p>
          <h1>Administrator session is active.</h1>
          <p className="lede">
            The admin header now exposes primary navigation, current user identity,
            and a direct sign-out action.
          </p>
        </section>

        <section className="status-grid" aria-label="Session details">
          <article className="status-card">
            <span className="status-label">Signed in as</span>
            <strong>{session.name}</strong>
            <span>{session.email}</span>
          </article>
          <article className="status-card">
            <span className="status-label">Session timeout</span>
            <strong>{sessionExpiresIn}</strong>
            <span>Automatic logout after 30 minutes</span>
          </article>
        </section>
      </main>
    )
  }

  return (
    <main className="login-layout">
      <section className="login-copy">
        <p className="eyebrow">ProdMag administration</p>
        <h1>Store control starts with a secure sign-in.</h1>
        <p className="lede">
          Use the administrator account to access the back office. Invalid
          credentials stay blocked and the session expires automatically.
        </p>

        <div className="credentials-card" aria-label="Demo credentials">
          <span className="status-label">Demo access</span>
          <strong>{ADMIN_CREDENTIALS.email}</strong>
          <span>{ADMIN_CREDENTIALS.password}</span>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-heading">
            <p className="form-kicker">PM-1</p>
            <h2>Administrator sign in</h2>
          </div>

          <label className="field">
            <span>Email</span>
            <input
              autoComplete="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@prodmag.local"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
            />
          </label>

          {errorMessage ? (
            <p className="form-error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button className="primary-button" type="submit">
            Sign in
          </button>
        </form>
      </section>
    </main>
  )
}

export default App
