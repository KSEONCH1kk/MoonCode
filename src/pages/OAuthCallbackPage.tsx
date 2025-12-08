import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setUser, setToken } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const userParam = searchParams.get('user')
    const error = searchParams.get('error')

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`)
      return
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam))
        localStorage.setItem('token', token)
        setToken(token)
        setUser(user)

        // Redirect based on role
        if (user.role === 'admin') {
          navigate('/admin')
        } else if (user.role === 'teacher') {
          navigate('/teacher')
        } else {
          navigate('/dashboard')
        }
      } catch (err) {
        console.error('Failed to parse user data:', err)
        navigate('/login?error=' + encodeURIComponent('Ошибка обработки данных'))
      }
    } else {
      navigate('/login?error=' + encodeURIComponent('Не получены данные авторизации'))
    }
  }, [searchParams, navigate, setUser, setToken])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Завершение авторизации...</p>
      </div>
    </div>
  )
}

