import { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useLocation, useParams, useNavigate } from 'react-router-dom'
import { 
  Home, BookOpen, Target, FileCode, Trophy, 
  MessageSquare, Lightbulb, Users, X,
  Gift, Briefcase, Send, UserPlus, CheckCircle, Clock,
  ArrowRight, ChevronRight, ChevronDown, Paperclip, Image as ImageIcon, FileText, Loader2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { submissionsAPI, chatAPI, userAPI, createWebSocket } from '../api'
import type { Submission, Chat, Message, Teacher, UserEnrollment, UserStats, LeaderboardEntry } from '../api'
import { StreakWidget } from '../components/StreakWidget'

// Sidebar Navigation
function Sidebar() {
  const location = useLocation()
  
  const mainLinks = [
    { to: '/dashboard', icon: Home, label: 'Дашборд', exact: true },
    { to: '/dashboard/courses', icon: BookOpen, label: 'Мои курсы' },
    { to: '/dashboard/challenges', icon: Target, label: 'Мои испытания' },
    { to: '/dashboard/solutions', icon: FileCode, label: 'Мои решения' },
    { to: '/dashboard/rating', icon: Trophy, label: 'Рейтинг' },
    { to: '/dashboard/chat', icon: MessageSquare, label: 'Чат с учителем' },
  ]
  
  const secondaryLinks = [
    { to: '/dashboard/contact', icon: MessageSquare, label: 'Свяжитесь со мной' },
    { to: '/dashboard/feedback', icon: Lightbulb, label: 'Есть предложение (идея)' },
    { to: '/dashboard/teams', icon: Users, label: 'Для команд' },
  ]

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="w-[240px] shrink-0">
      <nav className="sticky top-24">
        <div className="space-y-1">
          {mainLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive(link.to, link.exact)
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </Link>
          ))}
        </div>
        
        <div className="my-4 border-t border-gray-200" />
        
        <div className="space-y-1">
          {secondaryLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive(link.to)
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  )
}

// Dashboard Home Content
export function DashboardHome() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-3">
        {/* Getting Started */}
        <section className="mb-12">
          <h2 className="text-xl font-medium text-gray-900 mb-6">С чего начать</h2>
          <div className="grid md:grid-cols-2 gap-4">
          <Link to="/courses" className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer block">
            <div className="h-32 flex items-center justify-center mb-4">
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=120&fit=crop" 
                alt="Working"
                className="rounded-lg opacity-80"
              />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Если я уже работаю и хочу прокачаться?</h3>
            <p className="text-sm text-gray-500">
              Выбирайте продвинутые курсы и получайте полный доступ к ним по подписке
            </p>
          </Link>

          <Link to="/dashboard/chat" className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer block">
            <div className="h-32 flex items-center justify-center mb-4">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200&h=120&fit=crop" 
                alt="Career"
                className="rounded-lg opacity-80"
              />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Нужна помощь преподавателя?</h3>
            <p className="text-sm text-gray-500">
              Свяжитесь с преподавателем через чат для получения консультации
            </p>
          </Link>
        </div>
      </section>

      {/* More Opportunities */}
      <section>
        <h2 className="text-xl font-medium text-gray-900 mb-6">Больше возможностей с MoonCode</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-600 mb-1">Реферальная программа</h3>
                <p className="text-sm text-gray-500">
                  Приводите друзей учиться и <strong className="text-gray-700">получайте бонусы</strong> вместе
                </p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-600 mb-1">Обучение за счет работодателя</h3>
                <p className="text-sm text-gray-500">
                  MoonCode адаптирован под работу с юрлицами. Покажите вашему работодателю эту ссылку
                </p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-600 mb-1">Помощь с трудоустройством</h3>
                <p className="text-sm text-gray-500">
                  Работаем над коммерческими проектами в кроссфункциональных командах
                </p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-600 mb-1">Сообщество (&gt; 8 000 человек)</h3>
                <p className="text-sm text-gray-500">
                  Получайте помощь, заряд мотивации и поддержки, находите друзей
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* Sidebar with Streak Widget */}
      <div className="lg:col-span-2">
        <StreakWidget />
      </div>
    </div>
  )
}

// Empty State Component
function EmptyState({ title, description, action, actionLabel }: { 
  title: string; description: string; action?: string; actionLabel?: string 
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-12 text-center">
      <div className="w-32 h-32 mx-auto mb-6 opacity-50">
        <img 
          src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=200&h=200&fit=crop"
          alt="Empty"
          className="rounded-lg w-full h-full object-cover"
        />
      </div>
      <h3 className="text-xl font-medium text-gray-400 mb-2">{title}</h3>
      <p className="text-gray-400 max-w-md mx-auto mb-4">{description}</p>
      {action && actionLabel && (
        <Link to={action} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">
          {actionLabel} <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}

// My Courses
export function DashboardCourses() {
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await userAPI.getEnrollments()
      setEnrollments(data || [])
    } catch (error) {
      console.error('Failed to load courses:', error)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-medium text-gray-900 mb-8">Мои курсы</h1>
      
      {enrollments.length === 0 ? (
        <EmptyState 
          title="Вы еще не записаны на курсы"
          description="Выберите курс из каталога и начните обучение прямо сейчас"
          action="/courses"
          actionLabel="Перейти к курсам"
        />
      ) : (
        <div className="space-y-4 mb-8">
          {enrollments.map((enrollment) => (
            <div key={enrollment.id} className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{enrollment.course?.title || 'Курс'}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-blue-600 rounded-full" 
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500">{enrollment.progress}%</span>
                  </div>
                </div>
              </div>
              <Link 
                to={`/learn`}
                onClick={() => {
                  // Save selected course to localStorage so LearnRoadmap loads it
                  localStorage.setItem('lastVisitedCourseId', enrollment.course.id)
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
              >
                Продолжить
              </Link>
            </div>
          ))}
        </div>
      )}

      <MoreOpportunities />
    </div>
  )
}

// My Challenges (Exercises)
export function DashboardChallenges() {
  const [activeTab, setActiveTab] = useState('all')
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const tabs = [
    { id: 'all', label: 'Все' },
    { id: 'started', label: 'Начатые' },
    { id: 'not_started', label: 'Не начатые' },
    { id: 'completed', label: 'Законченные' },
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Get submissions to determine exercise status
      const submissions = await submissionsAPI.getMy({})
      setExercises(submissions || [])
    } catch (error) {
      console.error('Failed to load exercises:', error)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const filteredExercises = exercises.filter(e => {
    if (activeTab === 'all') return true
    if (activeTab === 'completed') return e.status === 'passed'
    if (activeTab === 'started') return e.status === 'pending' || e.status === 'failed'
    return false
  })

  return (
    <div>
      <h1 className="text-3xl font-medium text-gray-900 mb-8">Мои испытания</h1>
      
      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredExercises.length === 0 ? (
        <EmptyState 
          title="Здесь пока ничего нет"
          description="Когда вы начнёте выполнять упражнения, они появятся здесь"
          action="/learn"
          actionLabel="Начать обучение"
        />
      ) : (
        <div className="space-y-3">
          {filteredExercises.map((exercise) => (
            <div key={exercise.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              {exercise.status === 'passed' ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : exercise.status === 'pending' ? (
                <Clock className="w-6 h-6 text-yellow-500" />
              ) : (
                <Target className="w-6 h-6 text-gray-400" />
              )}
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{exercise.exercise_title || 'Задание'}</h3>
                <p className="text-sm text-gray-500">{exercise.course_title || 'Курс'}</p>
              </div>
              <span className={`px-3 py-1 text-xs rounded-full ${
                exercise.status === 'passed' ? 'bg-green-100 text-green-700' :
                exercise.status === 'failed' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {exercise.status === 'passed' ? 'Выполнено' : 
                 exercise.status === 'failed' ? 'Не принято' : 'На проверке'}
              </span>
            </div>
          ))}
        </div>
      )}

      <MoreOpportunities />
    </div>
  )
}

// My Solutions with Grades
export function DashboardSolutions() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const result = await submissionsAPI.getMy({})
      setSubmissions(result || [])
    } catch (error) {
      console.error('Failed to load submissions:', error)
    }
    setLoading(false)
  }

  const getGradeDisplay = (grade: number | null) => {
    if (!grade) return null
    const gradeColors: Record<number, string> = {
      5: 'bg-green-500',
      4: 'bg-blue-500',
      3: 'bg-yellow-500',
      2: 'bg-red-500',
    }
    const gradeNames: Record<number, string> = {
      5: 'Отлично',
      4: 'Хорошо',
      3: 'Удовлетв.',
      2: 'Неудовлетв.',
    }
    return (
      <div className="flex items-center gap-2">
        <span className={`w-8 h-8 rounded-full text-white font-bold flex items-center justify-center ${gradeColors[grade]}`}>
          {grade}
        </span>
        <span className="text-sm text-gray-600">{gradeNames[grade]}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-medium text-gray-900 mb-8">Мои решения и оценки</h1>
      
      {submissions.length === 0 ? (
        <EmptyState 
          title="Вы еще не отправляли решения"
          description="Когда вы начнёте решать задачи, ваши решения появятся здесь"
          action="/learn"
          actionLabel="Начать обучение"
        />
      ) : (
        <div className="space-y-4">
          {submissions.map((submission: any) => (
            <div key={submission.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Main row */}
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedId(expandedId === submission.id ? null : submission.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Grade circle */}
                  {submission.grade ? (
                    <span className={`w-12 h-12 rounded-full text-white font-bold text-xl flex items-center justify-center ${
                      submission.grade === 5 ? 'bg-green-500' :
                      submission.grade === 4 ? 'bg-blue-500' :
                      submission.grade === 3 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      {submission.grade}
                    </span>
                  ) : (
                    <span className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-lg">?</span>
                    </span>
                  )}
                  
                  <div>
                    <div className="font-medium text-gray-900">{submission.exercise_title || 'Задание'}</div>
                    <div className="text-sm text-gray-500">{submission.language} • {new Date(submission.submitted_at).toLocaleDateString()}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    submission.status === 'passed' ? 'bg-green-100 text-green-700' :
                    submission.status === 'failed' ? 'bg-red-100 text-red-700' :
                    submission.status === 'needs_review' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {submission.status === 'passed' ? '✅ Принято' :
                     submission.status === 'failed' ? '❌ Не принято' :
                     submission.status === 'needs_review' ? '⏳ На проверке' : 'Ожидание'}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === submission.id ? 'rotate-180' : ''}`} />
                </div>
              </div>
              
              {/* Expanded details */}
              {expandedId === submission.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left: Code */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Ваш код:</h4>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto max-h-48">
                        {submission.code}
                      </pre>
                    </div>
                    
                    {/* Right: Grade and comment */}
                    <div>
                      {submission.grade && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Оценка:</h4>
                          {getGradeDisplay(submission.grade)}
                          {submission.points_earned > 0 && (
                            <div className="mt-1 text-sm text-gray-500">
                              +{submission.points_earned} баллов
                            </div>
                          )}
                        </div>
                      )}
                      
                      {submission.teacher_comment && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">💬 Комментарий преподавателя:</h4>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                            {submission.teacher_comment}
                          </div>
                        </div>
                      )}
                      
                      {submission.graded_at && (
                        <div className="text-xs text-gray-400">
                          Проверено: {new Date(submission.graded_at).toLocaleString()}
                        </div>
                      )}
                      
                      {!submission.grade && submission.status === 'needs_review' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                          ⏳ Решение отправлено на проверку преподавателю
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <MoreOpportunities />
    </div>
  )
}

// Rating Page
export function DashboardRating() {
  const [activeTab, setActiveTab] = useState<'week' | 'month' | 'all'>('week')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  
  const tabs: { id: 'week' | 'month' | 'all'; label: string }[] = [
    { id: 'week', label: 'Неделя' },
    { id: 'month', label: 'Месяц' },
    { id: 'all', label: 'Топ 100' },
  ]

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      const [leaderboardData, statsData] = await Promise.all([
        userAPI.getLeaderboard(activeTab),
        user ? userAPI.getStats() : Promise.resolve(null)
      ])
      setLeaderboard(leaderboardData || [])
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load rating:', error)
    }
    setLoading(false)
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-medium text-gray-900">Рейтинг</h1>
        <div className="flex items-center gap-4 text-gray-500">
          <span className="flex items-center gap-1">
            ☆ {stats?.totalPoints || 0}
          </span>
          <span className="flex items-center gap-1">
            📊 #{stats?.rank || '-'}
          </span>
        </div>
      </div>
      
      {/* Activity Graph */}
      <div className="mb-8 overflow-x-auto bg-white border border-gray-200 rounded-xl p-4">
        <div className="min-w-[800px]">
          {/* Month labels */}
          <div className="flex ml-10 mb-2">
            {Array.from({ length: 12 }).map((_, i) => {
              const date = new Date()
              date.setMonth(date.getMonth() - 11 + i)
              return (
                <span key={i} className="text-xs text-gray-400 w-[60px]">
                  {date.toLocaleDateString('ru', { month: 'short' })}
                </span>
              )
            })}
          </div>
          
          <div className="flex">
            <div className="flex flex-col mr-2">
              {days.map(day => (
                <span key={day} className="text-xs text-gray-400 h-[15px] leading-[15px]">{day}</span>
              ))}
            </div>
            
            <div className="flex gap-[3px]">
              {Array.from({ length: 52 }).map((_, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[3px]">
                  {Array.from({ length: 7 }).map((_, dayIdx) => {
                    // Calculate the date for this cell
                    const daysAgo = (51 - weekIdx) * 7 + (6 - dayIdx)
                    const cellDate = new Date()
                    cellDate.setDate(cellDate.getDate() - daysAgo)
                    const dateStr = cellDate.toISOString().split('T')[0]
                    
                    // Find activity for this date
                    const dayActivity = stats?.activity?.find(a => a.date === dateStr)
                    const count = dayActivity?.count || 0
                    
                    let bgColor = 'bg-gray-100'
                    if (count >= 5) bgColor = 'bg-blue-500'
                    else if (count >= 3) bgColor = 'bg-blue-400'
                    else if (count >= 2) bgColor = 'bg-blue-300'
                    else if (count >= 1) bgColor = 'bg-blue-200'
                    
                    return (
                      <div
                        key={dayIdx}
                        className={`w-[12px] h-[12px] rounded-sm ${bgColor}`}
                        title={`${dateStr}: ${count} действий`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 w-24">Позиция</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Имя</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 w-32">Баллов</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map(item => (
              <tr key={item.pos} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-500">
                  {item.pos <= 3 ? (
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                      item.pos === 1 ? 'bg-yellow-100 text-yellow-700' :
                      item.pos === 2 ? 'bg-gray-200 text-gray-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {item.pos}
                    </span>
                  ) : item.pos}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Chat with Teacher Page
export function DashboardChat() {
  const [chats, setChats] = useState<Chat[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [chatsResult, teachersResult] = await Promise.all([
        chatAPI.getChats(),
        chatAPI.getTeachers()
      ])
      
      // Remove duplicate chats (same teacher)
      const uniqueChats = new Map<string, Chat>()
      if (chatsResult) {
        chatsResult.forEach(chat => {
          const teacher = chat.participants?.find(p => p.role === 'teacher')
          if (teacher) {
            // Use teacher ID as key to avoid duplicates
            if (!uniqueChats.has(teacher.id)) {
              uniqueChats.set(teacher.id, chat)
            } else {
              // Keep the chat with the most recent message
              const existing = uniqueChats.get(teacher.id)!
              const existingTime = existing.last_message_at || ''
              const currentTime = chat.last_message_at || ''
              if (currentTime > existingTime) {
                uniqueChats.set(teacher.id, chat)
              }
            }
          } else {
            // If no teacher, keep the chat
            uniqueChats.set(chat.id, chat)
          }
        })
      }
      setChats(Array.from(uniqueChats.values()))
      
      // Remove duplicate teachers (by ID)
      const uniqueTeachers = new Map<string, Teacher>()
      if (teachersResult) {
        teachersResult.forEach(teacher => {
          if (!uniqueTeachers.has(teacher.id)) {
            uniqueTeachers.set(teacher.id, teacher)
          }
        })
      }
      setTeachers(Array.from(uniqueTeachers.values()))
    } catch (error) {
      console.error('Failed to load chats:', error)
    }
    setLoading(false)
  }

  const startChat = async (teacherId: string) => {
    try {
      const chat = await chatAPI.createDirect(teacherId)
      window.location.href = `/dashboard/chat/${chat.id}`
    } catch (error) {
      alert('Ошибка создания чата')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-medium text-gray-900 mb-8">Чат с преподавателем</h1>
      
      {/* Teachers List */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Преподаватели</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <img 
                src={teacher.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.id}`} 
                alt="" 
                className="w-12 h-12 rounded-full" 
              />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{teacher.name}</h3>
                <p className="text-sm text-gray-500">
                  {teacher.course_title || 'Преподаватель'}
                  {(teacher as any).courses_count && (teacher as any).courses_count > 1 && (
                    <span className="ml-2 text-xs text-gray-400">
                      (+{(teacher as any).courses_count - 1} {(teacher as any).courses_count === 2 ? 'курс' : 'курсов'})
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => startChat(teacher.id)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
              >
                Написать
              </button>
            </div>
          ))}
          {teachers.length === 0 && (
            <div className="col-span-2 text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Преподаватели пока недоступны</p>
            </div>
          )}
        </div>
      </div>

      {/* Existing Chats */}
      {chats.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Мои диалоги</h2>
          <div className="bg-white border border-gray-200 rounded-xl divide-y">
            {chats.map((chat) => {
              const teacher = chat.participants?.find(p => p.role === 'teacher')
              return (
                <Link
                  key={chat.id}
                  to={`/dashboard/chat/${chat.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50"
                >
                  <img 
                    src={teacher?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.id}`} 
                    alt="" 
                    className="w-12 h-12 rounded-full" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{teacher?.name || 'Преподаватель'}</div>
                    <div className="text-sm text-gray-500 truncate">{chat.last_message || 'Нет сообщений'}</div>
                  </div>
                  {chat.unread_count > 0 && (
                    <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                      {chat.unread_count}
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Chat Room Page (Student side)
export function DashboardChatRoom() {
  const { chatId } = useParams()
  const { user, token } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [chatInfo, setChatInfo] = useState<Chat | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (chatId) {
      loadChat()
    }
  }, [chatId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // WebSocket connection
  useEffect(() => {
    if (!token || !chatId) return

    const ws = createWebSocket(token)
    let isMounted = true
    
    // Add additional onopen handler (original is set in createWebSocket)
    ws.addEventListener('open', () => {
      // WebSocket connected
    })

    ws.onerror = () => {
      // WebSocket error
    }

    ws.onclose = () => {
      // WebSocket closed
    }
    
    ws.onmessage = async (event: MessageEvent) => {
      if (!isMounted) return
      
      try {
        const data = JSON.parse(event.data)
        console.log('Dashboard WebSocket message received:', data.type)
        
        // Handle auth success
        if (data.type === 'auth_success') {
          console.log('Dashboard WebSocket authenticated, userId:', data.userId)
          return
        }
        
        if (data.type === 'auth_error') {
          console.error('Dashboard WebSocket auth error:', data.error)
          return
        }
        
        if (data.type === 'new_message') {
          const message = data.message

          if (message.chat_id === chatId) {
            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              if (prev.some(m => m.id === message.id)) {
                return prev
              }
              return [...prev, message]
            })
            scrollToBottom()
          }
        }
      } catch (error) {
        console.error('Dashboard: Error processing WebSocket message:', error)
      }
    }

    wsRef.current = ws

    return () => {
      isMounted = false
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    }
  }, [token, chatId, user?.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChat = async () => {
    if (!chatId) return
    
    try {
      const [chatsResult, messagesResult] = await Promise.all([
        chatAPI.getChats(),
        chatAPI.getMessages(chatId)
      ])
      const chat = chatsResult.find(c => c.id === chatId)
      setChatInfo(chat || null)
      setMessages(messagesResult || [])
    } catch (error) {
      console.error('Failed to load chat:', error)
    }
    setLoading(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер: 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile || !chatId) return
    setUploading(true)
    try {
      const result = await chatAPI.uploadFile(selectedFile)
      await chatAPI.sendMessage(chatId, '', 'file', {
        file_url: result.url,
        file_name: result.originalName,
        file_size: result.size,
        file_mimetype: result.mimetype,
      })
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      loadChat()
    } catch (error: any) {
      alert(error.message || 'Ошибка загрузки файла')
    }
    setUploading(false)
  }

  const handleSend = async () => {
    if ((!newMessage.trim() && !selectedFile) || !chatId || sending) return
    
    setSending(true)
    try {
      const content = newMessage.trim()
      const messageType = newMessage.includes('```') ? 'code' : 'text'
      const message = await chatAPI.sendMessage(chatId, content, messageType)
      setMessages([...messages, message])
      setNewMessage('')
      scrollToBottom()
    } catch (error) {
      alert('Ошибка отправки')
    }
    setSending(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (mimetype?: string) => {
    if (!mimetype) return <FileText className="w-5 h-5" />
    if (mimetype.startsWith('image/')) return <ImageIcon className="w-5 h-5" />
    return <FileText className="w-5 h-5" />
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const teacher = chatInfo?.participants?.find(p => p.role === 'teacher')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col bg-white border border-gray-200 rounded-xl">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-4">
        <Link to="/dashboard/chat" className="p-2 hover:bg-gray-100 rounded-lg">
          ←
        </Link>
        <img 
          src={teacher?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chatId}`} 
          alt="" 
          className="w-10 h-10 rounded-full" 
        />
        <div className="flex-1">
          <div className="font-medium text-gray-900 flex items-center gap-2">
            {teacher?.name || 'Преподаватель'}
          </div>
          <div className="text-sm text-gray-500">Преподаватель</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Начните диалог с преподавателем</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id
            return (
              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {!isOwn && (
                    <img 
                      src={message.sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender_id}`} 
                      alt="" 
                      className="w-8 h-8 rounded-full" 
                    />
                  )}
                  <div>
                    <div className={`rounded-2xl px-4 py-2 ${
                      isOwn ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'
                    }`}>
                      {message.message_type === 'file' && message.file_url ? (
                        <div className="space-y-2">
                          {message.file_mimetype?.startsWith('image/') ? (
                            <div>
                              <img 
                                src={`http://localhost:3001${message.file_url}`}
                                alt={message.file_name || 'Изображение'}
                                className="max-w-full max-h-64 rounded-lg"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none'
                                }}
                              />
                              {message.file_name && (
                                <div className="text-xs mt-1 opacity-75">{message.file_name}</div>
                              )}
                            </div>
                          ) : (
                            <a
                              href={`http://localhost:3001${message.file_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 bg-white/10 rounded-lg hover:bg-white/20"
                            >
                              {getFileIcon(message.file_mimetype)}
                              <div className="flex-1">
                                <div className="text-sm font-medium">{message.file_name || 'Файл'}</div>
                                {message.file_size && (
                                  <div className="text-xs opacity-75">{formatFileSize(message.file_size)}</div>
                                )}
                              </div>
                            </a>
                          )}
                          {message.content && (
                            <div className="mt-2 text-sm">{message.content}</div>
                          )}
                        </div>
                      ) : message.message_type === 'code' ? (
                        <pre className={`text-sm font-mono whitespace-pre-wrap ${isOwn ? 'bg-blue-600' : 'bg-gray-200'} rounded p-2`}>
                          {message.content || ''}
                        </pre>
                      ) : (
                        <p className="whitespace-pre-wrap">
                          {message.content || ''}
                        </p>
                      )}
                    </div>
                    <div className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : ''}`}>
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="px-4 py-2 border-t bg-gray-50 flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2">
            {selectedFile.type.startsWith('image/') ? (
              <img 
                src={URL.createObjectURL(selectedFile)} 
                alt="Preview" 
                className="w-12 h-12 object-cover rounded"
              />
            ) : (
              <FileText className="w-8 h-8 text-gray-400" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{selectedFile.name}</div>
              <div className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</div>
            </div>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.zip,.rar"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Прикрепить файл"
          >
            <Paperclip className="w-5 h-5 text-gray-500" />
          </button>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Написать сообщение..."
            className="flex-1 px-4 py-2 border rounded-xl resize-none"
            rows={1}
            disabled={uploading}
          />
          <button
            onClick={selectedFile ? handleFileUpload : handleSend}
            disabled={(!newMessage.trim() && !selectedFile) || sending || uploading}
            className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Contact Page with Modal
export function DashboardContact() {
  const [showModal, setShowModal] = useState(true)
  const [contactMethod, setContactMethod] = useState('telegram')

  return (
    <div>
      <h1 className="text-3xl font-medium text-gray-900 mb-8">Свяжитесь со мной</h1>
      
      <EmptyState 
        title="Выберите способ связи"
        description="Мы свяжемся с вами в течение дня"
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-medium text-gray-900 mb-6">Поможем и подскажем</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Имя</label>
                <input 
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Способ связи *</label>
                <select 
                  value={contactMethod}
                  onChange={(e) => setContactMethod(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="telegram">Telegram</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="phone">Телефон</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Телефон / Имя пользователя *</label>
                <input 
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <p className="text-sm text-gray-500">
                Ответим в течение дня<br />
                Нам можно написать в <a href="#" className="text-blue-600 font-medium">телеграм</a>
              </p>

              <button className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
                Отправить
              </button>

              <p className="text-xs text-gray-400">
                Отправляя форму, вы принимаете «Соглашение об обработке персональных данных» и условия «Оферты», а также соглашаетесь с «Условиями использования».
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Feedback Page
export function DashboardFeedback() {
  return (
    <div>
      <h1 className="text-3xl font-medium text-gray-900 mb-8">Есть предложение (идея)</h1>
      
      <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-xl">
        <p className="text-gray-600 mb-6">
          Мы всегда рады обратной связи! Расскажите нам о своих идеях по улучшению платформы.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Тема</label>
            <input 
              type="text"
              placeholder="О чем ваша идея?"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 mb-1">Описание</label>
            <textarea 
              rows={5}
              placeholder="Опишите подробнее..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>

          <button className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
            Отправить
          </button>
        </div>
      </div>
    </div>
  )
}

// Teams Page
export function DashboardTeams() {
  return (
    <div>
      <h1 className="text-3xl font-medium text-gray-900 mb-8">Для команд</h1>
      
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white mb-8">
        <h2 className="text-2xl font-medium mb-4">Корпоративное обучение</h2>
        <p className="text-blue-100 mb-6 max-w-xl">
          MoonCode адаптирован для работы с компаниями. Обучайте сотрудников программированию с гарантией результата.
        </p>
        <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors">
          Узнать подробнее
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="border border-gray-200 rounded-xl p-6">
          <div className="text-3xl font-medium text-gray-900 mb-2">500+</div>
          <p className="text-gray-500">компаний обучают сотрудников</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-6">
          <div className="text-3xl font-medium text-gray-900 mb-2">94%</div>
          <p className="text-gray-500">завершают обучение</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-6">
          <div className="text-3xl font-medium text-gray-900 mb-2">4.9</div>
          <p className="text-gray-500">средняя оценка курсов</p>
        </div>
      </div>
    </div>
  )
}

// More Opportunities Component
function MoreOpportunities() {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-medium text-gray-900 mb-6">Больше возможностей с MoonCode</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors cursor-pointer">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-600 mb-1">Реферальная программа</h3>
              <p className="text-sm text-gray-500">
                Приводите друзей учиться и <strong className="text-gray-700">получайте бонусы</strong> вместе
              </p>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors cursor-pointer">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-600 mb-1">Обучение за счет работодателя</h3>
              <p className="text-sm text-gray-500">
                MoonCode адаптирован под работу с юрлицами. Покажите вашему работодателю эту ссылку
              </p>
            </div>
          </div>
        </div>

        <Link to="/dashboard/chat" className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors cursor-pointer">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Send className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-600 mb-1">Чат с преподавателем</h3>
              <p className="text-sm text-gray-500">
                Получите помощь и консультацию от опытных преподавателей
              </p>
            </div>
          </div>
        </Link>

        <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors cursor-pointer">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-600 mb-1">Сообщество (&gt; 8 000 человек)</h3>
              <p className="text-sm text-gray-500">
                Получайте помощь, заряд мотивации и поддержки, находите друзей
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Dashboard Layout
export function DashboardPage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  // Redirect admins and teachers to their respective pages
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (user.role === 'teacher') {
        navigate('/teacher', { replace: true })
      }
    }
  }, [user, isLoading, navigate])

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // Don't render dashboard if user is admin or teacher (redirect will happen)
  if (user && (user.role === 'admin' || user.role === 'teacher')) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex gap-12">
          <Sidebar />
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
