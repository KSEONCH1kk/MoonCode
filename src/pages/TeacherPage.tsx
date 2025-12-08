import { useState, useEffect, useRef } from 'react'
import { Link, Routes, Route, useLocation, Navigate, useParams, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, Users, BookOpen, FileCheck, MessageCircle,
  Plus, Clock, CheckCircle, XCircle, ChevronRight, Send, ArrowLeft,
  Edit, Save, AlertCircle, Paperclip, Lock, Image as ImageIcon, FileText, Loader2, X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { teacherAPI, submissionsAPI, chatAPI, coursesAPI, createWebSocket } from '../api'
import type { TeacherStats, Course, Student, Submission, Chat, Message, StudentDetails } from '../api'
import {
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  encryptMessage,
  decryptMessage,
  storePrivateKey,
  getStoredPrivateKey,
  storePublicKey,
  getStoredPublicKey,
  storeRecipientPublicKey,
  getRecipientPublicKey,
} from '../utils/e2ee'

// Teacher Sidebar
function TeacherSidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  
  const links = [
    { to: '/teacher', icon: LayoutDashboard, label: 'Дашборд', exact: true },
    { to: '/teacher/courses', icon: BookOpen, label: 'Мои курсы' },
    { to: '/teacher/students', icon: Users, label: 'Студенты' },
    { to: '/teacher/submissions', icon: FileCheck, label: 'Проверка ДЗ' },
    { to: '/teacher/chat', icon: MessageCircle, label: 'Сообщения' },
  ]

  return (
    <aside className="w-64 bg-purple-900 min-h-screen flex flex-col">
      <div className="p-4 border-b border-purple-800">
        <Link to="/" className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <div className="w-4 h-4 bg-purple-900 rounded-sm"></div>
          </div>
          <span className="font-bold">MoonCode Teacher</span>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {links.map((link) => {
            const isActive = link.exact 
              ? location.pathname === link.to
              : location.pathname.startsWith(link.to)
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-purple-700 text-white' 
                      : 'text-purple-300 hover:text-white hover:bg-purple-800'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-purple-800">
        <div className="flex items-center gap-3">
          <img src={user?.avatar} alt="" className="w-10 h-10 rounded-full" />
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user?.name}</div>
            <div className="text-purple-400 text-xs">Преподаватель</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 w-full px-3 py-2 text-sm text-purple-300 hover:text-white hover:bg-purple-800 rounded-lg transition-colors"
        >
          Выйти
        </button>
      </div>
    </aside>
  )
}

// Dashboard Page
function DashboardPage() {
  const [stats, setStats] = useState<TeacherStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    teacherAPI.getStats().then(setStats).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Панель преподавателя</h1>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-bold text-purple-600">{stats?.stats.courses || 0}</div>
          <div className="text-gray-500">Курсов</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-bold text-blue-600">{stats?.stats.total_students || 0}</div>
          <div className="text-gray-500">Студентов</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-bold text-yellow-600">{stats?.stats.pending_submissions || 0}</div>
          <div className="text-gray-500">На проверке</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-bold text-green-600">{stats?.stats.published_courses || 0}</div>
          <div className="text-gray-500">Опубликовано</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Последние решения</h2>
          <Link to="/teacher/submissions" className="text-purple-600 hover:underline text-sm">
            Все решения →
          </Link>
        </div>
        <div className="space-y-3">
          {stats?.recentSubmissions && stats.recentSubmissions.length > 0 ? (
            stats.recentSubmissions.map((sub) => (
              <div key={sub.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <img src={sub.student_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.user_id}`} alt="" className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <div className="font-medium">{sub.student_name || 'Студент'}</div>
                  <div className="text-sm text-gray-500">{sub.exercise_title || 'Задание'}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  sub.status === 'passed' ? 'bg-green-100 text-green-700' :
                  sub.status === 'failed' ? 'bg-red-100 text-red-700' :
                  sub.status === 'needs_review' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {sub.status === 'passed' ? 'Принято' :
                   sub.status === 'failed' ? 'Не принято' :
                   sub.status === 'needs_review' ? 'На проверке' : 'Ожидание'}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>Нет решений на проверке</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// My Courses Page
function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    teacherAPI.getCourses().then(setCourses).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Мои курсы</h1>
        <Link
          to="/teacher/courses/new"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-5 h-5" />
          Создать курс
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">У вас пока нет курсов</h3>
          <p className="text-gray-500 mb-4">Создайте свой первый курс и начните обучать студентов</p>
          <Link
            to="/teacher/courses/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-5 h-5" />
            Создать курс
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
                  {course.image ? (
                    <img src={course.image} alt="" className="w-10 h-10" />
                  ) : (
                    <BookOpen className="w-8 h-8 text-purple-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{course.title}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      course.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {course.is_published ? 'Опубликован' : 'Черновик'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">{course.short_description || 'Без описания'}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.students_count || 0} студентов
                    </span>
                    <span>{course.duration_hours || 0}ч</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Link
                  to={`/teacher/courses/${course.id}/structure`}
                  className="flex-1 px-4 py-2 text-center bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Уроки
                </Link>
                <Link
                  to={`/teacher/courses/${course.id}/edit`}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <Link
                  to={`/teacher/students?course_id=${course.id}`}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Create/Edit Course Page
function CourseEditorPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const isNew = courseId === 'new'
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    short_description: '',
    image: '',
    price: 0,
    duration_hours: 0,
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    category: '',
    tags: [] as string[],
    is_free: true,
    is_published: false,
  })
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (!isNew && courseId) {
      coursesAPI.getBySlug(courseId).then((course) => {
        setForm({
          title: course.title,
          description: course.description || '',
          short_description: course.short_description || '',
          image: course.image || '',
          price: course.price,
          duration_hours: course.duration_hours,
          level: course.level,
          category: course.category || '',
          tags: course.tags || [],
          is_free: course.is_free,
          is_published: course.is_published,
        })
      }).catch(console.error).finally(() => setLoading(false))
    }
  }, [courseId, isNew])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isNew) {
        await coursesAPI.create(form)
      } else {
        await coursesAPI.update(courseId!, form)
      }
      navigate('/teacher/courses')
    } catch (error) {
      alert('Ошибка сохранения курса')
    }
    setSaving(false)
  }

  const addTag = () => {
    if (tagInput && !form.tags.includes(tagInput)) {
      setForm({ ...form, tags: [...form.tags, tagInput] })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter(t => t !== tag) })
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/teacher/courses" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? 'Создание курса' : 'Редактирование курса'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 max-w-3xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Название курса *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Краткое описание</label>
            <input
              type="text"
              value={form.short_description}
              onChange={(e) => setForm({ ...form, short_description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Одно предложение о курсе"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Полное описание</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg h-32"
              placeholder="Подробное описание курса..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Уровень</label>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value as any })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="beginner">Начинающий</option>
                <option value="intermediate">Средний</option>
                <option value="advanced">Продвинутый</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Например: Программирование"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Длительность (часов)</label>
              <input
                type="number"
                value={form.duration_hours}
                onChange={(e) => setForm({ ...form, duration_hours: Number(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL изображения</label>
              <input
                type="url"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Теги</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {form.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-purple-900">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-2 border rounded-lg"
                placeholder="Добавить тег..."
              />
              <button type="button" onClick={addTag} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                Добавить
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_free}
                onChange={(e) => setForm({ ...form, is_free: e.target.checked })}
                className="w-5 h-5"
              />
              <span>Бесплатный курс</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                className="w-5 h-5"
              />
              <span>Опубликовать</span>
            </label>
          </div>

          {!form.is_free && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Цена (₽)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
                min={0}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Link
              to="/teacher/courses"
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// Students Page
function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    teacherAPI.getStudents().then(setStudents).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Мои студенты</h1>

      {students.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Пока нет студентов</h3>
          <p className="text-gray-500">Когда студенты запишутся на ваши курсы, они появятся здесь</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Студент</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Курс</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Прогресс</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Статус</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Действия</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => (
                <tr key={`${student.id}-${idx}`} className="border-t">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`} alt="" className="w-10 h-10 rounded-full" />
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{student.course_title || 'Курс'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-purple-600 rounded-full" 
                          style={{ width: `${student.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">{student.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      student.status === 'completed' ? 'bg-green-100 text-green-700' :
                      student.status === 'active' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {student.status === 'completed' ? 'Завершил' :
                       student.status === 'active' ? 'Учится' : 'Пауза'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link 
                        to={`/teacher/students/${student.id}`}
                        className="text-purple-600 hover:underline"
                      >
                        Подробнее
                      </Link>
                      <button
                        onClick={() => startChat(student.id)}
                        className="text-blue-600 hover:underline ml-2"
                      >
                        Написать
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Helper function to start chat
async function startChat(userId: string) {
  try {
    const chat = await chatAPI.createDirect(userId)
    window.location.href = `/teacher/chat/${chat.id}`
  } catch (error) {
    alert('Ошибка создания чата')
  }
}

// Student Details Page
function StudentDetailsPage() {
  const { studentId } = useParams()
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (studentId) {
      teacherAPI.getStudent(studentId).then(setStudent).catch(console.error).finally(() => setLoading(false))
    }
  }, [studentId])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Студент не найден
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/teacher/students" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Профиль студента</h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-center">
            <img src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`} alt="" className="w-24 h-24 rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-bold">{student.name}</h2>
            <p className="text-gray-500">{student.email}</p>
            <button
              onClick={() => startChat(student.id)}
              className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Написать
            </button>
          </div>
        </div>

        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Курсы</h3>
            <div className="space-y-3">
              {student.enrollments?.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{enrollment.course_id}</div>
                    <div className="text-sm text-gray-500">
                      Записан: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-purple-600 rounded-full" style={{ width: `${enrollment.progress}%` }} />
                    </div>
                    <span className="text-sm">{enrollment.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Последние решения</h3>
            <div className="space-y-3">
              {student.submissions?.length > 0 ? student.submissions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{sub.exercise_title || 'Задание'}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(sub.submitted_at).toLocaleString()}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    sub.status === 'passed' ? 'bg-green-100 text-green-700' :
                    sub.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {sub.status === 'passed' ? 'Принято' : sub.status === 'failed' ? 'Не принято' : 'На проверке'}
                  </span>
                </div>
              )) : (
                <p className="text-gray-500 text-center py-4">Нет решений</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Submissions Page
function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

  useEffect(() => {
    submissionsAPI.getPending().then(setSubmissions).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleGrade = async (grade: number, comment: string) => {
    if (!selectedSubmission) return
    
    try {
      await submissionsAPI.grade(selectedSubmission.id, {
        grade,
        teacher_comment: comment
      })
      
      setSubmissions(submissions.filter(s => s.id !== selectedSubmission.id))
      setSelectedSubmission(null)
    } catch (error) {
      alert('Ошибка при оценке')
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Проверка домашних заданий
        {submissions.length > 0 && (
          <span className="ml-2 px-2 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-full">
            {submissions.length} на проверке
          </span>
        )}
      </h1>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b font-medium">Ожидают проверки</div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {submissions.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubmission(sub)}
                className={`w-full p-4 text-left hover:bg-gray-50 ${
                  selectedSubmission?.id === sub.id ? 'bg-purple-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <img src={sub.student_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.user_id}`} alt="" className="w-10 h-10 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{sub.student_name || 'Студент'}</div>
                    <div className="text-sm text-gray-500 truncate">{sub.exercise_title || 'Задание'}</div>
                  </div>
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
              </button>
            ))}
            {submissions.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                Все решения проверены!
              </div>
            )}
          </div>
        </div>

        {selectedSubmission ? (
          <GradePanel 
            submission={selectedSubmission} 
            onGrade={handleGrade}
            onCancel={() => setSelectedSubmission(null)}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-500 min-h-[400px]">
            <div className="text-center">
              <FileCheck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Выберите решение для проверки</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Grade Panel with 2-5 scale
function GradePanel({ 
  submission, 
  onGrade, 
  onCancel 
}: { 
  submission: Submission
  onGrade: (grade: number, comment: string) => void
  onCancel: () => void
}) {
  const [comment, setComment] = useState('')
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)

  const grades = [
    { value: 5, label: '5', name: 'Отлично', color: 'bg-green-500 hover:bg-green-600' },
    { value: 4, label: '4', name: 'Хорошо', color: 'bg-blue-500 hover:bg-blue-600' },
    { value: 3, label: '3', name: 'Удовл.', color: 'bg-yellow-500 hover:bg-yellow-600' },
    { value: 2, label: '2', name: 'Неуд.', color: 'bg-red-500 hover:bg-red-600' },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-4 border-b font-medium flex items-center justify-between">
        <span>Проверка решения</span>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
      </div>
      
      <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
        <div>
          <div className="text-sm text-gray-500 mb-1">Студент</div>
          <div className="flex items-center gap-2">
            <img src={submission.student_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${submission.user_id}`} alt="" className="w-8 h-8 rounded-full" />
            <span className="font-medium">{submission.student_name || 'Студент'}</span>
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500 mb-1">Задание</div>
          <div className="font-medium">{submission.exercise_title || 'Задание'}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500 mb-1">Код</div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto max-h-64">
            {submission.code}
          </pre>
        </div>

        {submission.test_results && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Результаты тестов</div>
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              {typeof submission.test_results === 'object' && submission.test_results.testResults ? (
                <div className="space-y-1">
                  {submission.test_results.testResults.map((t: any, i: number) => (
                    <div key={i} className={`flex items-center gap-2 ${t.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {t.passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      Test {i + 1}: {t.passed ? 'Passed' : 'Failed'}
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="whitespace-pre-wrap">{JSON.stringify(submission.test_results, null, 2)}</pre>
              )}
            </div>
          </div>
        )}

        <div>
          <div className="text-sm text-gray-500 mb-2">Оценка</div>
          <div className="flex gap-2">
            {grades.map((g) => (
              <button
                key={g.value}
                onClick={() => setSelectedGrade(g.value)}
                className={`flex-1 py-3 rounded-lg text-white font-bold text-xl transition-all ${g.color} ${
                  selectedGrade === g.value ? 'ring-4 ring-offset-2 ring-gray-400 scale-105' : 'opacity-80'
                }`}
              >
                <div>{g.label}</div>
                <div className="text-xs font-normal">{g.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500 mb-1">Комментарий</div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Напишите комментарий для студента..."
            className="w-full px-4 py-2 border rounded-lg h-24 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            onClick={() => selectedGrade && onGrade(selectedGrade, comment)}
            disabled={!selectedGrade}
            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Выставить оценку
          </button>
        </div>
      </div>
    </div>
  )
}

// Chat List Page
function TeacherChatListPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chatAPI.getChats().then(setChats).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Сообщения</h1>

      {chats.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Нет сообщений</h3>
          <p className="text-gray-500">Сообщения от студентов появятся здесь</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="divide-y">
            {chats.map((chat) => {
              const otherParticipant = chat.participants?.find(p => p.role !== 'teacher') || chat.participants?.[0]
              return (
                <Link
                  key={chat.id}
                  to={`/teacher/chat/${chat.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50"
                >
                  <img 
                    src={otherParticipant?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.id}`} 
                    alt="" 
                    className="w-12 h-12 rounded-full" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{otherParticipant?.name || 'Пользователь'}</div>
                    <div className="text-sm text-gray-500 truncate">{chat.last_message || 'Нет сообщений'}</div>
                  </div>
                  {chat.unread_count > 0 && (
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
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

// Chat Room Page
function ChatRoomPage() {
  const { chatId } = useParams()
  const { user, token } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [chatInfo, setChatInfo] = useState<Chat | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [e2eeEnabled, setE2eeEnabled] = useState(false)
  const [e2eeInitialized, setE2eeInitialized] = useState(false)
  const [decryptionErrors, setDecryptionErrors] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize E2EE
  useEffect(() => {
    if (user?.id) {
      initializeE2EE()
    }
  }, [user?.id])

  const initializeE2EE = async () => {
    if (!user?.id) {
      console.log('[Teacher initializeE2EE] No user ID, skipping')
      return
    }
    console.log('[Teacher initializeE2EE] Starting E2EE initialization for user:', user.id)
    try {
      // Check localStorage first
      let privateKeyStr = getStoredPrivateKey(user.id)
      let publicKeyStr = getStoredPublicKey(user.id)
      console.log('[Teacher initializeE2EE] Keys in localStorage - private:', !!privateKeyStr, 'public:', !!publicKeyStr)
      
      // If keys exist locally, use them
      if (privateKeyStr && publicKeyStr) {
        console.log('[Teacher initializeE2EE] Keys found in localStorage, using them')
        setE2eeInitialized(true)
        console.log('[Teacher initializeE2EE] E2EE initialized with existing keys')
        return
      }
      
      // No keys locally - check server
      console.log('[Teacher initializeE2EE] No keys in localStorage, checking server')
      try {
        const serverKeys = await chatAPI.getMyKeys()
        
        if (serverKeys.public_key && serverKeys.private_key) {
          console.log('[Teacher initializeE2EE] Found keys on server!')
          
          privateKeyStr = serverKeys.private_key
          publicKeyStr = serverKeys.public_key
          
          // Store keys locally
          storePrivateKey(user.id, privateKeyStr)
          storePublicKey(user.id, publicKeyStr)
          console.log('[Teacher initializeE2EE] Keys loaded from server and stored locally')
          
          setE2eeInitialized(true)
          console.log('[Teacher initializeE2EE] E2EE initialized with server keys')
          return
        } else {
          console.log('[Teacher initializeE2EE] No keys on server')
        }
      } catch (error) {
        console.log('[Teacher initializeE2EE] No keys on server')
      }
      
      // Generate new keys
      if (!privateKeyStr || !publicKeyStr) {
        console.log('[Teacher initializeE2EE] Generating new key pair')
        
        const keyPair = await generateKeyPair()
        privateKeyStr = await exportPrivateKey(keyPair.privateKey)
        publicKeyStr = await exportPublicKey(keyPair.publicKey)
        console.log('[Teacher initializeE2EE] Key pair generated')
        
        // Store keys locally
        storePrivateKey(user.id, privateKeyStr)
        storePublicKey(user.id, publicKeyStr)
        console.log('[Teacher initializeE2EE] Keys stored in localStorage')
        
        // Upload keys to server
        try {
          await chatAPI.savePublicKey(publicKeyStr, privateKeyStr)
          console.log('[Teacher initializeE2EE] Keys uploaded to server')
        } catch (error) {
          console.error('[Teacher initializeE2EE] Failed to upload keys:', error)
        }
      }
      
      setE2eeInitialized(true)
      console.log('[Teacher initializeE2EE] E2EE initialization complete')
    } catch (error) {
      console.error('[Teacher initializeE2EE] Failed to initialize E2EE:', error)
    }
  }

  // WebSocket connection
  useEffect(() => {
    if (!token || !chatId) return

    const ws = createWebSocket(token)
    let isMounted = true
    
    // Add additional onopen handler (original is set in createWebSocket)
    ws.addEventListener('open', () => {
      if (isMounted) {
        console.log('Teacher WebSocket connected')
      }
    })

    ws.onerror = (error) => {
      if (isMounted) {
        console.error('Teacher WebSocket error:', error)
      }
    }

    ws.onclose = () => {
      if (isMounted) {
        console.log('Teacher WebSocket closed')
      }
    }
    
    ws.onmessage = async (event: MessageEvent) => {
      if (!isMounted) return
      
      try {
        const data = JSON.parse(event.data)
        console.log('Teacher WebSocket message received:', data.type)
        
        // Handle auth success
        if (data.type === 'auth_success') {
          console.log('Teacher WebSocket authenticated, userId:', data.userId)
          return
        }
        
        if (data.type === 'auth_error') {
          console.error('Teacher WebSocket auth error:', data.error)
          return
        }
        
        if (data.type === 'new_message') {
          const message = data.message
          
          // Decrypt message if encrypted (but not if it's our own message)
          if (message.is_encrypted && message.encrypted_content && user?.id && message.sender_id !== user.id) {
            console.log('[Teacher WebSocket] Decrypting new message', message.id, 'from sender', message.sender_id, 'my id:', user.id)
            try {
              const privateKeyStr = getStoredPrivateKey(user.id)
              if (privateKeyStr) {
                console.log('[Teacher WebSocket] Private key found, length:', privateKeyStr.length)
                // Check if public key matches private key
                const myPublicKey = getStoredPublicKey(user.id)
                if (myPublicKey) {
                  console.log('[Teacher WebSocket] My public key (first 50 chars):', myPublicKey.substring(0, 50))
                  // Try to get public key from server to compare
                  try {
                    const serverKeyData = await chatAPI.getUserPublicKey(user.id)
                    if (serverKeyData.public_key) {
                      console.log('[Teacher WebSocket] Server public key for me (first 50 chars):', serverKeyData.public_key.substring(0, 50))
                      if (serverKeyData.public_key !== myPublicKey) {
                        console.error('[Teacher WebSocket] WARNING: My public key in localStorage does not match server public key!')
                        console.error('[Teacher WebSocket] localStorage key (first 50):', myPublicKey.substring(0, 50))
                        console.error('[Teacher WebSocket] Server key (first 50):', serverKeyData.public_key.substring(0, 50))
                      }
                    }
                  } catch (e) {
                    console.log('[Teacher WebSocket] Could not fetch my public key from server for comparison')
                  }
                }
                let encryptedData: any
                if (typeof message.encrypted_content === 'string') {
                  try {
                    encryptedData = JSON.parse(message.encrypted_content)
                    console.log('[Teacher WebSocket] Parsed encrypted_content as JSON, has encrypted:', !!encryptedData.encrypted, 'has iv:', !!encryptedData.iv)
                  } catch (e) {
                    console.log('[Teacher WebSocket] Failed to parse as JSON, using legacy format')
                    // If parsing fails, treat it as a direct base64 string (legacy format)
                    encryptedData = { encrypted: message.encrypted_content, iv: message.iv || '' }
                  }
                } else {
                  encryptedData = message.encrypted_content
                  console.log('[Teacher WebSocket] encrypted_content is not a string, type:', typeof message.encrypted_content)
                }
                
                if (!encryptedData.encrypted) {
                  console.error('[Teacher WebSocket] No encrypted data in message', message.id)
                  message.content = '[Не удалось расшифровать сообщение]'
                  setDecryptionErrors(prev => new Set(prev).add(message.id))
                  return
                }
                
                // Verify key pair before decryption
                let shouldRegenerateKeys = false
                if (myPublicKey) {
                  try {
                    const { verifyKeyPair } = await import('../utils/e2ee')
                    const isValid = await verifyKeyPair(myPublicKey, privateKeyStr)
                    if (!isValid) {
                      console.error('[Teacher WebSocket] WARNING: Private key does not match public key! Will regenerate keys.')
                      shouldRegenerateKeys = true
                    }
                  } catch (e) {
                    console.error('[Teacher WebSocket] Failed to verify key pair:', e)
                    // If verification fails, try to decrypt anyway - might be a temporary issue
                  }
                }
                
                console.log('[Teacher WebSocket] Calling decryptMessage for message', message.id, 'encrypted length:', encryptedData.encrypted.length)
                try {
                  const decrypted = await decryptMessage(
                    encryptedData,
                    privateKeyStr
                  )
                  console.log('[Teacher WebSocket] Successfully decrypted message', message.id, 'decrypted length:', decrypted.length)
                  message.content = decrypted
                } catch (decryptError: any) {
                  const errorMsg = decryptError instanceof Error ? decryptError.message : String(decryptError)
                  console.error('[Teacher WebSocket] Decryption failed:', errorMsg)
                  
                  // If decryption fails due to key mismatch, regenerate keys
                  if (errorMsg.includes('does not match') || errorMsg.includes('DataError') || shouldRegenerateKeys) {
                    console.log('[Teacher WebSocket] Regenerating keys due to mismatch...')
                    try {
                      const keyPair = await generateKeyPair()
                      const newPrivateKey = await exportPrivateKey(keyPair.privateKey)
                      const newPublicKey = await exportPublicKey(keyPair.publicKey)
                      
                      storePrivateKey(user.id, newPrivateKey)
                      storePublicKey(user.id, newPublicKey)
                      
                      // Upload new keys to server
                      await chatAPI.savePublicKey(newPublicKey, newPrivateKey)
                      console.log('[Teacher WebSocket] Keys regenerated and uploaded to server')
                      
                      // Try to decrypt again with new keys (won't work for old messages, but will work for new ones)
                      message.content = '[Не удалось расшифровать сообщение: ключи были перегенерированы. Старые сообщения не могут быть расшифрованы.]'
                    } catch (regenError) {
                      console.error('[Teacher WebSocket] Failed to regenerate keys:', regenError)
                      message.content = '[Не удалось расшифровать сообщение: ошибка ключей]'
                    }
                  } else {
                    message.content = '[Не удалось расшифровать сообщение]'
                  }
                  setDecryptionErrors(prev => new Set(prev).add(message.id))
                }
              } else {
                console.error('[Teacher WebSocket] No private key found for user', user.id)
                message.content = '[Не удалось расшифровать сообщение: отсутствует приватный ключ]'
                setDecryptionErrors(prev => new Set(prev).add(message.id))
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error)
              console.error('[Teacher WebSocket] Failed to decrypt message', message.id, 'error:', errorMessage, 'full error:', error)
              
              // Check if it's a key mismatch error
              if (errorMessage.includes('different public key') || errorMessage.includes('decrypt AES key')) {
                message.content = '[Сообщение было зашифровано другим ключом. Возможно, ключи были перегенерированы после отправки сообщения.]'
              } else {
                message.content = '[Не удалось расшифровать сообщение]'
              }
              setDecryptionErrors(prev => new Set(prev).add(message.id))
            }
          } else if (message.is_encrypted && message.sender_id === user?.id) {
            // Our own encrypted message - check if we already have it with original content
            setMessages(prev => {
              const existingMessage = prev.find(m => m.id === message.id)
              if (existingMessage && existingMessage.content && !existingMessage.content.includes('зашифрованное')) {
                // Use existing message with original content
                return prev
              }
              // If no original content, show placeholder
              if (!message.content) {
                message.content = '[Ваше зашифрованное сообщение]'
              }
              return prev
            })
          } else if (message.is_encrypted && !message.encrypted_content) {
            setDecryptionErrors(prev => new Set(prev).add(message.id))
          }

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
        // Silent error handling
      }
    }

    wsRef.current = ws

    return () => {
      isMounted = false
      console.log('Teacher: Cleaning up WebSocket')
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    }
  }, [token, chatId, user?.id])

  // Exchange public keys
  const exchangePublicKeys = async (chat: Chat) => {
    if (!user?.id || !e2eeInitialized) {
      setE2eeEnabled(false)
      return
    }

    const otherParticipant = chat.participants.find(p => p.id !== user?.id)
    if (!otherParticipant) {
      setE2eeEnabled(false)
      return
    }

    try {
      // ALWAYS fetch from server - don't trust cache
      console.log('[Teacher exchangePublicKeys] Fetching recipient public key from server for:', otherParticipant.id)
      try {
        const keyData = await chatAPI.getUserPublicKey(otherParticipant.id)
        if (keyData.public_key) {
          const recipientKey = keyData.public_key
          console.log('[Teacher exchangePublicKeys] Received recipient public key from server, length:', recipientKey.length, 'first 50 chars:', recipientKey.substring(0, 50))
          
          // Check cache
          const cachedKey = getRecipientPublicKey(otherParticipant.id)
          if (cachedKey && cachedKey !== recipientKey) {
            console.warn('[Teacher exchangePublicKeys] ⚠️ WARNING: Cached key differs from server! Updating.')
            console.warn('[Teacher exchangePublicKeys] Cached key (first 50):', cachedKey.substring(0, 50))
            console.warn('[Teacher exchangePublicKeys] Server key (first 50):', recipientKey.substring(0, 50))
          } else if (cachedKey) {
            console.log('[Teacher exchangePublicKeys] Cache matches server')
          }
          
          // Always update cache with server key
          storeRecipientPublicKey(otherParticipant.id, recipientKey)
          console.log('[Teacher exchangePublicKeys] Recipient public key stored')
          
          // Also verify: if recipient is trying to decrypt messages from me, check if my public key matches
          const myPublicKey = getStoredPublicKey(user.id)
          if (myPublicKey) {
            console.log('[Teacher exchangePublicKeys] My public key (first 50 chars):', myPublicKey.substring(0, 50))
            console.log('[Teacher exchangePublicKeys] Recipient will use this key to encrypt messages to me')
          }
        } else {
          console.warn('[Teacher exchangePublicKeys] Recipient public key not found in response')
        }
      } catch (error) {
        console.error('[Teacher exchangePublicKeys] Failed to fetch recipient public key:', error)
        // Disable E2EE if key fetch failed
        setE2eeEnabled(false)
        return
      }

      // Enable E2EE if initialization is complete
      setE2eeEnabled(e2eeInitialized)
    } catch (error) {
      console.error('Failed to exchange keys:', error)
      // Disable E2EE if key exchange failed
      setE2eeEnabled(false)
    }
  }

  useEffect(() => {
    if (chatId) {
      loadChat()
    }
  }, [chatId, e2eeInitialized])

  const loadChat = async () => {
    if (!chatId || !user?.id) return
    
    try {
      // Get chat info
      const chats = await chatAPI.getChats()
      const chat = chats.find(c => c.id === chatId)
      setChatInfo(chat || null)
      
      // Exchange public keys first (wait for it to complete)
      if (chat) {
        console.log('[Teacher loadChat] Exchanging public keys for chat:', chatId)
        await exchangePublicKeys(chat)
      }
      
      // Get messages
      const msgs = await chatAPI.getMessages(chatId)
      console.log('[Teacher loadChat] Loaded', msgs.length, 'messages')
      
      // Decrypt messages if E2EE is enabled
      const privateKeyStr = getStoredPrivateKey(user.id)
      console.log('[Teacher loadChat] E2EE initialized:', e2eeInitialized, 'Private key exists:', !!privateKeyStr)
      if (privateKeyStr && e2eeInitialized) {
        console.log('[Teacher loadChat] Private key found, starting decryption')
        const decryptedMessages = await Promise.all(
          msgs.map(async (msg) => {
            // Don't try to decrypt our own messages - they were encrypted for recipient
            if (msg.is_encrypted && msg.encrypted_content && msg.sender_id !== user.id) {
              console.log('[Teacher loadChat] Decrypting message', msg.id, 'from sender', msg.sender_id, 'my id:', user.id)
              try {
                let encryptedData: any
                if (typeof msg.encrypted_content === 'string') {
                  try {
                    encryptedData = JSON.parse(msg.encrypted_content)
                    console.log('[Teacher loadChat] Parsed encrypted_content as JSON, has encrypted:', !!encryptedData.encrypted, 'has iv:', !!encryptedData.iv)
              } catch (e) {
                console.log('[Teacher loadChat] Failed to parse as JSON, using legacy format')
                // If parsing fails, treat it as a direct base64 string (legacy format)
                encryptedData = { encrypted: msg.encrypted_content, iv: msg.iv || '' }
              }
            } else {
              encryptedData = msg.encrypted_content
              console.log('[Teacher loadChat] encrypted_content is not a string, type:', typeof msg.encrypted_content)
            }
            
            if (!encryptedData.encrypted) {
              console.error('[Teacher loadChat] No encrypted data in message', msg.id)
              setDecryptionErrors(prev => new Set(prev).add(msg.id))
              return { ...msg, content: '[Не удалось расшифровать сообщение]' }
            }
            
            console.log('[Teacher loadChat] Calling decryptMessage for message', msg.id, 'encrypted length:', encryptedData.encrypted.length)
            const decrypted = await decryptMessage(
              encryptedData,
              privateKeyStr
            )
            console.log('[Teacher loadChat] Successfully decrypted message', msg.id, 'decrypted length:', decrypted.length)
            return { ...msg, content: decrypted }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            console.error('[Teacher loadChat] Failed to decrypt message', msg.id, 'error:', errorMessage, 'full error:', error)
                
                // Check if it's a key mismatch error
                let errorContent = '[Не удалось расшифровать сообщение]'
                if (errorMessage.includes('different public key') || errorMessage.includes('decrypt AES key')) {
                  errorContent = '[Сообщение было зашифровано другим ключом. Возможно, ключи были перегенерированы после отправки сообщения.]'
                }
                
                setDecryptionErrors(prev => new Set(prev).add(msg.id))
                return { ...msg, content: errorContent }
              }
            } else if (msg.is_encrypted && msg.sender_id === user.id) {
              // Our own encrypted message - keep original content if available
              return { ...msg, content: msg.content || '[Ваше зашифрованное сообщение]' }
            }
            return msg
          })
        )
        setMessages(decryptedMessages)
      } else {
        setMessages(msgs)
      }
    } catch (error) {
      console.error('Failed to load chat:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
    if ((!newMessage.trim() && !selectedFile) || !chatId || sending || !user?.id) return
    
    setSending(true)
    try {
      let content = newMessage.trim()
      let encryptedContent: string | undefined
      let isEncrypted = false

      // Always try to encrypt if E2EE is initialized and we have content
      if (e2eeInitialized && content && chatInfo) {
        const otherParticipant = chatInfo.participants.find(p => p.id !== user.id)
        if (otherParticipant) {
          console.log('[Teacher handleSend] Encrypting message for recipient:', otherParticipant.id, 'recipient name:', otherParticipant.name, 'my id:', user.id)
          // Use cached key only - it was loaded once in loadChat/exchangePublicKeys
          const recipientKeyStr = getRecipientPublicKey(otherParticipant.id)
          console.log('[Teacher handleSend] Recipient public key from cache:', !!recipientKeyStr, recipientKeyStr ? 'length: ' + recipientKeyStr.length + ', first 50 chars: ' + recipientKeyStr.substring(0, 50) : 'not found')
          
          // Encrypt if we have recipient's key
          if (recipientKeyStr) {
            try {
              // Verify we're not using our own key
              const myPublicKey = getStoredPublicKey(user.id)
              if (myPublicKey && recipientKeyStr === myPublicKey) {
                console.error('[Teacher handleSend] ERROR: Trying to encrypt with own public key!')
                throw new Error('Cannot encrypt with own public key')
              }
              
              console.log('[Teacher handleSend] Encrypting message with recipient public key')
              console.log('[Teacher handleSend] Using recipient public key (first 50 chars):', recipientKeyStr.substring(0, 50))
              const encrypted = await encryptMessage(content, recipientKeyStr)
              encryptedContent = JSON.stringify(encrypted)
              isEncrypted = true
              console.log('[Teacher handleSend] Message encrypted successfully, encrypted_content length:', encryptedContent.length)
              // Keep original content for sender to see their own message
              // Don't clear content - we'll send it but server will use encrypted_content for recipient
            } catch (error) {
              console.error('[Teacher handleSend] Encryption failed:', error)
              // Fall back to unencrypted if encryption fails
            }
          } else {
            console.warn('[Teacher handleSend] Recipient public key not found, sending unencrypted')
          }
        }
      }

      const message = await chatAPI.sendMessage(chatId, content, 'text', {
        encrypted_content: encryptedContent,
        is_encrypted: isEncrypted,
      })
      // For our own encrypted messages, keep the original content so we can see what we sent
      if (isEncrypted && message.sender_id === user.id) {
        message.content = content
      }
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

  const otherParticipant = chatInfo?.participants?.find(p => p.id !== user?.id)

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-4">
        <Link to="/teacher/chat" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <img 
          src={otherParticipant?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chatId}`} 
          alt="" 
          className="w-10 h-10 rounded-full" 
        />
        <div className="flex-1">
          <div className="font-medium flex items-center gap-2">
            {otherParticipant?.name || 'Пользователь'}
            {e2eeEnabled && (
              <div className="relative group">
                <Lock className="w-4 h-4 text-green-600" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  End-to-end шифрование включено
                </div>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500">Студент</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.sender_id === user?.id
          return (
            <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                {!isOwn && (
                  <img src={message.sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender_id}`} alt="" className="w-8 h-8 rounded-full" />
                )}
                <div>
                  <div className={`rounded-2xl px-4 py-2 ${
                    isOwn ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-900'
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
                      <pre className={`text-sm font-mono whitespace-pre-wrap ${isOwn ? 'bg-purple-700' : 'bg-gray-200'} rounded p-2`}>
                        {decryptionErrors.has(message.id) 
                          ? '[Ошибка расшифровки]' 
                          : (message.content || (message.is_encrypted ? '[Зашифрованное сообщение]' : ''))}
                      </pre>
                    ) : (
                      <p className="whitespace-pre-wrap">
                        {decryptionErrors.has(message.id) 
                          ? '[Не удалось расшифровать сообщение]' 
                          : (message.content || (message.is_encrypted ? '[Зашифрованное сообщение]' : ''))}
                      </p>
                    )}
                    {message.is_encrypted && !decryptionErrors.has(message.id) && (
                      <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                        <Lock className="w-3 h-3" />
                        <span>Зашифровано</span>
                      </div>
                    )}
                  </div>
                  <div className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : ''}`}>
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
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
            className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
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

// Main Teacher Page
export default function TeacherPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <TeacherSidebar />
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="courses" element={<MyCoursesPage />} />
          <Route path="courses/new" element={<CourseEditorPage />} />
          <Route path="courses/:courseId/edit" element={<CourseEditorPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="students/:studentId" element={<StudentDetailsPage />} />
          <Route path="submissions" element={<SubmissionsPage />} />
          <Route path="chat" element={<TeacherChatListPage />} />
          <Route path="chat/:chatId" element={<ChatRoomPage />} />
        </Routes>
      </main>
    </div>
  )
}
