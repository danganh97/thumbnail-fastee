import express from 'express'
import cors from 'cors'
import configRouter from './routes/config'
import templatesRouter from './routes/templates'

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(cors())
app.use(express.json())

app.use('/config', configRouter)
app.use('/templates', templatesRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})

export default app
