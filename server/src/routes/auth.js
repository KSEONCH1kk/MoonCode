import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import speakeasy from 'speakeasy'
import db from '../db/database.js'
import { generateToken, authenticate } from '../middleware/auth.js'

const router = Router()

// Register
router.post('/register', (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Все поля обязательны' })
    }

    // Check if email exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' })
    }

    // Create user
    const id = uuid()
    const hashedPassword = bcrypt.hashSync(password, 10)
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`

    db.prepare(`
      INSERT INTO users (id, email, password, name, avatar, role)
      VALUES (?, ?, ?, ?, ?, 'student')
    `).run(id, email, hashedPassword, name, avatar)

    const user = db.prepare('SELECT id, email, name, avatar, role FROM users WHERE id = ?').get(id)
    const token = generateToken(user)

    res.status(201).json({ user, token })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Ошибка регистрации' })
  }
})

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password, twoFactorToken } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' })
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)

    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' })
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Аккаунт заблокирован' })
    }

    const validPassword = bcrypt.compareSync(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' })
    }

    // Check if 2FA is enabled
    if (user.two_factor_enabled && user.two_factor_secret) {
      if (!twoFactorToken) {
        return res.status(200).json({ 
          requiresTwoFactor: true,
          message: 'Введите код из приложения аутентификации'
        })
      }

      // Verify 2FA token
      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: twoFactorToken,
        window: 2
      })

      if (!verified) {
        return res.status(401).json({ error: 'Неверный код аутентификации' })
      }
    }

    // Update last login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id)

    const token = generateToken(user)
    const { password: _, two_factor_secret: __, ...userWithoutPassword } = user

    res.json({ user: userWithoutPassword, token })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Ошибка входа' })
  }
})

// Get current user
router.get('/me', authenticate, (req, res) => {
  const { password: _, ...user } = req.user
  res.json(user)
})

// Update profile
router.put('/profile', authenticate, (req, res) => {
  try {
    const { name, bio, github, telegram, avatar } = req.body

    db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name),
          bio = COALESCE(?, bio),
          github = COALESCE(?, github),
          telegram = COALESCE(?, telegram),
          avatar = COALESCE(?, avatar),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, bio, github, telegram, avatar, req.user.id)

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
    const { password: _, ...userWithoutPassword } = user

    res.json(userWithoutPassword)
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Ошибка обновления профиля' })
  }
})

// Change password
router.put('/password', authenticate, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Все поля обязательны' })
    }

    const validPassword = bcrypt.compareSync(currentPassword, req.user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный текущий пароль' })
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10)
    db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(hashedPassword, req.user.id)

    res.json({ message: 'Пароль успешно изменен' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Ошибка смены пароля' })
  }
})

export default router

