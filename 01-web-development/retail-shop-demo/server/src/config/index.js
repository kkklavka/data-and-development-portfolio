import dotenv from 'dotenv'

dotenv.config()

const env = process.env

const required = ['DB_PASSWORD', 'JWT_SECRET']
const missing = required.filter((key) => !env[key])

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}. ` +
    'Copy .env.example to .env and provide local values.'
  )
}

const numberFromEnv = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const cfg = {
  DB_NAME: env.DB_NAME || 'shop_portfolio',
  DB_USER: env.DB_USER || 'postgres',
  DB_PASSWORD: env.DB_PASSWORD,
  DB_HOST: env.DB_HOST || 'localhost',
  DB_PORT: numberFromEnv(env.DB_PORT, 5432),
  JWT_SECRET: env.JWT_SECRET,
  PORT: numberFromEnv(env.PORT, 3500),
  CLIENT_ORIGIN: env.CLIENT_ORIGIN || 'http://localhost:3000',
}

export default cfg
