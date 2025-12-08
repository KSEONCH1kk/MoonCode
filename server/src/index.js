// Load environment variables first
import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// Initialize database
import './db/database.js'

// Import routes
import authRoutes from './routes/auth.js'
import oauthRoutes from './routes/oauth.js'
import coursesRoutes from './routes/courses.js'
import submissionsRoutes from './routes/submissions.js'
import chatRoutes from './routes/chat.js'
import adminRoutes from './routes/admin.js'
import teacherRoutes from './routes/teacher.js'
import userRoutes from './routes/user.js'
import uploadRoutes from './routes/upload.js'

// Import services
import { setupWebSocket } from './services/websocket.js'
import { executeCode } from './services/codeRunner.js'
import { analyzeCode } from './services/languageServer.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Create data directory
const dataDir = join(__dirname, '../data')
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Static files for uploads
app.use('/uploads', express.static(join(__dirname, '../uploads')))

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/oauth', oauthRoutes)
app.use('/api/courses', coursesRoutes)
app.use('/api/submissions', submissionsRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/teacher', teacherRoutes)
app.use('/api/user', userRoutes)
app.use('/api/upload', uploadRoutes)

// Code execution endpoint
app.post('/api/execute', async (req, res) => {
  try {
    const { code, language, input = '', testCases = [] } = req.body

    console.log(`[Execute] Language: ${language}, Code length: ${code?.length}, TestCases: ${testCases?.length}`)

    if (!code || !language) {
      return res.status(400).json({ error: 'Missing code or language' })
    }

    const result = await executeCode(code, language, input, testCases)
    
    console.log(`[Execute] Result:`, JSON.stringify(result, null, 2).slice(0, 500))
    
    res.json(result)
  } catch (error) {
    console.error('[Execute] Error:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || 'Unknown server error',
      stage: 'server'
    })
  }
})

// Language server endpoints
app.post('/api/lint', (req, res) => {
  try {
    const { code, language } = req.body

    if (!code || !language) {
      return res.status(400).json({ error: 'Missing code or language' })
    }

    const result = analyzeCode(code, language)
    res.json(result)
  } catch (error) {
    console.error('Lint error:', error)
    res.status(500).json({ error: error.message })
  }
})


// Get supported languages
app.get('/api/languages', (req, res) => {
  const languages = [
    { id: 'java', name: 'Java', extension: '.java', icon: '☕' },
    { id: 'python', name: 'Python', extension: '.py', icon: '🐍' },
    { id: 'javascript', name: 'JavaScript', extension: '.js', icon: '🟨' },
    { id: 'typescript', name: 'TypeScript', extension: '.ts', icon: '🔷' },
    { id: 'cpp', name: 'C++', extension: '.cpp', icon: '⚡' },
    { id: 'c', name: 'C', extension: '.c', icon: '⚡' },
    { id: 'go', name: 'Go', extension: '.go', icon: '🔵' },
    { id: 'rust', name: 'Rust', extension: '.rs', icon: '🦀' },
    { id: 'kotlin', name: 'Kotlin', extension: '.kt', icon: '💜' },
    { id: 'csharp', name: 'C#', extension: '.cs', icon: '💚' },
    { id: 'php', name: 'PHP', extension: '.php', icon: '🐘' },
    { id: 'ruby', name: 'Ruby', extension: '.rb', icon: '💎' },
  ]
  res.json(languages)
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Create HTTP server
const server = createServer(app)

// Setup WebSocket
setupWebSocket(server)

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎓 MoonCode School Backend Server                        ║
║   Running on http://localhost:${PORT}                        ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║   📚 API Endpoints:                                        ║
║   ├── GET  /health              Health check               ║
║   ├── POST /api/auth/register   Register new user          ║
║   ├── POST /api/auth/login      Login                      ║
║   ├── GET  /api/auth/me         Get current user           ║
║   ├── GET  /api/courses         List courses               ║
║   ├── GET  /api/courses/:slug   Get course details         ║
║   ├── POST /api/submissions     Submit code                ║
║   ├── GET  /api/chat            Get user chats             ║
║   ├── POST /api/execute         Execute code               ║
║   ├── POST /api/lint            Lint code                  ║
║   ├── GET  /api/admin/*         Admin endpoints            ║
║   └── GET  /api/teacher/*       Teacher endpoints          ║
║                                                            ║
║   🔌 WebSocket: ws://localhost:${PORT}/ws                    ║
║                                                            ║
║   📧 Test Accounts:                                        ║
║   ├── Admin:   admin@mooncode.io / admin123                 ║
║   ├── Teacher: teacher@mooncode.io / teacher123            ║
║   └── Student: demo@mooncode.io / demo123                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `)
})

