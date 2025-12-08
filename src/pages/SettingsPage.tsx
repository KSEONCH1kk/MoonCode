import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { userAPI } from '../api'
import { Shield, User, Mail, Lock, Camera, Check } from 'lucide-react'

export function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Profile states
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  
  // Security states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [twoFASetup, setTwoFASetup] = useState<{ qrCode: string; secret: string } | null>(null)
  const [twoFAToken, setTwoFAToken] = useState('')
  const [passwordChanged, setPasswordChanged] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  
  // Load user profile data
  useEffect(() => {
    if (user) {
      setNickname(user.name || '')
      setEmail(user.email || '')
      setAvatar(user.avatar || null)
      
      // Load 2FA status
      userAPI.get2FAStatus()
        .then(data => setTwoFAEnabled(data.enabled))
        .catch(err => console.error('Failed to load 2FA status:', err))
    }
  }, [user])
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleProfileSave = async () => {
    setProfileLoading(true)
    try {
      await userAPI.updateProfile({ 
        name: nickname, 
        email, 
        avatar: avatar || undefined 
      })
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch (error: any) {
      alert(error.message || 'Ошибка сохранения профиля')
    } finally {
      setProfileLoading(false)
    }
  }
  
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert('Пароли не совпадают')
      return
    }
    if (newPassword.length < 6) {
      alert('Новый пароль должен быть минимум 6 символов')
      return
    }
    
    setPasswordLoading(true)
    try {
      await userAPI.changePassword(currentPassword, newPassword)
      setPasswordChanged(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordChanged(false), 3000)
    } catch (error: any) {
      alert(error.message || 'Ошибка изменения пароля')
    } finally {
      setPasswordLoading(false)
    }
  }
  
  const handleToggle2FA = async () => {
    try {
      if (!twoFAEnabled) {
        // Enable 2FA - show setup
        const result = await userAPI.setup2FA()
        setTwoFASetup({
          qrCode: result.qrCode,
          secret: result.manualEntryKey
        })
      } else {
        // Disable 2FA - need verification code
        if (!twoFAToken) {
          alert('Введите код для отключения 2FA')
          return
        }
        const result = await userAPI.disable2FA(twoFAToken)
        setTwoFAEnabled(false)
        setTwoFAToken('')
        alert(result.message)
      }
    } catch (error: any) {
      alert(error.message || 'Ошибка изменения настроек 2FA')
    }
  }
  
  const handleVerify2FA = async () => {
    if (!twoFAToken || twoFAToken.length !== 6) {
      alert('Введите 6-значный код')
      return
    }
    
    try {
      const result = await userAPI.verify2FA(twoFAToken)
      setTwoFAEnabled(true)
      setTwoFASetup(null)
      setTwoFAToken('')
      alert(result.message)
    } catch (error: any) {
      alert(error.message || 'Неверный код')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <h1 className="text-[32px] font-medium text-gray-900 mb-8">Настройки профиля</h1>
        
        <div className="grid lg:grid-cols-[250px_1fr] gap-8">
          {/* Sidebar */}
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <User className="w-5 h-5" />
              Профиль
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'security'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Shield className="w-5 h-5" />
              Безопасность
            </button>
          </div>
          
          {/* Content */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            {activeTab === 'profile' ? (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-medium text-gray-900 mb-6">Основная информация</h2>
                  
                  {/* Avatar */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Аватар
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt="Avatar"
                            className="w-20 h-20 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-medium">
                            {nickname?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <button
                          onClick={handleAvatarClick}
                          className="absolute bottom-0 right-0 p-1.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>Рекомендуемый размер: 400x400px</p>
                        <p>Максимальный размер: 5MB</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                  
                  {/* Nickname */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Имя пользователя
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        placeholder="Введите имя"
                      />
                    </div>
                  </div>
                  
                  {/* Email */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  
                  {/* Save Button */}
                  <button
                    onClick={handleProfileSave}
                    disabled={profileLoading}
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {profileLoading ? (
                      'Сохранение...'
                    ) : profileSaved ? (
                      <>
                        <Check className="w-5 h-5" />
                        Сохранено
                      </>
                    ) : (
                      'Сохранить изменения'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-medium text-gray-900 mb-6">Безопасность</h2>
                  
                  {/* Change Password */}
                  <div className="mb-8 pb-8 border-b border-gray-200">
                    <h3 className="text-base font-medium text-gray-900 mb-4">Изменить пароль</h3>
                    
                    <div className="space-y-4 max-w-md">
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="Текущий пароль"
                        />
                      </div>
                      
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="Новый пароль"
                        />
                      </div>
                      
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="Подтвердите новый пароль"
                        />
                      </div>
                      
                      <button
                        onClick={handlePasswordChange}
                        disabled={passwordLoading}
                        className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {passwordLoading ? (
                          'Изменение...'
                        ) : passwordChanged ? (
                          <>
                            <Check className="w-5 h-5" />
                            Пароль изменен
                          </>
                        ) : (
                          'Изменить пароль'
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* 2FA */}
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-4">Двухфакторная аутентификация (2FA)</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Добавьте дополнительный уровень безопасности к вашему аккаунту через Google Authenticator или другое приложение
                    </p>
                    
                    {!twoFASetup ? (
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl max-w-md">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${twoFAEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <Shield className={`w-5 h-5 ${twoFAEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {twoFAEnabled ? 'Включено' : 'Выключено'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Authenticator app
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={handleToggle2FA}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            twoFAEnabled
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {twoFAEnabled ? 'Отключить' : 'Включить'}
                        </button>
                      </div>
                    ) : (
                      <div className="max-w-md">
                        <div className="p-6 border border-gray-200 rounded-xl bg-gray-50">
                          <h4 className="text-sm font-medium text-gray-900 mb-4">Настройка 2FA</h4>
                          
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-3">
                              1. Отсканируйте QR код в приложении Google Authenticator:
                            </p>
                            <div className="flex justify-center p-4 bg-white rounded-lg">
                              <img src={twoFASetup.qrCode} alt="QR Code" className="w-48 h-48" />
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                              2. Или введите код вручную:
                            </p>
                            <div className="p-3 bg-white rounded-lg border border-gray-200 font-mono text-sm">
                              {twoFASetup.secret}
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                              3. Введите 6-значный код из приложения:
                            </p>
                            <input
                              type="text"
                              value={twoFAToken}
                              onChange={(e) => setTwoFAToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent text-center text-lg font-mono tracking-widest"
                              placeholder="000000"
                              maxLength={6}
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={handleVerify2FA}
                              disabled={twoFAToken.length !== 6}
                              className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Подтвердить
                            </button>
                            <button
                              onClick={() => {
                                setTwoFASetup(null)
                                setTwoFAToken('')
                              }}
                              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {twoFAEnabled && !twoFASetup && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Для отключения 2FA введите код:</p>
                        <div className="flex gap-2 max-w-md">
                          <input
                            type="text"
                            value={twoFAToken}
                            onChange={(e) => setTwoFAToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-center font-mono"
                            placeholder="000000"
                            maxLength={6}
                          />
                          <button
                            onClick={handleToggle2FA}
                            disabled={twoFAToken.length !== 6}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Отключить 2FA
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {twoFAEnabled && !twoFASetup && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl max-w-md">
                        <div className="flex gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-green-800">
                            <p className="font-medium mb-1">2FA активирована</p>
                            <p className="text-green-700">
                              Теперь при входе в аккаунт вам нужно будет вводить код из приложения-аутентификатора
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

