import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import db from '../db/database.js'
import { generateToken } from '../middleware/auth.js'

const router = Router()

// OAuth callback handler
router.get('/callback/:provider', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  
  try {
    const { provider } = req.params
    const { code, error } = req.query

    if (error) {
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('OAuth авторизация отменена')}`)
    }

    if (!code) {
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Код авторизации не получен')}`)
    }

    let userData
    let oauthId

    // Exchange code for user data based on provider
    switch (provider) {
      case 'google': {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID || '',
            client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
            redirect_uri: `${backendUrl}/api/oauth/callback/google`,
            grant_type: 'authorization_code',
          }),
        })

        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange code for token')
        }

        const { access_token } = await tokenResponse.json()

        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` },
        })

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data')
        }

        const googleUser = await userResponse.json()
        oauthId = googleUser.id
        userData = {
          email: googleUser.email,
          name: googleUser.name || googleUser.given_name || 'User',
          avatar: googleUser.picture,
        }
        break
      }

      case 'vk': {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
        const tokenResponse = await fetch('https://oauth.vk.com/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: process.env.VK_CLIENT_ID || '',
            client_secret: process.env.VK_CLIENT_SECRET || '',
            redirect_uri: `${backendUrl}/api/oauth/callback/vk`,
          }),
        })

        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange code for token')
        }

        const tokenData = await tokenResponse.json()
        const { access_token, user_id } = tokenData
        oauthId = user_id.toString()

        const userResponse = await fetch(
          `https://api.vk.com/method/users.get?user_ids=${user_id}&fields=photo_200&access_token=${access_token}&v=5.131`
        )

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data')
        }

        const vkData = await userResponse.json()
        const vkUser = vkData.response[0]
        userData = {
          email: tokenData.email || `${oauthId}@vk.com`,
          name: `${vkUser.first_name} ${vkUser.last_name}`,
          avatar: vkUser.photo_200,
        }
        break
      }

      case 'github': {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: new URLSearchParams({
            code,
            client_id: process.env.GITHUB_CLIENT_ID || '',
            client_secret: process.env.GITHUB_CLIENT_SECRET || '',
            redirect_uri: `${backendUrl}/api/oauth/callback/github`,
          }),
        })

        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange code for token')
        }

        const { access_token } = await tokenResponse.json()

        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        })

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data')
        }

        const githubUser = await userResponse.json()
        oauthId = githubUser.id.toString()

        // Get email if not public
        let email = githubUser.email
        if (!email) {
          const emailResponse = await fetch('https://api.github.com/user/emails', {
            headers: {
              Authorization: `Bearer ${access_token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          })
          if (emailResponse.ok) {
            const emails = await emailResponse.json()
            email = emails.find((e) => e.primary)?.email || emails[0]?.email || `${oauthId}@github.com`
          }
        }

        userData = {
          email: email || `${oauthId}@github.com`,
          name: githubUser.name || githubUser.login,
          avatar: githubUser.avatar_url,
        }
        break
      }

      default: {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
        return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Неизвестный провайдер OAuth')}`)
      }
    }

    // Find or create user
    let user = db
      .prepare('SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?')
      .get(provider, oauthId)

    if (!user) {
      // Check if email already exists
      const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(userData.email)

      if (existingUser) {
        // Link OAuth to existing account
        db.prepare('UPDATE users SET oauth_provider = ?, oauth_id = ? WHERE id = ?').run(
          provider,
          oauthId,
          existingUser.id
        )
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(existingUser.id)
      } else {
        // Create new user
        const id = uuid()
        const avatar = userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`

        db.prepare(
          `INSERT INTO users (id, email, password, name, avatar, role, oauth_provider, oauth_id)
           VALUES (?, ?, NULL, ?, ?, 'student', ?, ?)`
        ).run(id, userData.email, userData.name, avatar, provider, oauthId)

        user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
      }
    } else {
      // Update user info
      db.prepare(
        `UPDATE users SET name = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(userData.name, userData.avatar || user.avatar, user.id)
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id)
    }

    // Update last login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id)

    // Generate token
    const token = generateToken(user)
    const { password: _, ...userWithoutPassword } = user

    // Redirect to frontend with token
    res.redirect(`${frontendUrl}/oauth/success?token=${token}&user=${encodeURIComponent(JSON.stringify(userWithoutPassword))}`)
  } catch (error) {
    console.error('OAuth callback error:', error)
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Ошибка OAuth авторизации')}`)
  }
})

// Get OAuth URL
router.get('/:provider', (req, res) => {
  const { provider } = req.params
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

  let authUrl
  let clientId

  switch (provider) {
    case 'google': {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
      clientId = process.env.GOOGLE_CLIENT_ID
      
      if (!clientId) {
        console.error('GOOGLE_CLIENT_ID not found in environment variables')
        return res.status(500).json({ error: 'OAuth не настроен. Отсутствует GOOGLE_CLIENT_ID' })
      }
      
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${backendUrl}/api/oauth/callback/google`,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
      })}`
      break
    }

    case 'vk': {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
      clientId = process.env.VK_CLIENT_ID
      
      if (!clientId) {
        console.error('VK_CLIENT_ID not found in environment variables')
        return res.status(500).json({ error: 'OAuth не настроен. Отсутствует VK_CLIENT_ID' })
      }
      
      authUrl = `https://oauth.vk.com/authorize?${new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${backendUrl}/api/oauth/callback/vk`,
        response_type: 'code',
        scope: 'email',
        display: 'page',
      })}`
      break
    }

    case 'github': {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
      clientId = process.env.GITHUB_CLIENT_ID
      
      if (!clientId) {
        console.error('GITHUB_CLIENT_ID not found in environment variables')
        return res.status(500).json({ error: 'OAuth не настроен. Отсутствует GITHUB_CLIENT_ID' })
      }
      
      authUrl = `https://github.com/login/oauth/authorize?${new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${backendUrl}/api/oauth/callback/github`,
        scope: 'user:email',
      })}`
      break
    }

    default:
      return res.status(400).json({ error: 'Неизвестный провайдер OAuth' })
  }

  res.json({ url: authUrl })
})

export default router

