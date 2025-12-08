import { Calendar, Clock, ArrowRight } from 'lucide-react'

export function BlogPage() {
  const posts = [
    {
      title: 'Как начать карьеру в IT с нуля в 2025 году',
      excerpt: 'Подробное руководство для тех, кто хочет войти в IT без опыта. Разбираем все этапы: от выбора направления до первой работы.',
      category: 'Карьера',
      date: '15 декабря 2024',
      readTime: '10 мин',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop'
    },
    {
      title: 'Python vs JavaScript: какой язык выбрать в 2025',
      excerpt: 'Сравниваем два самых популярных языка программирования. Что учить новичку и какие перспективы открывает каждый язык.',
      category: 'Программирование',
      date: '12 декабря 2024',
      readTime: '8 мин',
      image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&h=400&fit=crop'
    },
    {
      title: 'Топ-10 навыков разработчика в 2025 году',
      excerpt: 'Какие технологии и soft skills нужны современному разработчику. Актуальный список от экспертов индустрии.',
      category: 'Технологии',
      date: '8 декабря 2024',
      readTime: '12 мин',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop'
    },
    {
      title: 'Как составить резюме Junior-разработчика',
      excerpt: 'Практические советы по составлению резюме, которое заметят рекрутеры. Примеры и шаблоны inside.',
      category: 'Карьера',
      date: '5 декабря 2024',
      readTime: '15 мин',
      image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=400&fit=crop'
    },
    {
      title: 'DevOps практики для начинающих',
      excerpt: 'Основы DevOps: CI/CD, Docker, Kubernetes и другие инструменты, которые должен знать каждый разработчик.',
      category: 'DevOps',
      date: '1 декабря 2024',
      readTime: '20 мин',
      image: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&h=400&fit=crop'
    },
    {
      title: 'Что такое Clean Code и зачем он нужен',
      excerpt: 'Разбираем принципы чистого кода с примерами. Как писать код, который будет понятен другим разработчикам.',
      category: 'Программирование',
      date: '28 ноября 2024',
      readTime: '10 мин',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop'
    }
  ]

  const categories = ['Все', 'Карьера', 'Программирование', 'Технологии', 'DevOps']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold mb-6">Блог MoonCode</h1>
            <p className="text-xl text-gray-300">
              Статьи про карьеру в IT, обучение программированию и новые технологии
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-3 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`px-6 py-2 rounded-full whitespace-nowrap ${
                  cat === 'Все'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 grid md:grid-cols-2">
            <img 
              src={posts[0].image}
              alt={posts[0].title}
              className="w-full h-full object-cover"
            />
            <div className="p-8 flex flex-col justify-center">
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full w-fit mb-4">
                {posts[0].category}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{posts[0].title}</h2>
              <p className="text-gray-600 mb-6">{posts[0].excerpt}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {posts[0].date}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {posts[0].readTime}
                </div>
              </div>
              <button className="inline-flex items-center gap-2 text-gray-900 font-medium hover:gap-3 transition-all">
                Читать далее <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Последние статьи</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {posts.slice(1).map((post) => (
              <article key={post.title} className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                <img 
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-3">
                    {post.category}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{post.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {post.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-2 text-gray-900 font-medium text-sm hover:gap-3 transition-all">
                    Читать <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Подпишитесь на рассылку</h2>
          <p className="text-xl text-gray-300 mb-8">
            Получайте новые статьи и новости из мира IT прямо на почту
          </p>
          <form className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Ваш email"
              className="flex-1 px-4 py-3 rounded-xl text-gray-900"
            />
            <button className="px-6 py-3 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-colors">
              Подписаться
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

