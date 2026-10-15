
import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const db = new Database(path.join(__dirname, 'contacts.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'contacthub-local-development-secret-change-before-deploy'

const app = express()

const allowedOrigins = [
  'http://localhost:5173',
  'https://contacthub20.netlify.app',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    console.error('CORS blocked origin:', origin)
    return callback(new Error('Origin not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json())
app.use(cookieParser())

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    tag TEXT NOT NULL DEFAULT 'Друзья'
  );
`)

const columns = db.prepare('PRAGMA table_info(contacts)').all()

if (!columns.some((column) => column.name === 'user_id')) {
  db.exec('ALTER TABLE contacts ADD COLUMN user_id INTEGER REFERENCES users(id)')
}

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' },
  )
}

function setAuthCookie(res, user) {
  res.cookie('contacthub_token', createToken(user), {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

function clearAuthCookie(res) {
  res.clearCookie('contacthub_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  })
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email }
}

function authenticate(req, res, next) {
  const token = req.cookies.contacthub_token

  if (!token) {
    return res.status(401).json({ message: 'Войдите в аккаунт' })
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET)
    return next()
  } catch {
    clearAuthCookie(res)
    return res.status(401).json({ message: 'Сессия истекла. Войдите снова' })
  }
}

app.get('/', (req, res) => {
  res.send('ContactHub API работает!')
})

app.post('/api/auth/register', (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
  const email = typeof req.body.email === 'string'
    ? req.body.email.trim().toLowerCase()
    : ''
  const password = typeof req.body.password === 'string' ? req.body.password : ''

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Заполни все обязательные поля' })
  }

  if (name.length > 100 || email.length > 254) {
    return res.status(400).json({ message: 'Слишком длинное имя или email' })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Укажи корректный email' })
  }

  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({
      message: 'Пароль должен содержать от 8 до 72 символов',
    })
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)

  if (existing) {
    return res.status(409).json({ message: 'Этот email уже зарегистрирован' })
  }

  const passwordHash = bcrypt.hashSync(password, 12)

  try {
    const transaction = db.transaction(() => {
      const result = db.prepare(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      ).run(name, email, passwordHash)

      const userId = Number(result.lastInsertRowid)
      const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get()

      if (userCount.count === 1) {
        db.prepare('UPDATE contacts SET user_id = ? WHERE user_id IS NULL')
          .run(userId)
      }

      return db.prepare(
        'SELECT id, name, email FROM users WHERE id = ?',
      ).get(userId)
    })

    const user = transaction()
    setAuthCookie(res, user)
    return res.status(201).json({ user })
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ message: 'Этот email уже зарегистрирован' })
    }

    console.error(error)
    return res.status(500).json({ message: 'Ошибка регистрации' })
  }
})

app.post('/api/auth/login', (req, res) => {
  const email = typeof req.body.email === 'string'
    ? req.body.email.trim().toLowerCase()
    : ''
  const password = typeof req.body.password === 'string' ? req.body.password : ''

  if (!email || !password) {
    return res.status(400).json({ message: 'Введи email и пароль' })
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Неверный email или пароль' })
  }

  setAuthCookie(res, user)
  return res.json({ user: publicUser(user) })
})

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = db.prepare(
    'SELECT id, name, email FROM users WHERE id = ?',
  ).get(req.user.id)

  if (!user) {
    clearAuthCookie(res)
    return res.status(401).json({ message: 'Пользователь не найден' })
  }

  return res.json({ user })
})

app.post('/api/auth/logout', (req, res) => {
  clearAuthCookie(res)
  return res.json({ message: 'Вы вышли из аккаунта' })
})

app.get('/api/contacts', authenticate, (req, res) => {
  const contacts = db.prepare(`
    SELECT id, name, email, phone, company, tag
    FROM contacts
    WHERE user_id = ?
    ORDER BY id DESC
  `).all(req.user.id)

  return res.json(contacts)
})

app.get('/api/contacts/:id', authenticate, (req, res) => {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'Некорректный ID контакта' })
  }

  const contact = db.prepare(`
    SELECT id, name, email, phone, company, tag
    FROM contacts
    WHERE id = ? AND user_id = ?
  `).get(id, req.user.id)

  if (!contact) {
    return res.status(404).json({ message: 'Контакт не найден' })
  }

  return res.json(contact)
})

app.post('/api/contacts', authenticate, (req, res) => {
  const { name, email, phone = '', company = '', tag = 'Друзья' } = req.body

  if (
    typeof name !== 'string' || !name.trim() ||
    typeof email !== 'string' || !email.trim()
  ) {
    return res.status(400).json({ message: 'Имя и email обязательны' })
  }

  const result = db.prepare(`
    INSERT INTO contacts (name, email, phone, company, tag, user_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(),
    email.trim(),
    typeof phone === 'string' ? phone : '',
    typeof company === 'string' ? company : '',
    typeof tag === 'string' ? tag : 'Друзья',
    req.user.id,
  )

  const contact = db.prepare(`
    SELECT id, name, email, phone, company, tag
    FROM contacts
    WHERE id = ? AND user_id = ?
  `).get(Number(result.lastInsertRowid), req.user.id)

  return res.status(201).json(contact)
})

app.put('/api/contacts/:id', authenticate, (req, res) => {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'Некорректный ID контакта' })
  }

  const current = db.prepare(
    'SELECT * FROM contacts WHERE id = ? AND user_id = ?',
  ).get(id, req.user.id)

  if (!current) {
    return res.status(404).json({ message: 'Контакт не найден' })
  }

  const { name, email, phone, company, tag } = req.body

  const updated = {
    name: typeof name === 'string' && name.trim() ? name.trim() : current.name,
    email: typeof email === 'string' && email.trim() ? email.trim() : current.email,
    phone: typeof phone === 'string' ? phone : current.phone,
    company: typeof company === 'string' ? company : current.company,
    tag: typeof tag === 'string' ? tag : current.tag,
  }

  db.prepare(`
    UPDATE contacts
    SET name = ?, email = ?, phone = ?, company = ?, tag = ?
    WHERE id = ? AND user_id = ?
  `).run(
    updated.name,
    updated.email,
    updated.phone,
    updated.company,
    updated.tag,
    id,
    req.user.id,
  )

  const contact = db.prepare(`
    SELECT id, name, email, phone, company, tag
    FROM contacts
    WHERE id = ? AND user_id = ?
  `).get(id, req.user.id)

  return res.json(contact)
})

app.delete('/api/contacts/:id', authenticate, (req, res) => {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'Некорректный ID контакта' })
  }

  const result = db.prepare(
    'DELETE FROM contacts WHERE id = ? AND user_id = ?',
  ).run(id, req.user.id)

  if (result.changes === 0) {
    return res.status(404).json({ message: 'Контакт не найден' })
  }

  return res.json({ message: 'Контакт удалён' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ContactHub API запущен на порту ${PORT}`)
})
