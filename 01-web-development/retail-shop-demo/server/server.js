import cors from 'cors'
import express from 'express'
import http from 'http'
import { Server } from 'socket.io'

import sequelize from './src/db/index.js'
import router from './src/routes/index.js'
import { sio_chat, sio_middleware } from './src/controllers/sio_controller.js'
import cfg from './src/config/index.js'

const app = express()
const allowedOrigins = cfg.CLIENT_ORIGIN === '*'
  ? '*'
  : cfg.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: '1mb' }))
app.use('/api', router)

app.get('/', (req, res) => {
  res.json({ status: 'ok' })
})

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
  path: '/ws',
})

app.set('io', io)
io.use(sio_middleware)
sio_chat(io)

const start = async () => {
  try {
    await sequelize.authenticate()
    await sequelize.sync()
    server.listen(cfg.PORT, () => console.log(`Server started on port ${cfg.PORT}`))
  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exitCode = 1
  }
}

start()
