
import { Link, useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, SearchX } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <div className="not-found-icon">
          <SearchX size={42} strokeWidth={1.7} />
        </div>

        <p className="not-found-code">ОШИБКА 404</p>

        <h1>Страница не найдена</h1>

        <p className="not-found-description">
          Кажется, такой страницы не существует или она была перемещена.
          Проверь адрес или вернись на главную страницу ContactHub.
        </p>

        <div className="not-found-actions">
          <button
            className="not-found-back"
            type="button"
            onClick={() => {
              if (window.history.state?.idx > 0) {
                navigate(-1)
              } else {
                navigate('/')
              }
            }}
          >
            <ArrowLeft size={18} />
            Назад
          </button>

          <Link to="/" className="not-found-home">
            <Home size={18} />
            На главную
          </Link>
        </div>

        <div className="not-found-brand">ContactHub</div>
      </div>
    </main>
  )
}
