import jwt from 'jsonwebtoken'
import cfg from '../config/index.js'
import { Users } from '../db/models.js'

const accessPriority = { 1: 1, 2: 2, 3: 3 }

export default function accessLevel (requiredLevel = 1) {
  return async function authorize (req, res, next) {
    if (req.method === 'OPTIONS') return next()

    try {
      const authHeader = req.headers.authorization
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Не авторизован' })
      }

      const token = authHeader.slice(7)
      const decoded = jwt.verify(token, cfg.JWT_SECRET)
      if (!decoded?.user_id) {
        return res.status(401).json({ message: 'Неверный токен' })
      }

      const user = await Users.findByPk(decoded.user_id)
      if (!user) {
        return res.status(401).json({ message: 'Пользователь не найден' })
      }

      const userPriority = accessPriority[user.access_level] || 0
      const requiredPriority = accessPriority[requiredLevel] || 0
      if (userPriority < requiredPriority) {
        return res.status(403).json({ message: 'Недостаточно прав' })
      }

      req.user = user
      next()
    } catch (error) {
      console.error('Authorization error:', error.message)
      return res.status(401).json({ message: 'Ошибка авторизации' })
    }
  }
}
