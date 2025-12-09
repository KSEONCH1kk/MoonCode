import { WebSocketServer } from 'ws'
import { verifyToken } from '../middleware/auth.js'
import db from '../db/database.js'
import { v4 as uuid } from 'uuid'

// Store connected clients
const clients = new Map() // Map<userId, Set<WebSocket>>

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws, req) => {
    let userId = null

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString())

        switch (message.type) {
          case 'auth':
            // Authenticate user
            const decoded = verifyToken(message.token)
            if (decoded) {
              userId = decoded.id
              
              // Add to clients
              if (!clients.has(userId)) {
                clients.set(userId, new Set())
              }
              clients.get(userId).add(ws)

              ws.send(JSON.stringify({
                type: 'auth_success',
                userId,
              }))

              console.log(`User ${userId} connected via WebSocket`)
            } else {
              ws.send(JSON.stringify({
                type: 'auth_error',
                error: 'Invalid token',
              }))
            }
            break

          case 'chat_message':
            // Send chat message
            if (!userId) {
              ws.send(JSON.stringify({ type: 'error', error: 'Not authenticated' }))
              return
            }

            const { 
              chatId, 
              content, 
              messageType = 'text',
              file_url,
              file_name,
              file_size,
              file_mimetype
            } = message

            // Verify user is participant
            const participant = db.prepare(`
              SELECT * FROM chat_participants WHERE chat_id = ? AND user_id = ?
            `).get(chatId, userId)

            if (!participant) {
              ws.send(JSON.stringify({ type: 'error', error: 'Not a participant' }))
              return
            }

            // Save message
            const msgId = uuid()
            db.prepare(`
              INSERT INTO messages (
                id, chat_id, sender_id, content,
                message_type, file_url, file_name, file_size, file_mimetype, is_encrypted
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              msgId, chatId, userId, 
              content || '',
              messageType, file_url || null, file_name || null,
              file_size || null, file_mimetype || null,
              0
            )

            const savedMessage = db.prepare(`
              SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
              FROM messages m
              JOIN users u ON m.sender_id = u.id
              WHERE m.id = ?
            `).get(msgId)

            // Convert is_encrypted to boolean
            if (savedMessage) {
              savedMessage.is_encrypted = false
            }

            // Get all participants
            const participants = db.prepare(`
              SELECT user_id FROM chat_participants WHERE chat_id = ?
            `).all(chatId)

            // Broadcast to all participants
            for (const p of participants) {
              const userSockets = clients.get(p.user_id)
              if (userSockets) {
                for (const socket of userSockets) {
                  if (socket.readyState === 1) { // OPEN
                    socket.send(JSON.stringify({
                      type: 'new_message',
                      message: savedMessage,
                    }))
                  }
                }
              }
            }
            break

          case 'typing':
            // User is typing
            if (!userId) return

            const typingParticipants = db.prepare(`
              SELECT user_id FROM chat_participants WHERE chat_id = ? AND user_id != ?
            `).all(message.chatId, userId)

            const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId)

            for (const p of typingParticipants) {
              const userSockets = clients.get(p.user_id)
              if (userSockets) {
                for (const socket of userSockets) {
                  if (socket.readyState === 1) {
                    socket.send(JSON.stringify({
                      type: 'user_typing',
                      chatId: message.chatId,
                      userId,
                      userName: user?.name,
                    }))
                  }
                }
              }
            }
            break

          case 'read_messages':
            // Mark messages as read
            if (!userId) return

            db.prepare(`
              UPDATE messages SET is_read = 1 
              WHERE chat_id = ? AND sender_id != ? AND is_read = 0
            `).run(message.chatId, userId)
            break

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }))
            break
        }
      } catch (error) {
        console.error('WebSocket message error:', error)
        ws.send(JSON.stringify({ type: 'error', error: 'Invalid message format' }))
      }
    })

    ws.on('close', () => {
      if (userId) {
        const userSockets = clients.get(userId)
        if (userSockets) {
          userSockets.delete(ws)
          if (userSockets.size === 0) {
            clients.delete(userId)
          }
        }
        console.log(`User ${userId} disconnected from WebSocket`)
      }
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
  })

  console.log('✅ WebSocket server initialized')
  return wss
}

// Send notification to specific user
export function sendNotification(userId, notification) {
  const userSockets = clients.get(userId)
  if (userSockets) {
    for (const socket of userSockets) {
      if (socket.readyState === 1) {
        socket.send(JSON.stringify({
          type: 'notification',
          notification,
        }))
      }
    }
  }
}

// Broadcast to all connected users
export function broadcast(message) {
  for (const [userId, sockets] of clients) {
    for (const socket of sockets) {
      if (socket.readyState === 1) {
        socket.send(JSON.stringify(message))
      }
    }
  }
}

// Broadcast message to all participants of a chat
export function broadcastMessageToChat(chatId, message) {
  try {
    console.log(`Broadcasting message ${message.id} to chat ${chatId}`)
    
    // Get all participants
    const participants = db.prepare(`
      SELECT user_id FROM chat_participants WHERE chat_id = ?
    `).all(chatId)

    console.log(`Found ${participants.length} participants for chat ${chatId}`)
    console.log(`Total connected clients: ${clients.size}`)

    // Broadcast to all participants
    let sentCount = 0
    for (const p of participants) {
      const userSockets = clients.get(p.user_id)
      if (userSockets) {
        console.log(`User ${p.user_id} has ${userSockets.size} WebSocket connections`)
        for (const socket of userSockets) {
          if (socket.readyState === 1) { // OPEN
            socket.send(JSON.stringify({
              type: 'new_message',
              message: message,
            }))
            sentCount++
            console.log(`Sent message to user ${p.user_id}`)
          } else {
            console.log(`Socket for user ${p.user_id} is not open (state: ${socket.readyState})`)
          }
        }
      } else {
        console.log(`User ${p.user_id} has no WebSocket connections`)
      }
    }
    console.log(`Sent message to ${sentCount} connections`)
  } catch (error) {
    console.error('Error broadcasting message to chat:', error)
  }
}

export default { setupWebSocket, sendNotification, broadcast, broadcastMessageToChat }

