
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const from = location.state?.from
  const returnTo =
    from && typeof from.pathname === 'string' &&
    from.pathname.startsWith('/') &&
    !from.pathname.startsWith('//')
      ? `${from.pathname}${from.search || ''}${from.hash || ''}`
      : '/dashboard'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      await login(email.trim(), password)
      navigate(returnTo, { replace: true })
    } catch (err) {
      setError(err.message || 'Не удалось войти')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-brand">
          ContactHub
        </Link>

        <h1>С возвращением!</h1>
        <p className="auth-description">
          Войди в аккаунт, чтобы открыть свои контакты.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Введи пароль"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button
            className="primary-button"
            type="submit"
            disabled={saving}
          >
            {saving ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <p className="auth-switch">
          Ещё нет аккаунта?{' '}
          <Link to="/register">Зарегистрироваться</Link>
        </p>
      </section>
    </main>
  )
}
