import { verifyAccessToken } from '../lib/security.js'

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.access_token
    if (!token) return res.status(401).json({ error: 'UNAUTHENTICATED' })
    const payload = verifyAccessToken(token)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'UNAUTHENTICATED' })
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHENTICATED' })
    if (req.user.role !== role) return res.status(403).json({ error: 'FORBIDDEN' })
    next()
  }
}
