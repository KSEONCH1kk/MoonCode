import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <Link to="/" className="flex items-center gap-1.5 mb-6">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="white"/>
                <path d="M8 10h4v12H8V10zm6 4h4v8h-4v-8zm6-2h4v10h-4V12z" fill="#111827"/>
              </svg>
              <span className="text-xl font-medium">MoonCode</span>
            </Link>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">О нас</a></li>
              <li><a href="#" className="hover:text-white">Отзывы</a></li>
              <li><a href="#" className="hover:text-white">Корпоративное обучение</a></li>
              <li><a href="#" className="hover:text-white">Блог</a></li>
              <li><a href="#" className="hover:text-white">Вопросы и ответы</a></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-medium mb-6 text-gray-300">Направления</div>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/courses?category=DevOps" className="hover:text-white">DevOps</Link></li>
              <li><Link to="/courses?category=Аналитика" className="hover:text-white">Аналитика</Link></li>
              <li><Link to="/courses?category=Бэкенд" className="hover:text-white">Бэкенд</Link></li>
              <li><Link to="/courses?category=Фронтенд" className="hover:text-white">Фронтенд</Link></li>
              <li><Link to="/courses?category=Тестирование" className="hover:text-white">Тестирование</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-medium mb-6 text-gray-300">Профессии</div>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/courses/devops-engineer" className="hover:text-white">DevOps-инженер с нуля</Link></li>
              <li><Link to="/courses/go-developer" className="hover:text-white">Go-разработчик</Link></li>
              <li><Link to="/courses/java-developer" className="hover:text-white">Java-разработчик</Link></li>
              <li><Link to="/courses/python-developer" className="hover:text-white">Python-разработчик</Link></li>
              <li><Link to="/courses/frontend-developer" className="hover:text-white">Frontend-разработчик</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-medium mb-6 text-gray-300">Навыки</div>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Django</a></li>
              <li><a href="#" className="hover:text-white">Docker</a></li>
              <li><a href="#" className="hover:text-white">Laravel</a></li>
              <li><a href="#" className="hover:text-white">React</a></li>
              <li><a href="#" className="hover:text-white">TypeScript</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="text-gray-400 text-sm">
              <div className="mb-2">8 800 100 22 47</div>
              <div className="text-gray-500">бесплатно по РФ</div>
            </div>
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} MoonCode. Все права защищены.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

