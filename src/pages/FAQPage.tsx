import { useState } from 'react'
import { ChevronDown, Search, MessageCircle, Mail, Phone } from 'lucide-react'

export function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      category: 'Общие вопросы',
      questions: [
        {
          q: 'Кто может учиться в MoonCode?',
          a: 'Наши курсы подходят всем: от полных новичков до опытных специалистов, которые хотят освоить новые технологии. Не нужно иметь техническое образование - мы начинаем с основ и постепенно усложняем материал.'
        },
        {
          q: 'Сколько времени нужно уделять обучению?',
          a: 'В среднем студенты занимаются 10-15 часов в неделю. Вы можете учиться в своем темпе - все материалы доступны 24/7. Программа рассчитана на 6-12 месяцев в зависимости от курса.'
        },
        {
          q: 'Нужно ли покупать дополнительное оборудование?',
          a: 'Для большинства курсов достаточно обычного компьютера с выходом в интернет. Минимальные требования: 4 ГБ RAM, любая современная ОС (Windows, macOS, Linux). Все инструменты, которые мы используем, бесплатны.'
        }
      ]
    },
    {
      category: 'Обучение',
      questions: [
        {
          q: 'Как проходит обучение?',
          a: 'Обучение состоит из видеолекций, практических заданий, проектов и менторских сессий. Вы изучаете теорию, затем сразу применяете знания на практике. Менторы проверяют ваш код и дают обратную связь.'
        },
        {
          q: 'Что делать, если я не понимаю материал?',
          a: 'У каждого студента есть личный ментор, к которому можно обратиться за помощью. Также работает чат поддержки и комьюнити студентов, где можно задать вопросы. Материалы можно пересматривать неограниченное количество раз.'
        },
        {
          q: 'Можно ли совмещать обучение с работой?',
          a: 'Да, большинство наших студентов работают параллельно с обучением. Программа построена так, чтобы можно было заниматься в удобное время. Вы сами выбираете темп обучения.'
        },
        {
          q: 'Выдается ли сертификат после обучения?',
          a: 'Да, после успешного завершения курса вы получаете сертификат MoonCode. Также мы помогаем сформировать портфолио из проектов, которые вы создадите во время обучения.'
        }
      ]
    },
    {
      category: 'Оплата и гарантии',
      questions: [
        {
          q: 'Сколько стоит обучение?',
          a: 'Стоимость зависит от курса и составляет от 50 000 до 150 000 рублей. Доступна рассрочка без процентов на 12 месяцев. Первый урок всегда бесплатный - вы можете попробовать перед покупкой.'
        },
        {
          q: 'Можно ли оплатить обучение в рассрочку?',
          a: 'Да, мы предлагаем беспроцентную рассрочку на 6 или 12 месяцев. Первый платеж - после первого месяца обучения. Также есть скидки при полной оплате.'
        },
        {
          q: 'Есть ли гарантия трудоустройства?',
          a: 'Мы гарантируем помощь в трудоустройстве: подготовка резюме, тренировка собеседований, рекомендации партнерским компаниям. 95% наших выпускников находят работу в течение 3 месяцев после окончания курса.'
        },
        {
          q: 'Можно ли вернуть деньги, если не подошло?',
          a: 'Да, действует гарантия возврата денег в течение первых 14 дней обучения, если вы поняли, что курс вам не подходит. Без вопросов вернем полную сумму.'
        }
      ]
    },
    {
      category: 'Трудоустройство',
      questions: [
        {
          q: 'Помогаете ли вы с поиском работы?',
          a: 'Да, у нас есть карьерный центр, который помогает с трудоустройством: составление резюме, подготовка к собеседованиям, рекомендации компаниям-партнерам. Также проводим карьерные вебинары и встречи с работодателями.'
        },
        {
          q: 'Какая зарплата у выпускников?',
          a: 'Средняя зарплата Junior-разработчика после наших курсов - 80 000 - 120 000 рублей. С опытом зарплата растет до 150 000 - 250 000 рублей через 6-12 месяцев работы.'
        },
        {
          q: 'Нужен ли опыт работы для трудоустройства?',
          a: 'Нет, многие наши выпускники находят первую работу без опыта. Во время обучения вы создаете портфолио проектов, которое показывает ваши навыки работодателям.'
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold mb-6">Частые вопросы</h1>
            <p className="text-xl text-gray-300 mb-8">
              Ответы на самые популярные вопросы об обучении в MoonCode
            </p>
            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по вопросам..."
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          {faqs.map((category, categoryIndex) => (
            <div key={category.category} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{category.category}</h2>
              <div className="space-y-4">
                {category.questions.map((faq, questionIndex) => {
                  const index = categoryIndex * 100 + questionIndex
                  const isOpen = openIndex === index
                  
                  return (
                    <div key={questionIndex} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : index)}
                        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 pr-8">{faq.q}</span>
                        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Не нашли ответ?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Онлайн-чат</h3>
              <p className="text-gray-600 text-sm mb-4">Напишите нам в чат, ответим в течение 5 минут</p>
              <button className="text-blue-600 font-medium hover:underline">Открыть чат</button>
            </div>
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600 text-sm mb-4">Отправьте письмо на почту</p>
              <a href="mailto:support@mooncode.io" className="text-green-600 font-medium hover:underline">
                support@mooncode.io
              </a>
            </div>
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Телефон</h3>
              <p className="text-gray-600 text-sm mb-4">Позвоните нам бесплатно</p>
              <a href="tel:+78001002247" className="text-purple-600 font-medium hover:underline">
                8 800 100 22 47
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

