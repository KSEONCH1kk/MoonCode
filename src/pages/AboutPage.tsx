import { Users, Target, Award, Heart } from 'lucide-react'

export function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold mb-6">О MoonCode</h1>
            <p className="text-xl text-gray-300">
              Мы создаем будущее IT-образования, помогая людям осваивать новые профессии и строить успешную карьеру в технологиях
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Наша миссия</h2>
              <p className="text-lg text-gray-600 mb-4">
                Сделать качественное IT-образование доступным для каждого. Мы верим, что каждый человек способен освоить программирование и начать карьеру в технологиях.
              </p>
              <p className="text-lg text-gray-600">
                Наши курсы разработаны практикующими специалистами из ведущих IT-компаний. Мы обучаем реальным навыкам, которые нужны работодателям прямо сейчас.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-4xl font-bold text-gray-900 mb-2">10K+</div>
                <div className="text-sm text-gray-600">Выпускников</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-4xl font-bold text-gray-900 mb-2">95%</div>
                <div className="text-sm text-gray-600">Трудоустройство</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-4xl font-bold text-gray-900 mb-2">50+</div>
                <div className="text-sm text-gray-600">Курсов</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-4xl font-bold text-gray-900 mb-2">200+</div>
                <div className="text-sm text-gray-600">Менторов</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Наши ценности</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Сообщество</h3>
              <p className="text-gray-600 text-sm">
                Создаем дружелюбную среду для обучения и развития
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Практика</h3>
              <p className="text-gray-600 text-sm">
                Фокус на реальных проектах и практических навыках
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Качество</h3>
              <p className="text-gray-600 text-sm">
                Высокие стандарты образования и постоянное обновление программ
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Поддержка</h3>
              <p className="text-gray-600 text-sm">
                Индивидуальное сопровождение каждого студента
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Наша команда</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Мы — команда профессионалов из ведущих IT-компаний, которые любят то, что делают, и хотят поделиться своим опытом
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Алексей Иванов', role: 'CEO & Founder', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
              { name: 'Мария Петрова', role: 'CTO', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria' },
              { name: 'Дмитрий Сидоров', role: 'Head of Education', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dmitry' },
            ].map((member) => (
              <div key={member.name} className="bg-white rounded-xl p-6 border border-gray-200 text-center">
                <img 
                  src={member.avatar} 
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Начните свой путь в IT</h2>
          <p className="text-xl text-gray-300 mb-8">
            Присоединяйтесь к тысячам студентов, которые уже изменили свою жизнь с MoonCode
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

