import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import bcrypt from 'bcryptjs'
import db from '../db/database.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin)

// Dashboard stats
router.get('/stats', (req, res) => {
  try {
    const stats = {
      users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      students: db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count,
      teachers: db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'").get().count,
      courses: db.prepare('SELECT COUNT(*) as count FROM courses').get().count,
      published_courses: db.prepare('SELECT COUNT(*) as count FROM courses WHERE is_published = 1').get().count,
      enrollments: db.prepare('SELECT COUNT(*) as count FROM enrollments').get().count,
      submissions: db.prepare('SELECT COUNT(*) as count FROM submissions').get().count,
      revenue: db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'completed'").get().total,
    }

    // Recent activity
    const recentUsers = db.prepare(`
      SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5
    `).all()

    const recentEnrollments = db.prepare(`
      SELECT e.*, u.name as user_name, c.title as course_title
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      JOIN courses c ON e.course_id = c.id
      ORDER BY e.enrolled_at DESC LIMIT 5
    `).all()

    res.json({ stats, recentUsers, recentEnrollments })
  } catch (error) {
    console.error('Admin stats error:', error)
    res.status(500).json({ error: 'Ошибка получения статистики' })
  }
})

// Get all users
router.get('/users', (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let query = 'SELECT id, email, name, avatar, role, is_active, created_at, last_login FROM users WHERE 1=1'
    const params = []

    if (role) {
      query += ' AND role = ?'
      params.push(role)
    }

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(limit), Number(offset))

    const users = db.prepare(query).all(...params)
    const { count } = db.prepare('SELECT COUNT(*) as count FROM users').get()

    res.json({ users, total: count, page: Number(page), totalPages: Math.ceil(count / limit) })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Ошибка получения пользователей' })
  }
})

// Create user
router.post('/users', (req, res) => {
  try {
    const { email, password, name, role } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, пароль и имя обязательны' })
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' })
    }

    const id = uuid()
    const hashedPassword = bcrypt.hashSync(password, 10)
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`

    db.prepare(`
      INSERT INTO users (id, email, password, name, avatar, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, email, hashedPassword, name, avatar, role || 'student')

    const user = db.prepare('SELECT id, email, name, avatar, role, created_at FROM users WHERE id = ?').get(id)
    res.status(201).json(user)
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ error: 'Ошибка создания пользователя' })
  }
})

// Update user
router.put('/users/:id', (req, res) => {
  try {
    const { name, email, role, is_active, password } = req.body

    let updateQuery = `
      UPDATE users SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        role = COALESCE(?, role),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    db.prepare(updateQuery).run(name, email, role, is_active, req.params.id)

    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10)
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, req.params.id)
    }

    const user = db.prepare('SELECT id, email, name, avatar, role, is_active, created_at FROM users WHERE id = ?').get(req.params.id)
    res.json(user)
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Ошибка обновления пользователя' })
  }
})

// Delete user
router.delete('/users/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
    res.json({ message: 'Пользователь удален' })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'Ошибка удаления пользователя' })
  }
})

// Get all courses (including unpublished)
router.get('/courses', (req, res) => {
  try {
    const courses = db.prepare(`
      SELECT c.*, u.name as teacher_name,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as students_count
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      ORDER BY c.created_at DESC
    `).all()

    res.json(courses.map(c => ({ ...c, tags: JSON.parse(c.tags || '[]') })))
  } catch (error) {
    console.error('Get courses error:', error)
    res.status(500).json({ error: 'Ошибка получения курсов' })
  }
})

// Get course students
router.get('/courses/:courseId/students', (req, res) => {
  try {
    const { courseId } = req.params
    const enrollments = db.prepare(`
      SELECT e.*, u.name as user_name, u.email as user_email, u.id as user_id
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      WHERE e.course_id = ?
      ORDER BY e.enrolled_at DESC
    `).all(courseId)

    res.json(enrollments)
  } catch (error) {
    console.error('Get course students error:', error)
    res.status(500).json({ error: 'Ошибка получения студентов курса' })
  }
})

// Enroll user to course (admin can add users for free)
router.post('/courses/:courseId/enroll', (req, res) => {
  try {
    const { courseId } = req.params
    const { user_id } = req.body

    if (!user_id) {
      return res.status(400).json({ error: 'user_id обязателен' })
    }

    // Check if user exists
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id)
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    // Check if course exists
    const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId)
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' })
    }

    // Check if already enrolled
    const existing = db.prepare('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?').get(user_id, courseId)
    if (existing) {
      return res.status(400).json({ error: 'Пользователь уже записан на курс' })
    }

    // Create enrollment
    const enrollmentId = uuid()
    db.prepare(`
      INSERT INTO enrollments (id, user_id, course_id, status, enrolled_at)
      VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP)
    `).run(enrollmentId, user_id, courseId)

    res.json({ message: 'Пользователь успешно добавлен к курсу', enrollment_id: enrollmentId })
  } catch (error) {
    console.error('Enroll user error:', error)
    res.status(500).json({ error: 'Ошибка добавления пользователя к курсу' })
  }
})

// Remove user from course
router.delete('/enrollments/:enrollmentId', (req, res) => {
  try {
    const { enrollmentId } = req.params

    const enrollment = db.prepare('SELECT id FROM enrollments WHERE id = ?').get(enrollmentId)
    if (!enrollment) {
      return res.status(404).json({ error: 'Запись не найдена' })
    }

    db.prepare('DELETE FROM enrollments WHERE id = ?').run(enrollmentId)

    res.json({ message: 'Пользователь удален из курса' })
  } catch (error) {
    console.error('Remove enrollment error:', error)
    res.status(500).json({ error: 'Ошибка удаления пользователя из курса' })
  }
})

// Get all transactions
router.get('/transactions', (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let query = `
      SELECT t.*, u.name as user_name, u.email as user_email, c.title as course_title
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN courses c ON t.course_id = c.id
      WHERE 1=1
    `
    const params = []

    if (status) {
      query += ' AND t.status = ?'
      params.push(status)
    }

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(limit), Number(offset))

    const transactions = db.prepare(query).all(...params)
    const { count } = db.prepare('SELECT COUNT(*) as count FROM transactions').get()

    res.json({ transactions, total: count, page: Number(page), totalPages: Math.ceil(count / limit) })
  } catch (error) {
    console.error('Get transactions error:', error)
    res.status(500).json({ error: 'Ошибка получения транзакций' })
  }
})

// System settings (placeholder)
router.get('/settings', (req, res) => {
  res.json({
    siteName: 'MoonCode School',
    allowRegistration: true,
    emailNotifications: true,
    maintenanceMode: false,
  })
})

router.put('/settings', (req, res) => {
  // Save settings to database or config file
  res.json({ message: 'Настройки сохранены' })
})

export default router

