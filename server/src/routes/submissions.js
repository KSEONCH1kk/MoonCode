import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import db from '../db/database.js'
import { authenticate, requireTeacher } from '../middleware/auth.js'
import { executeCode } from '../services/codeRunner.js'

const router = Router()

// Submit code for exercise
router.post('/', authenticate, async (req, res) => {
  try {
    const { exercise_id, code, language } = req.body

    if (!exercise_id || !code) {
      return res.status(400).json({ error: 'Exercise ID и код обязательны' })
    }

    const exercise = db.prepare(`
      SELECT e.*, l.module_id, m.course_id
      FROM exercises e
      JOIN lessons l ON e.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      WHERE e.id = ?
    `).get(exercise_id)

    if (!exercise) {
      return res.status(404).json({ error: 'Задание не найдено' })
    }

    // Check enrollment
    const enrollment = db.prepare(`
      SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?
    `).get(req.user.id, exercise.course_id)

    if (!enrollment) {
      return res.status(403).json({ error: 'Вы не записаны на этот курс' })
    }

    // Create submission
    const id = uuid()
    db.prepare(`
      INSERT INTO submissions (id, user_id, exercise_id, code, language, status)
      VALUES (?, ?, ?, ?, ?, 'checking')
    `).run(id, req.user.id, exercise_id, code, language || exercise.language)

    // Run tests
    const testCases = JSON.parse(exercise.test_cases || '[]')
    
    try {
      const result = await executeCode(code, language || exercise.language, '', testCases)
      
      let status = 'failed'
      let pointsEarned = 0

      if (result.success && result.testResults) {
        const allPassed = result.testResults.every(t => t.passed)
        if (allPassed) {
          // Set to needs_review so teacher can grade it
          status = 'needs_review'
          pointsEarned = exercise.points
        }
      } else if (result.stage === 'compile') {
        status = 'failed'
      }

      // Update submission
      db.prepare(`
        UPDATE submissions 
        SET status = ?, test_results = ?, points_earned = ?
        WHERE id = ?
      `).run(status, JSON.stringify(result), pointsEarned, id)

      // If all tests passed (needs_review), mark lesson as completed
      if (status === 'needs_review' || status === 'passed') {
        // Check if already completed
        const existingProgress = db.prepare(`
          SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?
        `).get(req.user.id, exercise.lesson_id)

        if (existingProgress) {
          db.prepare(`
            UPDATE lesson_progress SET status = 'completed', completed_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND lesson_id = ?
          `).run(req.user.id, exercise.lesson_id)
        } else {
          db.prepare(`
            INSERT INTO lesson_progress (id, user_id, lesson_id, status, completed_at)
            VALUES (?, ?, ?, 'completed', CURRENT_TIMESTAMP)
          `).run(uuid(), req.user.id, exercise.lesson_id)
        }

        // Update course progress
        const totalLessons = db.prepare(`
          SELECT COUNT(*) as count FROM lessons l
          JOIN modules m ON l.module_id = m.id
          WHERE m.course_id = ?
        `).get(exercise.course_id).count

        const completedLessons = db.prepare(`
          SELECT COUNT(*) as count FROM lesson_progress lp
          JOIN lessons l ON lp.lesson_id = l.id
          JOIN modules m ON l.module_id = m.id
          WHERE lp.user_id = ? AND m.course_id = ? AND lp.status = 'completed'
        `).get(req.user.id, exercise.course_id).count

        const progress = Math.round((completedLessons / totalLessons) * 100)

        db.prepare(`
          UPDATE enrollments SET progress = ? WHERE user_id = ? AND course_id = ?
        `).run(progress, req.user.id, exercise.course_id)
      }

      const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id)
      
      res.json({
        ...submission,
        test_results: JSON.parse(submission.test_results || '{}')
      })
    } catch (execError) {
      // Execution failed
      db.prepare(`
        UPDATE submissions SET status = 'failed', test_results = ? WHERE id = ?
      `).run(JSON.stringify({ error: execError.message }), id)

      const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id)
      res.json({
        ...submission,
        test_results: { error: execError.message }
      })
    }
  } catch (error) {
    console.error('Submit error:', error)
    res.status(500).json({ error: 'Ошибка отправки решения' })
  }
})

// Get user submissions
router.get('/my', authenticate, (req, res) => {
  try {
    const { exercise_id, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let query = `
      SELECT s.*, e.title as exercise_title
      FROM submissions s
      JOIN exercises e ON s.exercise_id = e.id
      WHERE s.user_id = ?
    `
    const params = [req.user.id]

    if (exercise_id) {
      query += ' AND s.exercise_id = ?'
      params.push(exercise_id)
    }

    query += ' ORDER BY s.submitted_at DESC LIMIT ? OFFSET ?'
    params.push(Number(limit), Number(offset))

    const submissions = db.prepare(query).all(...params)

    res.json(submissions.map(s => ({
      ...s,
      test_results: JSON.parse(s.test_results || '{}')
    })))
  } catch (error) {
    console.error('Get submissions error:', error)
    res.status(500).json({ error: 'Ошибка получения решений' })
  }
})

// Get submission by ID
router.get('/:id', authenticate, (req, res) => {
  try {
    const submission = db.prepare(`
      SELECT s.*, e.title as exercise_title, e.description as exercise_description
      FROM submissions s
      JOIN exercises e ON s.exercise_id = e.id
      WHERE s.id = ?
    `).get(req.params.id)

    if (!submission) {
      return res.status(404).json({ error: 'Решение не найдено' })
    }

    // Only allow user who submitted or teacher/admin
    if (submission.user_id !== req.user.id && req.user.role === 'student') {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    res.json({
      ...submission,
      test_results: JSON.parse(submission.test_results || '{}')
    })
  } catch (error) {
    console.error('Get submission error:', error)
    res.status(500).json({ error: 'Ошибка получения решения' })
  }
})

// Teacher: Get submissions for review
router.get('/review/pending', authenticate, requireTeacher, (req, res) => {
  try {
    const submissions = db.prepare(`
      SELECT s.*, e.title as exercise_title, u.name as student_name, u.avatar as student_avatar,
             c.title as course_title
      FROM submissions s
      JOIN exercises e ON s.exercise_id = e.id
      JOIN lessons l ON e.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'needs_review' AND c.teacher_id = ?
      ORDER BY s.submitted_at ASC
    `).all(req.user.id)

    res.json(submissions.map(s => ({
      ...s,
      test_results: JSON.parse(s.test_results || '{}')
    })))
  } catch (error) {
    console.error('Get pending submissions error:', error)
    res.status(500).json({ error: 'Ошибка получения решений на проверку' })
  }
})

// Teacher: Grade submission (2-5 scale)
router.put('/:id/grade', authenticate, requireTeacher, (req, res) => {
  try {
    const { grade, teacher_comment } = req.body

    // Validate grade (2-5 scale)
    if (!grade || grade < 2 || grade > 5) {
      return res.status(400).json({ error: 'Оценка должна быть от 2 до 5' })
    }

    const submission = db.prepare(`
      SELECT s.*, c.teacher_id, e.points as max_points
      FROM submissions s
      JOIN exercises e ON s.exercise_id = e.id
      JOIN lessons l ON e.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE s.id = ?
    `).get(req.params.id)

    if (!submission) {
      return res.status(404).json({ error: 'Решение не найдено' })
    }

    if (submission.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    // Calculate points based on grade (2=0%, 3=50%, 4=75%, 5=100%)
    const gradeToPercent = { 2: 0, 3: 0.5, 4: 0.75, 5: 1 }
    const points_earned = Math.round(submission.max_points * gradeToPercent[grade])
    
    // Status: passed if grade >= 3, failed if grade = 2
    const status = grade >= 3 ? 'passed' : 'failed'

    db.prepare(`
      UPDATE submissions 
      SET status = ?, grade = ?, points_earned = ?, teacher_comment = ?, teacher_id = ?, graded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, grade, points_earned, teacher_comment, req.user.id, req.params.id)

    // Notify student
    const gradeNames = { 2: 'неудовлетворительно (2)', 3: 'удовлетворительно (3)', 4: 'хорошо (4)', 5: 'отлично (5)' }
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, link)
      VALUES (?, ?, 'submission_graded', 'Решение проверено', ?, ?)
    `).run(uuid(), submission.user_id, `Ваше решение оценено: ${gradeNames[grade]}`, `/submissions/${req.params.id}`)

    const updated = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id)
    res.json({
      ...updated,
      test_results: JSON.parse(updated.test_results || '{}')
    })
  } catch (error) {
    console.error('Grade submission error:', error)
    res.status(500).json({ error: 'Ошибка оценки решения' })
  }
})

export default router

