import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  UserRound,
  BriefcaseBusiness,
} from 'lucide-react'

const API_URL = import.meta.env.DEV
  ? 'http://localhost:3001/api/contacts'
  : '/api/contacts'

export default function ContactDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [contact, setContact] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadContact() {
      setLoading(true)
      setError('')
      setContact(null)

      try {
        const response = await fetch(`${API_URL}/${id}`, {
          credentials: 'include',
        })

        const data = await response.json().catch(() => ({}))

        if (response.status === 401) {
          navigate('/login', { replace: true })
          return
        }

        if (response.status === 404) {
          throw new Error('Контакт не найден.')
        }

        if (!response.ok) {
          throw new Error(
            data.message || 'Не удалось загрузить контакт.',
          )
        }

        if (!cancelled) {
          setContact(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Не удалось загрузить контакт.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadContact()

    return () => {
      cancelled = true
    }
  }, [id, navigate])

  if (loading) {
    return (
      <main className="dashboard">
        <div className="detail-loading">
          Загружаем контакт...
        </div>
      </main>
    )
  }

  if (error || !contact) {
    return (
      <main className="dashboard">
        <div className="detail-container">
          <Link className="secondary-button" to="/dashboard">
            <ArrowLeft size={16} />
            Назад к контактам
          </Link>

          <div className="empty-state detail-error">
            <UserRound size={38} />
            <h2>{error || 'Контакт не найден.'}</h2>
            <p>
              Возможно, контакт удалён или у тебя нет доступа к нему.
            </p>
            <Link className="primary-button" to="/dashboard">
              Вернуться к контактам
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="dashboard detail-page">
      <header className="dashboard-header">
        <Link className="brand" to="/dashboard">
          <div className="brand-icon">
            <UsersIcon />
          </div>
          <div>
            <h1>ContactHub</h1>
            <p>Карточка контакта</p>
          </div>
        </Link>

        <Link className="secondary-button" to="/dashboard">
          <ArrowLeft size={16} />
          Назад к контактам
        </Link>
      </header>

      <div className="detail-container">
        <p className="eyebrow detail-eyebrow">
          ТВОЯ АДРЕСНАЯ КНИГА
        </p>

        <h2 className="detail-page-title">
          Информация о контакте
        </h2>

        <p className="detail-page-description">
          Все данные о человеке в одном месте.
        </p>

        <article className="detail-contact-card">
          <div className="detail-contact-top">
            <div className="detail-avatar">
              {contact.name?.charAt(0).toUpperCase() || '?'}
            </div>

            <div className="detail-person-heading">
              <span className="contact-tag">
                {contact.tag || 'Без категории'}
              </span>
              <h1>{contact.name || 'Без имени'}</h1>
              <p>Контакт ContactHub</p>
            </div>
          </div>

          <div className="detail-divider" />

          <h3 className="detail-section-title">
            Контактные данные
          </h3>

          <div className="detail-info-list">
            <div className="detail-info-item">
              <span className="detail-info-icon">
                <Mail size={19} />
              </span>
              <div>
                <span className="detail-info-label">
                  Электронная почта
                </span>
                <p>{contact.email || 'Email не указан'}</p>
              </div>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-icon">
                <Phone size={19} />
              </span>
              <div>
                <span className="detail-info-label">
                  Телефон
                </span>
                <p>{contact.phone || 'Телефон не указан'}</p>
              </div>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-icon">
                <Building2 size={19} />
              </span>
              <div>
                <span className="detail-info-label">
                  Компания
                </span>
                <p>{contact.company || 'Компания не указана'}</p>
              </div>
            </div>

            <div className="detail-info-item">
              <span className="detail-info-icon">
                <BriefcaseBusiness size={19} />
              </span>
              <div>
                <span className="detail-info-label">
                  Категория контакта
                </span>
                <p>{contact.tag || 'Без категории'}</p>
              </div>
            </div>
          </div>

          <div className="detail-card-actions">
            <Link className="secondary-button" to="/dashboard">
              <ArrowLeft size={16} />
              К списку контактов
            </Link>
          </div>
        </article>
      </div>
    </main>
  )
}

function UsersIcon() {
  return <UserRound size={23} />
}