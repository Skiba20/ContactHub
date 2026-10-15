import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Users,
  Mail,
  Phone,
  MapPin,
  Search,
  ArrowDownAZ,
} from 'lucide-react'

const API_URL = 'https://dummyjson.com/users?limit=12'

export default function ExternalUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  const [search, setSearch] = useState('')
  const [gender, setGender] = useState('all')
  const [sortOrder, setSortOrder] = useState('asc')

  const loadUsers = useCallback(async (signal) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(API_URL, { signal })

      if (!response.ok) {
        throw new Error('Не удалось получить пользователей с сервера.')
      }

      const data = await response.json()

      if (!Array.isArray(data.users)) {
        throw new Error('Сервер вернул данные в неожиданном формате.')
      }

      setUsers(data.users)
    } catch (err) {
      if (err.name === 'AbortError') return

      setUsers([])
      setError(
        'Не удалось загрузить пользователей. Проверь подключение к интернету и попробуй ещё раз.',
      )
    } finally {
      if (!signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    loadUsers(controller.signal)

    return () => controller.abort()
  }, [loadUsers, attempt])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return users
      .filter((user) => {
        const fullName =
          `${user.firstName} ${user.lastName}`.toLowerCase()

        const matchesSearch =
          fullName.includes(query) ||
          (user.email || '').toLowerCase().includes(query)

        const matchesGender =
          gender === 'all' || user.gender === gender

        return matchesSearch && matchesGender
      })
      .sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`
        const nameB = `${b.firstName} ${b.lastName}`

        return sortOrder === 'asc'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA)
      })
  }, [users, search, gender, sortOrder])

  return (
    <main className="dashboard external-users-page">
      <header className="dashboard-header">
        <Link className="brand" to="/dashboard">
          <div className="brand-icon">
            <Users size={24} />
          </div>
          <div>
            <h1>ContactHub</h1>
            <p>Внешний API</p>
          </div>
        </Link>

        <Link className="secondary-button" to="/dashboard">
          <ArrowLeft size={16} />
          Мои контакты
        </Link>
      </header>

      <section className="welcome">
        <p className="eyebrow">ВНЕШНИЕ ДАННЫЕ</p>
        <h2>Пользователи DummyJSON</h2>
        <p>
          Данные загружаются из внешнего API и не сохраняются
          в твоей адресной книге.
        </p>

        {!loading && !error && (
          <div className="stats">
            <div className="stat-card">
              <span className="stat-icon">
                <Users size={21} />
              </span>
              <div>
                <strong>{users.length}</strong>
                <p>Загружено пользователей</p>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-icon">
                <Search size={21} />
              </span>
              <div>
                <strong>{filteredUsers.length}</strong>
                <p>Найдено по фильтрам</p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="contacts-section">
        <div className="section-heading">
          <div>
            <h2>Список пользователей</h2>
            <p>Источник: DummyJSON API</p>
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            disabled={loading}
          >
            <RefreshCw size={16} />
            {loading ? 'Загрузка...' : 'Обновить'}
          </button>
        </div>

        {!loading && !error && (
          <div className="toolbar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="search"
                placeholder="Поиск по имени или email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={gender}
              onChange={(event) => setGender(event.target.value)}
              aria-label="Фильтр по полу"
            >
              <option value="all">Все пользователи</option>
              <option value="male">Мужчины</option>
              <option value="female">Женщины</option>
            </select>

            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                setSortOrder((value) =>
                  value === 'asc' ? 'desc' : 'asc',
                )
              }
              title="Изменить порядок сортировки"
            >
              <ArrowDownAZ size={16} />
              {sortOrder === 'asc' ? 'А — Я' : 'Я — А'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="empty-state">
            <RefreshCw size={30} />
            <h3>Загружаем пользователей...</h3>
            <p>Пожалуйста, подожди.</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <h3>Не удалось загрузить данные</h3>
            <p>{error}</p>
            <button
              className="primary-button"
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
            >
              <RefreshCw size={16} />
              Попробовать снова
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <Users size={36} />
            <h3>Пользователи не найдены</h3>
            <p>Измени запрос или фильтр и попробуй снова.</p>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setSearch('')
                setGender('all')
                setSortOrder('asc')
              }}
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <>
            <p className="contacts-count">
              Найдено пользователей: {filteredUsers.length}
            </p>

            <div className="contacts-grid">
              {filteredUsers.map((user) => (
                <article className="contact-card" key={user.id}>
                  <div className="contact-top">
                    <div className="external-user-avatar">
                      {user.firstName?.charAt(0).toUpperCase()}
                      {user.lastName?.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <h3>
                    {user.firstName} {user.lastName}
                  </h3>

                  <span className="contact-tag">
                    {user.company?.title || 'Пользователь'}
                  </span>

                  <div className="contact-details">
                    <p>
                      <Mail size={16} />
                      <span>{user.email || 'Email не указан'}</span>
                    </p>

                    <p>
                      <Phone size={16} />
                      <span>{user.phone || 'Телефон не указан'}</span>
                    </p>

                    <p>
                      <MapPin size={16} />
                      <span>
                        {[
                          user.address?.city,
                          user.address?.country,
                        ]
                          .filter(Boolean)
                          .join(', ') || 'Адрес не указан'}
                      </span>
                    </p>
                  </div>

                  <Link
                    className="primary-button"
                    to={`/external-users/${user.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      marginTop: 18,
                      textDecoration: 'none',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    Подробнее <ArrowRight size={16} />
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}