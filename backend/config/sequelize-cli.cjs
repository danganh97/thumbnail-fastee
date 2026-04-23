const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') })

function envNumber(name, fallback) {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

const common = {
  dialect: 'mysql',
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: envNumber('MYSQL_PORT', 3306),
  username: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'thumbnail_fastee',
  migrationStorageTableName: 'sequelize_meta',
}

module.exports = {
  development: common,
  test: common,
  production: common,
}
