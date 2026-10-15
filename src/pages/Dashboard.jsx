import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users,
  Search,
  Plus,
  X,
  Trash2,
  Mail,
  Phone,
  Building2,
  Pencil,
  LogOut,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API_URL = '/api/contacts'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  tag: 'Друзья',
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [contacts, setContacts] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Все')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...options.headers,
      },
    })

    const data = await response.json().catch(() => ({}))

    if (response.status === 401) {
      navigate('/login', { replace: true })
      throw new Error('Сессия завершена. Войдите снова.')
    }

    if (!response.ok) {
      throw new Error(data.message || 'Не удалось выполнить запрос')
    }

    return data
  }

  async function loadContacts() {
    setLoading(true)
    setError('')

    try {
      const data = await apiRequest(API_URL)
      setContacts(data)
    } catch (err) {
      setError(err.message || 'Не удалось загрузить контакты.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContacts()
  }, [])

  function openAddForm() {
    setEditingId(null)
    setForm({ ...emptyForm })
    setError('')
    setShowForm(true)
  }

  function openEditForm(contact) {
    setEditingId(contact.id)
    setForm({
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      tag: contact.tag || 'Друзья',
    })
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    if (saving) return

    setShowForm(false)
    setEditingId(null)
    setForm({ ...emptyForm })
    setError('')
  }

  function updateField(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function saveContact(event) {
    event.preventDefault()

    if (saving) return

    const name = form.name.trim()
    const email = form.email.trim()
    const phone = form.phone.trim()
    const company = form.company.trim()

    if (!name) {
      setError('Введите имя контакта.')
      return
    }

    if (!email) {
      setError('Введите электронную почту.')
      return
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailPattern.test(email)) {
      setError('Введите корректный email, например anna@example.com.')
      return
    }

    if (!['Друзья', 'Работа', 'Семья'].includes(form.tag)) {
      setError('Выберите корректную категорию.')
      return
    }

    setSaving(true)
    setError('')

    const isEditing = editingId !== null

    try {
      const data = await apiRequest(
        isEditing ? `${API_URL}/${editingId}` : API_URL,
        {
          method: isEditing ? 'PUT' : 'POST',
          body: JSON.stringify({
            name,
            email,
            phone,
            company,
            tag: form.tag,
          }),
        },
      )

      if (isEditing) {
        setContacts((previous) =>
          previous.map((contact) =>
            contact.id === editingId ? data : contact,
          ),
        )
      } else {
        setContacts((previous) => [data, ...previous])
      }

      setShowForm(false)
      setEditingId(null)
      setForm({ ...emptyForm })
      setError('')
    } catch (err) {
      setError(err.message || 'Не удалось сохранить контакт.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteContact(id) {
    if (!window.confirm('Удалить этот контакт?')) return

    setError('')

    try {
      await apiRequest(`${API_URL}/${id}`, {
        method: 'DELETE',
      })

      setContacts((previous) =>
        previous.filter((contact) => contact.id !== id),
      )
    } catch (err) {
      setError(err.message || 'Не удалось удалить контакт.')
    }
  }

  async function handleLogout() {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.message || 'Не удалось выйти из аккаунта.')
    }
  }

  const filteredContacts = contacts.filter((contact) => {
    const searchable = [
      contact.name,
      contact.email,
      contact.phone,
      contact.company,
    ]
      .join(' ')
      .toLowerCase()

    return (
      searchable.includes(search.toLowerCase()) &&
      (filter === 'Все' || contact.tag === filter)
    )
  })

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <Link className="brand" to="/dashboard">
          <div className="brand-icon">
            <Users size={24} />
          </div>

          <div>
            <h1>ContactHub</h1>
            <p>Твоя книга контактов</p>
          </div>
        </Link>

        <div className="topbar-actions">
          <span>{user?.name || 'Пользователь'}</span>

          <Link className="secondary-button" to="/external-users">
            <ExternalLink size={16} />
            Внешние пользователи
          </Link>

          <button
            className="secondary-button"
            type="button"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Выйти
          </button>

          <button
            className="primary-button"
            type="button"
            onClick={openAddForm}
          >
            <Plus size={18} />
            Добавить контакт
          </button>
        </div>
      </header>

      <section className="welcome">
        <p className="eyebrow">ТВОЁ ПРОСТРАНСТВО</p>
        <h2>Все важные люди рядом.</h2>
        <p>
          Организуй контакты и находи нужных людей за секунды.
        </p>

        <div className="stats">
          <div className="stat-card">
            <span className="stat-icon">
              <Users size={21} />
            </span>
            <div>
              <strong>{contacts.length}</strong>
              <p>Всего контактов</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">
              <Building2 size={21} />
            </span>
            <div>
              <strong>
                {contacts.filter((contact) => contact.company).length}
              </strong>
              <p>С указанием компании</p>
            </div>
          </div>
        </div>
      </section>

      <section className="contacts-section">
        <div className="section-heading">
          <div>
            <h2>Мои контакты</h2>
            <p>Управляй своей адресной книгой</p>
          </div>
        </div>

        {error && !showForm && (
          <div className="error-message" role="alert">
            <p>{error}</p>
            <button type="button" onClick={loadContacts}>
              Повторить
            </button>
          </div>
        )}

        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="search"
              placeholder="Поиск по имени, email или компании..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Поиск контактов"
            />
          </div>

          <select
            className="filter-select"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Фильтр контактов"
          >
            <option value="Все">Все контакты</option>
            <option value="Работа">Работа</option>
            <option value="Друзья">Друзья</option>
            <option value="Семья">Семья</option>
          </select>
        </div>

        <p className="contacts-count">
          Найдено контактов: {filteredContacts.length}
        </p>

        {loading ? (
          <div className="empty-state">
            <p>Загружаем контакты...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="empty-state">
            <Users size={38} />
            <h3>Контакты не найдены</h3>
            <p>
              Попробуй изменить запрос или добавь новый контакт.
            </p>
          </div>
        ) : (
          <div className="contacts-grid">
            {filteredContacts.map((contact) => (
              <article className="contact-card" key={contact.id}>
                <div className="contact-top">
                  <div className="contact-avatar-initials">
                    {contact.name?.trim().charAt(0).toUpperCase() || '?'}
                  </div>

                  <div className="contact-actions">
                    <button
                      className="icon-button"
                      type="button"
                      title="Редактировать контакт"
                      aria-label={`Редактировать ${contact.name}`}
                      onClick={() => openEditForm(contact)}
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      className="icon-button delete-button"
                      type="button"
                      title="Удалить контакт"
                      aria-label={`Удалить ${contact.name}`}
                      onClick={() => deleteContact(contact.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <h3>
                  <Link
                    className="contact-name-link"
                    to={`/contacts/${contact.id}`}
                  >
                    {contact.name}
                  </Link>
                </h3>

                <span className="contact-tag">{contact.tag}</span>

                <div className="contact-details">
                  <p>
                    <Mail size={16} />
                    <span>{contact.email}</span>
                  </p>

                  <p>
                    <Phone size={16} />
                    <span>{contact.phone || 'Телефон не указан'}</span>
                  </p>

                  <p>
                    <Building2 size={16} />
                    <span>{contact.company || 'Компания не указана'}</span>
                  </p>
                </div>

                <Link
                  className="primary-button"
                  to={`/contacts/${contact.id}`}
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
                  Подробнее →
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <section
            className="contact-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-form-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <h2 id="contact-form-title">
                  {editingId !== null
                    ? 'Редактировать контакт'
                    : 'Новый контакт'}
                </h2>
                <p>
                  {editingId !== null
                    ? 'Измени нужные данные'
                    : 'Добавь информацию о человеке'}
                </p>
              </div>

              <button
                className="icon-button"
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Закрыть форму"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveContact}>
              <label>
                Имя *
                <input
                  name="name"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={updateField}
                  placeholder="Например, Анна Петрова"
                />
              </label>

              <label>
                Email *
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  value={form.email}
                  onChange={updateField}
                  placeholder="anna@example.com"
                />
              </label>

              <label>
                Телефон
                <input
                  name="phone"
                  type="tel"
                  maxLength={30}
                  value={form.phone}
                  onChange={updateField}
                  placeholder="+7 700 000 00 00"
                />
              </label>

              <label>
                Компания
                <input
                  name="company"
                  maxLength={100}
                  value={form.company}
                  onChange={updateField}
                  placeholder="Название компании"
                />
              </label>

              <label>
                Категория
                <select
                  name="tag"
                  value={form.tag}
                  onChange={updateField}
                >
                  <option value="Друзья">Друзья</option>
                  <option value="Работа">Работа</option>
                  <option value="Семья">Семья</option>
                </select>
              </label>

              {error && (
                <div className="error-message" role="alert">
                  <p>{error}</p>
                </div>
              )}

              <div className="form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Отмена
                </button>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? 'Сохраняем...'
                    : editingId !== null
                      ? 'Сохранить изменения'
                      : 'Сохранить контакт'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}