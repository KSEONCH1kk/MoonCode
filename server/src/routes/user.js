import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import bcrypt from 'bcrypt'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import db from '../db/database.js'
import { authenticate } from '../middleware/auth.js'
import { validateTitle, validateContent, validateUUID, sanitizeText } from '../utils/sanitize.js'

const router = Router()

// ============================================================================
// PROFILE SETTINGS
// ============================================================================

// Get current user profile
router.get('/profile', authenticate, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, email, name, avatar, bio, github, telegram, role, 
             two_factor_enabled, theme_preference, created_at
      FROM users 
      WHERE id = ?
    `).get(req.user.id)

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    res.json(user)
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Ошибка получения профиля' })
  }
})

// Update user profile
router.put('/profile', authenticate, (req, res) => {
  try {
    const { name, email, avatar, bio, github, telegram } = req.body

    // Validate name
    if (name && (name.length < 2 || name.length > 100)) {
      return res.status(400).json({ error: 'Имя должно быть от 2 до 100 символов' })
    }

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Некорректный формат email' })
    }

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.user.id)
      if (existingUser) {
        return res.status(400).json({ error: 'Email уже используется' })
      }
    }

    // Update user
    db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          avatar = COALESCE(?, avatar),
          bio = ?,
          github = ?,
          telegram = ?
      WHERE id = ?
    `).run(
      name || null,
      email || null,
      avatar || null,
      bio || null,
      github || null,
      telegram || null,
      req.user.id
    )

    // Get updated user
    const updatedUser = db.prepare(`
      SELECT id, email, name, avatar, bio, github, telegram, role, two_factor_enabled
      FROM users WHERE id = ?
    `).get(req.user.id)

    res.json(updatedUser)
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Ошибка обновления профиля' })
  }
})

// Change password
router.put('/password', authenticate, (req, res) => {
  try {
    const { current_password, new_password } = req.body

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Все поля обязательны' })
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Новый пароль должен быть минимум 6 символов' })
    }

    // Get current user with password
    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id)

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    // Verify current password
    const validPassword = bcrypt.compareSync(current_password, user.password)
    if (!validPassword) {
      return res.status(400).json({ error: 'Неверный текущий пароль' })
    }

    // Hash new password
    const hashedPassword = bcrypt.hashSync(new_password, 10)

    // Update password
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, req.user.id)

    res.json({ success: true, message: 'Пароль успешно изменен' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Ошибка изменения пароля' })
  }
})

// Get 2FA status
router.get('/2fa/status', authenticate, (req, res) => {
  try {
    const user = db.prepare('SELECT two_factor_enabled, two_factor_secret FROM users WHERE id = ?').get(req.user.id)
    
    res.json({ 
      enabled: user?.two_factor_enabled === 1 || user?.two_factor_enabled === true,
      hasSecret: !!user?.two_factor_secret
    })
  } catch (error) {
    console.error('Get 2FA status error:', error)
    res.status(500).json({ error: 'Ошибка получения статуса 2FA' })
  }
})

// Setup 2FA - generate secret and QR code
router.post('/2fa/setup', authenticate, async (req, res) => {
  try {
    const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(req.user.id)
    
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `MoonCode (${user.email})`,
      issuer: 'MoonCode'
    })

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url)

    // Save secret to database (but don't enable 2FA yet)
    db.prepare('UPDATE users SET two_factor_secret = ? WHERE id = ?').run(secret.base32, req.user.id)

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    })
  } catch (error) {
    console.error('Setup 2FA error:', error)
    res.status(500).json({ error: 'Ошибка настройки 2FA' })
  }
})

// Verify and enable 2FA
router.post('/2fa/verify', authenticate, (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Код обязателен' })
    }

    // Get user secret
    const user = db.prepare('SELECT two_factor_secret FROM users WHERE id = ?').get(req.user.id)

    if (!user || !user.two_factor_secret) {
      return res.status(400).json({ error: 'Сначала настройте 2FA' })
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before/after
    })

    if (!verified) {
      return res.status(400).json({ error: 'Неверный код' })
    }

    // Enable 2FA
    db.prepare('UPDATE users SET two_factor_enabled = 1 WHERE id = ?').run(req.user.id)

    res.json({ 
      success: true, 
      enabled: true,
      message: '2FA успешно включена'
    })
  } catch (error) {
    console.error('Verify 2FA error:', error)
    res.status(500).json({ error: 'Ошибка верификации 2FA' })
  }
})

// Disable 2FA
router.post('/2fa/disable', authenticate, (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Код обязателен для отключения 2FA' })
    }

    // Get user secret
    const user = db.prepare('SELECT two_factor_secret FROM users WHERE id = ?').get(req.user.id)

    if (!user || !user.two_factor_secret) {
      return res.status(400).json({ error: '2FA не настроена' })
    }

    // Verify token before disabling
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 2
    })

    if (!verified) {
      return res.status(400).json({ error: 'Неверный код' })
    }

    // Disable 2FA
    db.prepare('UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?').run(req.user.id)

    res.json({ 
      success: true, 
      enabled: false,
      message: '2FA выключена'
    })
  } catch (error) {
    console.error('Disable 2FA error:', error)
    res.status(500).json({ error: 'Ошибка отключения 2FA' })
  }
})

// Get notifications - REAL implementation
router.get('/notifications', authenticate, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT id, type, title, message, read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(req.user.id)

    res.json(notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read === 1,
      created_at: n.created_at
    })))
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ error: 'Ошибка получения уведомлений' })
  }
})

// Mark notification as read
router.put('/notifications/:id/read', authenticate, (req, res) => {
  try {
    const { id } = req.params

    // Verify notification belongs to user
    const notification = db.prepare('SELECT user_id FROM notifications WHERE id = ?').get(id)
    
    if (!notification) {
      return res.status(404).json({ error: 'Уведомление не найдено' })
    }

    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Доступ запрещен' })
    }

    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id)

    res.json({ success: true })
  } catch (error) {
    console.error('Mark notification read error:', error)
    res.status(500).json({ error: 'Ошибка обновления уведомления' })
  }
})

// Mark all notifications as read
router.put('/notifications/read-all', authenticate, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Mark all notifications read error:', error)
    res.status(500).json({ error: 'Ошибка обновления уведомлений' })
  }
})

// Delete notification
router.delete('/notifications/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params

    // Verify notification belongs to user
    const notification = db.prepare('SELECT user_id FROM notifications WHERE id = ?').get(id)
    
    if (!notification) {
      return res.status(404).json({ error: 'Уведомление не найдено' })
    }

    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Доступ запрещен' })
    }

    db.prepare('DELETE FROM notifications WHERE id = ?').run(id)

    res.json({ success: true })
  } catch (error) {
    console.error('Delete notification error:', error)
    res.status(500).json({ error: 'Ошибка удаления уведомления' })
  }
})

// Helper function to create notification
export function createNotification(userId, type, title, message) {
  try {
    const id = uuid()
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, type, title, message)
    return id
  } catch (error) {
    console.error('Create notification error:', error)
    return null
  }
}

// Update theme preference
router.put('/theme', authenticate, (req, res) => {
  try {
    const { theme } = req.body

    if (!['light', 'dark'].includes(theme)) {
      return res.status(400).json({ error: 'Тема должна быть light или dark' })
    }

    db.prepare('UPDATE users SET theme_preference = ? WHERE id = ?').run(theme, req.user.id)

    res.json({ success: true, theme })
  } catch (error) {
    console.error('Update theme error:', error)
    res.status(500).json({ error: 'Ошибка изменения темы' })
  }
})

// ============================================================================
// EXISTING ROUTES
// ============================================================================

// Get user enrollments with course details and dynamic progress
router.get('/enrollments', authenticate, (req, res) => {
  try {
    const enrollments = db.prepare(`
      SELECT e.*, 
        c.title as course_title, c.slug as course_slug, c.image as course_image,
        c.description as course_description, c.level as course_level,
        c.duration_hours as course_duration, c.category as course_category,
        u.name as teacher_name
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE e.user_id = ?
      ORDER BY e.enrolled_at DESC
    `).all(req.user.id)

    // Calculate dynamic progress for each enrollment
    const result = enrollments.map(e => {
      // Count total lessons in course
      const totalLessons = db.prepare(`
        SELECT COUNT(*) as count 
        FROM lessons l
        JOIN modules m ON l.module_id = m.id
        WHERE m.course_id = ?
      `).get(e.course_id).count

      // Count completed lessons for this user in this course
      const completedLessons = db.prepare(`
        SELECT COUNT(*) as count 
        FROM lesson_progress lp
        JOIN lessons l ON lp.lesson_id = l.id
        JOIN modules m ON l.module_id = m.id
        WHERE lp.user_id = ? AND m.course_id = ? AND lp.status = 'completed'
      `).get(req.user.id, e.course_id).count

      // Calculate progress percentage
      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

      return {
        id: e.id,
        user_id: e.user_id,
        course_id: e.course_id,
        enrolled_at: e.enrolled_at,
        completed_at: e.completed_at,
        progress,
        completedLessons,
        totalLessons,
        status: e.status,
        course: {
          id: e.course_id,
          title: e.course_title,
          slug: e.course_slug,
          image: e.course_image,
          description: e.course_description,
          level: e.course_level,
          duration_hours: e.course_duration,
          category: e.course_category,
          teacher_name: e.teacher_name
        }
      }
    })

    res.json(result)
  } catch (error) {
    console.error('Get enrollments error:', error)
    res.status(500).json({ error: 'Ошибка получения записей' })
  }
})

// Get user statistics
router.get('/stats', authenticate, (req, res) => {
  try {
    // Total lessons completed
    const lessonsCompleted = db.prepare(`
      SELECT COUNT(*) as count FROM lesson_progress 
      WHERE user_id = ? AND status = 'completed'
    `).get(req.user.id).count

    // Total courses completed
    const coursesCompleted = db.prepare(`
      SELECT COUNT(*) as count FROM enrollments 
      WHERE user_id = ? AND status = 'completed'
    `).get(req.user.id).count

    // Total exercises completed
    const exercisesCompleted = db.prepare(`
      SELECT COUNT(*) as count FROM submissions 
      WHERE user_id = ? AND status = 'passed'
    `).get(req.user.id).count

    // Calculate study hours (rough estimate: 10 min per completed lesson)
    const studyHours = Math.round(lessonsCompleted * 10 / 60)

    // Total points
    const pointsResult = db.prepare(`
      SELECT COALESCE(SUM(points_earned), 0) as total FROM submissions 
      WHERE user_id = ?
    `).get(req.user.id)
    const totalPoints = pointsResult.total

    // Calculate rank
    const rankResult = db.prepare(`
      SELECT COUNT(*) + 1 as rank FROM (
        SELECT user_id, SUM(points_earned) as points 
        FROM submissions 
        GROUP BY user_id 
        HAVING points > ?
      )
    `).get(totalPoints)
    const rank = rankResult.rank

    // Activity for last 30 days
    const activity = db.prepare(`
      SELECT DATE(submitted_at) as date, COUNT(*) as count
      FROM submissions
      WHERE user_id = ? AND submitted_at >= DATE('now', '-30 days')
      GROUP BY DATE(submitted_at)
      ORDER BY date
    `).all(req.user.id)

    // Recent activity
    const recentActivity = db.prepare(`
      SELECT 'submission' as type, s.submitted_at as time, 
        CASE s.status WHEN 'passed' THEN 'Выполнено упражнение' ELSE 'Отправлено решение' END as action,
        COALESCE(l.title, 'Задание') as item
      FROM submissions s
      LEFT JOIN exercises e ON s.exercise_id = e.id
      LEFT JOIN lessons l ON e.lesson_id = l.id
      WHERE s.user_id = ?
      UNION ALL
      SELECT 'lesson' as type, lp.completed_at as time, 
        'Пройден урок' as action, l.title as item
      FROM lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.id
      WHERE lp.user_id = ? AND lp.status = 'completed' AND lp.completed_at IS NOT NULL
      ORDER BY time DESC
      LIMIT 10
    `).all(req.user.id, req.user.id)

    res.json({
      lessonsCompleted,
      coursesCompleted,
      exercisesCompleted,
      studyHours,
      totalPoints,
      rank,
      activity,
      recentActivity
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: 'Ошибка получения статистики' })
  }
})

// Get leaderboard
router.get('/leaderboard', (req, res) => {
  try {
    const { period = 'week', limit = 15 } = req.query
    
    let dateFilter = ''
    if (period === 'week') {
      dateFilter = "AND submitted_at >= DATE('now', '-7 days')"
    } else if (period === 'month') {
      dateFilter = "AND submitted_at >= DATE('now', '-30 days')"
    }

    const leaderboard = db.prepare(`
      SELECT u.id, u.name, u.avatar, 
        COALESCE(SUM(s.points_earned), 0) as points,
        COUNT(CASE WHEN s.status = 'passed' THEN 1 END) as solved
      FROM users u
      LEFT JOIN submissions s ON u.id = s.user_id ${dateFilter}
      WHERE u.role = 'student'
      GROUP BY u.id
      HAVING points > 0
      ORDER BY points DESC
      LIMIT ?
    `).all(Number(limit))

    res.json(leaderboard.map((user, index) => ({
      pos: index + 1,
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      points: user.points,
      solved: user.solved
    })))
  } catch (error) {
    console.error('Get leaderboard error:', error)
    res.status(500).json({ error: 'Ошибка получения рейтинга' })
  }
})

// Get discussions
router.get('/discussions', (req, res) => {
  try {
    const { course_id, page = 1, limit = 20 } = req.query
    
    // Validate and sanitize pagination parameters
    const pageNum = Math.max(1, Math.min(100, Number(page) || 1))
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 20))
    const offset = (pageNum - 1) * limitNum

    let query = `
      SELECT d.*, u.name as author_name, u.avatar as author_avatar,
        c.title as course_title,
        (SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = d.id) as replies_count
      FROM discussions d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN courses c ON d.course_id = c.id
    `
    const params = []

    if (course_id) {
      // Validate UUID format
      if (!validateUUID(course_id)) {
        return res.status(400).json({ error: 'Некорректный ID курса' })
      }
      query += ' WHERE d.course_id = ?'
      params.push(course_id)
    }

    query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    const discussions = db.prepare(query).all(...params)

    res.json(discussions.map(d => ({
      id: d.id,
      title: d.title,
      content: d.content,
      course: d.course_title,
      course_id: d.course_id,
      author: d.author_name,
      author_avatar: d.author_avatar,
      replies: d.replies_count,
      created_at: d.created_at,
      time: formatTimeAgo(d.created_at)
    })))
  } catch (error) {
    console.error('Get discussions error:', error)
    res.status(500).json({ error: 'Ошибка получения обсуждений' })
  }
})

// Create discussion
router.post('/discussions', authenticate, (req, res) => {
  try {
    const { title, content, course_id } = req.body
    
    // Validate and sanitize input
    const sanitizedTitle = validateTitle(title)
    const sanitizedContent = validateContent(content)
    
    // Validate course_id if provided
    let validCourseId = null
    if (course_id) {
      if (!validateUUID(course_id)) {
        return res.status(400).json({ error: 'Некорректный ID курса' })
      }
      // Verify course exists
      const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(course_id)
      if (!course) {
        return res.status(404).json({ error: 'Курс не найден' })
      }
      validCourseId = course_id
    }
    
    const id = uuid()

    db.prepare(`
      INSERT INTO discussions (id, user_id, course_id, title, content)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.user.id, validCourseId, sanitizedTitle, sanitizedContent)

    // Get created discussion with author info
    const discussion = db.prepare(`
      SELECT d.*, u.name as author_name, u.avatar as author_avatar,
        c.title as course_title,
        (SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = d.id) as replies_count
      FROM discussions d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN courses c ON d.course_id = c.id
      WHERE d.id = ?
    `).get(id)

    res.status(201).json({
      id: discussion.id,
      title: discussion.title,
      content: discussion.content,
      course: discussion.course_title,
      course_id: discussion.course_id,
      author: discussion.author_name,
      author_avatar: discussion.author_avatar,
      replies: discussion.replies_count,
      created_at: discussion.created_at,
      time: formatTimeAgo(discussion.created_at)
    })
  } catch (error) {
    console.error('Create discussion error:', error)
    if (error.message && (error.message.includes('обязателен') || error.message.includes('должен') || error.message.includes('не должен'))) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Ошибка создания обсуждения' })
  }
})

// Get single discussion with replies
router.get('/discussions/:id', (req, res) => {
  try {
    const { id } = req.params
    
    // Validate UUID format
    if (!validateUUID(id)) {
      return res.status(400).json({ error: 'Некорректный ID обсуждения' })
    }

    // Get discussion
    const discussion = db.prepare(`
      SELECT d.*, u.name as author_name, u.avatar as author_avatar,
        c.title as course_title,
        (SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = d.id) as replies_count
      FROM discussions d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN courses c ON d.course_id = c.id
      WHERE d.id = ?
    `).get(id)

    if (!discussion) {
      return res.status(404).json({ error: 'Обсуждение не найдено' })
    }

    // Get replies
    const replies = db.prepare(`
      SELECT dr.*, u.name as author_name, u.avatar as author_avatar
      FROM discussion_replies dr
      JOIN users u ON dr.user_id = u.id
      WHERE dr.discussion_id = ?
      ORDER BY dr.created_at ASC
    `).all(id)

    res.json({
      id: discussion.id,
      title: discussion.title,
      content: discussion.content,
      course: discussion.course_title,
      course_id: discussion.course_id,
      author: discussion.author_name,
      author_avatar: discussion.author_avatar,
      replies: discussion.replies_count,
      created_at: discussion.created_at,
      time: formatTimeAgo(discussion.created_at),
      replies_list: replies.map(r => ({
        id: r.id,
        content: r.content,
        author: r.author_name,
        author_avatar: r.author_avatar,
        created_at: r.created_at,
        time: formatTimeAgo(r.created_at)
      }))
    })
  } catch (error) {
    console.error('Get discussion error:', error)
    res.status(500).json({ error: 'Ошибка получения обсуждения' })
  }
})

// Create reply to discussion
router.post('/discussions/:id/replies', authenticate, (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body

    // Validate UUID format
    if (!validateUUID(id)) {
      return res.status(400).json({ error: 'Некорректный ID обсуждения' })
    }

    // Validate and sanitize content
    const sanitizedContent = validateContent(content)

    // Check if discussion exists
    const discussion = db.prepare('SELECT id FROM discussions WHERE id = ?').get(id)
    if (!discussion) {
      return res.status(404).json({ error: 'Обсуждение не найдено' })
    }

    const replyId = uuid()

    db.prepare(`
      INSERT INTO discussion_replies (id, discussion_id, user_id, content)
      VALUES (?, ?, ?, ?)
    `).run(replyId, id, req.user.id, sanitizedContent)

    // Get created reply with author info
    const reply = db.prepare(`
      SELECT dr.*, u.name as author_name, u.avatar as author_avatar
      FROM discussion_replies dr
      JOIN users u ON dr.user_id = u.id
      WHERE dr.id = ?
    `).get(replyId)

    res.status(201).json({
      id: reply.id,
      content: reply.content,
      author: reply.author_name,
      author_avatar: reply.author_avatar,
      created_at: reply.created_at,
      time: formatTimeAgo(reply.created_at)
    })
  } catch (error) {
    console.error('Create reply error:', error)
    if (error.message && (error.message.includes('обязателен') || error.message.includes('должен') || error.message.includes('не должен'))) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Ошибка создания ответа' })
  }
})

// Helper function
function formatTimeAgo(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes} мин. назад`
  if (hours < 24) return `${hours} ч. назад`
  if (days === 1) return 'вчера'
  return `${days} дн. назад`
}

// ============================================
// STREAK & ACHIEVEMENTS
// ============================================

// Get user streak and gems
router.get('/streak', authenticate, (req, res) => {
  try {
    const userId = req.user.id
    const user = db.prepare(`
      SELECT streak_count, streak_freeze_count, gems, last_activity_date, achievements
      FROM users WHERE id = ?
    `).get(userId)

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    res.json({
      streak: user.streak_count || 0,
      freezes: user.streak_freeze_count || 0,
      gems: user.gems || 0,
      lastActivity: user.last_activity_date,
      achievements: user.achievements ? JSON.parse(user.achievements) : []
    })
  } catch (error) {
    console.error('Get streak error:', error)
    res.status(500).json({ error: 'Ошибка получения стрейка' })
  }
})

// Record activity and update streak
router.post('/activity', authenticate, (req, res) => {
  try {
    const userId = req.user.id
    const today = new Date().toISOString().split('T')[0]
    
    const user = db.prepare(`
      SELECT streak_count, last_activity_date, streak_freeze_count
      FROM users WHERE id = ?
    `).get(userId)

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    let newStreak = user.streak_count || 0
    const lastActivity = user.last_activity_date
    
    // If activity today already recorded, just return current streak
    if (lastActivity === today) {
      return res.json({ 
        streak: newStreak, 
        message: 'Активность уже отмечена сегодня'
      })
    }

    // Calculate if streak should continue
    if (lastActivity) {
      const lastDate = new Date(lastActivity)
      const todayDate = new Date(today)
      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        // Consecutive day
        newStreak += 1
      } else if (diffDays === 2 && user.streak_freeze_count > 0) {
        // Missed yesterday but have freeze
        newStreak += 1
        db.prepare('UPDATE users SET streak_freeze_count = streak_freeze_count - 1 WHERE id = ?').run(userId)
        createNotification(db, userId, 'streak', 'Streak Freeze использована!', 'Ваш стрейк сохранен благодаря Streak Freeze')
      } else if (diffDays > 1) {
        // Streak broken
        if (newStreak >= 7) {
          createNotification(db, userId, 'streak', 'Стрейк сброшен', `Ваш ${newStreak}-дневный стрейк сброшен. Начните заново!`)
        }
        newStreak = 1
      }
    } else {
      // First activity
      newStreak = 1
    }

    // Update user
    db.prepare(`
      UPDATE users 
      SET streak_count = ?, last_activity_date = ?
      WHERE id = ?
    `).run(newStreak, today, userId)

    // Check achievements
    checkStreakAchievements(db, userId, newStreak)

    res.json({ 
      streak: newStreak,
      message: newStreak === 1 ? 'Стрейк начат!' : `${newStreak} дней подряд!`
    })
  } catch (error) {
    console.error('Record activity error:', error)
    res.status(500).json({ error: 'Ошибка записи активности' })
  }
})

// Buy streak freeze
router.post('/streak-freeze/buy', authenticate, (req, res) => {
  try {
    const userId = req.user.id
    const FREEZE_COST = 100

    const user = db.prepare('SELECT gems FROM users WHERE id = ?').get(userId)
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    if (user.gems < FREEZE_COST) {
      return res.status(400).json({ error: 'Недостаточно алмазов' })
    }

    // Deduct gems and add freeze
    db.prepare(`
      UPDATE users 
      SET gems = gems - ?, streak_freeze_count = streak_freeze_count + 1
      WHERE id = ?
    `).run(FREEZE_COST, userId)

    createNotification(db, userId, 'achievement', 'Streak Freeze куплена!', 'Теперь вы можете пропустить один день без потери стрейка')

    const updatedUser = db.prepare('SELECT gems, streak_freeze_count FROM users WHERE id = ?').get(userId)

    res.json({ 
      gems: updatedUser.gems,
      freezes: updatedUser.streak_freeze_count,
      message: 'Streak Freeze куплена!'
    })
  } catch (error) {
    console.error('Buy freeze error:', error)
    res.status(500).json({ error: 'Ошибка покупки' })
  }
})

// Add gems (called after test/practice completion)
router.post('/gems/add', authenticate, (req, res) => {
  try {
    const userId = req.user.id
    const { amount, reason } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Неверное количество алмазов' })
    }

    db.prepare('UPDATE users SET gems = gems + ? WHERE id = ?').run(amount, userId)

    const user = db.prepare('SELECT gems FROM users WHERE id = ?').get(userId)

    // Create notification
    createNotification(db, userId, 'achievement', 'Алмазы получены!', `+${amount} 💎 за ${reason || 'выполнение задания'}`)

    res.json({ 
      gems: user.gems,
      added: amount,
      message: `Получено ${amount} алмазов!`
    })
  } catch (error) {
    console.error('Add gems error:', error)
    res.status(500).json({ error: 'Ошибка начисления алмазов' })
  }
})

// Get achievements
router.get('/achievements', authenticate, (req, res) => {
  try {
    const userId = req.user.id
    const user = db.prepare('SELECT achievements FROM users WHERE id = ?').get(userId)

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    const achievements = user.achievements ? JSON.parse(user.achievements) : []
    
    // Define all available achievements
    const allAchievements = [
      { id: 'streak_3', title: '3 дня подряд', description: 'Занимайтесь 3 дня подряд', icon: '🔥', unlocked: achievements.includes('streak_3') },
      { id: 'streak_7', title: 'Неделя стрейка', description: 'Занимайтесь 7 дней подряд', icon: '⚡', unlocked: achievements.includes('streak_7') },
      { id: 'streak_14', title: '2 недели стрейка', description: 'Занимайтесь 14 дней подряд', icon: '💪', unlocked: achievements.includes('streak_14') },
      { id: 'streak_30', title: 'Месяц стрейка', description: 'Занимайтесь 30 дней подряд', icon: '🏆', unlocked: achievements.includes('streak_30') },
      { id: 'streak_100', title: '100 дней стрейка', description: 'Занимайтесь 100 дней подряд', icon: '👑', unlocked: achievements.includes('streak_100') },
      { id: 'gems_100', title: 'Первые 100 алмазов', description: 'Заработайте 100 алмазов', icon: '💎', unlocked: achievements.includes('gems_100') },
      { id: 'gems_500', title: '500 алмазов', description: 'Заработайте 500 алмазов', icon: '💠', unlocked: achievements.includes('gems_500') },
      { id: 'gems_1000', title: '1000 алмазов', description: 'Заработайте 1000 алмазов', icon: '💍', unlocked: achievements.includes('gems_1000') },
    ]

    res.json({ achievements: allAchievements })
  } catch (error) {
    console.error('Get achievements error:', error)
    res.status(500).json({ error: 'Ошибка получения достижений' })
  }
})

// Helper function to check and unlock streak achievements
function checkStreakAchievements(db, userId, streak) {
  const user = db.prepare('SELECT achievements FROM users WHERE id = ?').get(userId)
  const achievements = user.achievements ? JSON.parse(user.achievements) : []

  const streakMilestones = [
    { count: 3, id: 'streak_3', title: '3 дня подряд' },
    { count: 7, id: 'streak_7', title: 'Неделя стрейка' },
    { count: 14, id: 'streak_14', title: '2 недели стрейка' },
    { count: 30, id: 'streak_30', title: 'Месяц стрейка' },
    { count: 100, id: 'streak_100', title: '100 дней стрейка' }
  ]

  for (const milestone of streakMilestones) {
    if (streak >= milestone.count && !achievements.includes(milestone.id)) {
      achievements.push(milestone.id)
      db.prepare('UPDATE users SET achievements = ? WHERE id = ?').run(JSON.stringify(achievements), userId)
      createNotification(db, userId, 'achievement', 'Достижение разблокировано!', `🎉 ${milestone.title}`)
    }
  }
}

export default router

