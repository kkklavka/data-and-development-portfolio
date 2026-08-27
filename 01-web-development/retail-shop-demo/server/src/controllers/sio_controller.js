import jwt from 'jsonwebtoken'
import cfg from '../config/index.js'
import { Users } from '../db/models.js'

export const sio_middleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Unauthorized'))

    const decoded = jwt.verify(token, cfg.JWT_SECRET)
    const user = await Users.findByPk(decoded.user_id)
    if (!user) return next(new Error('Unauthorized'))

    socket.user = user
    next()
  } catch {
    next(new Error('Unauthorized'))
  }
}

export const sio_chat = (io) => {
  io.on('connection', (socket) => {
    socket.join(`user_${socket.user.user_id}`)
    if (socket.user.access_level >= 2) socket.join('staff')
  })
}
