const API_URL = 'http://localhost:3001/api'
const WS_URL = 'ws://localhost:3001/ws'

// Get auth token
function getToken(): string | null {
  return localStorage.getItem('token')
}

// API request helper
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; name: string }) =>
    request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string; twoFactorToken?: string }) =>
    request<{ user?: User; token?: string; requiresTwoFactor?: boolean; message?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<User>('/auth/me'),

  updateProfile: (data: Partial<User>) =>
    request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getOAuthUrl: (provider: 'google' | 'vk' | 'github') =>
    request<{ url: string }>(`/oauth/${provider}`),
}

// Courses API
export const coursesAPI = {
  getMeta: () => request<{ categories: string[]; tags: string[] }>('/courses/meta'),

  getAll: (params?: { category?: string; level?: string; search?: string; page?: number }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString()
    return request<{ courses: Course[]; total: number; page: number; totalPages: number }>(
      `/courses${query ? `?${query}` : ''}`
    )
  },

  getBySlug: (slug: string) => request<CourseDetails>(`/courses/${slug}`),

  enroll: (courseId: string) =>
    request<Enrollment>(`/courses/${courseId}/enroll`, { method: 'POST' }),

  getLesson: (courseId: string, lessonId: string) =>
    request<LessonDetails>(`/courses/${courseId}/lessons/${lessonId}`),

  getLessonById: (lessonId: string) =>
    request<LessonWithNavigation>(`/courses/lessons/${lessonId}`),

  completeLesson: (courseId: string, lessonId: string) =>
    request<{ progress: number; completed: boolean }>(
      `/courses/${courseId}/lessons/${lessonId}/complete`,
      { method: 'POST' }
    ),

  create: (data: Partial<Course>) =>
    request<Course>('/courses', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Course>) =>
    request<Course>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<{ message: string }>(`/courses/${id}`, { method: 'DELETE' }),
}

// Submissions API
export const submissionsAPI = {
  submit: (data: { exercise_id: string; code: string; language: string }) =>
    request<Submission>('/submissions', { method: 'POST', body: JSON.stringify(data) }),

  getMy: (params?: { exercise_id?: string; page?: number }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString()
    return request<Submission[]>(`/submissions/my${query ? `?${query}` : ''}`)
  },

  getById: (id: string) => request<Submission>(`/submissions/${id}`),

  getPending: () => request<Submission[]>('/submissions/review/pending'),

  grade: (id: string, data: { grade: number; teacher_comment: string }) =>
    request<Submission>(`/submissions/${id}/grade`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}

// Chat API
export const chatAPI = {
  getChats: () => request<Chat[]>('/chat'),

  createDirect: (userId: string) =>
    request<Chat>('/chat/direct', { method: 'POST', body: JSON.stringify({ user_id: userId }) }),

  getMessages: (chatId: string, page = 1) =>
    request<Message[]>(`/chat/${chatId}/messages?page=${page}`),

  sendMessage: (
    chatId: string, 
    content: string, 
    messageType = 'text',
    options?: {
      encrypted_content?: string
      file_url?: string
      file_name?: string
      file_size?: number
      file_mimetype?: string
      is_encrypted?: boolean
    }
  ) =>
    request<Message>(`/chat/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ 
        content, 
        message_type: messageType,
        ...options
      }),
    }),

  uploadFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const token = getToken()
    return fetch(`${API_URL}/upload/chat`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(res => {
      if (!res.ok) {
        return res.json().then(err => Promise.reject(new Error(err.error || 'Upload failed')))
      }
      return res.json()
    })
  },

  getTeachers: () => request<Teacher[]>('/chat/teachers'),

  // E2EE key management
  savePublicKey: (publicKey: string, privateKey: string) =>
    request<{ success: boolean; message: string; key_exists: boolean }>('/chat/keys', {
      method: 'POST',
      body: JSON.stringify({ 
        public_key: publicKey,
        private_key: privateKey
      }),
    }),

  getMyKeys: () =>
    request<{ 
      public_key: string | null; 
      private_key: string | null;
    }>('/chat/keys/me'),

  getUserPublicKey: async (userId: string) => {
    try {
      return await request<{ public_key: string | null }>(`/chat/keys/${userId}`)
    } catch (error: any) {
      // If 404, key doesn't exist yet - return null instead of throwing
      if (error?.message?.includes('404') || error?.message?.includes('не найден')) {
        return { public_key: null }
      }
      throw error
    }
  },

  getChatKeys: (chatId: string) =>
    request<{ keys: Record<string, string> }>(`/chat/${chatId}/keys`),
}

// Admin API
export const adminAPI = {
  getStats: () => request<AdminStats>('/admin/stats'),

  getUsers: (params?: { role?: string; search?: string; page?: number }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString()
    return request<{ users: User[]; total: number; page: number; totalPages: number }>(
      `/admin/users${query ? `?${query}` : ''}`
    )
  },

  createUser: (data: { email: string; password: string; name: string; role: string }) =>
    request<User>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),

  updateUser: (id: string, data: Partial<User>) =>
    request<User>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteUser: (id: string) =>
    request<{ message: string }>(`/admin/users/${id}`, { method: 'DELETE' }),

  getCourses: () => request<Course[]>('/admin/courses'),

  getCourseStudents: (courseId: string) =>
    request<any[]>(`/admin/courses/${courseId}/students`),

  enrollUserToCourse: (courseId: string, userId: string) =>
    request<{ message: string }>(`/admin/courses/${courseId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),

  removeUserFromCourse: (enrollmentId: string) =>
    request<{ message: string }>(`/admin/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    }),

  getTransactions: (params?: { status?: string; page?: number }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString()
    return request<{ transactions: Transaction[]; total: number }>(
      `/admin/transactions${query ? `?${query}` : ''}`
    )
  },
}

// Teacher API
export const teacherAPI = {
  getStats: () => request<TeacherStats>('/teacher/stats'),

  getCourses: () => request<Course[]>('/teacher/courses'),

  getCourse: (courseId: string) => request<CourseWithModules>(`/teacher/courses/${courseId}`),

  getStudents: (params?: { course_id?: string; search?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString()
    return request<Student[]>(`/teacher/students${query ? `?${query}` : ''}`)
  },

  getStudent: (id: string) => request<StudentDetails>(`/teacher/students/${id}`),

  createModule: (courseId: string, data: { title: string; description?: string; order_index?: number }) =>
    request<Module>(`/teacher/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateModule: (moduleId: string, data: { title?: string; description?: string; order_index?: number }) =>
    request<Module>(`/teacher/modules/${moduleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteModule: (moduleId: string) =>
    request<{ message: string }>(`/teacher/modules/${moduleId}`, { method: 'DELETE' }),

  createLesson: (moduleId: string, data: Partial<Lesson>) =>
    request<Lesson>(`/teacher/modules/${moduleId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateLesson: (lessonId: string, data: Partial<Lesson>) =>
    request<Lesson>(`/teacher/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteLesson: (lessonId: string) =>
    request<{ message: string }>(`/teacher/lessons/${lessonId}`, { method: 'DELETE' }),

  createExercise: (lessonId: string, data: Partial<Exercise>) =>
    request<Exercise>(`/teacher/lessons/${lessonId}/exercises`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateExercise: (exerciseId: string, data: Partial<Exercise>) =>
    request<Exercise>(`/teacher/exercises/${exerciseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteExercise: (exerciseId: string) =>
    request<{ message: string }>(`/teacher/exercises/${exerciseId}`, { method: 'DELETE' }),

  notify: (userId: string, data: { title: string; content: string; link?: string }) =>
    request<{ message: string }>(`/teacher/notify/${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// User API (enrollments, stats, leaderboard, discussions)
export const userAPI = {
  // Profile settings
  getProfile: () => request<User>('/user/profile'),
  
  updateProfile: (data: { name?: string; email?: string; avatar?: string; bio?: string; github?: string; telegram?: string }) =>
    request<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/user/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    }),
  
  get2FAStatus: () => request<{ enabled: boolean; hasSecret?: boolean }>('/user/2fa/status'),
  
  setup2FA: () =>
    request<{ secret: string; qrCode: string; manualEntryKey: string }>('/user/2fa/setup', {
      method: 'POST',
    }),
  
  verify2FA: (token: string) =>
    request<{ success: boolean; enabled: boolean; message: string }>('/user/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
  
  disable2FA: (token: string) =>
    request<{ success: boolean; enabled: boolean; message: string }>('/user/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
  
  // Notifications
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/user/notifications/${id}/read`, {
      method: 'PUT',
    }),
  
  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/user/notifications/read-all', {
      method: 'PUT',
    }),
  
  deleteNotification: (id: string) =>
    request<{ success: boolean }>(`/user/notifications/${id}`, {
      method: 'DELETE',
    }),
  
  updateTheme: (theme: 'light' | 'dark') =>
    request<{ success: boolean; theme: string }>('/user/theme', {
      method: 'PUT',
      body: JSON.stringify({ theme }),
    }),
  
  getNotifications: () =>
    request<Array<{
      id: string
      type: string
      title: string
      message: string
      read: boolean
      created_at: string
    }>>('/user/notifications'),

  // Existing methods
  getEnrollments: () =>
    request<UserEnrollment[]>('/user/enrollments'),

  getStats: () =>
    request<UserStats>('/user/stats'),

  getLeaderboard: (period: 'week' | 'month' | 'all' = 'week') =>
    request<LeaderboardEntry[]>(`/user/leaderboard?period=${period}`),

  getDiscussions: (params?: { course_id?: string; page?: number }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString()
    return request<Discussion[]>(`/user/discussions${query ? `?${query}` : ''}`)
  },

  getDiscussion: (id: string) =>
    request<DiscussionDetail>(`/user/discussions/${id}`),

  createDiscussion: (data: { title: string; content: string; course_id?: string }) =>
    request<Discussion>('/user/discussions', { method: 'POST', body: JSON.stringify(data) }),

  createReply: (discussionId: string, content: string) =>
    request<DiscussionReply>(`/user/discussions/${discussionId}/replies`, { 
      method: 'POST', 
      body: JSON.stringify({ content }) 
    }),
  
  // Streak & Achievements
  getStreak: () =>
    request<{
      streak: number
      freezes: number
      gems: number
      lastActivity: string | null
      achievements: string[]
    }>('/user/streak'),
  
  recordActivity: () =>
    request<{ streak: number; message: string }>('/user/activity', {
      method: 'POST',
    }),
  
  buyStreakFreeze: () =>
    request<{ gems: number; freezes: number; message: string }>('/user/streak-freeze/buy', {
      method: 'POST',
    }),
  
  addGems: (amount: number, reason: string) =>
    request<{ gems: number; added: number; message: string }>('/user/gems/add', {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    }),
  
  getAchievements: () =>
    request<{
      achievements: Array<{
        id: string
        title: string
        description: string
        icon: string
        unlocked: boolean
      }>
    }>('/user/achievements'),
}

// Code execution API
export const codeAPI = {
  execute: (data: { code: string; language: string; input?: string; testCases?: TestCase[] }) =>
    request<ExecutionResult>('/execute', { method: 'POST', body: JSON.stringify(data) }),

  lint: (data: { code: string; language: string }) =>
    request<LintResult>('/lint', { method: 'POST', body: JSON.stringify(data) }),

  getLanguages: () => request<Language[]>('/languages'),

}

// WebSocket connection
export function createWebSocket(token: string): WebSocket {
  const ws = new WebSocket(WS_URL)

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'auth', token }))
  }

  return ws
}

// Types
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'student' | 'teacher' | 'admin'
  bio?: string
  github?: string
  telegram?: string
  is_active?: boolean
  created_at?: string
  last_login?: string
}

export interface Course {
  id: string
  title: string
  slug: string
  description?: string
  short_description?: string
  image?: string
  price: number
  duration_hours: number
  level: 'beginner' | 'intermediate' | 'advanced'
  category?: string
  tags: string[]
  is_published: boolean
  is_free: boolean
  teacher_id?: string
  teacher_name?: string
  teacher_avatar?: string
  students_count?: number
  avg_rating?: number
  created_at?: string
}

export interface CourseDetails extends Course {
  modules: Module[]
  enrollment?: Enrollment
  reviews: Review[]
  teacher_bio?: string
}

export interface CourseWithModules extends Course {
  modules: (Module & { lessons: (Lesson & { exercise?: Exercise })[] })[]
}

export interface Module {
  id: string
  course_id: string
  title: string
  description?: string
  order_index: number
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  module_id: string
  title: string
  type: 'theory' | 'video' | 'practice' | 'quiz' | 'project'
  content?: string
  video_url?: string
  duration_minutes: number
  order_index: number
  is_free: boolean
  exercise?: Exercise
}

export interface LessonDetails extends Lesson {
  exercise?: Exercise
  progress?: { status: string }
}

export interface LessonWithNavigation {
  lesson: Lesson & { 
    course_id: string
    course_title: string
    course_slug: string
    module_title: string
  }
  exercise?: Exercise
  progress?: { status: string }
  navigation: {
    prev: { id: string; title: string; type: string } | null
    next: { id: string; title: string; type: string } | null
    total: number
    current: number
  }
}

export interface Exercise {
  id: string
  lesson_id: string
  title: string
  description?: string
  initial_code?: string
  solution_code?: string
  language: string
  test_cases: TestCase[]
  hints: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
}

export interface TestCase {
  id?: string
  input: string
  expected?: string
  expected_output?: string
  is_hidden?: boolean
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
  completed_at?: string
  progress: number
  status: 'active' | 'completed' | 'paused' | 'cancelled'
}

export interface Submission {
  id: string
  user_id: string
  exercise_id: string
  code: string
  language: string
  status: 'pending' | 'checking' | 'passed' | 'failed' | 'needs_review'
  test_results?: any
  points_earned: number
  teacher_comment?: string
  submitted_at: string
  graded_at?: string
  exercise_title?: string
  student_name?: string
  student_avatar?: string
  course_title?: string
}

export interface Chat {
  id: string
  type: 'direct' | 'group' | 'course'
  name?: string
  last_message?: string
  last_message_at?: string
  unread_count: number
  participants: ChatParticipant[]
}

export interface ChatParticipant {
  id: string
  name: string
  avatar?: string
  role: string
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  sender_name: string
  sender_avatar?: string
  content: string
  encrypted_content?: string
  message_type: 'text' | 'code' | 'file' | 'system'
  file_url?: string
  file_name?: string
  file_size?: number
  file_mimetype?: string
  is_encrypted?: boolean
  iv?: string
  is_read: boolean
  created_at: string
}

export interface Teacher {
  id: string
  name: string
  avatar?: string
  bio?: string
  course_title?: string
  courses_count?: number
}

export interface Student {
  id: string
  name: string
  email: string
  avatar?: string
  enrolled_at: string
  progress: number
  status: string
  course_title?: string
  course_id?: string
}

export interface StudentDetails extends Student {
  enrollments: Enrollment[]
  submissions: Submission[]
}

export interface Review {
  id: string
  user_id: string
  user_name: string
  user_avatar?: string
  rating: number
  comment?: string
  created_at: string
}

export interface AdminStats {
  stats: {
    users: number
    students: number
    teachers: number
    courses: number
    published_courses: number
    enrollments: number
    submissions: number
    revenue: number
  }
  recentUsers: User[]
  recentEnrollments: Enrollment[]
}

export interface TeacherStats {
  stats: {
    courses: number
    published_courses: number
    total_students: number
    pending_submissions: number
  }
  recentSubmissions: Submission[]
}

export interface Transaction {
  id: string
  user_id: string
  user_name: string
  user_email: string
  course_id?: string
  course_title?: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_method?: string
  created_at: string
}

export interface ExecutionResult {
  success: boolean
  stage: 'compile' | 'run' | 'test' | 'system'
  output?: string
  error?: string
  executionTime?: number
  timedOut?: boolean
  testResults?: { input: string; expected: string; actual: string; passed: boolean; error?: string }[]
  passedCount?: number
  totalCount?: number
}

export interface LintResult {
  errors: LintError[]
  warnings: LintError[]
}

export interface LintError {
  line: number
  column?: number
  endColumn?: number
  message: string
  severity: 'error' | 'warning'
  code?: string
}


export interface Language {
  id: string
  name: string
  extension: string
  icon: string
}

export interface UserEnrollment {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
  completed_at?: string
  progress: number
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  course: {
    id: string
    title: string
    slug: string
    image?: string
    description?: string
    level: string
    duration_hours: number
    category?: string
    teacher_name?: string
  }
}

export interface UserStats {
  lessonsCompleted: number
  coursesCompleted: number
  exercisesCompleted: number
  studyHours: number
  totalPoints: number
  rank: number
  activity: { date: string; count: number }[]
  recentActivity: { type: string; time: string; action: string; item: string }[]
}

export interface LeaderboardEntry {
  pos: number
  id: string
  name: string
  avatar?: string
  points: number
  solved: number
}

export interface Discussion {
  id: string
  title: string
  content?: string
  course?: string
  course_id?: string
  author: string
  author_avatar?: string
  replies: number
  created_at: string
  time: string
}

export interface DiscussionReply {
  id: string
  content: string
  author: string
  author_avatar?: string
  created_at: string
  time: string
}

export interface DiscussionDetail extends Discussion {
  replies_list: DiscussionReply[]
}

export default {
  auth: authAPI,
  courses: coursesAPI,
  submissions: submissionsAPI,
  chat: chatAPI,
  admin: adminAPI,
  teacher: teacherAPI,
  user: userAPI,
  code: codeAPI,
  createWebSocket,
}

