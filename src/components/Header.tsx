import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, ChevronDown, Search, Bell, Moon, Sun } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { coursesAPI, userAPI } from '../api'

export function Header() {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [coursesDropdown, setCoursesDropdown] = useState(false)
  const [aboutDropdown, setAboutDropdown] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [popularCourses, setPopularCourses] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const coursesRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  
  // Check if user is logged in
  const isLoggedIn = !!user

  // Load categories and popular courses from backend
  useEffect(() => {
    // Load categories
    coursesAPI.getMeta()
      .then(data => {
        setCategories(data.categories)
      })
      .catch(err => {
        console.error('Failed to load categories:', err)
        // Fallback to static categories
        setCategories([
          'Программирование',
          'Data Science',
          'DevOps',
          'Тестирование',
          'Дизайн',
          'Менеджмент'
        ])
      })
    
    // Load popular courses
    coursesAPI.getAll({ page: 1 })
      .then(data => {
        setPopularCourses(data.courses.slice(0, 4)) // Get top 4 courses
      })
      .catch(err => {
        console.error('Failed to load popular courses:', err)
      })
  }, [])

  // Load notifications
  useEffect(() => {
    if (isLoggedIn) {
      userAPI.getNotifications()
        .then(data => setNotifications(data))
        .catch(err => console.error('Failed to load notifications:', err))
    }
  }, [isLoggedIn])

  // Load dark mode preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    
    setDarkMode(shouldBeDark)
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  // Toggle dark mode
  const toggleDarkMode = async () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
    
    // Save to backend if logged in
    if (isLoggedIn) {
      try {
        await userAPI.updateTheme(newMode ? 'dark' : 'light')
      } catch (error) {
        console.error('Failed to save theme preference:', error)
      }
    }
  }
  
  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes} мин. назад`
    if (hours < 24) return `${hours} ч. назад`
    if (days === 1) return 'вчера'
    return `${days} дн. назад`
  }

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (coursesRef.current && !coursesRef.current.contains(event.target as Node)) {
        setCoursesDropdown(false)
      }
      if (aboutRef.current && !aboutRef.current.contains(event.target as Node)) {
        setAboutDropdown(false)
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCategoryClick = (category: string) => {
    setCoursesDropdown(false)
    navigate(`/courses?category=${encodeURIComponent(category)}`)
  }

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-1.5">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#111827"/>
                <path d="M8 10h4v12H8V10zm6 4h4v8h-4v-8zm6-2h4v10h-4V12z" fill="white"/>
              </svg>
              <span className="text-[20px] font-medium text-gray-900 tracking-tight">MoonCode</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              {/* My Learning (logged in) */}
              {isLoggedIn && (
                <Link to="/dashboard" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
                  Мое обучение
                </Link>
              )}
              
              {/* Courses Dropdown */}
              <div ref={coursesRef} className="relative">
                <button 
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                  onClick={() => setCoursesDropdown(!coursesDropdown)}
                >
                  Все курсы <ChevronDown className={`w-4 h-4 transition-transform ${coursesDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {coursesDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-[600px] bg-white rounded-xl shadow-xl border border-gray-200 p-6 grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Направления</div>
                      <div className="space-y-1">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => handleCategoryClick(cat)}
                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Популярные</div>
                      <div className="space-y-1">
                        {popularCourses.length > 0 ? (
                          popularCourses.map((course) => (
                            <Link 
                              key={course.slug}
                              to={`/courses/${course.slug}`} 
                              onClick={() => setCoursesDropdown(false)} 
                              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                            >
                              {course.title}
                            </Link>
                          ))
                        ) : (
                          <>
                            <Link to="/courses/python-developer" onClick={() => setCoursesDropdown(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Python-разработчик</Link>
                            <Link to="/courses/frontend-developer" onClick={() => setCoursesDropdown(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Frontend-разработчик</Link>
                            <Link to="/courses/java-developer" onClick={() => setCoursesDropdown(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Java-разработчик</Link>
                            <Link to="/courses/devops-engineer" onClick={() => setCoursesDropdown(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">DevOps-инженер</Link>
                          </>
                        )}
                      </div>
                      <Link 
                        to="/courses" 
                        onClick={() => setCoursesDropdown(false)}
                        className="block mt-4 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-lg"
                      >
                        Все курсы →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* About Dropdown */}
              <div ref={aboutRef} className="relative">
                <button 
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                  onClick={() => setAboutDropdown(!aboutDropdown)}
                >
                  О MoonCode <ChevronDown className={`w-4 h-4 transition-transform ${aboutDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {aboutDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-[280px] bg-white rounded-xl shadow-xl border border-gray-200 p-4">
                    <div className="space-y-1">
                      <Link to="/about" onClick={() => setAboutDropdown(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">О школе</Link>
                      <Link to="/reviews" onClick={() => setAboutDropdown(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Отзывы выпускников</Link>
                      <Link to="/corporate" onClick={() => setAboutDropdown(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Корпоративное обучение</Link>
                      <Link to="/blog" onClick={() => setAboutDropdown(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Блог</Link>
                      <Link to="/faq" onClick={() => setAboutDropdown(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Вопросы и ответы</Link>
                    </div>
                  </div>
                )}
              </div>

              <Link to="/courses" className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">Подписка</Link>
              <a href="#" className="px-3 py-2 text-sm font-medium text-gray-900">-30% New Year →</a>
            </nav>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {/* Notifications */}
                <div ref={notificationsRef} className="relative">
                  <button 
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 text-gray-500 hover:text-gray-900 relative rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {/* Notification badge - only show if there are unread notifications */}
                    {notifications.some(n => !n.read) && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>
                  
                  {notificationsOpen && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-medium text-gray-900">Уведомления</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div key={notif.id} className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50' : ''}`}>
                              <div className="text-sm text-gray-900 mb-1 font-medium">{notif.title}</div>
                              <div className="text-xs text-gray-600 mb-1">{notif.message}</div>
                              <div className="text-xs text-gray-500">{formatTimeAgo(notif.created_at)}</div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-sm text-gray-500">
                            Нет уведомлений
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-2 border-t border-gray-100">
                        <Link to="/dashboard/notifications" className="text-sm text-gray-600 hover:text-gray-900">
                          Все уведомления →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Theme Toggle */}
                <button 
                  onClick={toggleDarkMode}
                  className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                
                {/* User Menu */}
                <div ref={userRef} className="relative">
                  <button 
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {userMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2">
                      <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Мой профиль</Link>
                      <Link to="/dashboard/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Настройки</Link>
                      <Link to="/dashboard/courses" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Мои курсы</Link>
                      <Link to="/dashboard/rating" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Рейтинг</Link>
                      <div className="border-t border-gray-100 my-1" />
                      <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">Выйти</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button className="p-2 text-gray-500 hover:text-gray-900">
                  <Search className="w-5 h-5" />
                </button>
                <Link to="/register" className="text-sm text-gray-600 hover:text-gray-900">Регистрация</Link>
                <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">Вход</Link>
              </>
            )}
          </div>
          
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="p-4 space-y-2">
            <Link to="/courses" className="block py-3 text-gray-700 font-medium border-b border-gray-100">Все курсы</Link>
            <div className="py-2 space-y-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate(`/courses?category=${encodeURIComponent(cat)}`)
                  }}
                  className="block w-full text-left py-2 pl-4 text-sm text-gray-500"
                >
                  {cat}
                </button>
              ))}
            </div>
            <Link to="/login" className="block py-3 text-gray-700 border-t border-gray-100">Вход</Link>
            <Link to="/register" className="block py-3 text-gray-700">Регистрация</Link>
          </div>
        </div>
      )}
    </header>
  )
}

