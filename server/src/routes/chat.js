import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import db from '../db/database.js'
import { authenticate } from '../middleware/auth.js'
import { broadcastMessageToChat } from '../services/websocket.js'

const router = Router()

// Get user's chats
router.get('/', authenticate, (req, res) => {
  try {
    const chats = db.prepare(`
      SELECT c.*, 
        (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND is_read = 0 AND sender_id != ?) as unread_count
      FROM chats c
      JOIN chat_participants cp ON c.id = cp.chat_id
      WHERE cp.user_id = ?
      ORDER BY last_message_at DESC
    `).all(req.user.id, req.user.id)

    // Get participants for each chat
    for (const chat of chats) {
      chat.participants = db.prepare(`
        SELECT u.id, u.name, u.avatar, u.role, cp.role as chat_role
        FROM chat_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.chat_id = ?
      `).all(chat.id)
    }

    res.json(chats)
  } catch (error) {
    console.error('Get chats error:', error)
    res.status(500).json({ error: 'Ошибка получения чатов' })
  }
})

// Create direct chat with user
router.post('/direct', authenticate, (req, res) => {
  try {
    const { user_id } = req.body

    if (!user_id) {
      return res.status(400).json({ error: 'User ID обязателен' })
    }

    // Check if chat already exists
    const existingChat = db.prepare(`
      SELECT c.id FROM chats c
      JOIN chat_participants cp1 ON c.id = cp1.chat_id
      JOIN chat_participants cp2 ON c.id = cp2.chat_id
      WHERE c.type = 'direct' AND cp1.user_id = ? AND cp2.user_id = ?
    `).get(req.user.id, user_id)

    if (existingChat) {
      const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(existingChat.id)
      chat.participants = db.prepare(`
        SELECT u.id, u.name, u.avatar, u.role
        FROM chat_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.chat_id = ?
      `).all(chat.id)
      return res.json(chat)
    }

    // Create new chat
    const chatId = uuid()
    db.prepare(`INSERT INTO chats (id, type) VALUES (?, 'direct')`).run(chatId)

    // Add participants
    db.prepare(`INSERT INTO chat_participants (id, chat_id, user_id) VALUES (?, ?, ?)`).run(uuid(), chatId, req.user.id)
    db.prepare(`INSERT INTO chat_participants (id, chat_id, user_id) VALUES (?, ?, ?)`).run(uuid(), chatId, user_id)

    const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(chatId)
    chat.participants = db.prepare(`
      SELECT u.id, u.name, u.avatar, u.role
      FROM chat_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.chat_id = ?
    `).all(chatId)

    res.status(201).json(chat)
  } catch (error) {
    console.error('Create chat error:', error)
    res.status(500).json({ error: 'Ошибка создания чата' })
  }
})

// Get chat messages
router.get('/:chatId/messages', authenticate, (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query
    const offset = (page - 1) * limit

    // Check if user is participant
    const participant = db.prepare(`
      SELECT * FROM chat_participants WHERE chat_id = ? AND user_id = ?
    `).get(req.params.chatId, req.user.id)

    if (!participant) {
      return res.status(403).json({ error: 'Нет доступа к этому чату' })
    }

    const messages = db.prepare(`
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.params.chatId, Number(limit), Number(offset))

    // Convert is_encrypted to boolean
    const formattedMessages = messages.map(msg => ({
      ...msg,
      is_encrypted: msg.is_encrypted === 1
    }))

    // Mark messages as read
    db.prepare(`
      UPDATE messages SET is_read = 1 
      WHERE chat_id = ? AND sender_id != ? AND is_read = 0
    `).run(req.params.chatId, req.user.id)

    res.json(formattedMessages.reverse())
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: 'Ошибка получения сообщений' })
  }
})

// Send message
router.post('/:chatId/messages', authenticate, (req, res) => {
  try {
    const { 
      content, 
      encrypted_content, 
      message_type = 'text', 
      file_url,
      file_name,
      file_size,
      file_mimetype,
      is_encrypted = false
    } = req.body

    if (!content && !encrypted_content && !file_url) {
      return res.status(400).json({ error: 'Сообщение не может быть пустым' })
    }

    // Check if user is participant
    const participant = db.prepare(`
      SELECT * FROM chat_participants WHERE chat_id = ? AND user_id = ?
    `).get(req.params.chatId, req.user.id)

    if (!participant) {
      return res.status(403).json({ error: 'Нет доступа к этому чату' })
    }

    const id = uuid()
    db.prepare(`
      INSERT INTO messages (
        id, chat_id, sender_id, content, encrypted_content, 
        message_type, file_url, file_name, file_size, file_mimetype, is_encrypted
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.params.chatId, req.user.id, 
      content || '', encrypted_content || null,
      message_type, file_url || null, file_name || null, 
      file_size || null, file_mimetype || null,
      is_encrypted ? 1 : 0
    )

    const message = db.prepare(`
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(id)

    // Convert is_encrypted to boolean
    if (message) {
      message.is_encrypted = message.is_encrypted === 1
    }

    // Broadcast message to all participants via WebSocket
    try {
      if (broadcastMessageToChat) {
        broadcastMessageToChat(req.params.chatId, message)
      }
    } catch (error) {
      console.error('Error broadcasting message:', error)
    }

    res.status(201).json(message)
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Ошибка отправки сообщения' })
  }
})

// Store/Update user's keys for E2EE
router.post('/keys', authenticate, (req, res) => {
  try {
    const { public_key, private_key } = req.body

    if (!public_key || !private_key) {
      return res.status(400).json({ error: 'Public key и private key обязательны' })
    }

    // Check if user already has a key
    const existing = db.prepare('SELECT * FROM user_public_keys WHERE user_id = ?').get(req.user.id)

    if (existing) {
      // Update keys
      console.log(`[E2EE] Updating keys for user ${req.user.id}`)
      db.prepare(`
        UPDATE user_public_keys 
        SET public_key = ?, 
            private_key_encrypted = ?,
            updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = ?
      `).run(public_key, private_key, req.user.id)
      res.json({ success: true, message: 'Keys updated', key_exists: true })
    } else {
      // Insert new key
      console.log(`[E2EE] Saving new keys for user ${req.user.id}`)
      const id = uuid()
      db.prepare(`
        INSERT INTO user_public_keys (id, user_id, public_key, private_key_encrypted)
        VALUES (?, ?, ?, ?)
      `).run(id, req.user.id, public_key, private_key)
      res.json({ success: true, message: 'Keys saved', key_exists: false })
    }
  } catch (error) {
    console.error('Save keys error:', error)
    res.status(500).json({ error: 'Ошибка сохранения ключей' })
  }
})

// Get user's own keys (public key and private key)
router.get('/keys/me', authenticate, (req, res) => {
  try {
    const keyRecord = db.prepare(`
      SELECT public_key, private_key_encrypted as private_key
      FROM user_public_keys 
      WHERE user_id = ?
    `).get(req.user.id)

    if (!keyRecord) {
      return res.status(404).json({ 
        error: 'Keys not found', 
        public_key: null,
        private_key: null
      })
    }

    res.json({ 
      public_key: keyRecord.public_key,
      private_key: keyRecord.private_key
    })
  } catch (error) {
    console.error('Get own keys error:', error)
    res.status(500).json({ error: 'Ошибка получения ключей' })
  }
})

// Get public key for a user
router.get('/keys/:userId', authenticate, (req, res) => {
  try {
    // Check if requesting user is in a chat with the target user
    const { userId } = req.params

    // Verify users share at least one chat
    const sharedChat = db.prepare(`
      SELECT DISTINCT c.id
      FROM chats c
      JOIN chat_participants cp1 ON c.id = cp1.chat_id
      JOIN chat_participants cp2 ON c.id = cp2.chat_id
      WHERE cp1.user_id = ? AND cp2.user_id = ?
      LIMIT 1
    `).get(req.user.id, userId)

    if (!sharedChat) {
      return res.status(403).json({ error: 'Нет общего чата с этим пользователем' })
    }

    const keyRecord = db.prepare('SELECT public_key FROM user_public_keys WHERE user_id = ?').get(userId)

    if (!keyRecord) {
      // Return 404 but with a more graceful response
      return res.status(404).json({ error: 'Public key не найден', public_key: null })
    }

    res.json({ public_key: keyRecord.public_key })
  } catch (error) {
    console.error('Get public key error:', error)
    res.status(500).json({ error: 'Ошибка получения ключа' })
  }
})

// Get public keys for chat participants
router.get('/:chatId/keys', authenticate, (req, res) => {
  try {
    // Check if user is participant
    const participant = db.prepare(`
      SELECT * FROM chat_participants WHERE chat_id = ? AND user_id = ?
    `).get(req.params.chatId, req.user.id)

    if (!participant) {
      return res.status(403).json({ error: 'Нет доступа к этому чату' })
    }

    // Get all participants
    const participants = db.prepare(`
      SELECT user_id FROM chat_participants WHERE chat_id = ?
    `).all(req.params.chatId)

    // Get public keys for all participants
    const keys = {}
    for (const p of participants) {
      const keyRecord = db.prepare('SELECT public_key FROM user_public_keys WHERE user_id = ?').get(p.user_id)
      if (keyRecord) {
        keys[p.user_id] = keyRecord.public_key
      }
    }

    res.json({ keys })
  } catch (error) {
    console.error('Get chat keys error:', error)
    res.status(500).json({ error: 'Ошибка получения ключей' })
  }
})

// Get teachers available for chat
router.get('/teachers', authenticate, (req, res) => {
  try {
    // Get unique teachers from courses user is enrolled in
    // Group courses by teacher to avoid duplicates
    const teachersData = db.prepare(`
      SELECT u.id, u.name, u.avatar, u.bio,
        GROUP_CONCAT(DISTINCT c.title) as courses
      FROM users u
      JOIN courses c ON c.teacher_id = u.id
      JOIN enrollments e ON e.course_id = c.id
      WHERE e.user_id = ? AND u.role = 'teacher'
      GROUP BY u.id, u.name, u.avatar, u.bio
    `).all(req.user.id)

    // Format response
    const teachers = teachersData.map(t => ({
      id: t.id,
      name: t.name,
      avatar: t.avatar,
      bio: t.bio,
      course_title: t.courses ? t.courses.split(',').slice(0, 1)[0] : null, // First course as main
      courses_count: t.courses ? t.courses.split(',').length : 0
    }))

    res.json(teachers)
  } catch (error) {
    console.error('Get teachers error:', error)
    res.status(500).json({ error: 'Ошибка получения преподавателей' })
  }
})

export default router

