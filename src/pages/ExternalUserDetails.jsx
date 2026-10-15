import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  UserRound,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  VenusAndMars,
  RefreshCw,
} from 'lucide-react'

export default function ExternalUserDetails() {
  const { id } = useParams()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadUser(signal) {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `https://dummyjson.com/users/${id}`,
        { signal },
      )

      if (!response.ok) {
        throw new Error('Пользователь не найден.')
      }

      const data = await response.json()

      if (!data.id || !data.firstName) {
        throw new Error('Получены некорректные данные.')
      }

      setUser(data)
    } catch (err) {
      if (err.name === 'AbortError') return

      setError(
        err.message || 'Не удалось загрузить данные пользователя.',
      )
      setUser(null)
    } finally {
      if (!signal.aborted) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    loadUser(controller.signal)

    return () => controller.abort()
  }, [id])

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <Link className="brand" to="/external-users">
          <div className="brand-icon">
            <UserRound size={24} />
          </div>
          <div>
            <h1>ContactHub</h1>
            <p>Информация о пользователе</p>
          </div>
        </Link>

        <Link className="secondary-button" to="/external-users">
          <ArrowLeft size={16} />
          К списку пользователей
        </Link>
      </header>

      <section className="contacts-section">
        {loading ? (
          <div className="empty-state">
            <RefreshCw size={30} />
            <h2>Загружаем данные...</h2>
            <p>Пожалуйста, подожди.</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <h2>Не удалось загрузить пользователя</h2>
            <p>{error}</p>
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                const controller = new AbortController()
                loadUser(controller.signal)
              }}
            >
              <RefreshCw size={16} />
              Попробовать снова
            </button>
          </div>
        ) : user ? (
          <article className="contact-card">
            <div className="contact-top">
              {user.image ? (
                <img
                  src={user.image}
                  alt={`${user.firstName} ${user.lastName}`}
                  width="88"
                  height="88"
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div className="avatar">
                  {user.firstName.charAt(0)}
                </div>
              )}
            </div>

            <p className="eyebrow">ВНЕШНИЙ ПОЛЬЗОВАТЕЛЬ</p>

            <h2>
              {user.firstName} {user.lastName}
            </h2>

            <span className="contact-tag">
              {user.company?.title || 'Пользователь'}
            </span>

            <div className="contact-details">
              <p>
                <Mail size={18} />
                <span>Email: {user.email || 'Не указан'}</span>
              </p>

              <p>
                <Phone size={18} />
                <span>Телефон: {user.phone || 'Не указан'}</span>
              </p>

              <p>
                <Calendar size={18} />
                <span>Возраст: {user.age ?? 'Не указан'}</span>
              </p>

              <p>
                <VenusAndMars size={18} />
                <span>Пол: {user.gender || 'Не указан'}</span>
              </p>

              <p>
                <MapPin size={18} />
                <span>
                  Адрес: {[
                    user.address?.address,
                    user.address?.city,
                    user.address?.state,
                    user.address?.country,
                  ].filter(Boolean).join(', ') || 'Не указан'}
                </span>
              </p>

              <p>
                <Building2 size={18} />
                <span>
                  Компания: {user.company?.name || 'Не указана'}
                </span>
              </p>

              <p>
                <UserRound size={18} />
                <span>
                  Должность: {user.company?.title || 'Не указана'}
                </span>
              </p>
            </div>
          </article>
        ) : null}
      </section>
    </main>
  )
}