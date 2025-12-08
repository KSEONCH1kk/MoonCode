import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import db from '../db/database.js'
import { authenticate, requireTeacher } from '../middleware/auth.js'

const router = Router()

// All teacher routes require authentication and teacher/admin role
router.use(authenticate, requireTeacher)

// Dashboard stats for teacher
router.get('/stats', (req, res) => {
  try {
    const teacherId = req.user.id

    const stats = {
      courses: db.prepare('SELECT COUNT(*) as count FROM courses WHERE teacher_id = ?').get(teacherId).count,
      published_courses: db.prepare('SELECT COUNT(*) as count FROM courses WHERE teacher_id = ? AND is_published = 1').get(teacherId).count,
      total_students: db.prepare(`
        SELECT COUNT(DISTINCT e.user_id) as count 
        FROM enrollments e 
        JOIN courses c ON e.course_id = c.id 
        WHERE c.teacher_id = ?
      `).get(teacherId).count,
      pending_submissions: db.prepare(`
        SELECT COUNT(*) as count 
        FROM submissions s
        JOIN exercises ex ON s.exercise_id = ex.id
        JOIN lessons l ON ex.lesson_id = l.id
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        WHERE c.teacher_id = ? AND s.status = 'needs_review'
      `).get(teacherId).count,
    }

    // Recent submissions
    const recentSubmissions = db.prepare(`
      SELECT s.*, u.name as student_name, u.avatar as student_avatar, ex.title as exercise_title
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      JOIN exercises ex ON s.exercise_id = ex.id
      JOIN lessons l ON ex.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE c.teacher_id = ?
      ORDER BY s.submitted_at DESC
      LIMIT 10
    `).all(teacherId)

    res.json({ stats, recentSubmissions })
  } catch (error) {
    console.error('Teacher stats error:', error)
    res.status(500).json({ error: 'Ошибка получения статистики' })
  }
})

// Get teacher's courses
router.get('/courses', (req, res) => {
  try {
    const courses = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as students_count,
        (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as modules_count,
        (SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = c.id) as lessons_count
      FROM courses c
      WHERE c.teacher_id = ?
      ORDER BY c.created_at DESC
    `).all(req.user.id)

    res.json(courses.map(c => ({ ...c, tags: JSON.parse(c.tags || '[]') })))
  } catch (error) {
    console.error('Get teacher courses error:', error)
    res.status(500).json({ error: 'Ошибка получения курсов' })
  }
})

// Get students enrolled in teacher's courses
router.get('/students', (req, res) => {
  try {
    const { course_id, search } = req.query

    let query = `
      SELECT DISTINCT u.id, u.name, u.email, u.avatar, e.enrolled_at, e.progress, e.status,
        c.title as course_title, c.id as course_id
      FROM users u
      JOIN enrollments e ON u.id = e.user_id
      JOIN courses c ON e.course_id = c.id
      WHERE c.teacher_id = ?
    `
    const params = [req.user.id]

    if (course_id) {
      query += ' AND c.id = ?'
      params.push(course_id)
    }

    if (search) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    query += ' ORDER BY e.enrolled_at DESC'

    const students = db.prepare(query).all(...params)
    res.json(students)
  } catch (error) {
    console.error('Get students error:', error)
    res.status(500).json({ error: 'Ошибка получения студентов' })
  }
})

// Get student details
router.get('/students/:id', (req, res) => {
  try {
    const student = db.prepare(`
      SELECT u.id, u.name, u.email, u.avatar, u.created_at
      FROM users u
      WHERE u.id = ?
    `).get(req.params.id)

    if (!student) {
      return res.status(404).json({ error: 'Студент не найден' })
    }

    // Get student's enrollments in teacher's courses
    const enrollments = db.prepare(`
      SELECT e.*, c.title as course_title
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ? AND c.teacher_id = ?
    `).all(req.params.id, req.user.id)

    // Get student's submissions
    const submissions = db.prepare(`
      SELECT s.*, ex.title as exercise_title
      FROM submissions s
      JOIN exercises ex ON s.exercise_id = ex.id
      JOIN lessons l ON ex.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE s.user_id = ? AND c.teacher_id = ?
      ORDER BY s.submitted_at DESC
      LIMIT 20
    `).all(req.params.id, req.user.id)

    res.json({
      ...student,
      enrollments,
      submissions: submissions.map(s => ({
        ...s,
        test_results: JSON.parse(s.test_results || '{}')
      }))
    })
  } catch (error) {
    console.error('Get student error:', error)
    res.status(500).json({ error: 'Ошибка получения данных студента' })
  }
})

// Manage course modules
router.post('/courses/:courseId/modules', (req, res) => {
  try {
    const { title, description, order_index } = req.body

    // Verify course ownership
    const course = db.prepare('SELECT * FROM courses WHERE id = ? AND teacher_id = ?').get(req.params.courseId, req.user.id)
    if (!course && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет доступа к этому курсу' })
    }

    const id = uuid()
    db.prepare(`
      INSERT INTO modules (id, course_id, title, description, order_index)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.params.courseId, title, description, order_index || 0)

    const module = db.prepare('SELECT * FROM modules WHERE id = ?').get(id)
    res.status(201).json(module)
  } catch (error) {
    console.error('Create module error:', error)
    res.status(500).json({ error: 'Ошибка создания модуля' })
  }
})

// Manage lessons
router.post('/modules/:moduleId/lessons', (req, res) => {
  try {
    const { title, type, content, video_url, duration_minutes, order_index, is_free } = req.body

    // Verify module ownership
    const module = db.prepare(`
      SELECT m.* FROM modules m
      JOIN courses c ON m.course_id = c.id
      WHERE m.id = ? AND c.teacher_id = ?
    `).get(req.params.moduleId, req.user.id)

    if (!module && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет доступа к этому модулю' })
    }

    const id = uuid()
    db.prepare(`
      INSERT INTO lessons (id, module_id, title, type, content, video_url, duration_minutes, order_index, is_free)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.moduleId, title, type || 'theory', content, video_url, duration_minutes || 0, order_index || 0, is_free ? 1 : 0)

    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(id)
    res.status(201).json(lesson)
  } catch (error) {
    console.error('Create lesson error:', error)
    res.status(500).json({ error: 'Ошибка создания урока' })
  }
})

// Manage exercises
router.post('/lessons/:lessonId/exercises', (req, res) => {
  try {
    const { title, description, initial_code, solution_code, language, test_cases, hints, difficulty, points } = req.body

    const id = uuid()
    db.prepare(`
      INSERT INTO exercises (id, lesson_id, title, description, initial_code, solution_code, language, test_cases, hints, difficulty, points)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.params.lessonId, title, description, initial_code, solution_code,
      language || 'javascript', JSON.stringify(test_cases || []), JSON.stringify(hints || []),
      difficulty || 'easy', points || 10
    )

    const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(id)
    res.status(201).json({
      ...exercise,
      test_cases: JSON.parse(exercise.test_cases || '[]'),
      hints: JSON.parse(exercise.hints || '[]')
    })
  } catch (error) {
    console.error('Create exercise error:', error)
    res.status(500).json({ error: 'Ошибка создания упражнения' })
  }
})

// Get course details for editing (with all modules and lessons)
router.get('/courses/:courseId', (req, res) => {
  try {
    const course = db.prepare(`
      SELECT c.* FROM courses c
      WHERE c.id = ? AND (c.teacher_id = ? OR ? = 'admin')
    `).get(req.params.courseId, req.user.id, req.user.role)

    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' })
    }

    // Get modules with lessons and exercises
    const modules = db.prepare(`
      SELECT * FROM modules WHERE course_id = ? ORDER BY order_index
    `).all(course.id)

    for (const module of modules) {
      module.lessons = db.prepare(`
        SELECT * FROM lessons WHERE module_id = ? ORDER BY order_index
      `).all(module.id)

      for (const lesson of module.lessons) {
        const exercise = db.prepare(`
          SELECT * FROM exercises WHERE lesson_id = ?
        `).get(lesson.id)
        
        if (exercise) {
          lesson.exercise = {
            ...exercise,
            test_cases: JSON.parse(exercise.test_cases || '[]'),
            hints: JSON.parse(exercise.hints || '[]')
          }
        }
      }
    }

    res.json({
      ...course,
      tags: JSON.parse(course.tags || '[]'),
      modules
    })
  } catch (error) {
    console.error('Get course for edit error:', error)
    res.status(500).json({ error: 'Ошибка получения курса' })
  }
})

// Update module
router.put('/modules/:moduleId', (req, res) => {
  try {
    const { title, description, order_index } = req.body

    db.prepare(`
      UPDATE modules SET title = ?, description = ?, order_index = ?, created_at = created_at
      WHERE id = ?
    `).run(title, description, order_index, req.params.moduleId)

    const module = db.prepare('SELECT * FROM modules WHERE id = ?').get(req.params.moduleId)
    res.json(module)
  } catch (error) {
    console.error('Update module error:', error)
    res.status(500).json({ error: 'Ошибка обновления модуля' })
  }
})

// Delete module
router.delete('/modules/:moduleId', (req, res) => {
  try {
    db.prepare('DELETE FROM modules WHERE id = ?').run(req.params.moduleId)
    res.json({ message: 'Модуль удален' })
  } catch (error) {
    console.error('Delete module error:', error)
    res.status(500).json({ error: 'Ошибка удаления модуля' })
  }
})

// Update lesson
router.put('/lessons/:lessonId', (req, res) => {
  try {
    const { title, type, content, video_url, duration_minutes, order_index, is_free } = req.body

    db.prepare(`
      UPDATE lessons SET 
        title = COALESCE(?, title),
        type = COALESCE(?, type),
        content = COALESCE(?, content),
        video_url = COALESCE(?, video_url),
        duration_minutes = COALESCE(?, duration_minutes),
        order_index = COALESCE(?, order_index),
        is_free = COALESCE(?, is_free),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, type, content, video_url, duration_minutes, order_index, is_free, req.params.lessonId)

    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.lessonId)
    res.json(lesson)
  } catch (error) {
    console.error('Update lesson error:', error)
    res.status(500).json({ error: 'Ошибка обновления урока' })
  }
})

// Delete lesson
router.delete('/lessons/:lessonId', (req, res) => {
  try {
    db.prepare('DELETE FROM lessons WHERE id = ?').run(req.params.lessonId)
    res.json({ message: 'Урок удален' })
  } catch (error) {
    console.error('Delete lesson error:', error)
    res.status(500).json({ error: 'Ошибка удаления урока' })
  }
})

// Update exercise
router.put('/exercises/:exerciseId', (req, res) => {
  try {
    const { title, description, initial_code, solution_code, language, test_cases, hints, difficulty, points } = req.body

    db.prepare(`
      UPDATE exercises SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        initial_code = COALESCE(?, initial_code),
        solution_code = COALESCE(?, solution_code),
        language = COALESCE(?, language),
        test_cases = COALESCE(?, test_cases),
        hints = COALESCE(?, hints),
        difficulty = COALESCE(?, difficulty),
        points = COALESCE(?, points)
      WHERE id = ?
    `).run(
      title, description, initial_code, solution_code, language,
      test_cases ? JSON.stringify(test_cases) : null,
      hints ? JSON.stringify(hints) : null,
      difficulty, points, req.params.exerciseId
    )

    const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.exerciseId)
    res.json({
      ...exercise,
      test_cases: JSON.parse(exercise.test_cases || '[]'),
      hints: JSON.parse(exercise.hints || '[]')
    })
  } catch (error) {
    console.error('Update exercise error:', error)
    res.status(500).json({ error: 'Ошибка обновления упражнения' })
  }
})

// Delete exercise
router.delete('/exercises/:exerciseId', (req, res) => {
  try {
    db.prepare('DELETE FROM exercises WHERE id = ?').run(req.params.exerciseId)
    res.json({ message: 'Упражнение удалено' })
  } catch (error) {
    console.error('Delete exercise error:', error)
    res.status(500).json({ error: 'Ошибка удаления упражнения' })
  }
})

// Send notification to student
router.post('/notify/:userId', (req, res) => {
  try {
    const { title, content, link } = req.body

    const id = uuid()
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, link)
      VALUES (?, ?, 'teacher_message', ?, ?, ?)
    `).run(id, req.params.userId, title, content, link)

    res.status(201).json({ message: 'Уведомление отправлено' })
  } catch (error) {
    console.error('Send notification error:', error)
    res.status(500).json({ error: 'Ошибка отправки уведомления' })
  }
})

export default router

