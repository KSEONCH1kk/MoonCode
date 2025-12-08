import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowUpRight,
  Glasses, TrendingUp, Flame, Users
} from 'lucide-react'
import { coursesAPI } from '../api'

// Hero Section - Bento Grid
function Hero() {
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
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
  }, [])

  return (
    <section className="py-12">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Left side */}
          <div>
            <h1 className="text-[40px] leading-tight font-medium text-gray-900 mb-6">
              Помогли стать<br />
              программистами 4500+<br />
              выпускникам
            </h1>
            <p className="text-gray-500 text-lg mb-8 max-w-[480px]">
              Пройдите путь от новичка до первой работы — с поддержкой 
              от профессионалов, с гарантированной стажировкой
            </p>
            
            {/* Photo */}
            <div className="rounded-2xl overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=350&fit=crop"
                alt="Students"
                className="w-full h-[280px] object-cover"
              />
            </div>
          </div>

          {/* Right side - Cards grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Card 1 */}
            <Link to="/courses" className="bg-gray-50 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] hover:bg-gray-100 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start">
                <Glasses className="w-6 h-6 text-gray-400" />
                <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <div className="text-gray-900 text-[15px] leading-snug">
                Освоить<br />профессию с нуля
              </div>
            </Link>

            {/* Card 2 */}
            <Link to="/courses?tag=Для+продвинутых" className="bg-gray-50 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] hover:bg-gray-100 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start">
                <TrendingUp className="w-6 h-6 text-gray-400" />
                <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <div className="text-gray-900 text-[15px] leading-snug">
                Освоить<br />навык и повысить грейд
              </div>
            </Link>

            {/* Card 3 - Black */}
            <Link to="/register" className="bg-gray-900 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] hover:bg-gray-800 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start">
                <Flame className="w-6 h-6 text-white/70" />
                <ArrowUpRight className="w-5 h-5 text-white/50 group-hover:text-white/80 transition-colors" />
              </div>
              <div className="text-white text-[15px] leading-snug">
                Начать<br />бесплатно
              </div>
            </Link>

            {/* Card 4 */}
            <div className="bg-gray-50 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] hover:bg-gray-100 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start">
                <Users className="w-6 h-6 text-gray-400" />
                <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <div className="text-gray-900 text-[15px] leading-snug">
                Обучение<br />от компании
              </div>
            </div>
          </div>
        </div>

        {/* Categories - Dynamic from backend */}
        <div className="flex flex-wrap gap-3 mt-10">
          {categories.slice(0, 4).map(category => (
            <Link
              key={category}
              to={`/courses?category=${encodeURIComponent(category)}`}
              className="px-6 py-3 border border-gray-300 rounded-full text-sm text-gray-700 hover:border-gray-400 transition-colors"
            >
              {category}
          </Link>
          ))}
          <Link to="/courses" className="px-6 py-3 bg-gray-900 rounded-full text-sm text-white hover:bg-gray-800 transition-colors">
            Полный каталог
          </Link>
        </div>
      </div>
    </section>
  )
}

// School Section
function SchoolSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-6">
        <h2 className="text-[32px] font-medium text-gray-900 leading-tight mb-12">
          Школа программирования для любого<br />
          уровня: от нуля до опытного практика
        </h2>

        <div className="grid lg:grid-cols-[300px_1fr] gap-12">
          {/* Left - Photo */}
          <div>
            <img 
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=380&fit=crop"
              alt="Graduate"
              className="rounded-2xl w-full"
            />
            <p className="text-sm text-gray-500 mt-4">
              Надежда Каменская, выпускница<br />курса Frontend-разработчик
            </p>
          </div>

          {/* Right - Professions */}
          <div>
            <div className="mb-8">
              <h3 className="text-xl font-medium text-gray-900 mb-2">Профессии</h3>
              <p className="text-gray-500">
                Если вы новичок и хотите получить<br />
                новую профессию в IT-сфере
              </p>
            </div>

            <div className="space-y-0 border-t border-gray-200">
              {[
                { name: 'Фронтенд-разработчик', slug: 'frontend-developer', desc: 'Разработка фронтенд-компонентов для веб-приложений', duration: '10 месяцев' },
                { name: 'Python-разработчик', slug: 'python-developer', desc: 'Разработка веб-приложений на Django', duration: '10 месяцев' },
                { name: 'Тестирование', slug: 'qa-engineer', desc: 'Ручное тестирование веб-приложений', duration: '4 месяца' },
              ].map((item, i) => (
                <Link 
                  key={i} 
                  to={`/courses/${item.slug}`}
                  className="flex items-center justify-between py-5 border-b border-gray-200 cursor-pointer hover:bg-white transition-colors group"
                >
                  <div className="flex-1">
                    <div className="text-gray-900 font-medium">{item.name}</div>
                    <div className="text-gray-500 text-sm">{item.desc}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 border border-gray-300 rounded-full text-sm text-gray-600">
                      {item.duration}
                    </span>
                    <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>

            <Link to="/courses" className="inline-block mt-6 px-5 py-2.5 border border-gray-900 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-900 hover:text-white transition-colors">
              Все профессии
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// Stats Section
function StatsSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-6">
        <h2 className="text-[32px] font-medium text-gray-900 text-center mb-12">
          Выпускники MoonCode востребованы на рынке
        </h2>

        {/* Mastercard-style overlapping circles */}
        <div className="flex justify-center items-center mb-8">
          <div className="relative">
            {/* Circle 1 - Purple (left) */}
            <div className="w-[200px] h-[200px] rounded-full bg-[#7c5cfc]/90 flex flex-col items-center justify-center text-white absolute left-0 top-0">
              <div className="text-5xl font-medium">80%</div>
              <div className="text-sm text-center mt-2 text-white/80 px-4">
                Выпускников MoonCode<br />трудоустраиваются в IT
              </div>
            </div>

            {/* Circle 2 - Cyan (right, slight overlap) */}
            <div className="w-[200px] h-[200px] rounded-full bg-[#3ec9f0]/90 flex flex-col items-center justify-center text-white absolute left-[180px] top-0">
              <div className="text-5xl font-medium">74%</div>
              <div className="text-sm text-center mt-2 text-white/80 px-4">
                Наших студентов находят<br />работу уже через 3 месяца
              </div>
            </div>
            
            {/* Spacer for proper sizing */}
            <div className="w-[370px] h-[200px]"></div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm">
          По данным независимого <a href="#" className="text-gray-900 hover:underline">исследования Высшей школы экономики</a>, проведенного в 2023 году
        </p>
      </div>
    </section>
  )
}

// Companies Section with Marquee
function CompaniesSection() {
  const row1 = [
    { name: 'Альфа Банк', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Logo_alfa-bank.png' },
    { name: 'OZON', logo: 'https://upload.wikimedia.org/wikipedia/ru/thumb/e/ec/OZON_2019.svg/250px-OZON_2019.svg.png' },
    { name: 'Ростелеком', logo: 'https://upload.wikimedia.org/wikipedia/ru/thumb/d/d9/%D0%9B%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF_%D0%BA%D0%BE%D0%BC%D0%BF%D0%B0%D0%BD%D0%B8%D0%B8_%C2%AB%D0%A0%D0%BE%D1%81%D1%82%D0%B5%D0%BB%D0%B5%D0%BA%D0%BE%D0%BC%C2%BB.png/250px-%D0%9B%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF_%D0%BA%D0%BE%D0%BC%D0%BF%D0%B0%D0%BD%D0%B8%D0%B8_%C2%AB%D0%A0%D0%BE%D1%81%D1%82%D0%B5%D0%BB%D0%B5%D0%BA%D0%BE%D0%BC%C2%BB.png' },
    { name: 'ABBYY', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/61/ABBYY_logo.svg' },
    { name: 'VK', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/VK_Full_Logo_%282021-present%29.svg/250px-VK_Full_Logo_%282021-present%29.svg.png' },
    { name: 'Яндекс', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Yandex_logo_2021_Russian.svg/330px-Yandex_logo_2021_Russian.svg.png' },
  ]

  const row2 = [
    { name: 'МТС', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Logo_%D0%9C%D0%A2%D0%A1_%282023%29.svg/250px-Logo_%D0%9C%D0%A2%D0%A1_%282023%29.svg.png' },
    { name: 'Т-Банк', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/T-Bank_RU_logo.svg/250px-T-Bank_RU_logo.svg.png' },
    { name: 'Delivery', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Delivery2024.png/250px-Delivery2024.png' },
    { name: 'Сбер', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Sberbank_Logo_2020.svg/250px-Sberbank_Logo_2020.svg.png' },
    { name: 'Авито', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Avito_logo.svg/250px-Avito_logo.svg.png' },
    { name: 'Lamoda', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Lamoda_logo.svg/250px-Lamoda_logo.svg.png' },
  ]

  return (
    <section className="py-16 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 mb-12">
        <h2 className="text-[32px] font-medium text-gray-900">
          Наши студенты<br />
          уже работают в компаниях
        </h2>
      </div>

      {/* Marquee rows */}
      <div className="space-y-6">
        {/* Row 1 */}
        <div className="relative">
          <div className="flex animate-marquee-right items-center">
            {[...row1, ...row1, ...row1].map((company, i) => (
              <div key={i} className="flex items-center justify-center px-8 min-w-[200px]">
                <img 
                  src={company.logo} 
                  alt={company.name}
                  className="h-8 w-auto object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 */}
        <div className="relative">
          <div className="flex animate-marquee-left-fast items-center">
            {[...row2, ...row2, ...row2].map((company, i) => (
              <div key={i} className="flex items-center justify-center px-8 min-w-[200px]">
                <img 
                  src={company.logo} 
                  alt={company.name}
                  className="h-8 w-auto object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Reviews Section
function ReviewsSection() {
  const reviews = [
    { name: 'Отзовик', rating: 4.5 },
    { name: 'О курсах', rating: 4.6 },
    { name: 'Academy market', rating: 4.7 },
    { name: 'Сравни.ру', rating: 4.6 },
    { name: 'Каталог курсов', rating: 4.8 },
    { name: 'Пикабу', rating: 4.6 },
    { name: 'Т-Ж', rating: 4.5 },
    { name: 'КурсХаб', rating: 4.6 },
  ]

  return (
    <section className="py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <h2 className="text-[32px] font-medium text-gray-900 mb-12">
          Отзывы о MoonCode<br />
          на площадках
        </h2>

        <div className="grid md:grid-cols-[250px_1fr] gap-6">
          {/* Main rating */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <div className="text-gray-500 mb-2">TutorTop</div>
            <div className="text-6xl font-medium text-gray-900">4.8</div>
          </div>

          {/* Other ratings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reviews.map((review, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-gray-500 text-sm">{review.name}</span>
                  <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
                <div className="text-2xl font-medium text-gray-900">{review.rating}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Cookie Banner
function CookieBanner() {
  const [show, setShow] = useState(true)
  
  if (!show) return null

  return (
    <div className="fixed bottom-6 right-6 w-[360px] bg-gray-900 text-white rounded-2xl p-5 shadow-2xl z-50">
      <p className="text-sm text-gray-300 mb-4">
        Мы используем cookie. Нажимая «Принять», вы соглашаетесь с их{' '}
        <a href="#" className="text-white underline">использованием</a>. Подробнее – в{' '}
        <a href="#" className="text-white underline">Условиях</a>.
      </p>
      <button 
        onClick={() => setShow(false)}
        className="w-full py-3 bg-gray-700 text-white rounded-xl text-sm font-medium hover:bg-gray-600 transition-colors"
      >
        Принять
      </button>
    </div>
  )
}

export function HomePage() {
  return (
    <>
      <Hero />
      <SchoolSection />
      <StatsSection />
      <CompaniesSection />
      <ReviewsSection />
      <CookieBanner />
    </>
  )
}

