import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { z } from 'zod'
import pdfParse from 'pdf-parse'

import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { extractInvoiceFieldsFromText } from '../services/pdfExtract.js'

const router = express.Router()
const uploadDir = path.join(process.cwd(), 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
      cb(null, `${Date.now()}_${safe}`)
    },
  }),
  limits: { fileSize: 12 * 1024 * 1024 },
})

router.get('/', requireAuth, async (req, res) => {
  const q = String(req.query.q || '').trim()
  const status = String(req.query.status || 'all')
  const sort = String(req.query.sort || 'date_desc')

  const where = {
    userId: req.user.sub,
    ...(status === 'paid' ? { status: 'PAID' } : status === 'pending' ? { status: 'PENDING' } : {}),
    ...(q
      ? {
          OR: [
            { vendor: { contains: q, mode: 'insensitive' } },
            { number: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const orderBy =
    sort === 'date_asc'
      ? { invoiceDate: 'asc' }
      : sort === 'date_desc'
        ? { invoiceDate: 'desc' }
        : sort === 'total_asc'
          ? { totalCents: 'asc' }
          : sort === 'total_desc'
            ? { totalCents: 'desc' }
            : sort === 'vendor_asc'
              ? { vendor: 'asc' }
              : { createdAt: 'desc' }

  const rows = await prisma.invoice.findMany({
    where,
    orderBy,
    include: { history: { orderBy: { at: 'desc' }, take: 10 } },
  })

  res.json({ rows: rows.map(toInvoiceDto) })
})

router.post('/', requireAuth, async (req, res) => {
  const schema = z.object({
    number: z.string().optional(),
    vendor: z.string().optional(),
    invoiceDate: z.string().datetime().optional(),
    total: z.number().optional(),
    currency: z.string().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_BODY' })
  const { number, vendor, invoiceDate, total, currency } = parsed.data

  const created = await prisma.invoice.create({
    data: {
      userId: req.user.sub,
      number,
      vendor,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
      totalCents: typeof total === 'number' ? Math.round(total * 100) : null,
      currency: currency || 'EUR',
      status: 'PENDING',
      history: { create: { from: 'PAID', to: 'PENDING' } },
    },
    include: { history: true },
  })

  res.status(201).json({ invoice: toInvoiceDto(created) })
})

router.post('/:id/toggle-status', requireAuth, async (req, res) => {
  const id = String(req.params.id)
  const inv = await prisma.invoice.findFirst({ where: { id, userId: req.user.sub } })
  if (!inv) return res.status(404).json({ error: 'NOT_FOUND' })

  const next = inv.status === 'PAID' ? 'PENDING' : 'PAID'
  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: next, history: { create: { from: inv.status, to: next, actorId: req.user.sub } } },
    include: { history: { orderBy: { at: 'desc' }, take: 20 } },
  })
  res.json({ invoice: toInvoiceDto(updated) })
})

router.post('/upload-pdf', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'NO_FILE' })
  const buf = fs.readFileSync(req.file.path)
  const parsed = await pdfParse(buf)
  const extracted = extractInvoiceFieldsFromText(parsed.text || '')

  const created = await prisma.invoice.create({
    data: {
      userId: req.user.sub,
      number: extracted.number || null,
      vendor: extracted.vendor || null,
      invoiceDate: extracted.date ? new Date(extracted.date) : null,
      totalCents: typeof extracted.total === 'number' ? Math.round(extracted.total * 100) : null,
      currency: extracted.currency || 'EUR',
      status: 'PENDING',
      pdfPath: req.file.path,
      pdfFilename: req.file.originalname,
      history: { create: { from: 'PAID', to: 'PENDING', actorId: req.user.sub } },
    },
    include: { history: true },
  })

  res.status(201).json({ invoice: toInvoiceDto(created), extracted })
})

router.get('/:id/pdf', requireAuth, async (req, res) => {
  const id = String(req.params.id)
  const inv = await prisma.invoice.findFirst({ where: { id, userId: req.user.sub } })
  if (!inv || !inv.pdfPath) return res.status(404).json({ error: 'NOT_FOUND' })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${inv.pdfFilename || 'invoice.pdf'}"`)
  fs.createReadStream(inv.pdfPath).pipe(res)
})

router.get('/stats/monthly', requireAuth, async (req, res) => {
  const months = Math.min(24, Math.max(3, Number(req.query.months || 6)))

  // Agrupación mensual: simple en JS para evitar raw SQL dependiente
  const since = new Date()
  since.setMonth(since.getMonth() - (months - 1))
  since.setDate(1)

  const rows = await prisma.invoice.findMany({
    where: { userId: req.user.sub, invoiceDate: { gte: since } },
    select: { invoiceDate: true, totalCents: true },
  })

  const map = new Map()
  for (const r of rows) {
    if (!r.invoiceDate || typeof r.totalCents !== 'number') continue
    const d = r.invoiceDate
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    map.set(key, (map.get(key) || 0) + r.totalCents)
  }

  const out = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    out.push({ key, year: d.getFullYear(), month: d.getMonth() + 1, total: (map.get(key) || 0) / 100 })
  }
  res.json({ series: out })
})

function toInvoiceDto(inv) {
  return {
    id: inv.id,
    number: inv.number,
    vendor: inv.vendor,
    date: inv.invoiceDate ? inv.invoiceDate.toISOString() : null,
    total: typeof inv.totalCents === 'number' ? inv.totalCents / 100 : null,
    currency: inv.currency,
    status: inv.status === 'PAID' ? 'paid' : 'pending',
    pdfFilename: inv.pdfFilename,
    history: (inv.history || []).map((h) => ({
      at: h.at.toISOString(),
      from: h.from === 'PAID' ? 'paid' : 'pending',
      to: h.to === 'PAID' ? 'paid' : 'pending',
    })),
  }
}

export default router
