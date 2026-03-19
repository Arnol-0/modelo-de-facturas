import express from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { prisma } from '../lib/prisma.js'
import { cookieOptions, randomToken, sha256, signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/security.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

router.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_BODY', details: parsed.error.flatten() })
  const { email, password } = parsed.data

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return res.status(409).json({ error: 'EMAIL_IN_USE' })

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, passwordHash, role: 'USER' } })
  return res.status(201).json({ id: user.id, email: user.email, role: user.role })
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_BODY' })
  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'INVALID_CREDENTIALS' })

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'INVALID_CREDENTIALS' })

  const access = signAccessToken({ sub: user.id, email: user.email, role: user.role })
  const refresh = signRefreshToken({ sub: user.id, role: user.role })
  res.cookie('access_token', access, { ...cookieOptions(), maxAge: 15 * 60 * 1000 })
  res.cookie('refresh_token', refresh, { ...cookieOptions(), maxAge: 30 * 24 * 60 * 60 * 1000 })
  return res.json({ id: user.id, email: user.email, role: user.role })
})

router.post('/logout', (_req, res) => {
  res.clearCookie('access_token', cookieOptions())
  res.clearCookie('refresh_token', cookieOptions())
  return res.json({ ok: true })
})

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.sub }, select: { id: true, email: true, role: true } })
  return res.json(user)
})

router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refresh_token
    if (!token) return res.status(401).json({ error: 'UNAUTHENTICATED' })
    const payload = verifyRefreshToken(token)
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, role: true } })
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' })

    const access = signAccessToken({ sub: user.id, email: user.email, role: user.role })
    res.cookie('access_token', access, { ...cookieOptions(), maxAge: 15 * 60 * 1000 })
    return res.json({ ok: true })
  } catch {
    return res.status(401).json({ error: 'UNAUTHENTICATED' })
  }
})

router.post('/forgot-password', async (req, res) => {
  const parsed = z.object({ email: z.string().email() }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_BODY' })

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  // No revelar si existe
  if (!user) return res.json({ ok: true })

  const token = randomToken()
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  })

  // En producción se enviaría por email. Aquí devolvemos token para demo.
  return res.json({ ok: true, resetToken: token })
})

router.post('/reset-password', async (req, res) => {
  const parsed = z
    .object({ token: z.string().min(10), password: z.string().min(8) })
    .safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_BODY' })
  const { token, password } = parsed.data

  const tokenHash = sha256(token)
  const prt = await prisma.passwordResetToken.findFirst({ where: { tokenHash, usedAt: null } })
  if (!prt) return res.status(400).json({ error: 'INVALID_TOKEN' })
  if (prt.expiresAt < new Date()) return res.status(400).json({ error: 'TOKEN_EXPIRED' })

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.update({ where: { id: prt.userId }, data: { passwordHash } })
  await prisma.passwordResetToken.update({ where: { id: prt.id }, data: { usedAt: new Date() } })
  return res.json({ ok: true })
})

export default router
