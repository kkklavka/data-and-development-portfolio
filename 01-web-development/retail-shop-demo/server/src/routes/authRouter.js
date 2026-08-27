import { Router } from 'express'
import jwt from 'jsonwebtoken'
import cfg from '../config/index.js'
import { Users } from '../db/models.js'
import accessLevel from '../middleware/accessLevel.js'

const router = Router()

const generateToken = (user) => jwt.sign(
  { user_id: user.user_id, access_level: user.access_level },
  cfg.JWT_SECRET,
  { expiresIn: '24h' }
)

const publicUser = (user) => ({
  user_id: user.user_id,
  email: user.email,
  access_level: user.access_level,
  first_name: user.first_name,
  last_name: user.last_name,
  name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
})

router.post('/register', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')
    const firstName = String(req.body.first_name || '').trim()
    const lastName = String(req.body.last_name || '').trim()

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Все поля обязательны' })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Пароль должен содержать не менее 6 символов' })
    }

    const existingUser = await Users.findOne({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ message: 'Пользователь уже существует' })
    }

    const user = await Users.create({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      access_level: 1,
    })

    res.status(201).json({ token: generateToken(user), user: publicUser(user) })
  } catch (error) {
    console.error('Registration error:', error.message)
    res.status(500).json({ message: 'Ошибка регистрации' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (!email || !password) {
      return res.status(400).json({ message: 'Введите email и пароль' })
    }

    const user = await Users.findOne({ where: { email } })
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Неверный email или пароль' })
    }

    res.json({ token: generateToken(user), user: publicUser(user) })
  } catch (error) {
    console.error('Login error:', error.message)
    res.status(500).json({ message: 'Ошибка входа' })
  }
})

router.get('/profile', accessLevel(1), async (req, res) => {
  res.json(publicUser(req.user))
})

router.post('/logout', accessLevel(1), (req, res) => {
  res.json({ message: 'Выход выполнен' })
})

export default router
