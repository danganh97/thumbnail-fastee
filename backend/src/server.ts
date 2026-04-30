import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import configRouter from './routes/config'
import templatesRouter from './routes/templates'
import sharesRouter from './routes/shares'
import authRouter from './routes/auth'
import editorsRouter from './routes/editors'
import { attachAuthUser } from './middleware/auth'
import { sequelize } from './lib/sequelize'
import { initModelAssociations } from './models'

const envCandidates = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
]
const envPath = envCandidates.find(candidate => fs.existsSync(candidate))
if (envPath) {
  dotenv.config({ path: envPath })
}

const app = express()
const PORT = process.env.PORT ?? 3000

function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/$/, '')
}

const primaryFrontend = normalizeOrigin(
  process.env.FRONTEND_BASE_URL ?? 'http://localhost:5173',
)
const extraOrigins = (process.env.FRONTEND_EXTRA_ORIGINS ?? '')
  .split(',')
  .map(s => normalizeOrigin(s))
  .filter(Boolean)

const corsOrigins = Array.from(
  new Set([
    primaryFrontend,
    ...extraOrigins,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://[::1]:5173',
  ]),
)

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
)
app.use(cookieParser())
app.use(express.json({ limit: '2mb' }))
app.use(attachAuthUser)

app.use('/config', configRouter)
app.use('/templates', templatesRouter)
app.use('/shares', sharesRouter)
app.use('/auth', authRouter)
app.use('/editors', editorsRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

initModelAssociations()

sequelize.authenticate()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`)
    })
  })
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error('Failed to connect database:', error)
    process.exit(1)
  })

export default app
