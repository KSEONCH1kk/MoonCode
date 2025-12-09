import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { 
  Home, BarChart2, BookOpen, MessageCircle, Trophy, Users, UserPlus,
  ChevronDown, Play, FileText, Code, CheckCircle, Circle, ArrowRight,
  Calendar, HelpCircle, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Copy, Check
} from 'lucide-react'
import Editor from '@monaco-editor/react'
import { getLanguageFromFilename, initializeMonaco } from '../monaco-config'
import { executeCode, lintCode, healthCheck, getLanguageFromExtension } from '../api/codeRunner'
import { userAPI } from '../api'
import type { UserEnrollment, UserStats, Discussion, DiscussionDetail } from '../api'
import { useToast, ToastContainer } from '../components/Toast'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'

// Core components - must be loaded first
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-sql'

// Base languages (must be loaded before extensions)
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-python'

// Language extensions (depend on base languages)
import 'prismjs/components/prism-cpp' // Requires prism-c
import 'prismjs/components/prism-typescript' // Requires prism-javascript

// All other compiler-supported languages
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-kotlin'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-ruby'

// PHP has known compatibility issues with Prism.js
// We'll skip PHP highlighting to avoid errors - PHP code will display without syntax highlighting
// import 'prismjs/components/prism-clike'
// import 'prismjs/components/prism-php'

// Initialize Monaco with all language support
initializeMonaco()


// Code Block Component with Syntax Highlighting
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current) {
      if (language) {
        try {
          // Normalize language name for Prism
          const normalizedLang = normalizeLanguage(language)
          
          // Skip PHP highlighting as it has compatibility issues
          if (normalizedLang === 'php') {
            codeRef.current.textContent = code
            codeRef.current.className = 'language-text'
            return
          }
          
          // Check if language is supported by Prism
          if (!Prism.languages[normalizedLang]) {
            throw new Error(`Language ${normalizedLang} not loaded`)
          }
          
          codeRef.current.className = `language-${normalizedLang}`
          // Highlight code using Prism
          Prism.highlightElement(codeRef.current)
        } catch (error) {
          // If highlighting fails, just display the code without syntax highlighting
          console.warn(`Failed to highlight ${language}:`, error)
          if (codeRef.current) {
            codeRef.current.textContent = code
            codeRef.current.className = 'language-text'
          }
        }
      } else {
        // If no language, just escape HTML
        if (codeRef.current) {
          codeRef.current.textContent = code
          codeRef.current.className = 'language-text'
        }
      }
    }
  }, [code, language])

  // Normalize language names to Prism.js format
  const normalizeLanguage = (lang: string): string => {
    const langLower = lang.toLowerCase()
    const langMap: Record<string, string> = {
      'c++': 'cpp',
      'c#': 'csharp',
      'cs': 'csharp',
      'py': 'python',
      'js': 'javascript',
      'ts': 'typescript',
      'kt': 'kotlin',
      'rb': 'ruby',
      'md': 'markdown',
      'sh': 'bash',
      'shell': 'bash',
    }
    return langMap[langLower] || langLower
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const languageNames: Record<string, string> = {
    // Web technologies
    html: 'HTML',
    css: 'CSS',
    js: 'JavaScript',
    javascript: 'JavaScript',
    ts: 'TypeScript',
    typescript: 'TypeScript',
    json: 'JSON',
    xml: 'XML',
    md: 'Markdown',
    markdown: 'Markdown',
    
    // Compiler-supported languages
    java: 'Java',
    py: 'Python',
    python: 'Python',
    cpp: 'C++',
    'c++': 'C++',
    c: 'C',
    go: 'Go',
    golang: 'Go',
    rust: 'Rust',
    kotlin: 'Kotlin',
    kt: 'Kotlin',
    csharp: 'C#',
    cs: 'C#',
    php: 'PHP',
    ruby: 'Ruby',
    rb: 'Ruby',
    
    // Other
    bash: 'Bash',
    sh: 'Shell',
    shell: 'Shell',
    sql: 'SQL',
  }

  const displayLanguage = language ? (languageNames[language.toLowerCase()] || language.toUpperCase()) : 'Code'

  return (
    <div className="my-4 md:my-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-[#1e1e1e] overflow-hidden shadow-lg code-block-container w-full max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-2.5 bg-[#252526] border-b border-gray-700">
        <div className="flex items-center gap-2 min-w-0">
          <Code className="w-4 h-4 text-gray-400 hidden sm:block shrink-0" />
          <span className="text-xs md:text-sm font-medium text-gray-300 truncate">{displayLanguage}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors shrink-0"
          title="Копировать код"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Скопировано</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Копировать</span>
            </>
          )}
        </button>
      </div>
      
      {/* Code Content */}
      <div className="relative overflow-x-auto overflow-y-auto max-h-[300px] md:max-h-[600px] code-block-scroll">
        <pre className="m-0 p-3 md:p-4 text-[11px] md:text-sm leading-relaxed whitespace-pre">
          <code
            ref={codeRef}
            className={`language-${language ? normalizeLanguage(language) : 'text'}`}
          >
            {code}
          </code>
        </pre>
      </div>
    </div>
  )
}

// Custom Video Player Component
function VideoPlayer({ url, title, duration }: { url?: string; title: string; duration?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setTotalDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value)
    setVolume(vol)
    if (videoRef.current) {
      videoRef.current.volume = vol
    }
    setIsMuted(vol === 0)
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
    }
  }

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }

  // If no URL, show placeholder
  if (!url) {
    return (
      <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg md:rounded-xl mb-4 md:mb-8 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.1),transparent)]" />
        <div className="text-center text-white z-10 px-4">
          <div className="w-14 h-14 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 rounded-full bg-white/10 flex items-center justify-center">
            <Play className="w-7 h-7 md:w-10 md:h-10 text-white/80" />
          </div>
          <p className="text-base md:text-xl font-medium line-clamp-2">{title}</p>
          <p className="text-xs md:text-sm text-gray-400 mt-2">Видео скоро будет добавлено</p>
          {duration && <p className="text-xs text-gray-500 mt-1">Длительность: ~{duration} мин</p>}
        </div>
      </div>
    )
  }

  // Check if it's a YouTube URL
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be')
  
  // For YouTube, convert to embed URL
  if (isYouTube) {
    let embedUrl = url
    
    // Already an embed URL
    if (url.includes('/embed/')) {
      embedUrl = url
    }
    // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    else if (url.includes('watch?v=')) {
      const videoId = url.split('watch?v=')[1]?.split('&')[0]
      embedUrl = `https://www.youtube.com/embed/${videoId}`
    }
    // Short URL: https://youtu.be/VIDEO_ID
    else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0]
      embedUrl = `https://www.youtube.com/embed/${videoId}`
    }
    // Just video ID
    else if (url.match(/^[a-zA-Z0-9_-]{11}$/)) {
      embedUrl = `https://www.youtube.com/embed/${url}`
    }
    
    return (
      <div className="aspect-video bg-gray-900 rounded-lg md:rounded-xl mb-4 md:mb-8 overflow-hidden">
        <iframe 
          src={embedUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    )
  }

  // Custom video player for direct video files
  return (
    <div 
      ref={containerRef}
      className={`bg-black rounded-lg md:rounded-xl mb-4 md:mb-8 relative overflow-hidden group ${isFullscreen ? 'fixed inset-0 z-50 rounded-none mb-0' : 'aspect-video'}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onTouchStart={() => setShowControls(true)}
    >
      <video
        ref={videoRef}
        src={url}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
        playsInline
        webkit-playsinline="true"
      />
      
      {/* Play overlay */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
            <Play className="w-7 h-7 md:w-10 md:h-10 text-white ml-0.5 md:ml-1" />
          </div>
        </div>
      )}
      
      {/* Controls - fixed at bottom */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 md:p-4 pb-3 md:pb-6 transition-opacity z-10 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress bar */}
        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
          <span className="text-white text-[10px] md:text-sm font-mono w-10 md:w-14">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={totalDuration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 md:h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 md:[&::-webkit-slider-thumb]:w-4 md:[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
          />
          <span className="text-white text-[10px] md:text-sm font-mono w-10 md:w-14 text-right">{formatTime(totalDuration)}</span>
        </div>
        
        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5 md:gap-1">
            <button onClick={() => skip(-10)} className="p-1.5 md:p-2.5 text-white hover:bg-white/20 rounded-lg transition-colors">
              <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button onClick={togglePlay} className="p-2 md:p-3 text-white hover:bg-white/20 rounded-lg transition-colors">
              {isPlaying ? <Pause className="w-5 h-5 md:w-7 md:h-7" /> : <Play className="w-5 h-5 md:w-7 md:h-7" />}
            </button>
            <button onClick={() => skip(10)} className="p-1.5 md:p-2.5 text-white hover:bg-white/20 rounded-lg transition-colors">
              <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            
            {/* Volume - hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 ml-4">
              <button onClick={toggleMute} className="p-2.5 text-white hover:bg-white/20 rounded-lg transition-colors">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-24 h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-3">
            {/* Mute button on mobile */}
            <button onClick={toggleMute} className="md:hidden p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <span className="text-white text-sm hidden lg:block truncate max-w-[200px]">{title}</span>
            <button onClick={toggleFullscreen} className="p-1.5 md:p-2.5 text-white hover:bg-white/20 rounded-lg transition-colors">
              <Maximize className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Sidebar for learning
const learnSidebarLinks = [
  { to: '/learn', id: 'learn', icon: Home, label: 'Обучение' },
  { to: '/learn/progress', id: 'progress', icon: BarChart2, label: 'Прогресс' },
  { to: '/learn/courses', id: 'courses', icon: BookOpen, label: 'Курсы' },
  { to: '/dashboard/solutions', id: 'grades', icon: Trophy, label: 'Оценки' },
  { to: '/learn/discussions', id: 'discussions', icon: MessageCircle, label: 'Обсуждения' },
]

function LearnSidebar({ active = 'learn' }: { active?: string }) {
  return (
    <aside className="hidden md:block w-[200px] border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
      <nav className="p-4 space-y-1">
        {learnSidebarLinks.map(link => (
          <Link 
            key={link.id}
            to={link.to} 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              active === link.id 
                ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 font-medium' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <link.icon className="w-5 h-5" />
            {link.label}
          </Link>
        ))}
        
        <div className="border-t border-gray-200 dark:border-gray-700 my-4" />
        
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
          <Users className="w-5 h-5" />
          Партнерка
        </a>
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
          <UserPlus className="w-5 h-5" />
          Команда
        </a>
      </nav>
    </aside>
  )
}

// Mobile bottom navigation for Learn pages
function LearnMobileNav({ active = 'learn' }: { active?: string }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-14">
        {learnSidebarLinks.slice(0, 5).map(link => (
          <Link
            key={link.id}
            to={link.to}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 ${
              active === link.id
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <link.icon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{link.label.length > 8 ? link.label.slice(0, 7) + '…' : link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

// Course Roadmap Page
export function LearnRoadmap() {
  const [courseDropdown, setCourseDropdown] = useState(false)
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([])
  const [currentCourse, setCurrentCourse] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [firstLessonId, setFirstLessonId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const data = await userAPI.getEnrollments()
      setEnrollments(data || [])
      
      if (data && data.length > 0) {
        // Try to load last visited course from localStorage
        const lastCourseId = localStorage.getItem('lastVisitedCourseId')
        let enrollmentToLoad = data[0] // Default to first course
        
        if (lastCourseId) {
          // Find enrollment with matching course_id
          const lastEnrollment = data.find(e => e.course.id === lastCourseId)
          if (lastEnrollment) {
            enrollmentToLoad = lastEnrollment
          }
        }
        
        // Load course details for selected enrollment
        const courseDetails = await fetch(`http://localhost:3001/api/courses/${enrollmentToLoad.course.slug}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json())
        
        setCurrentCourse({
          ...enrollmentToLoad.course,
          progress: enrollmentToLoad.progress,
          modules: courseDetails.modules || []
        })
        setModules(courseDetails.modules || [])
        
        // Get first lesson ID
        if (courseDetails.modules?.length > 0 && courseDetails.modules[0].lessons?.length > 0) {
          setFirstLessonId(courseDetails.modules[0].lessons[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load courses:', error)
    }
    setLoading(false)
  }

  const selectCourse = async (enrollment: UserEnrollment) => {
    try {
      const token = localStorage.getItem('token')
      const courseDetails = await fetch(`http://localhost:3001/api/courses/${enrollment.course.slug}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json())
      
      // Save selected course to localStorage
      localStorage.setItem('lastVisitedCourseId', enrollment.course.id)
      
      setCurrentCourse({
        ...enrollment.course,
        progress: enrollment.progress,
        modules: courseDetails.modules || []
      })
      setModules(courseDetails.modules || [])
      
      if (courseDetails.modules?.length > 0 && courseDetails.modules[0].lessons?.length > 0) {
        setFirstLessonId(courseDetails.modules[0].lessons[0].id)
      }
    } catch (error) {
      console.error('Failed to load course:', error)
    }
    setCourseDropdown(false)
  }

  const getLessonIcon = (type: string, completed: boolean) => {
    if (completed) return <CheckCircle className="w-5 h-5 text-blue-500" />
    if (type === 'video') return <Play className="w-5 h-5 text-gray-400" />
    if (type === 'theory') return <FileText className="w-5 h-5 text-gray-400" />
    if (type === 'practice') return <Code className="w-5 h-5 text-gray-400" />
    if (type === 'quiz') return <HelpCircle className="w-5 h-5 text-gray-400" />
    return <Circle className="w-5 h-5 text-gray-400" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <LearnSidebar />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center pb-20 md:pb-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </main>
        <LearnMobileNav />
      </div>
    )
  }

  // If no enrollments, show empty state
  if (enrollments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <LearnSidebar />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center pb-20 md:pb-8">
          <div className="text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Нет активных курсов</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Запишитесь на курс, чтобы начать обучение</p>
            <Link 
              to="/courses" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
            >
              Выбрать курс <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
        <LearnMobileNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <LearnSidebar />
      
      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
        {/* Course Selector */}
        <div className="relative inline-block mb-6 md:mb-8">
          <button 
            onClick={() => setCourseDropdown(!courseDropdown)}
            className="flex items-center gap-2 text-lg md:text-2xl font-medium text-gray-900 dark:text-white"
          >
            <span className="truncate max-w-[200px] md:max-w-none">{currentCourse?.title || 'Выберите курс'}</span>
            <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${courseDropdown ? 'rotate-180' : ''}`} />
          </button>
          {courseDropdown && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-10">
              {enrollments.map(e => (
                <button 
                  key={e.id}
                  onClick={() => selectCourse(e)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    currentCourse?.id === e.course.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {e.course.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Promo Banner - stack on mobile */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-gray-900 dark:text-white text-sm md:text-base">Групповое обучение с наставником</div>
              <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">Ревью проектов, вебинары, поддержка</div>
            </div>
          </div>
          <Link to="/courses" className="px-4 md:px-6 py-2 md:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white text-center shrink-0">
            Все курсы
          </Link>
        </div>

        {/* Course Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Current Course */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg md:text-xl font-medium text-gray-900 dark:text-white truncate">{currentCourse?.title || 'Курс'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{currentCourse?.duration_hours || 0}ч обучения</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-orange-400 flex items-center justify-center text-xs md:text-sm font-medium text-orange-500 shrink-0 ml-2">
                {currentCourse?.progress || 0}%
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="flex gap-0.5 md:gap-1 mb-4">
              {Array.from({ length: 20 }).map((_, i) => {
                const progress = currentCourse?.progress || 0
                const filled = i < Math.floor(progress / 5)
                return (
                  <div 
                    key={i} 
                    className={`h-1 md:h-1.5 flex-1 rounded-full ${filled ? 'bg-blue-500' : 'bg-gray-100 dark:bg-gray-700'}`}
                  />
                )
              })}
            </div>

            <button 
              onClick={() => firstLessonId && navigate(`/learn/lesson/${firstLessonId}`)}
              disabled={!firstLessonId}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
            >
              Учиться <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Project Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg md:text-xl font-medium text-gray-900 dark:text-white">Практический проект</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Проект</p>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">0/5 этапов</div>
            </div>
            
            {/* Progress bar */}
            <div className="flex gap-0.5 md:gap-1 mb-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-1 md:h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-gray-700" />
              ))}
            </div>

            <button 
              onClick={() => firstLessonId && navigate(`/learn/lesson/${firstLessonId}`)}
              disabled={!firstLessonId}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
            >
              Кодить <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modules List */}
        {modules.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>Модули курса пока не добавлены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 md:gap-x-8 gap-y-6">
            {modules.map((module: any) => (
              <div key={module.id}>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 text-sm md:text-base">{module.title}</h4>
                <div className="space-y-2">
                  {(module.lessons || []).map((lesson: any) => (
                    <Link
                      key={lesson.id}
                      to={`/learn/lesson/${lesson.id}`}
                      className="flex items-center gap-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      {getLessonIcon(lesson.type, lesson.completed || false)}
                      <span className={`truncate ${lesson.completed ? 'text-gray-400 dark:text-gray-500' : ''}`}>{lesson.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <LearnMobileNav />
    </div>
  )
}

// Lesson Page Layout
export function LessonPage() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const [lessonData, setLessonData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    if (lessonId) {
      loadLesson()
    }
  }, [lessonId])

  const loadLesson = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Необходимо войти в систему')
        setLoading(false)
        return
      }

      const response = await fetch(`http://localhost:3001/api/courses/lessons/${lessonId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Ошибка загрузки урока')
      }
      
      const data = await response.json()
      setLessonData(data)
      setIsCompleted(data.progress?.status === 'completed')
      
      // Save course_id to localStorage so LearnRoadmap loads the correct course
      if (data.lesson?.course_id) {
        localStorage.setItem('lastVisitedCourseId', data.lesson.course_id)
      }
    } catch (err: any) {
      console.error('Failed to load lesson:', err)
      setError(err.message || 'Урок не найден')
    }
    setLoading(false)
  }

  const markAsCompleted = async () => {
    if (!lessonId || isCompleted || completing) return
    
    setCompleting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/courses/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        setIsCompleted(true)
        
        // Award gems and record activity for completing lesson
        const lessonType = lessonData?.lesson?.type
        if (lessonType === 'practice') {
          userAPI.addGems(5, 'выполнение практики')
            .then(() => console.log('✅ +5 алмазов за практику'))
            .catch(err => console.error('Failed to award gems:', err))
        } else if (lessonType === 'theory' || lessonType === 'video') {
          userAPI.addGems(3, `просмотр ${lessonType === 'video' ? 'видео' : 'теории'}`)
            .then(() => console.log(`✅ +3 алмаза за ${lessonType === 'video' ? 'видео' : 'теорию'}`))
            .catch(err => console.error('Failed to award gems:', err))
        }
        
        // Record daily activity
        userAPI.recordActivity()
          .then(() => console.log('✅ Активность записана'))
          .catch(err => console.error('Failed to record activity:', err))
        
        // Update navigation progress
        if (lessonData?.navigation) {
          setLessonData({
            ...lessonData,
            navigation: {
              ...lessonData.navigation,
              current: lessonData.navigation.current + 1
            }
          })
        }
      }
    } catch (err) {
      console.error('Failed to mark as completed:', err)
    }
    setCompleting(false)
  }

  // Show loading
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // Show error
  if (error || !lessonData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center py-16">
          <h1 className="text-2xl font-medium text-gray-900 mb-4">{error || 'Урок не найден'}</h1>
          <p className="text-gray-500 mb-4">Возможно, вы не записаны на этот курс</p>
          <Link to="/learn" className="text-blue-500 hover:underline">Вернуться к курсу</Link>
        </div>
      </div>
    )
  }

  const { lesson, exercise, navigation, attachments = [] } = lessonData
  const progress = Math.round((navigation.current / navigation.total) * 100)

  // For practice lessons with exercise, show code editor
  if (lesson.type === 'practice' && exercise) {
    return <ExercisePage lessonData={lessonData} />
  }

  // Render lesson content based on type
  const renderLessonContent = () => {
    if (lesson.type === 'video') {
      return (
        <>
          <VideoPlayer 
            url={lesson.video_url} 
            title={lesson.title}
            duration={lesson.duration_minutes}
          />
          {lesson.content && (
            <div className="prose prose-gray dark:prose-invert max-w-none overflow-x-hidden break-words">
              {renderMarkdownContent(lesson.content)}
            </div>
          )}
        </>
      )
    }

    if (lesson.type === 'theory') {
      return (
        <div className="prose prose-gray dark:prose-invert max-w-none overflow-x-hidden break-words">
          <h1 className="text-xl md:text-3xl break-words">{lesson.title}</h1>
          {lesson.content ? (
            <div className="overflow-x-hidden">
              {renderMarkdownContent(lesson.content)}
            </div>
          ) : (
            <p className="text-gray-500">Содержание урока будет добавлено позже.</p>
          )}
        </div>
      )
    }

    if (lesson.type === 'quiz') {
      return <QuizPage lesson={lesson} navigation={navigation} />
    }

    return (
      <div className="prose prose-gray max-w-none">
        <h1>{lesson.title}</h1>
        <p className="text-gray-500">Тип урока: {lesson.type}</p>
        {lesson.content && (
          <div>
            {renderMarkdownContent(lesson.content)}
          </div>
        )}
      </div>
    )
  }

  // Parse markdown and extract code blocks for React rendering
  const parseMarkdown = (content: string): { html: string; codeBlocks: Array<{ code: string; language?: string }> } => {
    if (!content) return { html: '', codeBlocks: [] }
    
    const codeBlocks: Array<{ code: string; language?: string }> = []
    
    // Extract code blocks with language support: ```html, ```javascript, etc.
    // Pattern: ```lang\ncode``` or ```code```
    let html = content.replace(/```(\w+)?\s*\n?([\s\S]*?)```/g, (_match, lang, code) => {
      const index = codeBlocks.length
      const trimmedCode = code.trim()
      const language = lang?.trim().toLowerCase() || undefined
      codeBlocks.push({
        code: trimmedCode,
        language: language
      })
      return `__CODE_BLOCK_${index}__`
    })
    
    // Extract inline code blocks
    const inlineCodeBlocks: string[] = []
    html = html.replace(/`([^`]+)`/g, (_match, code) => {
      const placeholder = `__INLINE_CODE_${inlineCodeBlocks.length}__`
      inlineCodeBlocks.push(code)
      return placeholder
    })
    
    // Now escape HTML to prevent XSS (but code blocks are already extracted)
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    
    // Apply markdown formatting (safe because HTML is already escaped)
    html = html
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n/g, '<br/>')
    
    // Restore inline code blocks
    html = html.replace(/__INLINE_CODE_(\d+)__/g, (_match, index) => {
      const code = inlineCodeBlocks[parseInt(index)]
      // Escape HTML in inline code
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      return `<code class="inline-code">${escapedCode}</code>`
    })
    
    // Final sanitization pass
    html = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '')
    
    return { html, codeBlocks }
  }

  // Render markdown content with code blocks
  const renderMarkdownContent = (content: string) => {
    const { html, codeBlocks } = parseMarkdown(content)
    
    // Split HTML by code block placeholders and render
    const parts = html.split(/(__CODE_BLOCK_\d+__)/)
    
    return (
      <div className="overflow-x-hidden w-full">
        {parts.map((part, index) => {
          const codeBlockMatch = part.match(/__CODE_BLOCK_(\d+)__/)
          if (codeBlockMatch) {
            const blockIndex = parseInt(codeBlockMatch[1])
            const codeBlock = codeBlocks[blockIndex]
            return <CodeBlock key={`code-${index}`} code={codeBlock.code} language={codeBlock.language} />
          }
          return <div key={`html-${index}`} className="break-words" dangerouslySetInnerHTML={{ __html: part }} />
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex overflow-x-hidden">
      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 pb-24 md:pb-8 overflow-x-hidden">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 md:mb-6 flex items-center gap-2">
          <Link to="/learn" className="hover:text-gray-700 dark:hover:text-gray-300 truncate max-w-[120px] md:max-w-none">{lesson.course_title}</Link>
          <span className="shrink-0">→</span>
          <span className="truncate">{lesson.module_title}</span>
        </div>

        {renderLessonContent()}

        {/* Mark as Completed Button for video/theory lessons */}
        {(lesson.type === 'video' || lesson.type === 'theory') && (
          <div className="mt-8 flex items-center justify-center gap-4">
            {isCompleted ? (
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle className="w-6 h-6" />
                Урок пройден!
              </div>
            ) : (
              <button
                onClick={markAsCompleted}
                disabled={completing}
                className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
              >
                {completing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Отмечаем...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Отметить урок как пройденный
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Materials */}
        {lesson.type !== 'quiz' && attachments && attachments.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-8">
            <h3 className="font-medium text-gray-900 mb-4">📁 Материалы урока</h3>
            <div className="space-y-2">
              {attachments.map((file: any) => {
                const formatSize = (bytes: number) => {
                  if (bytes < 1024) return `${bytes} B`
                  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
                  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
                }
                
                const getFileIcon = (mimetype: string) => {
                  if (mimetype?.includes('pdf')) return '📕'
                  if (mimetype?.includes('word') || mimetype?.includes('document')) return '📘'
                  if (mimetype?.includes('sheet') || mimetype?.includes('excel')) return '📗'
                  if (mimetype?.includes('presentation') || mimetype?.includes('powerpoint')) return '📙'
                  if (mimetype?.includes('image')) return '🖼️'
                  if (mimetype?.includes('zip') || mimetype?.includes('rar') || mimetype?.includes('7z')) return '📦'
                  if (mimetype?.includes('video')) return '🎬'
                  return '📄'
                }
                
                return (
                  <a 
                    key={file.id}
                    href={`http://localhost:3001${file.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={file.original_name}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                  >
                    <span className="text-2xl">{getFileIcon(file.mimetype)}</span>
                    <span className="text-sm text-gray-700 flex-1">{file.original_name}</span>
                    <span className="text-xs text-gray-400">{formatSize(file.size)}</span>
                    <span className="text-xs text-blue-500">⬇ Скачать</span>
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Right Sidebar - hidden on mobile */}
      <aside className="hidden lg:block w-[280px] border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
        <div className="sticky top-0">
          <button 
            onClick={async () => {
              // Auto-mark as completed when going to next
              if (!isCompleted && (lesson.type === 'video' || lesson.type === 'theory')) {
                await markAsCompleted()
              }
              navigation.next ? navigate(`/learn/lesson/${navigation.next.id}`) : navigate('/learn')
            }}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-orange-500 text-white font-medium hover:bg-orange-600"
          >
            {navigation.next ? 'Далее' : 'Завершить'} <ArrowRight className="w-4 h-4" />
          </button>

          <div className="p-4">
            <Link to="/learn" className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
              <Home className="w-5 h-5" />
              Навигация
            </Link>
            
            <div className="mt-4 px-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">пройдено {navigation.current} урок из {navigation.total}</div>
              <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
                <div className="h-1 bg-green-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="mt-6 space-y-1">
              <div className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                Шаг: {lesson.type === 'video' ? 'видео' : lesson.type === 'quiz' ? 'тест' : lesson.type === 'practice' ? 'практика' : 'теория'}
              </div>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Обсуждение</button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Теория</button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Сложности и вопросы?</button>
            </div>

            {/* Navigation buttons */}
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
              {navigation.prev && (
                <Link
                  to={`/learn/lesson/${navigation.prev.id}`}
                  className="block w-full px-4 py-2 text-sm text-center border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  ← {navigation.prev.title}
                </Link>
              )}
              {navigation.next && (
                <Link
                  to={`/learn/lesson/${navigation.next.id}`}
                  className="block w-full px-4 py-2 text-sm text-center bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  {navigation.next.title} →
                </Link>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation for Lesson */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-3 safe-area-bottom z-50">
        <div className="flex items-center gap-3">
          {navigation.prev && (
            <Link
              to={`/learn/lesson/${navigation.prev.id}`}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              ←
            </Link>
          )}
          <button 
            onClick={async () => {
              if (!isCompleted && (lesson.type === 'video' || lesson.type === 'theory')) {
                await markAsCompleted()
              }
              navigation.next ? navigate(`/learn/lesson/${navigation.next.id}`) : navigate('/learn')
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600"
          >
            {navigation.next ? 'Далее' : 'Завершить'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Learn Courses Page
export function LearnCourses() {
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <LearnSidebar active="courses" />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center pb-20 md:pb-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </main>
        <LearnMobileNav active="courses" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <LearnSidebar active="courses" />
      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
        <h1 className="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-6 md:mb-8">Мои курсы</h1>
        
        {enrollments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 md:p-12 text-center">
            <BookOpen className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg md:text-xl font-medium text-gray-400 mb-2">Вы еще не записаны на курсы</h3>
            <p className="text-gray-400 mb-4 text-sm md:text-base">Выберите курс из каталога и начните обучение</p>
            <Link to="/courses" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">
              Перейти к курсам <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {enrollments.map(enrollment => (
              <Link 
                key={enrollment.id}
                to="/learn"
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">{enrollment.course.category || 'Курс'}</span>
                  <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{enrollment.course.level}</span>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 md:mb-4 text-sm md:text-base">{enrollment.course.title}</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div 
                      className={`h-2 rounded-full ${enrollment.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${enrollment.progress}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{enrollment.progress}%</span>
                </div>
              </Link>
            ))}
          </div>
        )}

      </main>
      <LearnMobileNav active="courses" />
    </div>
  )
}

// Learn Progress Page
export function LearnProgress() {
  const [loading, setLoading] = useState(true)
  const [userStats, setUserStats] = useState<UserStats | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await userAPI.getStats()
      setUserStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
    setLoading(false)
  }

  const stats = userStats ? [
    { label: 'Уроков', value: String(userStats.lessonsCompleted) },
    { label: 'Часов', value: String(userStats.studyHours) },
    { label: 'Упражнений', value: String(userStats.exercisesCompleted) },
    { label: 'Курсов', value: String(userStats.coursesCompleted) },
  ] : []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <LearnSidebar active="progress" />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center pb-20 md:pb-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </main>
        <LearnMobileNav active="progress" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <LearnSidebar active="progress" />
      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
        <h1 className="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-6 md:mb-8">Прогресс</h1>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          {stats.map(stat => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6">
              <div className="text-2xl md:text-3xl font-medium text-gray-900 dark:text-white mb-1">{stat.value}</div>
              <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Activity Chart */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 mb-6 md:mb-8">
          <h2 className="font-medium text-gray-900 dark:text-white mb-4 md:mb-6 text-sm md:text-base">Активность за 30 дней</h2>
          <div className="flex items-end gap-0.5 md:gap-1 h-24 md:h-32 overflow-x-auto">
            {Array.from({ length: 30 }).map((_, i) => {
              // Find activity for this day
              const date = new Date()
              date.setDate(date.getDate() - (29 - i))
              const dateStr = date.toISOString().split('T')[0]
              const dayActivity = userStats?.activity?.find(a => a.date === dateStr)
              const height = dayActivity ? Math.min(dayActivity.count * 20, 100) : 5
              return (
                <div 
                  key={i}
                  className={`flex-1 min-w-[6px] rounded-t ${height > 5 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                  style={{ height: `${Math.max(height, 5)}%` }}
                  title={`${dateStr}: ${dayActivity?.count || 0} действий`}
                />
              )
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] md:text-xs text-gray-400">
            <span>{new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}</span>
            <span className="hidden md:inline">{new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}</span>
            <span>{new Date().toLocaleDateString('ru', { day: 'numeric', month: 'short' })}</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6">
          <h2 className="font-medium text-gray-900 dark:text-white mb-4 md:mb-6 text-sm md:text-base">Последняя активность</h2>
          <div className="space-y-3 md:space-y-4">
            {userStats?.recentActivity?.length ? userStats.recentActivity.map((activity, i) => (
              <div key={i} className="flex flex-col md:flex-row md:items-center justify-between py-2 md:py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 gap-1">
                <div className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{activity.action}:</span>
                  <span className="text-gray-900 dark:text-white ml-2">{activity.item}</span>
                </div>
                <span className="text-xs md:text-sm text-gray-400">
                  {new Date(activity.time).toLocaleDateString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )) : (
              <div className="text-center text-gray-400 py-4">Нет активности</div>
            )}
          </div>
        </div>
      </main>
      <LearnMobileNav active="progress" />
    </div>
  )
}

// Learn Discussions Page
export function LearnDiscussions() {
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createContent, setCreateContent] = useState('')
  const [createCourseId, setCreateCourseId] = useState<string>('')
  const [creating, setCreating] = useState(false)
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([])

  useEffect(() => {
    loadData()
    loadEnrollments()
  }, [])

  const loadEnrollments = async () => {
    try {
      const data = await userAPI.getEnrollments()
      setEnrollments(data || [])
    } catch (error) {
      console.error('Failed to load enrollments:', error)
    }
  }

  const loadData = async () => {
    try {
      const data = await userAPI.getDiscussions()
      setDiscussions(data || [])
    } catch (error) {
      console.error('Failed to load discussions:', error)
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    // Client-side validation
    if (!createTitle.trim()) {
      toast.error('Заполните заголовок')
      return
    }
    
    if (!createContent.trim()) {
      toast.error('Заполните содержание')
      return
    }
    
    if (createContent.trim().length < 10) {
      toast.error('Содержание должно содержать минимум 10 символов')
      return
    }

    setCreating(true)
    try {
      await userAPI.createDiscussion({
        title: createTitle.trim(),
        content: createContent.trim(),
        course_id: createCourseId || undefined
      })
      setShowCreateModal(false)
      setCreateTitle('')
      setCreateContent('')
      setCreateCourseId('')
      toast.success('Обсуждение успешно создано')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Ошибка создания обсуждения')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <LearnSidebar active="discussions" />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center pb-20 md:pb-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </main>
        <LearnMobileNav active="discussions" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <LearnSidebar active="discussions" />
      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-medium text-gray-900 dark:text-white">Обсуждения</h1>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 w-full sm:w-auto"
          >
            Новая тема
          </button>
        </div>
        
        {discussions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 md:p-12 text-center">
            <MessageCircle className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg md:text-xl font-medium text-gray-400 mb-2">Пока нет обсуждений</h3>
            <p className="text-gray-400 mb-4 text-sm md:text-base">Создайте первую тему для обсуждения</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
            >
              Создать тему
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            {discussions.map((discussion, i) => (
              <div 
                key={discussion.id}
                onClick={() => navigate(`/learn/discussions/${discussion.id}`)}
                className={`p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${i !== discussions.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1 text-sm md:text-base">{discussion.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                      <span>{discussion.course || 'Общее'}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{discussion.author}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{discussion.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <MessageCircle className="w-4 h-4" />
                    {discussion.replies}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Discussion Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg md:text-xl font-medium text-gray-900 dark:text-white mb-4">Новая тема</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Заголовок</label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите заголовок темы"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Курс (необязательно)</label>
                <select
                  value={createCourseId}
                  onChange={(e) => setCreateCourseId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Общее обсуждение</option>
                  {enrollments.map(e => (
                    <option key={e.course.id} value={e.course.id}>{e.course.title}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Содержание</label>
                <textarea
                  value={createContent}
                  onChange={(e) => setCreateContent(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Опишите вашу тему..."
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreateTitle('')
                    setCreateContent('')
                    setCreateCourseId('')
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {creating ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <LearnMobileNav active="discussions" />
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  )
}

// Discussion Detail Page
export function DiscussionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [discussion, setDiscussion] = useState<DiscussionDetail | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replying, setReplying] = useState(false)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    if (!id) return
    try {
      const data = await userAPI.getDiscussion(id)
      setDiscussion(data)
    } catch (error) {
      console.error('Failed to load discussion:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async () => {
    if (!id) return
    
    // Client-side validation
    if (!replyContent.trim()) {
      toast.error('Заполните содержание ответа')
      return
    }
    
    if (replyContent.trim().length < 10) {
      toast.error('Содержание должно содержать минимум 10 символов')
      return
    }

    setReplying(true)
    try {
      await userAPI.createReply(id, replyContent.trim())
      setReplyContent('')
      toast.success('Ответ успешно отправлен')
      loadData() // Reload to get updated replies
    } catch (error: any) {
      toast.error(error.message || 'Ошибка отправки ответа')
    } finally {
      setReplying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <LearnSidebar active="discussions" />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center pb-20 md:pb-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </main>
        <LearnMobileNav active="discussions" />
      </div>
    )
  }

  if (!discussion) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <LearnSidebar active="discussions" />
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Обсуждение не найдено</h2>
            <button
              onClick={() => navigate('/learn/discussions')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Вернуться к обсуждениям
            </button>
          </div>
        </main>
        <LearnMobileNav active="discussions" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <LearnSidebar active="discussions" />
      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
        <button
          onClick={() => navigate('/learn/discussions')}
          className="mb-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Назад
        </button>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-medium text-gray-900 dark:text-white mb-2">{discussion.title}</h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                <span>{discussion.course || 'Общее'}</span>
                <span className="hidden sm:inline">•</span>
                <span>{discussion.author}</span>
                <span className="hidden sm:inline">•</span>
                <span>{discussion.time}</span>
              </div>
            </div>
          </div>
          
          <div className="prose max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm md:text-base">
            {discussion.content}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 mb-4">
          <h2 className="text-base md:text-lg font-medium text-gray-900 dark:text-white mb-4">
            Ответы ({discussion.replies_list?.length || 0})
          </h2>

          {discussion.replies_list && discussion.replies_list.length > 0 ? (
            <div className="space-y-4">
              {discussion.replies_list.map((reply) => (
                <div key={reply.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400 shrink-0">
                      {reply.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white text-sm">{reply.author}</span>
                        <span className="text-xs md:text-sm text-gray-500">•</span>
                        <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{reply.time}</span>
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">{reply.content}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8 text-sm">Пока нет ответов</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6">
          <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-white mb-4">Оставить ответ</h3>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-sm md:text-base"
            placeholder="Напишите ваш ответ..."
          />
          <button
            onClick={handleReply}
            disabled={!replyContent.trim() || replying}
            className="w-full md:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {replying ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </main>
      <LearnMobileNav active="discussions" />
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  )
}

// Quiz Page Component
function QuizPage({ lesson, navigation }: { lesson: any; navigation: any }) {
  const navigate = useNavigate()
  const [started, setStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [rewardsGiven, setRewardsGiven] = useState(false)

  // Load questions from lesson content
  const questions = (() => {
    if (!lesson?.content) return []
    try {
      const parsed = JSON.parse(lesson.content)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((q: any, index: number) => ({
          id: q.id || index + 1,
          question: q.question || '',
          options: q.options || ['', '', '', ''],
          correct: q.correct ?? 0
        }))
      }
    } catch (e) {
      console.error('Failed to parse quiz questions:', e)
    }
    return []
  })()

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = optionIndex
    setAnswers(newAnswers)
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setShowResults(true)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const correctCount = answers.reduce((count, answer, index) => {
    return count + (answer === questions[index].correct ? 1 : 0)
  }, 0)

  const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0
  const passed = percentage >= 70

  // Award gems and record activity when quiz is completed
  useEffect(() => {
    if (showResults && passed && !rewardsGiven) {
      setRewardsGiven(true)
      
      // Award gems and record activity
      userAPI.addGems(10, 'прохождение теста')
        .then(() => {
          console.log('✅ Получено 10 алмазов за тест!')
        })
        .catch(err => console.error('Failed to award gems:', err))
      
      userAPI.recordActivity()
        .then(() => {
          console.log('✅ Активность записана!')
        })
        .catch(err => console.error('Failed to record activity:', err))
    }
  }, [showResults, passed, rewardsGiven])

  // If no questions, show message
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-white flex">
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-10 h-10 text-orange-500" />
            </div>
            <h1 className="text-2xl font-medium text-gray-900 mb-4">{lesson.title}</h1>
            <p className="text-gray-500 mb-8">Вопросы для теста еще не добавлены преподавателем</p>
            <Link to="/learn" className="text-sm text-gray-500 hover:text-gray-700">
              ← Вернуться к курсу
            </Link>
          </div>
        </main>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-white flex">
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-10 h-10 text-orange-500" />
            </div>
            <h1 className="text-2xl font-medium text-gray-900 mb-4">{lesson.title}</h1>
            <p className="text-gray-500 mb-2">Проверьте свои знания по пройденному материалу</p>
            <p className="text-sm text-gray-400 mb-8">{questions.length} вопросов • ~5 минут</p>
            <button 
              onClick={() => setStarted(true)}
              className="px-8 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Начать тест
            </button>
            <div className="mt-4">
              <Link to="/learn" className="text-sm text-gray-500 hover:text-gray-700">
                ← Вернуться к курсу
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-white flex">
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <span className="text-4xl">{passed ? '🎉' : '😢'}</span>
            </div>
            <h1 className="text-2xl font-medium text-gray-900 mb-2">
              {passed ? 'Тест пройден!' : 'Тест не пройден'}
            </h1>
            {passed && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg mb-4">
                <span className="text-lg">💎</span>
                <span className="font-medium">+10 алмазов</span>
              </div>
            )}
            <p className="text-gray-500 mb-4">
              Правильных ответов: {correctCount} из {questions.length} ({percentage}%)
            </p>
            
            <div className="w-full h-4 bg-gray-200 rounded-full mb-6">
              <div 
                className={`h-4 rounded-full transition-all ${passed ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="space-y-2 text-left mb-6 max-h-60 overflow-y-auto">
              {questions.map((q, i) => (
                <div key={q.id} className={`p-3 rounded-lg ${answers[i] === q.correct ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-start gap-2">
                    <span>{answers[i] === q.correct ? '✅' : '❌'}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{q.question}</p>
                      {answers[i] !== q.correct && (
                        <p className="text-xs text-gray-500 mt-1">
                          Правильный ответ: {q.options[q.correct]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              {!passed && (
                <button 
                  onClick={() => { setStarted(false); setAnswers([]); setCurrentQuestion(0); setShowResults(false) }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Попробовать снова
                </button>
              )}
              <button 
                onClick={() => navigation.next ? navigate(`/learn/lesson/${navigation.next.id}`) : navigate('/learn')}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {navigation.next ? 'Следующий урок' : 'К курсу'}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const question = questions[currentQuestion]

  return (
    <div className="min-h-screen bg-white flex">
      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Вопрос {currentQuestion + 1} из {questions.length}</span>
              <Link to="/learn" className="hover:text-gray-700">Выйти из теста</Link>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-orange-500 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-medium text-gray-900 mb-6">{question.question}</h2>
            <div className="space-y-3">
              {question.options.map((option: string, i: number) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    answers[currentQuestion] === i
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {option}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button 
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              ← Назад
            </button>
            <button 
              onClick={nextQuestion}
              disabled={answers[currentQuestion] === undefined}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              {currentQuestion === questions.length - 1 ? 'Завершить' : 'Далее →'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

// File Tree Types
interface FileNode {
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  content?: string
  language?: string
}

// File Tree Component
function FileTree({ 
  files, 
  activeFile, 
  onFileSelect,
  expandedFolders,
  onToggleFolder,
  level = 0 
}: { 
  files: FileNode[]
  activeFile: string
  onFileSelect: (file: FileNode) => void
  expandedFolders: Set<string>
  onToggleFolder: (path: string) => void
  level?: number
}) {
  const getFileIcon = (file: FileNode) => {
    if (file.type === 'folder') {
      return expandedFolders.has(file.name) ? '📂' : '📁'
    }
    const ext = file.name.split('.').pop()?.toLowerCase()
    const name = file.name.toLowerCase()
    
    // Special files
    if (name === 'makefile') return '⚙️'
    if (name === 'dockerfile') return '🐳'
    if (name.startsWith('.git')) return '📦'
    
    switch (ext) {
      case 'java': return '☕'
      case 'js': case 'jsx': case 'mjs': return '🟨'
      case 'ts': case 'tsx': return '🔷'
      case 'py': case 'pyw': return '🐍'
      case 'cpp': case 'cc': case 'cxx': case 'c': case 'h': case 'hpp': return '⚡'
      case 'go': return '🔵'
      case 'rs': return '🦀'
      case 'kt': case 'kts': return '💜'
      case 'cs': return '💚'
      case 'rb': return '💎'
      case 'php': return '🐘'
      case 'swift': return '🧡'
      case 'scala': return '🔴'
      case 'md': case 'markdown': return '📝'
      case 'json': return '📋'
      case 'xml': return '📄'
      case 'html': case 'htm': return '🌐'
      case 'css': case 'scss': case 'sass': case 'less': return '🎨'
      case 'yaml': case 'yml': return '⚙️'
      case 'toml': return '📦'
      case 'sql': return '🗄️'
      case 'sh': case 'bash': case 'zsh': return '💻'
      case 'txt': return '📃'
      case 'log': return '📜'
      default: return '📄'
    }
  }

  return (
    <div>
      {files.map((file) => (
        <div key={file.name}>
          <div
            onClick={() => {
              if (file.type === 'folder') {
                onToggleFolder(file.name)
              } else {
                onFileSelect(file)
              }
            }}
            className={`flex items-center gap-2 px-2 py-1 cursor-pointer text-sm transition-colors ${
              activeFile === file.name 
                ? 'bg-[#37373d] text-white' 
                : 'text-gray-400 hover:bg-[#2a2d2e] hover:text-gray-200'
            }`}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
          >
            {file.type === 'folder' && (
              <span className="text-[10px] text-gray-500">
                {expandedFolders.has(file.name) ? '▼' : '▶'}
              </span>
            )}
            <span>{getFileIcon(file)}</span>
            <span className="truncate">{file.name}</span>
          </div>
          {file.type === 'folder' && file.children && expandedFolders.has(file.name) && (
            <FileTree 
              files={file.children} 
              activeFile={activeFile}
              onFileSelect={onFileSelect}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// Exercise Page with Code Editor
function ExercisePage({ lessonData }: { lessonData?: any } = {}) {
  const [testResults, setTestResults] = useState<{ passed: number; total: number; results: any[] } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Get exercise data from lessonData prop
  const exercise = lessonData?.exercise
  const lesson = lessonData?.lesson
  const exerciseTitle = exercise?.title || lesson?.title || 'Практика'
  const exerciseDescription = exercise?.description || ''
  const exerciseHints = exercise?.hints || ['Используйте оператор + для сложения двух чисел', 'Не забудьте return']
  const testCases = exercise?.test_cases || []

  const defaultReadme = `# ${exerciseTitle}

${exerciseDescription || 'Реализуйте функцию согласно заданию.'}

## Примеры

${testCases.filter((t: any) => !t.is_hidden).map((tc: any, i: number) => 
  `**Тест ${i + 1}:**\n- Вход: \`${tc.input || '(нет входа)'}\`\n- Ожидаемый выход: \`${tc.expected || tc.expected_output || '(не указано)'}\``
).join('\n\n') || 'Примеры будут отображаться здесь.'}

## Подсказки

${exerciseHints.map((h: string, i: number) => `${i + 1}. ${h}`).join('\n')}
`

  // Get initial code from exercise or use default
  const exerciseInitialCode = exercise?.initial_code || ''
  const exerciseLanguage = exercise?.language || 'java'

  // Generate initial code for different languages based on exercise
  const getInitialCode = (lang: string) => {
    // If exercise has initial_code, use it for the matching language
    if (exerciseInitialCode && exerciseLanguage === lang) {
      return exerciseInitialCode
    }
    // Default templates for other languages
    const defaults: Record<string, string> = {
      java: `public class Solution {
    public static void main(String[] args) {
        // Ваш код здесь
    }
}`,
      python: `# Ваш код здесь
`,
      javascript: `// Ваш код здесь
`,
      typescript: `// Ваш код здесь
`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    // Ваш код здесь
    return 0;
}`,
      go: `package main

import "fmt"

func main() {
    // Ваш код здесь
}`,
      rust: `fn main() {
    // Ваш код здесь
}`,
      kotlin: `fun main() {
    // Ваш код здесь
}`,
      csharp: `using System;

class Solution {
    static void Main(string[] args) {
        // Ваш код здесь
    }
}`
    }
    return defaults[lang] || '// Ваш код здесь'
  }

  // Language-specific file configurations
  const languageConfig: Record<string, { mainFile: string; testFile: string; icon: string }> = {
    java: { mainFile: 'Solution.java', testFile: 'SolutionTest.java', icon: '☕' },
    python: { mainFile: 'solution.py', testFile: 'test_solution.py', icon: '🐍' },
    javascript: { mainFile: 'solution.js', testFile: 'solution.test.js', icon: '🟨' },
    typescript: { mainFile: 'solution.ts', testFile: 'solution.test.ts', icon: '🔷' },
    cpp: { mainFile: 'solution.cpp', testFile: 'test_solution.cpp', icon: '⚡' },
    go: { mainFile: 'solution.go', testFile: 'solution_test.go', icon: '🔵' },
    rust: { mainFile: 'solution.rs', testFile: 'solution_test.rs', icon: '🦀' },
    kotlin: { mainFile: 'Solution.kt', testFile: 'SolutionTest.kt', icon: '💜' },
    csharp: { mainFile: 'Solution.cs', testFile: 'SolutionTest.cs', icon: '💚' },
  }

  const currentLangConfig = languageConfig[exerciseLanguage] || languageConfig.java

  // File contents - dynamic based on exercise language
  const initialFileContents: Record<string, string> = {
    [currentLangConfig.mainFile]: getInitialCode(exerciseLanguage),
    'README.md': defaultReadme,
  }

  // Generate file contents with auto-detected languages
  const generateFileContents = () => {
    const contents: Record<string, { content: string; language: string }> = {}
    for (const [filename, content] of Object.entries(initialFileContents)) {
      contents[filename] = {
        content,
        language: getLanguageFromFilename(filename)
      }
    }
    return contents
  }

  // Project structure - dynamic based on exercise language
  const projectFiles: FileNode[] = [
    {
      name: 'src',
      type: 'folder',
      children: [
        { name: currentLangConfig.mainFile, type: 'file' },
      ]
    },
    { name: 'README.md', type: 'file' },
  ]

  const [activeFile, setActiveFile] = useState(currentLangConfig.mainFile)
  const [openTabs, setOpenTabs] = useState<string[]>([currentLangConfig.mainFile])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']))
  const [files, setFiles] = useState(() => generateFileContents())

  // Update files when exercise language changes
  useEffect(() => {
    setActiveFile(currentLangConfig.mainFile)
    setOpenTabs([currentLangConfig.mainFile])
    setFiles(generateFileContents())
  }, [exerciseLanguage])
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'output' | 'readme'>('editor')
  
  // Parse markdown helper for README
  const parseMarkdown = (content: string): { html: string; codeBlocks: Array<{ code: string; language?: string }> } => {
    if (!content) return { html: '', codeBlocks: [] }
    
    const codeBlocks: Array<{ code: string; language?: string }> = []
    
    // Extract code blocks with language support
    let html = content.replace(/```(\w+)?\s*\n?([\s\S]*?)```/g, (_match, lang, code) => {
      const index = codeBlocks.length
      const trimmedCode = code.trim()
      const language = lang?.trim().toLowerCase() || undefined
      codeBlocks.push({
        code: trimmedCode,
        language: language
      })
      return `__CODE_BLOCK_${index}__`
    })
    
    // Extract inline code blocks
    const inlineCodeBlocks: string[] = []
    html = html.replace(/`([^`]+)`/g, (_match, code) => {
      const placeholder = `__INLINE_CODE_${inlineCodeBlocks.length}__`
      inlineCodeBlocks.push(code)
      return placeholder
    })
    
    // Escape HTML to prevent XSS
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    
    // Apply markdown formatting
    html = html
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n/g, '<br/>')
    
    // Restore inline code blocks
    html = html.replace(/__INLINE_CODE_(\d+)__/g, (_match, index) => {
      const code = inlineCodeBlocks[parseInt(index)]
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      return `<code class="inline-code">${escapedCode}</code>`
    })
    
    // Restore code blocks
    html = html.replace(/__CODE_BLOCK_(\d+)__/g, (_match, index) => {
      const codeBlock = codeBlocks[parseInt(index)]
      const escapedCode = codeBlock.code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      return `<pre><code class="language-${codeBlock.language || 'text'}">${escapedCode}</code></pre>`
    })
    
    // Final sanitization
    html = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '')
    
    return { html, codeBlocks }
  }
  const [activeBottomTab, setActiveBottomTab] = useState('terminal')
  const [terminalOutput, setTerminalOutput] = useState('$ ')

  const currentFile = files[activeFile]

  const handleFileSelect = (file: FileNode) => {
    if (file.type === 'file') {
      if (file.name === 'README.md') {
        setActiveTab('readme')
      } else {
        setActiveFile(file.name)
        if (!openTabs.includes(file.name)) {
          setOpenTabs([...openTabs, file.name])
        }
        setActiveTab('editor')
      }
    }
  }

  const handleToggleFolder = (folderName: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName)
    } else {
      newExpanded.add(folderName)
    }
    setExpandedFolders(newExpanded)
  }

  const handleCloseTab = (fileName: string) => {
    const newTabs = openTabs.filter(t => t !== fileName)
    setOpenTabs(newTabs)
    if (activeFile === fileName && newTabs.length > 0) {
      setActiveFile(newTabs[newTabs.length - 1])
    }
  }

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setFiles(prev => ({
        ...prev,
        [activeFile]: { ...prev[activeFile], content: value }
      }))
    }
  }

  const [serverOnline, setServerOnline] = useState<boolean | null>(null)
  const [problems, setProblems] = useState<{line: number; message: string; severity: string}[]>([])

  // Check server status on mount
  useEffect(() => {
    healthCheck().then(setServerOnline)
  }, [])

  // Lint code on change
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (currentFile && serverOnline) {
        const lang = getLanguageFromExtension(activeFile)
        const result = await lintCode(currentFile.content, lang)
        setProblems([...result.errors, ...result.warnings])
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [currentFile?.content, activeFile, serverOnline])

  const runCode = async () => {
    setIsRunning(true)
    setActiveTab('output')
    setOutput('⏳ Подготовка к выполнению...\n')
    setTestResults(null)
    
    const lang = getLanguageFromExtension(activeFile)
    const code = currentFile?.content || ''
    
    setTerminalOutput(`$ Running ${activeFile}...\n`)
    setOutput(`⏳ Компиляция ${activeFile}...\n`)

    try {
      // Run with test cases if available
      const result = await executeCode(code, lang, '', testCases)
      
      // Check if we have test results (even if success is false)
      if (result.testResults && result.testResults.length > 0) {
        const passed = result.testResults.filter((t: any) => t.passed).length
        const total = result.testResults.length
        const allPassed = passed === total

        setTestResults({ passed, total, results: result.testResults })
        
        let outputText = allPassed 
          ? `✅ Все тесты пройдены! (${passed}/${total})\n\n`
          : `❌ Тесты не пройдены (${passed}/${total})\n\n`
        
        outputText += `━━━━━━━━━━ Результаты тестов ━━━━━━━━━━\n\n`
        
        result.testResults.forEach((test: any, i: number) => {
          const status = test.passed ? '✅' : '❌'
          const hidden = test.isHidden ? ' (скрытый)' : ''
          outputText += `${status} Тест ${i + 1}${hidden}\n`
          if (!test.isHidden) {
            outputText += `   Вход: ${test.input || '(пусто)'}\n`
            outputText += `   Ожидалось: ${test.expected || '(не указано)'}\n`
            outputText += `   Получено: ${test.actual || '(нет вывода)'}\n`
            if (test.error) {
              outputText += `   Ошибка: ${test.error}\n`
            }
          }
          outputText += '\n'
        })

        outputText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
        if (result.executionTime) {
          outputText += `⏱️ Время выполнения: ${result.executionTime}ms\n\n`
        }
        
        if (allPassed) {
          outputText += `🎉 Отличная работа! Теперь вы можете отправить решение преподавателю.`
        } else {
          outputText += `💡 Проверьте логику вашего решения и попробуйте снова.`
        }

        setOutput(outputText)
        setTerminalOutput(prev => prev + outputText + '\n$ ')
      } else if (result.success) {
        // No test cases, just show output
        setOutput(
          `✅ Компиляция успешна!\n\n` +
          `━━━━━━━━━━ Output ━━━━━━━━━━\n\n` +
          `${result.output || '(нет вывода)'}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `⏱️ Время выполнения: ${result.executionTime}ms`
        )
        setTerminalOutput(prev => prev + (result.output || '') + '\n$ ')
      } else {
        if (result.stage === 'compile') {
          setOutput(
            `❌ Ошибка компиляции!\n\n` +
            `━━━━━━━━━━ Errors ━━━━━━━━━━\n\n` +
            `${result.error}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            (result.errors?.map((e: any) => `Line ${e.line}: ${e.message}`).join('\n') || '')
          )
          if (result.errors) {
            setProblems(result.errors.map((e: any) => ({
              line: e.line || 1,
              message: e.message,
              severity: 'error'
            })))
          }
        } else if (result.timedOut) {
          setOutput(
            `⏰ Превышено время выполнения!\n\n` +
            `Программа выполнялась слишком долго и была остановлена.\n` +
            `Проверьте наличие бесконечных циклов.`
          )
        } else {
          setOutput(
            `❌ Ошибка выполнения!\n\n` +
            `━━━━━━━━━━ Error ━━━━━━━━━━\n\n` +
            `${result.error || 'Неизвестная ошибка'}\n\n` +
            (result.output ? `━━━━━━━━━━ Output ━━━━━━━━━━\n\n${result.output}\n\n` : '') +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
          )
        }
        setTerminalOutput(prev => prev + `Error: ${result.error || 'Неизвестная ошибка'}\n$ `)
      }
    } catch (error) {
      setOutput(
        `🔌 Сервер недоступен!\n\n` +
        `Убедитесь, что бэкенд запущен:\n\n` +
        `  cd server\n` +
        `  npm install\n` +
        `  npm start\n\n` +
        `Сервер должен работать на http://localhost:3001`
      )
    }
    
    setIsRunning(false)
  }

  // Submit solution to teacher
  const submitSolution = async () => {
    if (!exercise || !lessonData) {
      alert('Упражнение не загружено')
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          exercise_id: exercise.id,
          code: currentFile?.content || '',
          language: getLanguageFromExtension(activeFile),
          test_results: testResults
        })
      })

      if (response.ok) {
        setSubmitted(true)
        alert('✅ Решение отправлено преподавателю на проверку!')
      } else {
        const err = await response.json()
        alert(`❌ Ошибка: ${err.error}`)
      }
    } catch (error) {
      alert('❌ Не удалось отправить решение')
    }
    setIsSubmitting(false)
  }

  const resetCode = () => {
    setFiles(prev => ({
      ...prev,
      [currentLangConfig.mainFile]: { 
        ...prev[currentLangConfig.mainFile], 
        content: initialFileContents[currentLangConfig.mainFile] 
      }
    }))
    setOutput('')
    setTerminalOutput('$ ')
  }

  const [hintIndex, setHintIndex] = useState(0)
  
  const showHint = () => {
    if (exerciseHints.length > 0) {
      alert(`💡 Подсказка ${hintIndex + 1}/${exerciseHints.length}:\n\n${exerciseHints[hintIndex]}`)
      setHintIndex((hintIndex + 1) % exerciseHints.length)
    } else {
      alert('💡 Подсказка: Используйте оператор + для сложения двух чисел.\n\nПример: return a + b;')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e]">
      {/* Top Bar */}
      <div className="h-10 bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link to="/learn" className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
            <span>←</span> Назад к курсу
          </Link>
          <span className="text-gray-600">|</span>
          <span className="text-gray-300 text-sm font-medium">{exerciseTitle}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">java-practice</span>
          <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded">
            {getLanguageFromExtension(activeFile).toUpperCase()}
          </span>
          <span className={`px-2 py-0.5 text-white text-xs rounded flex items-center gap-1 ${
            serverOnline === null ? 'bg-gray-600' : serverOnline ? 'bg-green-600' : 'bg-red-600'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              serverOnline === null ? 'bg-gray-400' : serverOnline ? 'bg-green-300 animate-pulse' : 'bg-red-400'
            }`}></span>
            {serverOnline === null ? 'Connecting...' : serverOnline ? 'Server Online' : 'Server Offline'}
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* File Tree / Project Explorer - hidden on mobile */}
        <div className="hidden md:flex w-[200px] lg:w-[240px] bg-[#252526] border-r border-[#3c3c3c] flex-col">
          {/* Explorer Header */}
          <div className="px-4 py-2 text-[11px] text-gray-400 uppercase tracking-wider font-semibold border-b border-[#3c3c3c] flex items-center justify-between">
            <span>Explorer</span>
            <div className="flex items-center gap-1">
              <button className="p-1 hover:bg-[#3c3c3c] rounded" title="New File">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button className="p-1 hover:bg-[#3c3c3c] rounded" title="New Folder">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </button>
              <button className="p-1 hover:bg-[#3c3c3c] rounded" title="Refresh">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Project Name */}
          <div className="px-2 py-2 text-[11px] text-gray-300 font-medium border-b border-[#3c3c3c] flex items-center gap-2">
            <span className="text-yellow-500">▼</span>
            <span>JAVA-PRACTICE</span>
          </div>
          
          {/* File Tree */}
          <div className="flex-1 overflow-y-auto py-1">
            <FileTree 
              files={projectFiles}
              activeFile={activeFile}
              onFileSelect={handleFileSelect}
              expandedFolders={expandedFolders}
              onToggleFolder={handleToggleFolder}
            />
          </div>

          {/* Outline Section */}
          <div className="border-t border-[#3c3c3c]">
            <div className="px-4 py-2 text-[11px] text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-2">
              <span className="text-gray-500">▶</span>
              <span>Outline</span>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Open File Tabs */}
          <div className="h-9 bg-[#252526] flex items-center border-b border-[#3c3c3c] overflow-x-auto">
            {openTabs.map((tab) => {
              const getTabIcon = (name: string) => {
                const ext = name.split('.').pop()?.toLowerCase()
                const fileName = name.toLowerCase()
                if (fileName === 'makefile') return '⚙️'
                if (fileName.startsWith('.git')) return '📦'
                switch (ext) {
                  case 'java': return '☕'
                  case 'js': case 'jsx': return '🟨'
                  case 'ts': case 'tsx': return '🔷'
                  case 'py': return '🐍'
                  case 'cpp': case 'c': case 'h': return '⚡'
                  case 'go': return '🔵'
                  case 'rs': return '🦀'
                  case 'kt': return '💜'
                  case 'cs': return '💚'
                  case 'md': return '📝'
                  case 'json': return '📋'
                  case 'xml': return '📄'
                  case 'yaml': case 'yml': return '⚙️'
                  case 'toml': return '📦'
                  default: return '📄'
                }
              }
              return (
                <div 
                  key={tab}
                  onClick={() => { setActiveFile(tab); setActiveTab('editor') }}
                  className={`group px-3 h-full text-sm flex items-center gap-2 border-r border-[#3c3c3c] cursor-pointer ${
                    activeFile === tab && activeTab === 'editor'
                      ? 'bg-[#1e1e1e] text-white' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span>{getTabIcon(tab)}</span>
                  <span>{tab}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleCloseTab(tab) }}
                    className="ml-1 p-0.5 rounded hover:bg-[#3c3c3c] opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )
            })}
            <button 
              onClick={() => setActiveTab('readme')}
              className={`px-3 h-full text-sm flex items-center gap-2 border-r border-[#3c3c3c] ${
                activeTab === 'readme' ? 'bg-[#1e1e1e] text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              📋 README
            </button>
            <button 
              onClick={() => setActiveTab('output')}
              className={`px-3 h-full text-sm flex items-center gap-2 border-r border-[#3c3c3c] ${
                activeTab === 'output' ? 'bg-[#1e1e1e] text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              📤 Output
            </button>
          </div>

          {/* Editor Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'readme' ? (
              <div className="h-full p-6 bg-[#1e1e1e] overflow-y-auto">
                <div className="prose prose-invert max-w-none text-gray-300">
                  <style>{`
                    .prose-invert h1, .prose-invert h2, .prose-invert h3 { color: #e5e7eb; }
                    .prose-invert p { color: #d1d5db; }
                    .prose-invert strong { color: #f3f4f6; }
                    .prose-invert ul { color: #d1d5db; }
                    .prose-invert li { color: #d1d5db; }
                    .prose-invert code.inline-code { 
                      background: #2d2d2d; 
                      color: #f92672; 
                      padding: 0.125rem 0.375rem;
                      border-radius: 0.25rem;
                      font-size: 0.875em;
                    }
                    .prose-invert pre { 
                      background: #252526; 
                      border: 1px solid #3e3e42;
                      border-radius: 0.375rem;
                      padding: 1rem;
                    }
                    .prose-invert pre code { color: #d4d4d4; }
                  `}</style>
                  <div dangerouslySetInnerHTML={{ __html: parseMarkdown(defaultReadme).html }} />
                </div>
              </div>
            ) : activeTab === 'output' ? (
              <div className="h-full p-4 font-mono text-sm bg-[#1e1e1e] overflow-y-auto whitespace-pre-wrap">
                {output ? (
                  <div className={output.includes('✅') || output.includes('🎉') ? 'text-green-400' : output.includes('❌') ? 'text-red-400' : 'text-gray-300'}>
                    {output}
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <p className="mb-4">Нажмите "Проверить" для запуска кода</p>
                    <div className="text-gray-600 text-xs">
                      <p>Горячие клавиши:</p>
                      <p className="mt-1">• Ctrl+Enter — Запустить код</p>
                      <p>• Ctrl+S — Сохранить</p>
                    </div>
                  </div>
                )}
              </div>
            ) : currentFile ? (
              <Editor
                height="100%"
                language={currentFile.language}
                theme="vs-dark"
                value={currentFile.content}
                onChange={handleCodeChange}
                options={{
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                  minimap: { enabled: true, scale: 0.8 },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  glyphMargin: true,
                  folding: true,
                  lineDecorationsWidth: 10,
                  lineNumbersMinChars: 3,
                  renderLineHighlight: 'all',
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  smoothScrolling: true,
                  padding: { top: 10, bottom: 10 },
                  bracketPairColorization: { enabled: true },
                  guides: {
                    bracketPairs: true,
                    indentation: true,
                  },
                  suggest: {
                    showKeywords: true,
                    showSnippets: true,
                    showMethods: true,
                    showFunctions: true,
                    showVariables: true,
                    showClasses: true,
                    showFields: true,
                    showProperties: true,
                    showEvents: true,
                    showOperators: true,
                    showUnits: true,
                    showValues: true,
                    showConstants: true,
                    showEnums: true,
                    showEnumMembers: true,
                    showStructs: true,
                    showInterfaces: true,
                    showModules: true,
                    showTypeParameters: true,
                  },
                  quickSuggestions: {
                    other: true,
                    comments: false,
                    strings: true,
                  },
                  quickSuggestionsDelay: 100,
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Выберите файл для редактирования
              </div>
            )}
          </div>

          {/* Bottom Panel */}
          <div className="h-[180px] bg-[#1e1e1e] border-t border-[#3c3c3c]">
            <div className="h-8 bg-[#252526] flex items-center text-sm border-b border-[#3c3c3c]">
              {['Problems', 'Terminal', 'Debug Console'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveBottomTab(tab.toLowerCase().replace(' ', ''))}
                  className={`px-4 h-full ${activeBottomTab === tab.toLowerCase().replace(' ', '') ? 'text-white bg-[#1e1e1e]' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="p-3 font-mono text-sm text-gray-400 h-[140px] overflow-y-auto">
              {activeBottomTab === 'terminal' ? (
                <div>
                  <div className="mb-2">
                    <span className="text-green-400">user@mooncode</span>
                    <span className="text-white">:</span>
                    <span className="text-blue-400">~/project</span>
                    <span className="text-white">$ </span>
                    <span className="text-gray-300">{terminalOutput || 'Ready'}</span>
                  </div>
                </div>
              ) : activeBottomTab === 'problems' ? (
                <div>
                  {problems.length === 0 ? (
                    <div className="text-green-500 flex items-center gap-2">
                      <span>✓</span> No problems detected
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {problems.map((p, i) => (
                        <div 
                          key={i}
                          className={`flex items-start gap-2 ${
                            p.severity === 'error' ? 'text-red-400' : 'text-yellow-400'
                          }`}
                        >
                          <span>{p.severity === 'error' ? '❌' : '⚠️'}</span>
                          <span className="text-gray-500">Line {p.line}:</span>
                          <span>{p.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500">Debug console is empty</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - hidden on mobile */}
        <aside className="hidden lg:flex w-[260px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex-col">
          {/* Action buttons */}
          <div className="flex flex-col">
            <button 
              onClick={runCode}
              disabled={isRunning}
              className={`flex items-center justify-center gap-2 px-6 py-4 text-white font-medium transition-colors ${
                isRunning ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Выполняется...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Проверить
                </>
              )}
            </button>
            
            {/* Submit button - only show if tests passed */}
            {testResults && testResults.passed === testResults.total && !submitted && (
              <button 
                onClick={submitSolution}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" /> Отправить преподавателю
                  </>
                )}
              </button>
            )}
            
            {submitted && (
              <div className="px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm text-center">
                ✅ Решение отправлено!
              </div>
            )}
          </div>

          {/* Test Results Summary */}
          {testResults && (
            <div className={`p-3 text-sm ${testResults.passed === testResults.total ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <div className="flex items-center gap-2 font-medium">
                {testResults.passed === testResults.total ? (
                  <><CheckCircle className="w-4 h-4 text-green-600" /> Все тесты пройдены!</>
                ) : (
                  <><span className="text-red-600">❌</span> {testResults.passed}/{testResults.total} тестов</>
                )}
              </div>
            </div>
          )}

          <div className="p-4 flex-1 overflow-y-auto">
            {/* Task description */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">📋 {exerciseTitle}</h3>
              {exerciseDescription && (
                <p className="text-xs text-blue-700 dark:text-blue-400 line-clamp-3">{exerciseDescription.slice(0, 150)}...</p>
              )}
              <button 
                onClick={() => setActiveTab('readme')}
                className="text-xs text-blue-600 hover:underline mt-2"
              >
                Читать полностью →
              </button>
            </div>

            <Link to="/learn" className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
              <Home className="w-5 h-5" />
              Назад к курсу
            </Link>
            
            <div className="mt-4 px-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {lessonData?.navigation 
                  ? `Урок ${lessonData.navigation.current} из ${lessonData.navigation.total}`
                  : 'пройдено 20 уроков из 45'
                }
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
                <div 
                  className="h-2 bg-green-500 rounded-full transition-all" 
                  style={{ width: lessonData?.navigation ? `${(lessonData.navigation.current / lessonData.navigation.total) * 100}%` : '44%' }} 
                />
              </div>
            </div>

            <div className="mt-6 space-y-1 border-t border-gray-200 dark:border-gray-700 pt-4">
              <button 
                onClick={resetCode}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              >
                ↩️ Сброс кода
              </button>
              <button 
                onClick={showHint}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              >
                💡 Подсказка ({exerciseHints.length})
              </button>
            </div>
          </div>

          {/* Bottom character */}
          <div className="p-4 text-center border-t border-gray-100 dark:border-gray-700">
            <div className="text-3xl">🦉</div>
            <p className="text-xs text-gray-400 mt-1">MoonCode Helper</p>
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Action Bar for Practice */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-bottom z-50">
        <div className="flex items-center p-2 gap-2">
          <Link to="/learn" className="p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <Home className="w-5 h-5" />
          </Link>
          <button 
            onClick={resetCode}
            className="p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            ↩️
          </button>
          <button 
            onClick={showHint}
            className="p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            💡
          </button>
          <button 
            onClick={runCode}
            disabled={isRunning}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-white font-medium rounded-lg transition-colors ${
              isRunning ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Выполняется...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> 
                <span className="hidden sm:inline">Проверить</span>
              </>
            )}
          </button>
          {testResults && testResults.passed === testResults.total && !submitted && (
            <button 
              onClick={submitSolution}
              disabled={isSubmitting}
              className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg"
            >
              {isSubmitting ? '...' : '✓'}
            </button>
          )}
        </div>
        {testResults && (
          <div className={`px-3 py-2 text-xs text-center ${testResults.passed === testResults.total ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
            {testResults.passed === testResults.total ? '✅ Все тесты пройдены!' : `❌ ${testResults.passed}/${testResults.total} тестов`}
          </div>
        )}
      </div>
    </div>
  )
}


