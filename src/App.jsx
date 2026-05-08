import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom'
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

function AppShell({ children, session, onSignOut }) {
  return (
    <main className="shell">
      <header className="app-header">
        <div className="brand-block">
          <p className="eyebrow">ProdMag administration</p>
          <strong className="brand-title">ProdMag Admin</strong>
        </div>

        <nav className="header-nav" aria-label="Primary navigation">
          <Link to="/">Dashboard</Link>
          <Link to="/catalog">Catalog</Link>
          <Link to="/orders">Orders</Link>
        </nav>

        <div className="profile-block">
          <div className="profile-copy">
            <strong>{session.name}</strong>
            <span>{session.email}</span>
          </div>
          <button className="secondary-button" type="button" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>

      {children}
    </main>
  )
}

function DashboardPage() {
  return (
    <section className="hero-panel">
      <p className="eyebrow">PM-3</p>
      <h1>Administrator routes are protected.</h1>
      <p className="lede">
        Unauthenticated users are redirected to the login page before they can
        open any administration screen.
      </p>
    </section>
  )
}

function CatalogPage() {
  return (
    <section className="status-card page-card">
      <span className="status-label">Catalog</span>
      <strong>Protected catalog route</strong>
      <span>Only authenticated administrators can open this page.</span>
    </section>
  )
}

function OrdersPage() {
  return (
    <section className="status-card page-card">
      <span className="status-label">Orders</span>
      <strong>Protected orders route</strong>
      <span>Routing guard is active here as well.</span>
    </section>
  )
}

function LoginPage({ errorMessage, onSubmit }) {
  const location = useLocation()
  const redirectedFromGuard = location.state?.unauthorized === true
  const fromPath = location.state?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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
        <form
          className="login-form"
          onSubmit={(event) => onSubmit(event, { email, password, fromPath })}
        >
          <div className="form-heading">
            <p className="form-kicker">PM-1 / PM-3</p>
            <h2>Administrator sign in</h2>
          </div>

          {redirectedFromGuard ? (
            <p className="form-note" role="status">
              Sign in to continue to the requested administration page.
            </p>
          ) : null}

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

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [session, setSession] = useState(() => readStoredSession())
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
      setErrorMessage('Session timed out. Sign in again to continue.')
      navigate('/login', { replace: true })
    }, timeoutMs)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [navigate, session])

  useEffect(() => {
    if (session && location.pathname === '/login') {
      navigate('/', { replace: true })
    }
  }, [location.pathname, navigate, session])

  function handleSubmit(event, credentials) {
    event.preventDefault()

    const normalizedEmail = credentials.email.trim().toLowerCase()

    if (
      normalizedEmail !== ADMIN_CREDENTIALS.email ||
      credentials.password !== ADMIN_CREDENTIALS.password
    ) {
      setErrorMessage('Invalid email or password.')
      return
    }

    const nextSession = createSession()
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    setErrorMessage('')
    navigate(credentials.fromPath || '/', { replace: true })
  }

  function handleSignOut() {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    setSession(null)
    setErrorMessage('')
    navigate('/login', { replace: true })
  }

  if (location.pathname === '/login') {
    return <LoginPage errorMessage={errorMessage} onSubmit={handleSubmit} />
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ unauthorized: true, from: location }}
      />
    )
  }

  return (
    <AppShell
      session={session}
      onSignOut={handleSignOut}
    >
      {location.pathname === '/catalog' ? <CatalogPage /> : null}
      {location.pathname === '/orders' ? <OrdersPage /> : null}
      {location.pathname === '/' ? <DashboardPage /> : null}
      {!['/', '/catalog', '/orders'].includes(location.pathname) ? (
        <Navigate to="/" replace />
      ) : null}
    </AppShell>
  )
}

export default App
