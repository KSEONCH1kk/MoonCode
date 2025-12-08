import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import db from '../db/database.js'
import { authenticate, optionalAuth, requireTeacher, requireAdmin } from '../middleware/auth.js'

const router = Router()

// Get all unique categories and tags (public)
router.get('/meta', (req, res) => {
  try {
    // Get all unique categories from published courses
    const categories = db.prepare(`
      SELECT DISTINCT category 
      FROM courses 
      WHERE is_published = 1 AND category IS NOT NULL AND category != ''
      ORDER BY category
    `).all().map(row => row.category)

    // Get all unique tags from published courses
    const allCourses = db.prepare(`
      SELECT tags FROM courses WHERE is_published = 1 AND tags IS NOT NULL AND tags != ''
    `).all()
    
    const tagSet = new Set()
    allCourses.forEach(course => {
      try {
        const tags = JSON.parse(course.tags || '[]')
        tags.forEach(tag => tagSet.add(tag))
      } catch (e) {
        // Ignore invalid JSON
      }
    })
    
    const tags = Array.from(tagSet).sort()

    res.json({ categories, tags })
  } catch (error) {
    console.error('Get courses meta error:', error)
    res.status(500).json({ error: 'Ошибка получения метаданных курсов' })
  }
})

// Get all courses (public)
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, level, search, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let query = `
      SELECT c.*, u.name as teacher_name, u.avatar as teacher_avatar,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as students_count,
        (SELECT AVG(rating) FROM reviews WHERE course_id = c.id) as avg_rating
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.is_published = 1
    `
    const params = []

    if (category) {
      query += ' AND c.category = ?'
      params.push(category)
    }

    if (level) {
      query += ' AND c.level = ?'
      params.push(level)
    }

    if (search) {
      query += ' AND (c.title LIKE ? OR c.description LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(limit), Number(offset))

    const courses = db.prepare(query).all(...params)

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM courses WHERE is_published = 1'
    const countParams = []
    if (category) {
      countQuery += ' AND category = ?'
      countParams.push(category)
    }
    if (level) {
      countQuery += ' AND level = ?'
      countParams.push(level)
    }
    const { count } = db.prepare(countQuery).get(...countParams)

    res.json({
      courses: courses.map(c => ({ ...c, tags: JSON.parse(c.tags || '[]') })),
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / limit)
    })
  } catch (error) {
    console.error('Get courses error:', error)
    res.status(500).json({ error: 'Ошибка получения курсов' })
  }
})

// Get lesson by ID only (for student learning page) - must be before /:slug
router.get('/lessons/:lessonId', authenticate, (req, res) => {
  try {
    // Get lesson with course info
    const lesson = db.prepare(`
      SELECT l.*, m.course_id, m.title as module_title, c.title as course_title, c.slug as course_slug
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE l.id = ?
    `).get(req.params.lessonId)

    if (!lesson) {
      return res.status(404).json({ error: 'Урок не найден' })
    }

    // Check enrollment (allow free lessons)
    const enrollment = db.prepare(`
      SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?
    `).get(req.user.id, lesson.course_id)

    if (!enrollment && !lesson.is_free) {
      return res.status(403).json({ error: 'Вы не записаны на этот курс' })
    }

    // Get exercise if practice lesson
    let exercise = null
    if (lesson.type === 'practice') {
      exercise = db.prepare(`
        SELECT * FROM exercises WHERE lesson_id = ?
      `).get(lesson.id)
      
      if (exercise) {
        exercise.test_cases = JSON.parse(exercise.test_cases || '[]')
        exercise.hints = JSON.parse(exercise.hints || '[]')
        // Don't send solution to student
        delete exercise.solution_code
      }
    }

    // Get attachments
    const attachments = db.prepare(`
      SELECT * FROM lesson_attachments WHERE lesson_id = ? ORDER BY created_at DESC
    `).all(lesson.id)

    // Get progress
    let progress = db.prepare(`
      SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?
    `).get(req.user.id, lesson.id)

    if (!progress) {
      const progressId = uuid()
      db.prepare(`
        INSERT INTO lesson_progress (id, user_id, lesson_id, status)
        VALUES (?, ?, ?, 'in_progress')
      `).run(progressId, req.user.id, lesson.id)
      progress = { status: 'in_progress' }
    }

    // Get all lessons in course for navigation
    const allLessons = db.prepare(`
      SELECT l.id, l.title, l.type, l.order_index, m.order_index as module_order
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      WHERE m.course_id = ?
      ORDER BY m.order_index, l.order_index
    `).all(lesson.course_id)

    const currentIndex = allLessons.findIndex(l => l.id === lesson.id)
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

    res.json({ 
      lesson, 
      exercise, 
      progress,
      attachments,
      navigation: {
        prev: prevLesson,
        next: nextLesson,
        total: allLessons.length,
        current: currentIndex + 1
      }
    })
  } catch (error) {
    console.error('Get lesson error:', error)
    res.status(500).json({ error: 'Ошибка получения урока' })
  }
})

// Get course by slug (public)
router.get('/:slug', optionalAuth, (req, res) => {
  try {
    const course = db.prepare(`
      SELECT c.*, u.name as teacher_name, u.avatar as teacher_avatar, u.bio as teacher_bio,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as students_count,
        (SELECT AVG(rating) FROM reviews WHERE course_id = c.id) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE course_id = c.id) as reviews_count
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.slug = ?
    `).get(req.params.slug)

    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' })
    }

    // Get modules and lessons with progress
    const modules = db.prepare(`
      SELECT * FROM modules WHERE course_id = ? ORDER BY order_index
    `).all(course.id)

    for (const module of modules) {
      const lessons = db.prepare(`
        SELECT id, title, type, duration_minutes, order_index, is_free
        FROM lessons WHERE module_id = ? ORDER BY order_index
      `).all(module.id)

      // Add completion status for authenticated user
      module.lessons = lessons.map(lesson => {
        let completed = false
        if (req.user) {
          const progress = db.prepare(`
            SELECT status FROM lesson_progress WHERE user_id = ? AND lesson_id = ?
          `).get(req.user.id, lesson.id)
          completed = progress?.status === 'completed'
        }
        return { ...lesson, completed }
      })
    }

    // Check if user is enrolled
    let enrollment = null
    if (req.user) {
      enrollment = db.prepare(`
        SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?
      `).get(req.user.id, course.id)
    }

    // Get reviews
    const reviews = db.prepare(`
      SELECT r.*, u.name as user_name, u.avatar as user_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.course_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `).all(course.id)

    res.json({
      ...course,
      tags: JSON.parse(course.tags || '[]'),
      modules,
      enrollment,
      reviews
    })
  } catch (error) {
    console.error('Get course error:', error)
    res.status(500).json({ error: 'Ошибка получения курса' })
  }
})

// Enroll in course
router.post('/:id/enroll', authenticate, (req, res) => {
  try {
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id)
    
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' })
    }

    // Check if already enrolled
    const existing = db.prepare(`
      SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?
    `).get(req.user.id, course.id)

    if (existing) {
      return res.status(400).json({ error: 'Вы уже записаны на этот курс' })
    }

    // Check if course is paid
    if (!course.is_free && course.price > 0) {
      // Here you would integrate payment processing
      return res.status(402).json({ error: 'Требуется оплата', price: course.price })
    }

    // Create enrollment
    const id = uuid()
    db.prepare(`
      INSERT INTO enrollments (id, user_id, course_id, status)
      VALUES (?, ?, ?, 'active')
    `).run(id, req.user.id, course.id)

    const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(id)

    // Create notification for teacher
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, link)
      VALUES (?, ?, 'new_student', 'Новый студент', ?, ?)
    `).run(uuid(), course.teacher_id, `${req.user.name} записался на курс "${course.title}"`, `/teacher/courses/${course.id}/students`)

    res.status(201).json(enrollment)
  } catch (error) {
    console.error('Enroll error:', error)
    res.status(500).json({ error: 'Ошибка записи на курс' })
  }
})

// Get course lesson (legacy, requires courseId)
router.get('/:courseId/lessons/:lessonId', authenticate, (req, res) => {
  try {
    // Check enrollment
    const enrollment = db.prepare(`
      SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?
    `).get(req.user.id, req.params.courseId)

    if (!enrollment) {
      return res.status(403).json({ error: 'Вы не записаны на этот курс' })
    }

    const lesson = db.prepare(`
      SELECT l.*, m.course_id
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      WHERE l.id = ? AND m.course_id = ?
    `).get(req.params.lessonId, req.params.courseId)

    if (!lesson) {
      return res.status(404).json({ error: 'Урок не найден' })
    }

    // Get exercise if practice lesson
    let exercise = null
    if (lesson.type === 'practice') {
      exercise = db.prepare(`
        SELECT * FROM exercises WHERE lesson_id = ?
      `).get(lesson.id)
      
      if (exercise) {
        exercise.test_cases = JSON.parse(exercise.test_cases || '[]')
        exercise.hints = JSON.parse(exercise.hints || '[]')
      }
    }

    // Get or create progress
    let progress = db.prepare(`
      SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?
    `).get(req.user.id, lesson.id)

    if (!progress) {
      const progressId = uuid()
      db.prepare(`
        INSERT INTO lesson_progress (id, user_id, lesson_id, status)
        VALUES (?, ?, ?, 'in_progress')
      `).run(progressId, req.user.id, lesson.id)
      progress = { status: 'in_progress' }
    }

    res.json({ lesson, exercise, progress })
  } catch (error) {
    console.error('Get lesson error:', error)
    res.status(500).json({ error: 'Ошибка получения урока' })
  }
})

// Complete lesson (simple version - just lessonId)
router.post('/lessons/:lessonId/complete', authenticate, (req, res) => {
  try {
    const { lessonId } = req.params

    // Get course ID from lesson
    const lesson = db.prepare(`
      SELECT l.*, m.course_id
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      WHERE l.id = ?
    `).get(lessonId)

    if (!lesson) {
      return res.status(404).json({ error: 'Урок не найден' })
    }

    const courseId = lesson.course_id

    // Check/Create lesson_progress record
    const existingProgress = db.prepare(`
      SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?
    `).get(req.user.id, lessonId)

    if (existingProgress) {
      db.prepare(`
        UPDATE lesson_progress 
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND lesson_id = ?
      `).run(req.user.id, lessonId)
    } else {
      db.prepare(`
        INSERT INTO lesson_progress (id, user_id, lesson_id, status, completed_at)
        VALUES (?, ?, ?, 'completed', CURRENT_TIMESTAMP)
      `).run(uuid(), req.user.id, lessonId)
    }

    // Update course progress
    const totalLessons = db.prepare(`
      SELECT COUNT(*) as count FROM lessons l
      JOIN modules m ON l.module_id = m.id
      WHERE m.course_id = ?
    `).get(courseId).count

    const completedLessons = db.prepare(`
      SELECT COUNT(*) as count FROM lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      WHERE lp.user_id = ? AND m.course_id = ? AND lp.status = 'completed'
    `).get(req.user.id, courseId).count

    const progress = Math.round((completedLessons / totalLessons) * 100)

    db.prepare(`
      UPDATE enrollments SET progress = ? WHERE user_id = ? AND course_id = ?
    `).run(progress, req.user.id, courseId)

    // Check if course completed
    if (progress === 100) {
      db.prepare(`
        UPDATE enrollments SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND course_id = ?
      `).run(req.user.id, courseId)
    }

    res.json({ progress, completed: progress === 100, completedLessons, totalLessons })
  } catch (error) {
    console.error('Complete lesson error:', error)
    res.status(500).json({ error: 'Ошибка завершения урока' })
  }
})

// Complete lesson (with courseId - legacy)
router.post('/:courseId/lessons/:lessonId/complete', authenticate, (req, res) => {
  try {
    db.prepare(`
      UPDATE lesson_progress 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND lesson_id = ?
    `).run(req.user.id, req.params.lessonId)

    // Update course progress
    const totalLessons = db.prepare(`
      SELECT COUNT(*) as count FROM lessons l
      JOIN modules m ON l.module_id = m.id
      WHERE m.course_id = ?
    `).get(req.params.courseId).count

    const completedLessons = db.prepare(`
      SELECT COUNT(*) as count FROM lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      WHERE lp.user_id = ? AND m.course_id = ? AND lp.status = 'completed'
    `).get(req.user.id, req.params.courseId).count

    const progress = Math.round((completedLessons / totalLessons) * 100)

    db.prepare(`
      UPDATE enrollments SET progress = ? WHERE user_id = ? AND course_id = ?
    `).run(progress, req.user.id, req.params.courseId)

    // Check if course completed
    if (progress === 100) {
      db.prepare(`
        UPDATE enrollments SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND course_id = ?
      `).run(req.user.id, req.params.courseId)
    }

    res.json({ progress, completed: progress === 100 })
  } catch (error) {
    console.error('Complete lesson error:', error)
    res.status(500).json({ error: 'Ошибка завершения урока' })
  }
})

// Create course (teacher/admin)
router.post('/', authenticate, requireTeacher, (req, res) => {
  try {
    const { title, description, short_description, image, price, duration_hours, level, category, tags, is_free, teacher_id } = req.body

    const id = uuid()
    const slug = title.toLowerCase().replace(/[^a-zа-я0-9]+/g, '-').replace(/^-|-$/g, '')

    // Only allow admin to set teacher_id, otherwise use current user's id
    const finalTeacherId = req.user.role === 'admin' && teacher_id 
      ? teacher_id 
      : req.user.id

    db.prepare(`
      INSERT INTO courses (id, title, slug, description, short_description, image, price, duration_hours, level, category, tags, is_free, teacher_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, slug, description, short_description, image, price || 0, duration_hours || 0, level || 'beginner', category, JSON.stringify(tags || []), is_free ? 1 : 0, finalTeacherId)

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id)
    res.status(201).json({ ...course, tags: JSON.parse(course.tags || '[]') })
  } catch (error) {
    console.error('Create course error:', error)
    res.status(500).json({ error: 'Ошибка создания курса' })
  }
})

// Update course (teacher/admin)
router.put('/:id', authenticate, requireTeacher, (req, res) => {
  try {
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id)
    
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' })
    }

    // Only allow teacher who created it or admin
    if (course.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    const { title, description, short_description, image, price, duration_hours, level, category, tags, is_free, is_published, teacher_id } = req.body

    // Convert boolean to integer for SQLite
    const isPublishedInt = is_published !== undefined ? (is_published ? 1 : 0) : null
    const isFreeInt = is_free !== undefined ? (is_free ? 1 : 0) : null

    // Only allow admin to change teacher_id, otherwise keep current teacher_id
    const finalTeacherId = req.user.role === 'admin' && teacher_id !== undefined 
      ? (teacher_id || null) 
      : course.teacher_id

    db.prepare(`
      UPDATE courses SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        short_description = COALESCE(?, short_description),
        image = COALESCE(?, image),
        price = COALESCE(?, price),
        duration_hours = COALESCE(?, duration_hours),
        level = COALESCE(?, level),
        category = COALESCE(?, category),
        tags = COALESCE(?, tags),
        is_free = COALESCE(?, is_free),
        is_published = COALESCE(?, is_published),
        teacher_id = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, short_description, image, price, duration_hours, level, category, tags ? JSON.stringify(tags) : null, isFreeInt, isPublishedInt, finalTeacherId, req.params.id)

    const updated = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id)
    res.json({ ...updated, tags: JSON.parse(updated.tags || '[]') })
  } catch (error) {
    console.error('Update course error:', error)
    res.status(500).json({ error: 'Ошибка обновления курса' })
  }
})

// Delete course (admin only)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id)
    res.json({ message: 'Курс удален' })
  } catch (error) {
    console.error('Delete course error:', error)
    res.status(500).json({ error: 'Ошибка удаления курса' })
  }
})

export default router

