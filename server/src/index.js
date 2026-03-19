import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import { prisma } from './lib/prisma.js'
import authRouter from './routes/auth.js'
import invoicesRouter from './routes/invoices.js'

const app = express()
const port = Number(process.env.PORT || 4000)

app.use(
  cors({
    origin: (origin, cb) => cb(null, true),
    credentials: true,
  })
)
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

app.get('/health', async (_req, res) => {
  const db = await prisma.$queryRaw`SELECT 1 as ok`
  res.json({ ok: true, db })
})

app.use('/api/auth', authRouter)
app.use('/api/invoices', invoicesRouter)

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
