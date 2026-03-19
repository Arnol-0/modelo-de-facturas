import crypto from 'crypto'
import jwt from 'jsonwebtoken'

export function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' })
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET)
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET)
}

export function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex')
}

export function randomToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function cookieOptions() {
  const secure = String(process.env.COOKIE_SECURE || 'false') === 'true'
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
  }
}
