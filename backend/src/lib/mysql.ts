import mysql, { type Pool, type PoolOptions } from 'mysql2/promise'

let pool: Pool | null = null

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

function buildConfig(): PoolOptions {
  return {
    host: process.env.MYSQL_HOST ?? '127.0.0.1',
    port: envNumber('MYSQL_PORT', 3306),
    user: process.env.MYSQL_USER ?? 'root',
    password: process.env.MYSQL_PASSWORD ?? '',
    database: process.env.MYSQL_DATABASE ?? 'thumbnail_fastee',
    waitForConnections: true,
    connectionLimit: envNumber('MYSQL_CONNECTION_LIMIT', 10),
    queueLimit: 0,
  }
}

export function getMysqlPool(): Pool {
  if (!pool) {
    pool = mysql.createPool(buildConfig())
  }
  return pool
}
