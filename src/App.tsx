import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { OAuthCallbackPage } from './pages/OAuthCallbackPage'
import { CourseCatalogPage } from './pages/CourseCatalogPage'
import { CoursePage } from './pages/CoursePage'
import { AboutPage } from './pages/AboutPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { CorporatePage } from './pages/CorporatePage'
import { BlogPage } from './pages/BlogPage'
import { FAQPage } from './pages/FAQPage'
import { 
  DashboardPage, 
  DashboardHome, 
  DashboardCourses, 
  DashboardChallenges,
  DashboardSolutions,
  DashboardRating,
  DashboardContact,
  DashboardFeedback,
  DashboardTeams,
  DashboardChat,
  DashboardChatRoom
} from './pages/DashboardPage'
import { SettingsPage } from './pages/SettingsPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { LearnRoadmap, LessonPage, LearnCourses, LearnProgress, LearnDiscussions, DiscussionDetail } from './pages/LearnPage'
import AdminPage from './pages/AdminPage'
import TeacherPage from './pages/TeacherPage'
import CourseStructureEditorPage from './pages/CourseEditorPage'

// Layout with Header and Footer
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Learning pages (protected, no header/footer) */}
          <Route path="/learn" element={<ProtectedRoute><LearnRoadmap /></ProtectedRoute>} />
          <Route path="/learn/courses" element={<ProtectedRoute><LearnCourses /></ProtectedRoute>} />
          <Route path="/learn/progress" element={<ProtectedRoute><LearnProgress /></ProtectedRoute>} />
          <Route path="/learn/discussions" element={<ProtectedRoute><LearnDiscussions /></ProtectedRoute>} />
          <Route path="/learn/discussions/:id" element={<ProtectedRoute><DiscussionDetail /></ProtectedRoute>} />
          <Route path="/learn/lesson/:lessonId" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
          
          {/* Admin Panel (protected, no header/footer) */}
          <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />
          
          {/* Teacher Panel (protected, no header/footer) */}
          <Route path="/teacher/*" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherPage /></ProtectedRoute>} />
          <Route path="/teacher/courses/:courseId/structure" element={<ProtectedRoute allowedRoles={['teacher']}><CourseStructureEditorPage /></ProtectedRoute>} />
          
          {/* Main pages with header/footer */}
          <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
          <Route path="/login" element={<MainLayout><LoginPage /></MainLayout>} />
          <Route path="/register" element={<MainLayout><RegisterPage /></MainLayout>} />
          <Route path="/oauth/callback/:provider" element={<OAuthCallbackPage />} />
          <Route path="/oauth/success" element={<OAuthCallbackPage />} />
          <Route path="/courses" element={<MainLayout><CourseCatalogPage /></MainLayout>} />
          <Route path="/courses/:slug" element={<MainLayout><CoursePage /></MainLayout>} />
          <Route path="/about" element={<MainLayout><AboutPage /></MainLayout>} />
          <Route path="/reviews" element={<MainLayout><ReviewsPage /></MainLayout>} />
          <Route path="/corporate" element={<MainLayout><CorporatePage /></MainLayout>} />
          <Route path="/blog" element={<MainLayout><BlogPage /></MainLayout>} />
          <Route path="/faq" element={<MainLayout><FAQPage /></MainLayout>} />
          
          {/* Dashboard Routes (protected) */}
          <Route path="/dashboard" element={<ProtectedRoute><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>}>
            <Route index element={<DashboardHome />} />
            <Route path="courses" element={<DashboardCourses />} />
            <Route path="challenges" element={<DashboardChallenges />} />
            <Route path="solutions" element={<DashboardSolutions />} />
            <Route path="rating" element={<DashboardRating />} />
            <Route path="contact" element={<DashboardContact />} />
            <Route path="feedback" element={<DashboardFeedback />} />
            <Route path="teams" element={<DashboardTeams />} />
            <Route path="chat" element={<DashboardChat />} />
            <Route path="chat/:chatId" element={<DashboardChatRoom />} />
          </Route>
          <Route path="/dashboard/settings" element={<ProtectedRoute><MainLayout><SettingsPage /></MainLayout></ProtectedRoute>} />
          <Route path="/dashboard/notifications" element={<ProtectedRoute><MainLayout><NotificationsPage /></MainLayout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
