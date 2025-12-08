import { useState, useEffect } from 'react'
import { Link, Routes, Route, useLocation, Navigate, useParams, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, Users, BookOpen, CreditCard, Settings, 
  Search, Plus, Edit, Trash2, ArrowLeft, Save, X,
  TrendingUp, DollarSign, UserCheck, GraduationCap
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { adminAPI, coursesAPI } from '../api'
import type { User, Course, AdminStats } from '../api'

// Admin Sidebar
function AdminSidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  
  const links = [
    { to: '/admin', icon: LayoutDashboard, label: 'Дашборд', exact: true },
    { to: '/admin/users', icon: Users, label: 'Пользователи' },
    { to: '/admin/courses', icon: BookOpen, label: 'Курсы' },
    { to: '/admin/transactions', icon: CreditCard, label: 'Платежи' },
    { to: '/admin/settings', icon: Settings, label: 'Настройки' },
  ]

  return (
    <aside className="w-64 bg-gray-900 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <Link to="/" className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <div className="w-4 h-4 bg-gray-900 rounded-sm"></div>
          </div>
          <span className="font-bold">MoonCode Admin</span>
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
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
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

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <img src={user?.avatar} alt="" className="w-10 h-10 rounded-full" />
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user?.name}</div>
            <div className="text-gray-500 text-xs">Администратор</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          Выйти
        </button>
      </div>
    </aside>
  )
}

// Dashboard Page
function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getStats().then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8">Загрузка...</div>

  const statCards = [
    { label: 'Пользователей', value: stats?.stats.users || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Студентов', value: stats?.stats.students || 0, icon: GraduationCap, color: 'bg-green-500' },
    { label: 'Курсов', value: stats?.stats.courses || 0, icon: BookOpen, color: 'bg-purple-500' },
    { label: 'Доход', value: `${stats?.stats.revenue || 0} ₽`, icon: DollarSign, color: 'bg-yellow-500' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Дашборд</h1>

      <div className="grid grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-gray-500 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Новые пользователи</h2>
          <div className="space-y-3">
            {stats?.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  user.role === 'admin' ? 'bg-red-100 text-red-700' :
                  user.role === 'teacher' ? 'bg-purple-100 text-purple-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Последние записи</h2>
          <div className="space-y-3">
            {stats?.recentEnrollments.map((enrollment: any) => (
              <div key={enrollment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <UserCheck className="w-10 h-10 text-green-500" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{enrollment.user_name}</div>
                  <div className="text-sm text-gray-500">{enrollment.course_title}</div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(enrollment.enrolled_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Users Page
function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    loadUsers()
  }, [search, roleFilter])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const result = await adminAPI.getUsers({ search, role: roleFilter })
      setUsers(result.users)
    } catch (error) {
      console.error('Failed to load users:', error)
    }
    setIsLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Удалить пользователя?')) {
      await adminAPI.deleteUser(id)
      loadUsers()
    }
  }

  const handleToggleActive = async (user: User) => {
    await adminAPI.updateUser(user.id, { is_active: !user.is_active })
    loadUsers()
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
        <button
          onClick={() => { setEditingUser(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Добавить
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Все роли</option>
            <option value="student">Студенты</option>
            <option value="teacher">Преподаватели</option>
            <option value="admin">Администраторы</option>
          </select>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Пользователь</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Email</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Роль</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Статус</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
                    <span className="font-medium">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'admin' ? 'bg-red-100 text-red-700' :
                    user.role === 'teacher' ? 'bg-purple-100 text-purple-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role === 'admin' ? 'Админ' : user.role === 'teacher' ? 'Препод' : 'Студент'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleActive(user)}
                    className={`px-2 py-1 text-xs rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {user.is_active ? 'Активен' : 'Заблокирован'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingUser(user); setShowModal(true) }}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => setShowModal(false)}
          onSave={loadUsers}
        />
      )}
    </div>
  )
}

// User Modal
function UserModal({ user, onClose, onSave }: { user: User | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'student',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (user) {
        await adminAPI.updateUser(user.id, form)
      } else {
        await adminAPI.createUser(form as any)
      }
      onSave()
      onClose()
    } catch (error) {
      alert('Ошибка сохранения')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">
          {user ? 'Редактировать пользователя' : 'Новый пользователь'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль {user && '(оставьте пустым, чтобы не менять)'}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              {...(!user && { required: true })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as any })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="student">Студент</option>
              <option value="teacher">Преподаватель</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Create Course Page
function AdminCourseCreatePage() {
  const navigate = useNavigate()
  const [teachers, setTeachers] = useState<User[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState(true)
  
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
    teacher_id: '' as string | undefined,
  })
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    loadTeachers()
  }, [])

  const loadTeachers = async () => {
    try {
      const data = await adminAPI.getUsers()
      const teachersList = (data.users || []).filter((user: User) => user.role === 'teacher')
      setTeachers(teachersList)
    } catch (error) {
      console.error('Failed to load teachers:', error)
    } finally {
      setLoadingTeachers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await coursesAPI.create(form)
      navigate('/admin/courses')
    } catch (error: any) {
      alert(error.message || 'Ошибка создания курса')
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

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/courses" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Создание курса</h1>
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
                <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900">×</button>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Преподаватель</label>
            <select
              value={form.teacher_id || ''}
              onChange={(e) => setForm({ ...form, teacher_id: e.target.value || undefined })}
              className="w-full px-4 py-2 border rounded-lg"
              disabled={loadingTeachers}
            >
              <option value="">Не назначен</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.email})
                </option>
              ))}
            </select>
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
              to="/admin/courses"
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Создание...' : 'Создать курс'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// Courses Page
function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    adminAPI.getCourses().then(setCourses).catch(console.error).finally(() => setIsLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (confirm('Удалить курс?')) {
      try {
        await coursesAPI.delete(id)
        setCourses(courses.filter(c => c.id !== id))
      } catch (error) {
        alert('Ошибка удаления курса')
      }
    }
  }

  const handleTogglePublish = async (course: Course) => {
    try {
      await coursesAPI.update(course.id, { is_published: !course.is_published })
      setCourses(courses.map(c => c.id === course.id ? { ...c, is_published: !c.is_published } : c))
    } catch (error) {
      alert('Ошибка обновления курса')
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Курсы</h1>
        <Link
          to="/admin/courses/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Создать курс
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="h-40 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {course.image ? (
                <img src={course.image} alt="" className="w-20 h-20 object-contain" />
              ) : (
                <BookOpen className="w-16 h-16 text-white/50" />
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{course.title}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  course.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {course.is_published ? 'Опубликован' : 'Черновик'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{course.short_description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{course.students_count || 0} студентов</span>
                <span>{course.is_free ? 'Бесплатно' : `${course.price} ₽`}</span>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => handleTogglePublish(course)}
                  className="flex-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
                >
                  {course.is_published ? 'Скрыть' : 'Опубликовать'}
                </button>
                <Link
                  to={`/admin/courses/${course.id}`}
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                >
                  Редактировать
                </Link>
                <button
                  onClick={() => handleDelete(course.id)}
                  className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Transactions Page
function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    adminAPI.getTransactions().then(data => setTransactions(data.transactions)).catch(console.error).finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Платежи</h1>

      <div className="bg-white rounded-xl shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Пользователь</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Курс</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Сумма</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Статус</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Дата</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-t">
                <td className="px-6 py-4">
                  <div className="font-medium">{tx.user_name}</div>
                  <div className="text-sm text-gray-500">{tx.user_email}</div>
                </td>
                <td className="px-6 py-4">{tx.course_title || '-'}</td>
                <td className="px-6 py-4 font-medium">{tx.amount} ₽</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                    tx.status === 'failed' ? 'bg-red-100 text-red-700' :
                    tx.status === 'refunded' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {tx.status === 'completed' ? 'Оплачено' :
                     tx.status === 'failed' ? 'Ошибка' :
                     tx.status === 'refunded' ? 'Возврат' : 'Ожидание'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(tx.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Settings Page
function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Настройки</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Название сайта</label>
            <input type="text" defaultValue="MoonCode School" className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Разрешить регистрацию</div>
              <div className="text-sm text-gray-500">Новые пользователи смогут регистрироваться</div>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email уведомления</div>
              <div className="text-sm text-gray-500">Отправлять уведомления на email</div>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Режим обслуживания</div>
              <div className="text-sm text-gray-500">Сайт будет недоступен для пользователей</div>
            </div>
            <input type="checkbox" className="w-5 h-5" />
          </div>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}

// Admin Course Edit Page
function AdminCourseEditPage() {
  const { courseId } = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [teachers, setTeachers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')

  useEffect(() => {
    if (courseId && courseId !== 'new') {
      loadCourse()
      loadStudents()
      loadAllUsers()
    } else {
      setLoading(false)
    }
  }, [courseId])

  const loadCourse = async () => {
    try {
      // Try to get course by ID from admin API or by slug
      try {
        const courses = await adminAPI.getCourses()
        const found = courses.find(c => c.id === courseId)
        if (found) {
          setCourse(found)
        } else {
          // Fallback to slug
          const data = await coursesAPI.getBySlug(courseId!)
          setCourse(data)
        }
      } catch (e) {
        // Fallback to slug
        const data = await coursesAPI.getBySlug(courseId!)
        setCourse(data)
      }
    } catch (error) {
      console.error('Failed to load course:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStudents = async () => {
    try {
      const data = await adminAPI.getCourseStudents(courseId!)
      setStudents(data || [])
    } catch (error) {
      console.error('Failed to load students:', error)
    }
  }

  const loadAllUsers = async () => {
    try {
      const data = await adminAPI.getUsers()
      setAllUsers(data.users || [])
      // Filter teachers
      const teachersList = (data.users || []).filter((user: User) => user.role === 'teacher')
      setTeachers(teachersList)
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const handleSave = async () => {
    if (!course) return
    setSaving(true)
    try {
      await coursesAPI.update(course.id, {
        title: course.title,
        description: course.description,
        short_description: course.short_description,
        price: course.price,
        is_free: course.is_free,
        is_published: course.is_published,
        teacher_id: course.teacher_id,
      })
      alert('Курс сохранен!')
    } catch (error) {
      alert('Ошибка сохранения курса')
    }
    setSaving(false)
  }

  const handleAddUser = async () => {
    if (!selectedUserId || !courseId) return
    try {
      await adminAPI.enrollUserToCourse(courseId, selectedUserId)
      await loadStudents()
      setShowAddUser(false)
      setSelectedUserId('')
      alert('Пользователь добавлен к курсу!')
    } catch (error: any) {
      alert(error.message || 'Ошибка добавления пользователя')
    }
  }

  const handleRemoveUser = async (enrollmentId: string) => {
    if (!confirm('Удалить пользователя из курса?')) return
    try {
      await adminAPI.removeUserFromCourse(enrollmentId)
      await loadStudents()
      alert('Пользователь удален из курса!')
    } catch (error) {
      alert('Ошибка удаления пользователя')
    }
  }

  const filteredUsers = allUsers.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-2">Курс не найден</h2>
          <Link to="/admin/courses" className="text-blue-600 hover:text-blue-700">
            Вернуться к курсам
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/courses" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Редактирование курса</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Course Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Информация о курсе</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                <input
                  type="text"
                  value={course.title}
                  onChange={(e) => setCourse({ ...course, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Краткое описание</label>
                <input
                  type="text"
                  value={course.short_description || ''}
                  onChange={(e) => setCourse({ ...course, short_description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Полное описание</label>
                <textarea
                  value={course.description || ''}
                  onChange={(e) => setCourse({ ...course, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg h-32"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Цена (₽)</label>
                  <input
                    type="number"
                    value={course.price}
                    onChange={(e) => setCourse({ ...course, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    checked={course.is_free}
                    onChange={(e) => setCourse({ ...course, is_free: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-medium text-gray-700">Бесплатный курс</label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Преподаватель</label>
                <select
                  value={course.teacher_id || ''}
                  onChange={(e) => setCourse({ ...course, teacher_id: e.target.value || undefined })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="">Не назначен</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={course.is_published}
                  onChange={(e) => setCourse({ ...course, is_published: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-medium text-gray-700">Опубликован</label>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Студенты</h2>
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Добавить
              </button>
            </div>

            {showAddUser && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Поиск по email или имени..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
                  {filteredUsers.slice(0, 10).map(user => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`p-2 rounded-lg cursor-pointer ${
                        selectedUserId === user.id ? 'bg-blue-100 border-2 border-blue-500' : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddUser}
                    disabled={!selectedUserId}
                    className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Добавить
                  </button>
                  <button
                    onClick={() => {
                      setShowAddUser(false)
                      setSearchQuery('')
                      setSelectedUserId('')
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {students.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Нет студентов на курсе</p>
              ) : (
                students.map((enrollment: any) => (
                  <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{enrollment.user_name || enrollment.user?.name}</div>
                      <div className="text-xs text-gray-500">{enrollment.user_email || enrollment.user?.email}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Прогресс: {enrollment.progress || 0}%
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveUser(enrollment.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Удалить из курса"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Admin Page
export default function AdminPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1">
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/new" element={<AdminCourseCreatePage />} />
          <Route path="courses/:courseId" element={<AdminCourseEditPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}

