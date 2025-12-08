import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Plus, Minus, Check, Users, Award, Briefcase, Clock, BookOpen } from 'lucide-react'
import { coursesAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'

export function CoursePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<number[]>([])
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    if (slug) {
      loadCourse()
    }
  }, [slug])

  const loadCourse = async () => {
    try {
      const data = await coursesAPI.getBySlug(slug!)
      setCourse(data)
    } catch (error) {
      console.error('Failed to load course:', error)
    }
    setLoading(false)
  }

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    
    if (!course?.id) {
      alert('Курс не загружен')
      return
    }
    
    setEnrolling(true)
    try {
      await coursesAPI.enroll(course.id)
      navigate('/learn')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка при записи на курс')
    }
    setEnrolling(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-gray-900 mb-4">Курс не найден</h1>
          <Link to="/courses" className="text-gray-600 hover:underline">
            Вернуться к каталогу
          </Link>
        </div>
      </div>
    )
  }

  const toggleModule = (index: number) => {
    setExpandedModules(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const levelLabels: Record<string, string> = {
    beginner: 'Для начинающих',
    intermediate: 'Средний уровень',
    advanced: 'Продвинутый'
  }

  const modules = course.modules || []
  const totalLessons = modules.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        {/* Promo Banner */}
        <div className="bg-gray-900 text-white py-3 text-center text-sm">
          <span className="text-[#3ec9f0]">Скидка 30%</span> + курс по ИИ в подарок до 21 декабря
        </div>

        <div className="max-w-[1200px] mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">
            {/* Left */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  {course.category || 'Программирование'}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  {levelLabels[course.level] || course.level}
                </span>
              </div>

              <h1 className="text-5xl font-medium text-gray-900 mb-6 leading-tight">
                {course.title}
              </h1>

              {/* Tags */}
              <div className="flex flex-wrap gap-3 mb-6">
                {course.tags?.map((tag: string, i: number) => (
                  <span key={i} className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700">
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-xl text-gray-600 mb-8 max-w-xl">
                {course.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-6 text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{course.duration_hours || 0}ч обучения</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>{totalLessons} уроков</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{course.students_count || 0} студентов</span>
                </div>
              </div>
            </div>

            {/* Right - Enrollment Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-24">
              {course.image && (
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-xl mb-6"
                />
              )}
              
              <div className="mb-6">
                {course.is_free ? (
                  <div className="text-3xl font-medium text-green-600">Бесплатно</div>
                ) : (
                  <>
                    <div className="text-3xl font-medium text-gray-900">
                      {course.price > 0 ? `${course.price.toLocaleString()} ₽` : 'Бесплатно'}
                    </div>
                    {course.price > 0 && (
                      <div className="text-sm text-gray-500 mt-1">или от 5 753 ₽/мес в рассрочку</div>
                    )}
                  </>
                )}
              </div>

              <button 
                onClick={handleEnroll}
                disabled={enrolling || course.is_enrolled}
                className="w-full py-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {course.is_enrolled ? 'Вы уже записаны' : enrolling ? 'Записываем...' : 'Записаться на курс'}
              </button>

              {course.is_enrolled && (
                <Link 
                  to="/learn"
                  className="block w-full py-3 text-center border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                >
                  Перейти к обучению
                </Link>
              )}

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Доступ к материалам навсегда</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Поддержка преподавателя</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Сертификат по окончании</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-900 py-6">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <span className="text-2xl font-bold text-white">80%</span>, text: 'студентов находят работу в течение 3 месяцев' },
              { icon: <Check className="w-6 h-6 text-white" />, text: 'Актуальная программа и реальные проекты' },
              { icon: <Award className="w-6 h-6 text-white" />, text: 'Сертификат по окончании курса' },
              { icon: <Briefcase className="w-6 h-6 text-white" />, text: 'Помощь в трудоустройстве выпускникам' }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-white/80 text-sm">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <span className="leading-tight">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Course */}
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-4xl font-medium text-gray-900 mb-8">
            О курсе
          </h2>
          <div className="prose prose-lg max-w-none text-gray-600">
            <p>{course.description}</p>
          </div>
        </div>
      </section>

      {/* Program */}
      {modules.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="text-4xl font-medium text-gray-900 mb-6">
              Программа курса
            </h2>

            <div className="flex gap-3 mb-8">
              <span className="px-3 py-1 bg-gray-900 text-white text-xs rounded-full">
                {modules.length} МОДУЛЕЙ
              </span>
              <span className="px-3 py-1 bg-gray-900 text-white text-xs rounded-full">
                {totalLessons} УРОКОВ
              </span>
              <span className="px-3 py-1 bg-[#3ec9f0] text-white text-xs rounded-full">
                {course.duration_hours}Ч ОБУЧЕНИЯ
              </span>
            </div>

            <div className="border-t border-gray-200 bg-white rounded-xl overflow-hidden">
              {modules.map((module: any, i: number) => (
                <div key={module.id || i} className="border-b border-gray-200 last:border-b-0">
                  <button
                    onClick={() => toggleModule(i)}
                    className="w-full py-6 px-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <span className="text-lg text-gray-900 font-medium">{module.title}</span>
                      <span className="text-sm text-gray-500 ml-4">
                        {module.lessons?.length || 0} уроков
                      </span>
                    </div>
                    {expandedModules.includes(i) ? (
                      <Minus className="w-6 h-6 text-gray-400" />
                    ) : (
                      <Plus className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                  {expandedModules.includes(i) && module.lessons?.length > 0 && (
                    <div className="pb-6 px-6">
                      <ul className="space-y-2">
                        {module.lessons.map((lesson: any, j: number) => (
                          <li key={lesson.id || j} className="text-gray-600 flex items-center gap-3 py-2">
                            <div className={`w-2 h-2 rounded-full ${
                              lesson.type === 'video' ? 'bg-blue-500' :
                              lesson.type === 'practice' ? 'bg-green-500' :
                              lesson.type === 'quiz' ? 'bg-yellow-500' :
                              'bg-gray-300'
                            }`} />
                            <span>{lesson.title}</span>
                            <span className="text-xs text-gray-400 ml-auto">
                              {lesson.type === 'video' && 'Видео'}
                              {lesson.type === 'theory' && 'Теория'}
                              {lesson.type === 'practice' && 'Практика'}
                              {lesson.type === 'quiz' && 'Тест'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="bg-gray-900 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-medium text-white mb-4">
              Готовы начать обучение?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Присоединяйтесь к {course.students_count || 0}+ студентам, которые уже изучают этот курс
            </p>
            <button 
              onClick={handleEnroll}
              disabled={enrolling || course.is_enrolled}
              className="px-8 py-4 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {course.is_enrolled ? 'Перейти к обучению' : 'Записаться на курс'}
            </button>
          </div>
        </div>
      </section>

      {/* Teacher Info */}
      {course.teacher && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="text-4xl font-medium text-gray-900 mb-8">
              Преподаватель курса
            </h2>
            <div className="bg-white rounded-2xl p-8 flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-medium text-gray-500">
                {course.teacher.name?.[0] || 'П'}
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">{course.teacher.name}</h3>
                <p className="text-gray-600">{course.teacher.bio || 'Опытный преподаватель'}</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
