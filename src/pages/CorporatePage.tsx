import { Building2, Users, TrendingUp, Shield, CheckCircle } from 'lucide-react'

export function CorporatePage() {
  const benefits = [
    'Индивидуальные программы под задачи бизнеса',
    'Опытные менторы из топовых IT-компаний',
    'Гибкий график обучения',
    'Аналитика прогресса команды',
    'Сертификаты по окончании',
    'Техническая поддержка 24/7'
  ]

  const cases = [
    {
      company: 'Сбербанк',
      employees: 150,
      result: '+40% производительности команды',
      icon: 'https://api.dicebear.com/7.x/initials/svg?seed=SB'
    },
    {
      company: 'Яндекс',
      employees: 200,
      result: 'Переобучили 200 сотрудников на новые технологии',
      icon: 'https://api.dicebear.com/7.x/initials/svg?seed=YA'
    },
    {
      company: 'Тинькофф',
      employees: 100,
      result: 'Сократили время онбординга новых разработчиков на 50%',
      icon: 'https://api.dicebear.com/7.x/initials/svg?seed=TI'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6">Корпоративное обучение</h1>
              <p className="text-xl text-gray-300 mb-8">
                Повысьте квалификацию своей команды с индивидуальными образовательными программами от MoonCode
              </p>
              <button className="px-8 py-4 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-colors">
                Оставить заявку
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <Building2 className="w-10 h-10 mb-3" />
                <div className="text-2xl font-bold mb-1">500+</div>
                <div className="text-sm text-gray-300">Компаний-партнеров</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <Users className="w-10 h-10 mb-3" />
                <div className="text-2xl font-bold mb-1">15K+</div>
                <div className="text-sm text-gray-300">Обученных сотрудников</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <TrendingUp className="w-10 h-10 mb-3" />
                <div className="text-2xl font-bold mb-1">+35%</div>
                <div className="text-sm text-gray-300">Рост продуктивности</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <Shield className="w-10 h-10 mb-3" />
                <div className="text-2xl font-bold mb-1">98%</div>
                <div className="text-sm text-gray-300">Довольных клиентов</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Преимущества корпоративного обучения</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit) => (
              <div key={benefit} className="bg-white rounded-xl p-6 border border-gray-200 flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cases Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Кейсы наших клиентов</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {cases.map((caseItem) => (
              <div key={caseItem.company} className="bg-gray-50 rounded-xl p-8">
                <img 
                  src={caseItem.icon} 
                  alt={caseItem.company}
                  className="w-16 h-16 rounded-full mb-4"
                />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{caseItem.company}</h3>
                <p className="text-sm text-gray-600 mb-4">{caseItem.employees} сотрудников</p>
                <p className="text-gray-700 font-medium">{caseItem.result}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Программы обучения</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Базовая</h3>
              <div className="text-3xl font-bold text-gray-900 mb-6">от 100K ₽</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  До 50 сотрудников
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Стандартные курсы
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Базовая поддержка
                </li>
              </ul>
              <button className="w-full py-3 border-2 border-gray-900 text-gray-900 rounded-xl font-medium hover:bg-gray-900 hover:text-white transition-colors">
                Выбрать
              </button>
            </div>
            <div className="bg-gray-900 text-white rounded-xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Популярно
              </div>
              <h3 className="text-xl font-bold mb-4">Профессиональная</h3>
              <div className="text-3xl font-bold mb-6">от 300K ₽</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  До 200 сотрудников
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Кастомные программы
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Приоритетная поддержка
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Менторинг
                </li>
              </ul>
              <button className="w-full py-3 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-colors">
                Выбрать
              </button>
            </div>
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Корпоративная</h3>
              <div className="text-3xl font-bold text-gray-900 mb-6">По запросу</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Без ограничений
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Полная кастомизация
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Личный менеджер
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  SLA поддержка
                </li>
              </ul>
              <button className="w-full py-3 border-2 border-gray-900 text-gray-900 rounded-xl font-medium hover:bg-gray-900 hover:text-white transition-colors">
                Связаться
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Готовы начать обучение команды?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Оставьте заявку, и наш менеджер свяжется с вами в течение 24 часов
          </p>
          <button className="px-8 py-4 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-colors">
            Оставить заявку
          </button>
        </div>
      </section>
    </div>
  )
}

