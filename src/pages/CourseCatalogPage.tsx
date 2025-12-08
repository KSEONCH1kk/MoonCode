import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, ArrowRight, RotateCcw } from 'lucide-react'
import { coursesAPI } from '../api'
import type { Course } from '../api'

// Default categories and tags (fallback)
const defaultCategories = [
  'Программирование',
  'Frontend',
  'Backend', 
  'Тестирование',
  'DevOps',
  'Аналитика',
  'Дизайн',
]

const defaultTags = [
  'JavaScript',
  'Python',
  'Java',
  'PHP',
  'SQL',
  'HTML/CSS',
  'React',
  'Node.js',
]

function CourseCard({ course }: { course: Course }) {
  const levelLabels: Record<string, string> = {
    beginner: 'Начинающий',
    intermediate: 'Средний',
    advanced: 'Продвинутый',
  }

  return (
    <Link 
      to={`/courses/${course.slug}`}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all group"
    >
      <div className="p-6">
        {/* Meta */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <span>{course.duration_hours}ч</span>
          <span>·</span>
          <span>{levelLabels[course.level] || course.level}</span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-medium text-gray-900 mb-2 group-hover:text-gray-600 transition-colors">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-gray-500 text-sm mb-6 line-clamp-2">
          {course.short_description || course.description}
        </p>

        {/* Image */}
        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-6">
          {course.image ? (
            <img 
              src={course.image} 
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <span className="text-6xl">{course.title[0]}</span>
            </div>
          )}
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between">
          <div>
            {course.is_free ? (
              <span className="text-lg font-medium text-green-600">Бесплатно</span>
            ) : (
              <span className="text-lg font-medium text-gray-900">
                {course.price > 0 ? `от ${course.price.toLocaleString()} ₽` : 'Бесплатно'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-gray-500 text-sm group-hover:text-gray-900 transition-colors">
            Посмотреть <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  )
}

export function CourseCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<string[]>(defaultCategories)
  const [tags, setTags] = useState<string[]>(defaultTags)
  const [loading, setLoading] = useState(true)
  
  const selectedCategory = searchParams.get('category') || ''
  const selectedTags = searchParams.getAll('tag')
  const selectedLevel = searchParams.get('level') || ''

  useEffect(() => {
    loadMeta()
    loadCourses()
  }, [selectedCategory, selectedLevel, searchQuery])

  const loadMeta = async () => {
    try {
      const data = await coursesAPI.getMeta()
      if (data.categories && data.categories.length > 0) {
        setCategories(data.categories)
      }
      if (data.tags && data.tags.length > 0) {
        setTags(data.tags)
      }
    } catch (error) {
      console.error('Failed to load meta:', error)
      // Use defaults on error
    }
  }

  const loadCourses = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (selectedCategory) params.category = selectedCategory
      if (selectedLevel) params.level = selectedLevel
      if (searchQuery) params.search = searchQuery

      const result = await coursesAPI.getAll(params)
      setCourses(result.courses || [])
    } catch (error) {
      console.error('Failed to load courses:', error)
    }
    setLoading(false)
  }

  const handleCategoryChange = (category: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (category) {
      newParams.set('category', category)
    } else {
      newParams.delete('category')
    }
    setSearchParams(newParams)
  }

  const handleTagToggle = (tag: string) => {
    const newParams = new URLSearchParams(searchParams)
    const currentTags = newParams.getAll('tag')
    
    if (currentTags.includes(tag)) {
      newParams.delete('tag')
      currentTags.filter(t => t !== tag).forEach(t => newParams.append('tag', t))
    } else {
      newParams.append('tag', tag)
    }
    
    setSearchParams(newParams)
  }

  const handleReset = () => {
    setSearchParams({})
    setSearchQuery('')
  }

  // Filter by tags on frontend (backend already filtered by category/level/search)
  const filteredCourses = selectedTags.length > 0
    ? courses.filter(course => selectedTags.some(tag => course.tags?.includes(tag)))
    : courses

  const hasFilters = selectedCategory || selectedTags.length > 0 || searchQuery

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        {/* Title */}
        <h1 className="text-4xl font-medium text-gray-900 mb-8">Каталог курсов</h1>

        {/* Promo Banner */}
        <div className="bg-gray-900 text-white rounded-2xl px-6 py-4 mb-8 flex items-center justify-center gap-2">
          <span className="text-[#3ec9f0]">New Year: −30% на курсы</span>
          <span>и доступ к chatGPT на время обучения, оставьте заявку →</span>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-3 mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(selectedCategory === cat ? '' : cat)}
              className={`px-5 py-2.5 rounded-full text-sm border transition-colors ${
                selectedCategory === cat
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Tags */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поискать по курсам"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {tags.slice(0, 8).map(tag => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {tag}
              </button>
            ))}
            
            {hasFilters && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                <RotateCcw className="w-4 h-4" />
                Сбросить
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="text-gray-500 text-sm mb-6">
          Найдено курсов: {filteredCourses.length}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 text-lg mb-4">Курсы не найдены</div>
            <button
              onClick={handleReset}
              className="text-gray-900 font-medium hover:underline"
            >
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
