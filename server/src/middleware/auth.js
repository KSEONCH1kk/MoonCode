import jwt from 'jsonwebtoken'
import db from '../db/database.js'

const JWT_SECRET = process.env.JWT_SECRET || 'mooncode-school-secret-key-2024'

// Generate JWT token
export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      name: user.name 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// Auth middleware - requires valid token
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' })
  }

  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token)

  if (!decoded) {
    return res.status(401).json({ error: 'Недействительный токен' })
  }

  // Get fresh user data
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id)
  
  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'Пользователь не найден или заблокирован' })
  }

  req.user = user
  next()
}

// Optional auth - doesn't require token but attaches user if present
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (decoded) {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id)
      if (user && user.is_active) {
        req.user = user
      }
    }
  }
  
  next()
}

// Role-based access control
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется авторизация' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' })
    }

    next()
  }
}

// Require admin
export const requireAdmin = requireRole('admin')

// Require teacher or admin
export const requireTeacher = requireRole('teacher', 'admin')

// Require any authenticated user
export const requireAuth = authenticate

export default { 
  authenticate, 
  optionalAuth, 
  requireRole, 
  requireAdmin, 
  requireTeacher,
  generateToken, 
  verifyToken 
}

