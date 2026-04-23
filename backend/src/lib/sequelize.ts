import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { Sequelize } from 'sequelize'

const envCandidates = [
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
]
const envPath = envCandidates.find(candidate => fs.existsSync(candidate))
if (envPath) {
  dotenv.config({ path: envPath })
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}
export const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE ?? 'thumbnail_fastee',
  process.env.MYSQL_USER ?? 'root',
  process.env.MYSQL_PASSWORD ?? '',
  {
    host: process.env.MYSQL_HOST ?? '127.0.0.1',
    port: envNumber('MYSQL_PORT', 3306),
    dialect: 'mysql',
    logging: false,
    pool: {
      max: envNumber('MYSQL_CONNECTION_LIMIT', 10),
      min: 0,
      idle: 10_000,
    },
  },
)
