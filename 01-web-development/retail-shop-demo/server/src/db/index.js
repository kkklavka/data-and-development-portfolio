import { Sequelize } from 'sequelize'
import cfg from '../config/index.js'

const sequelize = new Sequelize(
  cfg.DB_NAME,
  cfg.DB_USER,
  cfg.DB_PASSWORD,
  {
    host: cfg.DB_HOST,
    port: cfg.DB_PORT,
    dialect: 'postgres',
    logging: false,
  }
)

export default sequelize
