import { Star, Quote } from 'lucide-react'

export function ReviewsPage() {
  const reviews = [
    {
      name: 'Надежда Каменская',
      course: 'Frontend-разработчик',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nadezhda',
      rating: 5,
      text: 'Прошла курс Frontend-разработчика и уже работаю в IT-компании! Курс очень практичный, много реальных проектов. Менторы всегда помогали и поддерживали. Спасибо MoonCode за новую профессию!',
      company: 'Яндекс'
    },
    {
      name: 'Михаил Соколов',
      course: 'Python-разработчик',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mikhail',
      rating: 5,
      text: 'Отличная структура курса, все логично и понятно объяснено. За 10 месяцев из новичка вырос до уверенного джуниора. Особенно понравились живые код-ревью и менторская поддержка.',
      company: 'VK'
    },
    {
      name: 'Анна Волкова',
      course: 'DevOps-инженер',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna',
      rating: 5,
      text: 'Курс превзошел все ожидания! Очень глубокое погружение в DevOps-практики. После обучения получила оффер в крупную компанию. Рекомендую всем, кто хочет сменить профессию.',
      company: 'Сбер'
    },
    {
      name: 'Дмитрий Кузнецов',
      course: 'Java-разработчик',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dmitry',
      rating: 5,
      text: 'Качественные материалы, опытные преподаватели, реальные проекты в портфолио. Через месяц после окончания курса нашел работу. Зарплата выросла в 3 раза!',
      company: 'Тинькофф'
    },
    {
      name: 'Елена Смирнова',
      course: 'Data Science',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
      rating: 5,
      text: 'Переходила в Data Science из другой сферы. Курс помог мне уверенно войти в новую профессию. Особенно ценю практические кейсы от реальных компаний.',
      company: 'Ozon'
    },
    {
      name: 'Игорь Петров',
      course: 'Fullstack-разработчик',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Igor',
      rating: 5,
      text: 'Лучшее вложение в себя! Курс дал полную картину современной веб-разработки. Сейчас работаю фулстек-разработчиком в стартапе. Спасибо команде MoonCode!',
      company: 'СберМаркет'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold mb-6">Отзывы выпускников</h1>
            <p className="text-xl text-gray-300">
              Истории успеха наших студентов, которые изменили свою жизнь с MoonCode
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">95%</div>
              <div className="text-sm text-gray-600">Трудоустроены</div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">4.9</div>
              <div className="text-sm text-gray-600">Средний рейтинг</div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">3x</div>
              <div className="text-sm text-gray-600">Рост зарплаты</div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">10K+</div>
              <div className="text-sm text-gray-600">Выпускников</div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {reviews.map((review) => (
              <div key={review.name} className="bg-white rounded-xl p-8 border border-gray-200 relative">
                <Quote className="absolute top-6 right-6 w-8 h-8 text-gray-200" />
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={review.avatar} 
                    alt={review.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{review.name}</h3>
                    <p className="text-sm text-gray-600">{review.course}</p>
                    <p className="text-sm font-medium text-blue-600">{review.company}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Reviews Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Видео-отзывы</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">Видео-отзыв {i}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Станьте следующим успешным выпускником</h2>
          <p className="text-xl text-gray-300 mb-8">
            Начните обучение сегодня и измените свою карьеру завтра
          </p>
          <a 
            href="/courses"
            className="inline-block px-8 py-4 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-colors"
          >
            Выбрать курс
          </a>
        </div>
      </section>
    </div>
  )
}

