
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  Outlet,
  useLocation,
} from 'react-router-dom'

import Dashboard from './pages/Dashboard'
import ContactDetails from './pages/ContactDetails'
import ExternalUsers from './pages/ExternalUsers'
import ExternalUserDetails from './pages/ExternalUserDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

import { AuthProvider, useAuth } from './context/AuthContext'
import './App.css'

function Home() {
  const { user } = useAuth()

  return (
    <div className="home-page">
      <header className="home-header">
        <Link to="/" className="logo">
          ContactHub
        </Link>

        <nav className="home-nav">
          {user ? (
            <Link to="/dashboard" className="primary-button">
              Мои контакты
            </Link>
          ) : (
            <>
              <Link to="/login" className="secondary-button">
                Войти
              </Link>
              <Link to="/register" className="primary-button">
                Регистрация
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="home-content">
        <section className="home-hero">
          <p className="eyebrow">ВАШИ КОНТАКТЫ — В ПОРЯДКЕ</p>

          <h1>
            Все важные контакты
            <br />
            в одном месте
          </h1>

          <p className="hero-description">
            ContactHub помогает хранить контактные данные,
            быстро находить нужных людей и управлять своей
            контактной книгой.
          </p>

          <div className="hero-actions">
            {user ? (
              <Link to="/dashboard" className="primary-button">
                Перейти к контактам
              </Link>
            ) : (
              <>
                <Link to="/register" className="primary-button">
                  Начать работу
                </Link>
                <Link to="/login" className="secondary-button">
                  Уже есть аккаунт?
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="home-features">
          <article className="feature-card">
            <h3>Управление контактами</h3>
            <p>
              Добавляйте, редактируйте, просматривайте и удаляйте
              контакты.
            </p>
          </article>

          <article className="feature-card">
            <h3>Поиск и фильтрация</h3>
            <p>
              Находите нужных людей по имени, электронной почте
              и другим данным.
            </p>
          </article>

          <article className="feature-card">
            <h3>Личный аккаунт</h3>
            <p>
              Регистрируйтесь и входите в систему. Ваши контакты
              хранятся отдельно от контактов других пользователей.
            </p>
          </article>

          <article className="feature-card">
            <h3>Внешний API</h3>
            <p>
              Просматривайте пользователей из внешнего источника,
              ищите их и открывайте подробную информацию.
            </p>
            <Link to="/external-users" className="text-link">
              Посмотреть пользователей →
            </Link>
          </article>
        </section>
      </main>

      <footer className="home-footer">
        <p>ContactHub — менеджер контактов</p>
      </footer>
    </div>
  )
}

function ProtectedLayout() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="loading-screen">Загрузка...</div>
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        }}
      />
    )
  }

  return <Outlet />
}

function AppRoutes() {
  const { loading } = useAuth()

  if (loading) {
    return <div className="loading-screen">Загрузка...</div>
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedLayout />}>
        <Route path="dashboard" element={<Dashboard />} />

        <Route path="contacts/:id" element={<ContactDetails />} />

        <Route path="external-users" element={<ExternalUsers />} />

        <Route
          path="external-users/:id"
          element={<ExternalUserDetails />}
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
