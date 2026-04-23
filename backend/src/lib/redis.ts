import Redis from 'ioredis'

let redis: Redis | null = null

function buildRedis(): Redis {
  const redisUrl = process.env.REDIS_URL
  if (redisUrl) return new Redis(redisUrl)

  const host = process.env.REDIS_HOST ?? '127.0.0.1'
  const port = Number(process.env.REDIS_PORT ?? 6379)
  const password = process.env.REDIS_PASSWORD

  return new Redis({
    host,
    port: Number.isFinite(port) ? port : 6379,
    password,
  })
}

export function getRedis(): Redis {
  if (!redis) {
    redis = buildRedis()
  }
  return redis
}
