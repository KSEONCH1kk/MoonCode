import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import db from '../db/database.js'
import { authenticate, requireTeacher } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads')
const videosDir = path.join(uploadsDir, 'videos')
const attachmentsDir = path.join(uploadsDir, 'attachments')

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true })
if (!fs.existsSync(attachmentsDir)) fs.mkdirSync(attachmentsDir, { recursive: true })

// Configure multer for video uploads
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videosDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuid()}${ext}`)
  }
})

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Недопустимый формат видео. Разрешены: MP4, WebM, OGG, MOV, AVI'))
    }
  }
})

// Configure multer for attachment uploads
const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, attachmentsDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuid()}${ext}`)
  }
})

const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      // Text
      'text/plain',
      'text/markdown',
      'text/csv',
      // Code
      'application/json',
      'application/xml',
      'text/html',
      'text/css',
      'text/javascript',
      'application/javascript',
    ]
    
    // Also allow by extension for flexibility
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', 
      '.zip', '.rar', '.7z', '.jpg', '.jpeg', '.png', '.gif', '.webp',
      '.txt', '.md', '.csv', '.json', '.xml', '.html', '.css', '.js', '.java', '.py', '.cpp']
    
    const ext = path.extname(file.originalname).toLowerCase()
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Недопустимый формат файла'))
    }
  }
})

// Upload video
router.post('/video', authenticate, requireTeacher, videoUpload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' })
    }

    const videoUrl = `/uploads/videos/${req.file.filename}`
    
    res.json({
      success: true,
      url: videoUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    })
  } catch (error) {
    console.error('Video upload error:', error)
    res.status(500).json({ error: error.message || 'Ошибка загрузки видео' })
  }
})

// Upload attachment
router.post('/attachment', authenticate, requireTeacher, attachmentUpload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' })
    }

    const { lesson_id } = req.body
    const fileUrl = `/uploads/attachments/${req.file.filename}`
    
    // Save to database
    const id = uuid()
    db.prepare(`
      INSERT INTO lesson_attachments (id, lesson_id, filename, original_name, url, size, mimetype, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, lesson_id, req.file.filename, req.file.originalname, fileUrl, req.file.size, req.file.mimetype, req.user.id)
    
    res.json({
      id,
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    })
  } catch (error) {
    console.error('Attachment upload error:', error)
    res.status(500).json({ error: error.message || 'Ошибка загрузки файла' })
  }
})

// Upload multiple attachments
router.post('/attachments', authenticate, requireTeacher, attachmentUpload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Файлы не загружены' })
    }

    const { lesson_id } = req.body
    const results = []

    for (const file of req.files) {
      const fileUrl = `/uploads/attachments/${file.filename}`
      const id = uuid()
      
      db.prepare(`
        INSERT INTO lesson_attachments (id, lesson_id, filename, original_name, url, size, mimetype, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, lesson_id, file.filename, file.originalname, fileUrl, file.size, file.mimetype, req.user.id)
      
      results.push({
        id,
        url: fileUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      })
    }
    
    res.json({
      success: true,
      files: results
    })
  } catch (error) {
    console.error('Attachments upload error:', error)
    res.status(500).json({ error: error.message || 'Ошибка загрузки файлов' })
  }
})

// Get attachments for a lesson
router.get('/attachments/:lessonId', authenticate, (req, res) => {
  try {
    const attachments = db.prepare(`
      SELECT * FROM lesson_attachments WHERE lesson_id = ? ORDER BY created_at DESC
    `).all(req.params.lessonId)
    
    res.json(attachments)
  } catch (error) {
    console.error('Get attachments error:', error)
    res.status(500).json({ error: 'Ошибка получения файлов' })
  }
})

// Delete attachment
router.delete('/attachment/:id', authenticate, requireTeacher, (req, res) => {
  try {
    const attachment = db.prepare('SELECT * FROM lesson_attachments WHERE id = ?').get(req.params.id)
    
    if (!attachment) {
      return res.status(404).json({ error: 'Файл не найден' })
    }

    // Delete file from disk
    const filePath = path.join(attachmentsDir, attachment.filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // Delete from database
    db.prepare('DELETE FROM lesson_attachments WHERE id = ?').run(req.params.id)
    
    res.json({ success: true })
  } catch (error) {
    console.error('Delete attachment error:', error)
    res.status(500).json({ error: 'Ошибка удаления файла' })
  }
})

// Configure multer for chat file uploads (images, documents)
const chatFilesDir = path.join(uploadsDir, 'chat')
if (!fs.existsSync(chatFilesDir)) fs.mkdirSync(chatFilesDir, { recursive: true })

const chatFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, chatFilesDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuid()}${ext}`)
  }
})

const chatFileUpload = multer({
  storage: chatFileStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max for chat files
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Text
      'text/plain', 'text/markdown', 'text/csv',
      // Archives
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    ]
    
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.txt', '.md', '.csv', '.zip', '.rar', '.7z']
    
    const ext = path.extname(file.originalname).toLowerCase()
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Недопустимый формат файла для чата'))
    }
  }
})

// Upload file for chat (available to all authenticated users)
router.post('/chat', authenticate, chatFileUpload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' })
    }

    const fileUrl = `/uploads/chat/${req.file.filename}`
    
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      isImage: req.file.mimetype.startsWith('image/'),
    })
  } catch (error) {
    console.error('Chat file upload error:', error)
    res.status(500).json({ error: error.message || 'Ошибка загрузки файла' })
  }
})

export default router

