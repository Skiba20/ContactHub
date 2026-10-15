import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов.')
      return
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают.')
      return
    }

    setSaving(true)

    try {
      await register(name.trim(), email.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Не удалось зарегистрироваться.')
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

        <h1>Создай аккаунт</h1>
        <p className="auth-description">
          Зарегистрируйся, чтобы хранить свои контакты в одном месте.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Имя
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Как тебя зовут?"
              autoComplete="name"
              maxLength={100}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              maxLength={254}
              required
            />
          </label>

          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Минимум 8 символов"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
          </label>

          <label>
            Повтори пароль
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Введи пароль ещё раз"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button
            className="primary-button"
            type="submit"
            disabled={saving}
          >
            {saving ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="auth-switch">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </section>
    </main>
  )
}