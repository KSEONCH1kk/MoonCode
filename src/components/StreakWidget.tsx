import { useState, useEffect } from 'react'
import { Flame, Snowflake, Gem, Trophy, Lock } from 'lucide-react'
import { userAPI } from '../api'
import { useToast } from './Toast'

export function StreakWidget() {
  const [streak, setStreak] = useState(0)
  const [freezes, setFreezes] = useState(0)
  const [gems, setGems] = useState(0)
  const [achievements, setAchievements] = useState<any[]>([])
  const [showAchievements, setShowAchievements] = useState(false)
  const [showShop, setShowShop] = useState(false)
  const toast = useToast()

  // Helper for pluralization
  const pluralize = (count: number, one: string, few: string, many: string) => {
    const mod10 = count % 10
    const mod100 = count % 100
    
    if (mod10 === 1 && mod100 !== 11) {
      return one
    } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return few
    } else {
      return many
    }
  }

  const getDaysText = (count: number) => pluralize(count, 'день', 'дня', 'дней')
  const getFreezeText = (count: number) => pluralize(count, 'заморозка', 'заморозки', 'заморозок')
  const getGemsText = (count: number) => pluralize(count, 'алмаз', 'алмаза', 'алмазов')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [streakData, achievementsData] = await Promise.all([
        userAPI.getStreak(),
        userAPI.getAchievements()
      ])
      
      setStreak(streakData.streak)
      setFreezes(streakData.freezes)
      setGems(streakData.gems)
      setAchievements(achievementsData.achievements)
    } catch (error) {
      console.error('Failed to load streak data:', error)
    }
  }

  const handleBuyFreeze = async () => {
    try {
      const result = await userAPI.buyStreakFreeze()
      setGems(result.gems)
      setFreezes(result.freezes)
      toast.success(result.message)
    } catch (error: any) {
      toast.error(error.message || 'Ошибка покупки')
    }
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <div className="space-y-4">
      {/* Streak Card */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white min-h-[140px]">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Flame className="w-8 h-8" />
            </div>
            <div>
              <div className="text-4xl font-bold leading-tight mb-1">{streak}</div>
              <div className="text-sm text-orange-100 leading-tight whitespace-nowrap">{getDaysText(streak)} подряд</div>
            </div>
          </div>
          <button
            onClick={() => setShowShop(true)}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-xl transition-colors flex-shrink-0"
          >
            <Gem className="w-5 h-5" />
            <span className="font-bold text-lg">{gems}</span>
          </button>
        </div>

        {streak === 0 && (
          <p className="text-sm text-orange-100 leading-relaxed">
            Начните обучение сегодня, чтобы начать свой стрейк! 🚀
          </p>
        )}

        {streak > 0 && (
          <div className="flex items-center gap-2 text-sm text-orange-100">
            <Snowflake className="w-4 h-4 flex-shrink-0" />
            <span>{getFreezeText(freezes)}: {freezes}</span>
          </div>
        )}
      </div>

      {/* Gems & Achievements */}
      <div className="space-y-4">
        <button
          onClick={() => setShowShop(true)}
          className="w-full bg-white border border-gray-200 rounded-xl p-6 text-left hover:shadow-md transition-shadow min-h-[120px]"
        >
          <div className="flex items-center gap-4 h-full">
            <div className="w-16 h-16 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Gem className="w-8 h-8 text-cyan-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-4xl font-bold text-gray-900 leading-tight mb-2">{gems}</div>
              <div className="text-sm text-gray-500 leading-tight whitespace-nowrap">{getGemsText(gems)}</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setShowAchievements(true)}
          className="w-full bg-white border border-gray-200 rounded-xl p-6 text-left hover:shadow-md transition-shadow min-h-[120px]"
        >
          <div className="flex items-center gap-4 h-full">
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trophy className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-4xl font-bold text-gray-900 leading-tight mb-2">{unlockedCount}/{achievements.length}</div>
              <div className="text-sm text-gray-500 leading-tight whitespace-nowrap">Достижений</div>
            </div>
          </div>
        </button>
      </div>

      {/* Shop Modal */}
      {showShop && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowShop(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full animate-modal-in shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Магазин</h2>
              <button 
                onClick={() => setShowShop(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-2 mb-6 text-lg">
              <Gem className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-gray-900">{gems} {getGemsText(gems)}</span>
            </div>

            <div className="rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800" style={{ backgroundColor: 'rgb(219 234 254)' }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgb(191 219 254)' }}>
                  <Snowflake className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1" style={{ color: '#111827' }}>Streak Freeze</h3>
                  <p className="text-sm mb-2" style={{ color: '#4b5563' }}>
                    Пропустите один день без потери стрейка
                  </p>
                  <div className="flex items-center gap-2">
                    <Gem className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold" style={{ color: '#111827' }}>100 {getGemsText(100)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleBuyFreeze}
                disabled={gems < 100}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {gems < 100 ? 'Недостаточно алмазов' : 'Купить'}
              </button>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-2">Как получить алмазы?</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>💎 +10 за прохождение теста</li>
                <li>💎 +5 за выполнение практики</li>
                <li>💎 +3 за просмотр видео/теории</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Modal */}
      {showAchievements && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowAchievements(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-modal-in shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Достижения</h2>
              <button 
                onClick={() => setShowAchievements(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`relative rounded-xl p-4 border-2 transition-all ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  {!achievement.unlocked && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div className="text-4xl mb-2">{achievement.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-1">{achievement.title}</h3>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

