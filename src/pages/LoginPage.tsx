import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, loginWithOAuth, user, isLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  // Redirect if already logged in (only on mount)
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (user.role === 'teacher') {
        navigate('/teacher', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [user, isLoading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const result = await login(email, password, twoFactorToken)
      
      // Check if 2FA is required
      if (result && result.requiresTwoFactor) {
        setRequiresTwoFactor(true)
        setLoading(false)
        return
      }
      
      // Login successful - state will update and useEffect will handle navigation
      setLoading(false)
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка входа'
      setError(errorMessage)
      
      // If error is about 2FA code, keep the 2FA field visible
      if (errorMessage.includes('код') || errorMessage.includes('аутентификации')) {
        setRequiresTwoFactor(true)
      }
      setLoading(false)
    }
  }

  const handleDemoLogin = async (role: 'admin' | 'teacher' | 'student') => {
    const accounts = {
      admin: { email: 'admin@mooncode.io', password: 'admin123' },
      teacher: { email: 'teacher@mooncode.io', password: 'teacher123' },
      student: { email: 'demo@mooncode.io', password: 'demo123' },
    }
    setEmail(accounts[role].email)
    setPassword(accounts[role].password)
  }

  const handleOAuthLogin = async (provider: 'google' | 'vk' | 'github') => {
    setOauthLoading(provider)
    setError('')
    try {
      await loginWithOAuth(provider)
    } catch (err: any) {
      setError(err.message || 'Ошибка OAuth авторизации')
      setOauthLoading(null)
    }
  }

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // Don't render form if user is logged in (redirect will happen)
  if (user) {
    return null
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-[420px]">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-gray-900 mb-2">Вход в аккаунт</h1>
          <p className="text-gray-500">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-gray-900 font-medium hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 2FA Token (shown only if required) */}
            {requiresTwoFactor && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Код из приложения аутентификации
                </label>
                <input
                  type="text"
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                  autoFocus
                  required
                />
                <p className="mt-2 text-sm text-blue-600">
                  Введите 6-значный код из приложения аутентификации (Google Authenticator, Authy и т.д.)
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setRequiresTwoFactor(false)
                    setTwoFactorToken('')
                    setError('')
                  }}
                  className="mt-2 text-sm text-gray-600 hover:text-gray-900 hover:underline"
                >
                  ← Вернуться к вводу пароля
                </button>
              </div>
            )}

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-600">Запомнить меня</span>
              </label>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
                Забыли пароль?
              </a>
            </div>

            {/* Submit */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
            
            {/* Demo Accounts */}
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 text-center mb-3">Демо аккаунты:</p>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => handleDemoLogin('admin')}
                  className="flex-1 py-2 text-xs border rounded-lg hover:bg-gray-50"
                >
                  👑 Админ
                </button>
                <button 
                  type="button"
                  onClick={() => handleDemoLogin('teacher')}
                  className="flex-1 py-2 text-xs border rounded-lg hover:bg-gray-50"
                >
                  👨‍🏫 Препод
                </button>
                <button 
                  type="button"
                  onClick={() => handleDemoLogin('student')}
                  className="flex-1 py-2 text-xs border rounded-lg hover:bg-gray-50"
                >
                  🎓 Студент
                </button>
              </div>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400">или</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button 
              onClick={() => handleOAuthLogin('google')}
              disabled={!!oauthLoading}
              className="w-full py-3 px-4 border border-gray-300 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-700 text-sm font-medium">
                {oauthLoading === 'google' ? 'Подключение...' : 'Войти через Google'}
              </span>
            </button>

            <button 
              onClick={() => handleOAuthLogin('vk')}
              disabled={!!oauthLoading}
              className="w-full py-3 px-4 border border-gray-300 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0077FF">
                <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.576-1.496c.59-.19 1.348 1.267 2.151 1.828.607.425 1.068.332 1.068.332l2.137-.03s1.117-.071.587-.964c-.043-.073-.308-.661-1.588-1.87-1.34-1.264-1.16-1.059.453-3.246.983-1.332 1.376-2.145 1.253-2.493-.117-.332-.84-.244-.84-.244l-2.406.015s-.178-.025-.31.056c-.13.079-.212.262-.212.262s-.382 1.03-.89 1.907c-1.07 1.85-1.499 1.948-1.674 1.832-.407-.267-.305-1.075-.305-1.648 0-1.793.267-2.54-.521-2.733-.262-.065-.454-.107-1.123-.114-.858-.009-1.585.003-1.996.208-.274.137-.485.442-.356.46.159.022.519.099.71.363.246.341.237 1.107.237 1.107s.142 2.11-.33 2.371c-.325.18-.77-.187-1.725-1.865-.489-.859-.858-1.81-.858-1.81s-.07-.176-.198-.271c-.154-.115-.37-.151-.37-.151l-2.286.015s-.343.01-.469.163c-.112.135-.009.414-.009.414s1.796 4.258 3.83 6.404c1.865 1.967 3.984 1.838 3.984 1.838h.96z"/>
              </svg>
              <span className="text-gray-700 text-sm font-medium">
                {oauthLoading === 'vk' ? 'Подключение...' : 'Войти через VK'}
              </span>
            </button>

            <button 
              onClick={() => handleOAuthLogin('github')}
              disabled={!!oauthLoading}
              className="w-full py-3 px-4 border border-gray-300 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span className="text-gray-700 text-sm font-medium">
                {oauthLoading === 'github' ? 'Подключение...' : 'Войти через GitHub'}
              </span>
            </button>
          </div>
        </div>

        {/* Terms */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Входя в аккаунт, вы принимаете{' '}
          <a href="#" className="text-gray-700 hover:underline">условия использования</a>
          {' '}и{' '}
          <a href="#" className="text-gray-700 hover:underline">политику конфиденциальности</a>
        </p>
      </div>
    </div>
  )
}

