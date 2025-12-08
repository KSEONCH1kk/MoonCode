import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, Plus, Trash2, Edit2, Save, GripVertical, Video, FileText, 
  Code, HelpCircle, ChevronDown, ChevronRight, Eye, X, Check,
  BookOpen, Clock, Target, Layers
} from 'lucide-react'
import { teacherAPI } from '../api'
import type { CourseWithModules, Lesson, Exercise, TestCase } from '../api'

// Rich text editor for content with proper selection handling
function RichEditor({ value, onChange, placeholder }: { 
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Wrap selected text or insert at cursor
  const wrapSelection = (before: string, after: string, defaultText: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    
    let newText: string
    let newCursorPos: number
    
    if (selectedText) {
      // Wrap selected text
      newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
      newCursorPos = start + before.length + selectedText.length + after.length
    } else {
      // Insert with default text
      newText = value.substring(0, start) + before + defaultText + after + value.substring(end)
      newCursorPos = start + before.length + defaultText.length
    }
    
    onChange(newText)
    
    // Restore focus and set cursor position
    setTimeout(() => {
      textarea.focus()
      if (selectedText) {
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      } else {
        // Select the default text so user can replace it
        textarea.setSelectionRange(start + before.length, start + before.length + defaultText.length)
      }
    }, 0)
  }

  // Insert text at cursor
  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const newText = value.substring(0, start) + text + value.substring(start)
    onChange(newText)
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => insertAtCursor('\n## ')}
          className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded"
          title="Заголовок H2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => insertAtCursor('\n### ')}
          className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded"
          title="Подзаголовок H3"
        >
          H3
        </button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => wrapSelection('**', '**', 'жирный')}
          className="px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded"
          title="Жирный (выделите текст)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => wrapSelection('*', '*', 'курсив')}
          className="px-2 py-1 text-xs italic text-gray-600 hover:bg-gray-200 rounded"
          title="Курсив (выделите текст)"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => wrapSelection('`', '`', 'код')}
          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded font-mono bg-gray-100"
          title="Инлайн код"
        >
          `code`
        </button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => insertAtCursor('\n```javascript\n// код\n```\n')}
          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded font-mono"
          title="Блок кода"
        >
          {'</>'}
        </button>
        <button
          type="button"
          onClick={() => insertAtCursor('\n- ')}
          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
          title="Список"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => insertAtCursor('\n> ')}
          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
          title="Цитата"
        >
          "
        </button>
        <button
          type="button"
          onClick={() => wrapSelection('[', '](url)', 'ссылка')}
          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
          title="Ссылка"
        >
          🔗
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-64 px-4 py-3 text-sm font-mono resize-none focus:outline-none"
      />
    </div>
  )
}

// Test case editor
function TestCaseEditor({ testCases, onChange }: {
  testCases: TestCase[]
  onChange: (testCases: TestCase[]) => void
}) {
  const addTestCase = () => {
    onChange([
      ...testCases,
      { id: Date.now().toString(), input: '', expected_output: '', is_hidden: false }
    ])
  }

  const updateTestCase = (index: number, field: keyof TestCase, value: string | boolean) => {
    const updated = [...testCases]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const removeTestCase = (index: number) => {
    onChange(testCases.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Тест-кейсы</h4>
        <button
          type="button"
          onClick={addTestCase}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </div>

      {testCases.length === 0 && (
        <p className="text-sm text-gray-500 italic">Нет тест-кейсов. Добавьте хотя бы один.</p>
      )}

      {testCases.map((tc, index) => (
        <div key={tc.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Тест #{index + 1}</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={tc.is_hidden}
                  onChange={(e) => updateTestCase(index, 'is_hidden', e.target.checked)}
                  className="rounded"
                />
                Скрытый
              </label>
              <button
                type="button"
                onClick={() => removeTestCase(index)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Входные данные</label>
              <textarea
                value={tc.input}
                onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                placeholder="Входные данные для теста"
                className="w-full h-20 px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Ожидаемый результат</label>
              <textarea
                value={tc.expected_output}
                onChange={(e) => updateTestCase(index, 'expected_output', e.target.value)}
                placeholder="Ожидаемый вывод"
                className="w-full h-20 px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Exercise editor modal
function ExerciseEditor({ 
  exercise, 
  onSave, 
  onClose 
}: {
  exercise: Partial<Exercise> | null
  onSave: (data: Partial<Exercise>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState<Partial<Exercise>>({
    title: '',
    description: '',
    initial_code: '',
    solution_code: '',
    language: 'javascript',
    difficulty: 'easy',
    points: 10,
    test_cases: [],
    hints: [],
    ...exercise
  })

  const [activeTab, setActiveTab] = useState<'description' | 'code' | 'tests' | 'hints'>('description')

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
  ]

  const difficulties = [
    { value: 'easy', label: 'Легкий', color: 'text-green-600' },
    { value: 'medium', label: 'Средний', color: 'text-yellow-600' },
    { value: 'hard', label: 'Сложный', color: 'text-red-600' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {exercise?.id ? 'Редактировать упражнение' : 'Новое упражнение'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'description', label: 'Описание', icon: FileText },
            { id: 'code', label: 'Код', icon: Code },
            { id: 'tests', label: 'Тесты', icon: Target },
            { id: 'hints', label: 'Подсказки', icon: HelpCircle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'description' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Название упражнения"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Язык</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {languages.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Сложность</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {difficulties.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Баллы</label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание задания</label>
                <RichEditor
                  value={formData.description || ''}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Опишите задание, что нужно сделать..."
                />
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-6">
              {/* Code templates helper */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">📝 Шаблоны кода</span>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="text-sm border border-blue-300 rounded px-2 py-1"
                  >
                    {languages.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const templates: Record<string, string> = {
                        java: `public class Solution {
    public static int solve(int a, int b) {
        // Ваш код здесь
        return 0;
    }
}`,
                        javascript: `function solve(a, b) {
    // Ваш код здесь
    return 0;
}`,
                        typescript: `function solve(a: number, b: number): number {
    // Ваш код здесь
    return 0;
}`,
                        python: `def solve(a, b):
    # Ваш код здесь
    return 0`,
                        go: `package main

func solve(a, b int) int {
    // Ваш код здесь
    return 0
}`,
                        rust: `fn solve(a: i32, b: i32) -> i32 {
    // Ваш код здесь
    0
}`,
                        cpp: `#include <iostream>
using namespace std;

int solve(int a, int b) {
    // Ваш код здесь
    return 0;
}`,
                        csharp: `public class Solution {
    public static int Solve(int a, int b) {
        // Ваш код здесь
        return 0;
    }
}`,
                        kotlin: `fun solve(a: Int, b: Int): Int {
    // Ваш код здесь
    return 0
}`
                      }
                      setFormData({ ...formData, initial_code: templates[formData.language || 'javascript'] || templates.javascript })
                    }}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Функция
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const templates: Record<string, string> = {
                        java: `public class Solution {
    public static void main(String[] args) {
        // Ваш код здесь
        System.out.println("Hello, World!");
    }
}`,
                        javascript: `// Ваш код здесь
console.log("Hello, World!");`,
                        typescript: `// Ваш код здесь
console.log("Hello, World!");`,
                        python: `# Ваш код здесь
print("Hello, World!")`,
                        go: `package main

import "fmt"

func main() {
    // Ваш код здесь
    fmt.Println("Hello, World!")
}`,
                        rust: `fn main() {
    // Ваш код здесь
    println!("Hello, World!");
}`,
                        cpp: `#include <iostream>
using namespace std;

int main() {
    // Ваш код здесь
    cout << "Hello, World!" << endl;
    return 0;
}`,
                        csharp: `using System;

class Solution {
    static void Main() {
        // Ваш код здесь
        Console.WriteLine("Hello, World!");
    }
}`,
                        kotlin: `fun main() {
    // Ваш код здесь
    println("Hello, World!")
}`
                      }
                      setFormData({ ...formData, initial_code: templates[formData.language || 'javascript'] || templates.javascript })
                    }}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Hello World
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const templates: Record<string, string> = {
                        java: `import java.util.*;

public class Solution {
    public static List<Integer> solve(int[] nums, int target) {
        // Ваш код здесь
        return new ArrayList<>();
    }
}`,
                        javascript: `function solve(nums, target) {
    // Ваш код здесь
    // nums - массив чисел
    // target - целевое значение
    return [];
}`,
                        typescript: `function solve(nums: number[], target: number): number[] {
    // Ваш код здесь
    return [];
}`,
                        python: `def solve(nums: list, target: int) -> list:
    # Ваш код здесь
    # nums - список чисел
    # target - целевое значение
    return []`,
                        go: `package main

func solve(nums []int, target int) []int {
    // Ваш код здесь
    return []int{}
}`,
                        rust: `fn solve(nums: Vec<i32>, target: i32) -> Vec<i32> {
    // Ваш код здесь
    vec![]
}`,
                        cpp: `#include <vector>
using namespace std;

vector<int> solve(vector<int>& nums, int target) {
    // Ваш код здесь
    return {};
}`,
                        csharp: `using System.Collections.Generic;

public class Solution {
    public static List<int> Solve(int[] nums, int target) {
        // Ваш код здесь
        return new List<int>();
    }
}`,
                        kotlin: `fun solve(nums: IntArray, target: Int): IntArray {
    // Ваш код здесь
    // nums - массив чисел
    // target - целевое значение
    return intArrayOf()
}`
                      }
                      setFormData({ ...formData, initial_code: templates[formData.language || 'javascript'] || templates.javascript })
                    }}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Массив
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    📋 Начальный код (шаблон для студента)
                  </label>
                  <span className="text-xs text-gray-400">Этот код увидит студент при старте</span>
                </div>
                <textarea
                  value={formData.initial_code}
                  onChange={(e) => setFormData({ ...formData, initial_code: e.target.value })}
                  placeholder="// Напишите начальный код, который увидит студент..."
                  className="w-full h-56 px-4 py-3 text-sm font-mono border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    ✅ Эталонное решение (не видно студентам)
                  </label>
                  <span className="text-xs text-gray-400">Используется для проверки правильности</span>
                </div>
                <textarea
                  value={formData.solution_code}
                  onChange={(e) => setFormData({ ...formData, solution_code: e.target.value })}
                  placeholder="// Напишите правильное решение..."
                  className="w-full h-56 px-4 py-3 text-sm font-mono border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100"
                />
              </div>

              {/* Validation */}
              {(!formData.initial_code || !formData.solution_code) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                  ⚠️ Заполните оба поля: начальный код и эталонное решение
                </div>
              )}
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="space-y-4">
              {/* Tests explanation */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">📊 Как работают тесты</h4>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• <strong>Входные данные</strong> — передаются в программу студента (stdin или аргументы)</li>
                  <li>• <strong>Ожидаемый результат</strong> — то, что должна вернуть/вывести программа</li>
                  <li>• <strong>Скрытые тесты</strong> — не показываются студентам, используются для финальной проверки</li>
                </ul>
              </div>

              <TestCaseEditor
                testCases={(formData.test_cases as TestCase[]) || []}
                onChange={(test_cases) => setFormData({ ...formData, test_cases })}
              />

              {/* Validation */}
              {((formData.test_cases as TestCase[]) || []).length === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  ❌ Добавьте хотя бы один тест-кейс для проверки решений
                </div>
              )}
              {((formData.test_cases as TestCase[]) || []).length > 0 && 
               ((formData.test_cases as TestCase[]) || []).every(t => !t.is_hidden) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                  💡 Рекомендуется добавить хотя бы один скрытый тест для предотвращения хардкода
                </div>
              )}
            </div>
          )}

          {activeTab === 'hints' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">Подсказки</h4>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    hints: [...(formData.hints || []), '']
                  })}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" /> Добавить подсказку
                </button>
              </div>

              {(formData.hints || []).length === 0 && (
                <p className="text-sm text-gray-500 italic">Нет подсказок. Они помогут студентам, если застрянут.</p>
              )}

              {(formData.hints || []).map((hint, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Подсказка #{index + 1}</label>
                    <textarea
                      value={hint}
                      onChange={(e) => {
                        const hints = [...(formData.hints || [])]
                        hints[index] = e.target.value
                        setFormData({ ...formData, hints })
                      }}
                      placeholder="Текст подсказки..."
                      className="w-full h-20 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const hints = (formData.hints || []).filter((_, i) => i !== index)
                      setFormData({ ...formData, hints })
                    }}
                    className="mt-6 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Validation Summary */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <span className="font-medium text-gray-600">Готовность:</span>
            <span className={formData.title ? 'text-green-600' : 'text-red-500'}>
              {formData.title ? '✓' : '✗'} Название
            </span>
            <span className={formData.description ? 'text-green-600' : 'text-gray-400'}>
              {formData.description ? '✓' : '○'} Описание
            </span>
            <span className={formData.initial_code ? 'text-green-600' : 'text-red-500'}>
              {formData.initial_code ? '✓' : '✗'} Шаблон
            </span>
            <span className={formData.solution_code ? 'text-green-600' : 'text-gray-400'}>
              {formData.solution_code ? '✓' : '○'} Решение
            </span>
            <span className={((formData.test_cases as TestCase[]) || []).length > 0 ? 'text-green-600' : 'text-red-500'}>
              {((formData.test_cases as TestCase[]) || []).length > 0 ? '✓' : '✗'} Тесты ({((formData.test_cases as TestCase[]) || []).length})
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Отмена
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.title || !formData.initial_code || ((formData.test_cases as TestCase[]) || []).length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}

// Lesson editor modal
function LessonEditorModal({
  lesson,
  onSave,
  onClose
}: {
  lesson: Partial<Lesson> | null
  onSave: (data: Partial<Lesson>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState<Partial<Lesson>>({
    title: '',
    type: 'theory',
    content: '',
    video_url: '',
    duration_minutes: 10,
    is_free: false,
    ...lesson
  })
  const [attachments, setAttachments] = useState<any[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  
  // Quiz questions state
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    id: string
    question: string
    options: string[]
    correct: number
  }>>([])
  
  // Load quiz questions when editing a quiz lesson
  useEffect(() => {
    if (formData.type === 'quiz' && lesson?.content) {
      try {
        const parsed = JSON.parse(lesson.content)
        if (Array.isArray(parsed)) {
          setQuizQuestions(parsed)
        }
      } catch (e) {
        // If not JSON, treat as empty
        setQuizQuestions([])
      }
    } else if (formData.type === 'quiz' && !lesson?.content) {
      setQuizQuestions([])
    }
  }, [formData.type, lesson?.content])

  // Load existing attachments when editing a lesson
  useEffect(() => {
    if (lesson?.id) {
      loadAttachments()
    }
  }, [lesson?.id])

  const loadAttachments = async () => {
    if (!lesson?.id) return
    setLoadingAttachments(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:3001/api/upload/attachments/${lesson.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setAttachments(data || [])
    } catch (err) {
      console.error('Failed to load attachments:', err)
    }
    setLoadingAttachments(false)
  }

  const deleteAttachment = async (attachmentId: string) => {
    if (!confirm('Удалить этот файл?')) return
    try {
      const token = localStorage.getItem('token')
      await fetch(`http://localhost:3001/api/upload/attachment/${attachmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setAttachments(attachments.filter(a => a.id !== attachmentId))
    } catch (err) {
      console.error('Failed to delete attachment:', err)
    }
  }

  const lessonTypes = [
    { value: 'theory', label: 'Теория', icon: FileText },
    { value: 'video', label: 'Видео', icon: Video },
    { value: 'practice', label: 'Практика', icon: Code },
    { value: 'quiz', label: 'Тест', icon: HelpCircle },
    { value: 'project', label: 'Проект', icon: Layers },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {lesson?.id ? 'Редактировать урок' : 'Новый урок'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название урока</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Введение в JavaScript"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Тип урока</label>
            <div className="grid grid-cols-5 gap-2">
              {lessonTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value as Lesson['type'] })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <type.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {formData.type === 'video' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Видео</label>
              <div className="space-y-3">
                {/* File upload */}
                <div className="flex items-center gap-3">
                  <label className="flex-1">
                    <div className="px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/ogg,video/quicktime"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const formDataUpload = new FormData()
                            formDataUpload.append('video', file)
                            
                            try {
                              const token = localStorage.getItem('token')
                              const res = await fetch('http://localhost:3001/api/upload/video', {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}` },
                                body: formDataUpload
                              })
                              const data = await res.json()
                              if (data.url) {
                                setFormData({ ...formData, video_url: `http://localhost:3001${data.url}` })
                              }
                            } catch (err) {
                              console.error('Upload error:', err)
                            }
                          }
                        }}
                      />
                      <span className="text-gray-600">📁 Загрузить видео файл (до 500 MB)</span>
                    </div>
                  </label>
                </div>
                
                {/* Or URL */}
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm">или</span>
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=... или прямая ссылка"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Preview */}
                {formData.video_url && (
                  <div className="text-sm text-green-600 flex items-center gap-2">
                    ✓ Видео: {formData.video_url.split('/').pop()?.substring(0, 40)}...
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Длительность (минут)</label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_free}
                  onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                  className="rounded"
                />
                Бесплатный урок (превью)
              </label>
            </div>
          </div>

          {/* Practice lesson notice */}
          {formData.type === 'practice' && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="text-3xl">💻</div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Практическое задание</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    После сохранения урока нажмите кнопку <strong>"+ Упражнение"</strong> рядом с уроком, 
                    чтобы настроить полную конфигурацию практики:
                  </p>
                  <ul className="text-sm text-blue-600 space-y-1 mb-3">
                    <li>📝 <strong>Описание задания</strong> — что нужно сделать</li>
                    <li>📋 <strong>Шаблон кода</strong> — начальный код для студента</li>
                    <li>✅ <strong>Эталонное решение</strong> — правильный ответ</li>
                    <li>🧪 <strong>Тест-кейсы</strong> — данные для автопроверки</li>
                    <li>💡 <strong>Подсказки</strong> — помощь для студентов</li>
                    <li>⚙️ <strong>Язык, сложность, баллы</strong></li>
                  </ul>
                  <div className="text-xs text-blue-500">
                    Без настройки упражнения студенты увидят пустую практику!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quiz questions editor */}
          {formData.type === 'quiz' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Вопросы теста</label>
                  <p className="text-xs text-gray-500">Добавьте вопросы с вариантами ответов</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQuizQuestions([
                      ...quizQuestions,
                      {
                        id: Date.now().toString(),
                        question: '',
                        options: ['', '', '', ''],
                        correct: 0
                      }
                    ])
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Добавить вопрос
                </button>
              </div>

              {quizQuestions.length === 0 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium text-gray-500 mb-1">Нет вопросов</p>
                  <p className="text-xs text-gray-400 mb-4">Добавьте хотя бы один вопрос для теста</p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuizQuestions([
                        {
                          id: Date.now().toString(),
                          question: '',
                          options: ['', '', '', ''],
                          correct: 0
                        }
                      ])
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    Создать первый вопрос
                  </button>
                </div>
              )}

              {quizQuestions.map((q, qIndex) => (
                <div key={q.id} className="border-2 border-gray-200 rounded-xl p-5 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">
                        {qIndex + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-700">Вопрос #{qIndex + 1}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setQuizQuestions(quizQuestions.filter((_, i) => i !== qIndex))
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Текст вопроса</label>
                    <textarea
                      value={q.question}
                      onChange={(e) => {
                        const updated = [...quizQuestions]
                        updated[qIndex].question = e.target.value
                        setQuizQuestions(updated)
                      }}
                      placeholder="Введите вопрос..."
                      className="w-full h-20 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-500 mb-2">Варианты ответов</label>
                    {q.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correct === oIndex}
                          onChange={() => {
                            const updated = [...quizQuestions]
                            updated[qIndex].correct = oIndex
                            setQuizQuestions(updated)
                          }}
                          className="w-4 h-4 text-orange-600"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const updated = [...quizQuestions]
                            updated[qIndex].options[oIndex] = e.target.value
                            setQuizQuestions(updated)
                          }}
                          placeholder={`Вариант ${oIndex + 1}`}
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        {q.correct === oIndex && (
                          <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
                            ✓ Правильный
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Content editor (not for quiz) */}
          {formData.type !== 'quiz' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.type === 'practice' ? 'Теоретическое введение (опционально)' : 'Содержание урока'}
              </label>
              <RichEditor
                value={formData.content || ''}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder={formData.type === 'practice' 
                  ? "Краткое теоретическое введение перед практикой (опционально)..." 
                  : "Содержание урока в формате Markdown..."}
              />
            </div>
          )}

          {/* File attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📁 Материалы урока</label>
            
            {/* Existing attachments */}
            {loadingAttachments ? (
              <div className="text-sm text-gray-500 mb-3">Загрузка файлов...</div>
            ) : attachments.length > 0 && (
              <div className="space-y-2 mb-4">
                {attachments.map(file => {
                  const formatSize = (bytes: number) => {
                    if (bytes < 1024) return `${bytes} B`
                    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
                    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
                  }
                  
                  const getFileIcon = (mimetype: string) => {
                    if (mimetype?.includes('pdf')) return '📕'
                    if (mimetype?.includes('word') || mimetype?.includes('document')) return '📘'
                    if (mimetype?.includes('sheet') || mimetype?.includes('excel')) return '📗'
                    if (mimetype?.includes('image')) return '🖼️'
                    if (mimetype?.includes('zip') || mimetype?.includes('rar')) return '📦'
                    if (mimetype?.includes('video')) return '🎬'
                    return '📄'
                  }
                  
                  return (
                    <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg group">
                      <span className="text-xl">{getFileIcon(file.mimetype)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{file.original_name}</div>
                        <div className="text-xs text-gray-500">{formatSize(file.size)}</div>
                      </div>
                      <a 
                        href={`http://localhost:3001${file.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Скачать
                      </a>
                      <button
                        onClick={() => deleteAttachment(file.id)}
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Удалить
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            
            {/* Upload new files */}
            <div className="space-y-3">
              <label className="block">
                <div className="px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.jpg,.jpeg,.png,.gif,.txt,.md,.csv,.json"
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files
                      if (files && files.length > 0) {
                        const uploadFormData = new FormData()
                        for (let i = 0; i < files.length; i++) {
                          uploadFormData.append('files', files[i])
                        }
                        if (lesson?.id) {
                          uploadFormData.append('lesson_id', lesson.id)
                        }
                        
                        try {
                          const token = localStorage.getItem('token')
                          const res = await fetch('http://localhost:3001/api/upload/attachments', {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` },
                            body: uploadFormData
                          })
                          const data = await res.json()
                          if (data.success) {
                            // Reload attachments to show new files
                            loadAttachments()
                          }
                        } catch (err) {
                          console.error('Upload error:', err)
                        }
                      }
                    }}
                  />
                  <span className="text-gray-600">📎 Добавить файлы (PDF, DOC, ZIP, изображения, до 50 MB)</span>
                </div>
              </label>
              {!lesson?.id && (
                <p className="text-xs text-amber-600">
                  ⚠️ Сохраните урок, чтобы добавить файлы
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Отмена
          </button>
          <button
            onClick={() => {
              // For quiz type, save questions as JSON in content
              if (formData.type === 'quiz') {
                const dataToSave = {
                  ...formData,
                  content: JSON.stringify(quizQuestions)
                }
                onSave(dataToSave)
              } else {
                onSave(formData)
              }
            }}
            disabled={formData.type === 'quiz' && quizQuestions.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}

// Main Course Structure Editor Page
export function CourseStructureEditorPage() {
  const { courseId } = useParams()
  
  const [course, setCourse] = useState<CourseWithModules | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  
  // Modal states
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lesson: Partial<Lesson> | null } | null>(null)
  const [editingExercise, setEditingExercise] = useState<{ lessonId: string; exercise: Partial<Exercise> | null } | null>(null)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [showNewModule, setShowNewModule] = useState(false)

  useEffect(() => {
    if (courseId) {
      loadCourse()
    }
  }, [courseId])

  const loadCourse = async () => {
    try {
      const data = await teacherAPI.getCourse(courseId!)
      setCourse(data)
      // Expand all modules by default
      setExpandedModules(new Set(data.modules.map(m => m.id)))
    } catch (error) {
      console.error('Failed to load course:', error)
    }
    setLoading(false)
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }

  const handleCreateModule = async () => {
    if (!newModuleTitle.trim() || !course) return
    
    try {
      const newModule = await teacherAPI.createModule(course.id, {
        title: newModuleTitle,
        order_index: course.modules.length
      })
      
      setCourse({
        ...course,
        modules: [...course.modules, { ...newModule, lessons: [] }]
      })
      setNewModuleTitle('')
      setShowNewModule(false)
      setExpandedModules(prev => new Set([...prev, newModule.id]))
    } catch (error) {
      console.error('Failed to create module:', error)
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Удалить модуль и все его уроки?')) return
    
    try {
      await teacherAPI.deleteModule(moduleId)
      setCourse({
        ...course!,
        modules: course!.modules.filter(m => m.id !== moduleId)
      })
    } catch (error) {
      console.error('Failed to delete module:', error)
    }
  }

  const handleSaveLesson = async (data: Partial<Lesson>) => {
    if (!editingLesson || !course) return
    
    try {
      if (editingLesson.lesson?.id) {
        // Update existing lesson
        const updated = await teacherAPI.updateLesson(editingLesson.lesson.id, data)
        setCourse({
          ...course,
          modules: course.modules.map(m => ({
            ...m,
            lessons: m.lessons.map(l => l.id === updated.id ? { ...l, ...updated } : l)
          }))
        })
      } else {
        // Create new lesson
        const newLesson = await teacherAPI.createLesson(editingLesson.moduleId, {
          ...data,
          order_index: course.modules.find(m => m.id === editingLesson.moduleId)?.lessons.length || 0
        })
        setCourse({
          ...course,
          modules: course.modules.map(m => 
            m.id === editingLesson.moduleId 
              ? { ...m, lessons: [...m.lessons, newLesson] }
              : m
          )
        })
      }
      setEditingLesson(null)
    } catch (error) {
      console.error('Failed to save lesson:', error)
    }
  }

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm('Удалить урок?')) return
    
    try {
      await teacherAPI.deleteLesson(lessonId)
      setCourse({
        ...course!,
        modules: course!.modules.map(m => 
          m.id === moduleId
            ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
            : m
        )
      })
    } catch (error) {
      console.error('Failed to delete lesson:', error)
    }
  }

  const handleSaveExercise = async (data: Partial<Exercise>) => {
    if (!editingExercise || !course) return
    
    try {
      if (editingExercise.exercise?.id) {
        // Update existing exercise
        const updated = await teacherAPI.updateExercise(editingExercise.exercise.id, data)
        setCourse({
          ...course,
          modules: course.modules.map(m => ({
            ...m,
            lessons: m.lessons.map(l => 
              l.id === editingExercise.lessonId 
                ? { ...l, exercise: updated }
                : l
            )
          }))
        })
      } else {
        // Create new exercise
        const newExercise = await teacherAPI.createExercise(editingExercise.lessonId, data)
        setCourse({
          ...course,
          modules: course.modules.map(m => ({
            ...m,
            lessons: m.lessons.map(l =>
              l.id === editingExercise.lessonId
                ? { ...l, exercise: newExercise }
                : l
            )
          }))
        })
      }
      setEditingExercise(null)
    } catch (error) {
      console.error('Failed to save exercise:', error)
    }
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />
      case 'practice': return <Code className="w-4 h-4" />
      case 'quiz': return <HelpCircle className="w-4 h-4" />
      case 'project': return <Layers className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-2">Курс не найден</h2>
          <Link to="/teacher/courses" className="text-blue-600 hover:text-blue-700">
            Вернуться к курсам
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/teacher/courses" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-medium text-gray-900">{course.title}</h1>
              <p className="text-sm text-gray-500">Редактор курса</p>
            </div>
            <Link
              to={`/courses/${course.slug}`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Eye className="w-4 h-4" />
              Превью
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-medium text-gray-900 mb-4">О курсе</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Модулей</span>
                  <span className="font-medium">{course.modules.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Уроков</span>
                  <span className="font-medium">
                    {course.modules.reduce((sum, m) => sum + m.lessons.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Упражнений</span>
                  <span className="font-medium">
                    {course.modules.reduce((sum, m) => 
                      sum + m.lessons.filter(l => l.exercise).length, 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Статус</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    course.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {course.is_published ? 'Опубликован' : 'Черновик'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
              <h3 className="font-medium text-blue-900 mb-2">💡 Советы</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Добавляйте теорию перед практикой</li>
                <li>• Включайте видео для сложных тем</li>
                <li>• Создавайте тест-кейсы для проверки</li>
                <li>• Добавляйте подсказки в упражнения</li>
              </ul>
            </div>
          </div>

          {/* Modules & Lessons */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Структура курса</h2>
              <button
                onClick={() => setShowNewModule(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Добавить модуль
              </button>
            </div>

            {/* New Module Input */}
            {showNewModule && (
              <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    placeholder="Название модуля..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleCreateModule}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setShowNewModule(false); setNewModuleTitle(''); }}
                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Modules List */}
            {course.modules.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Нет модулей</h3>
                <p className="text-gray-500 mb-4">Добавьте первый модуль для начала работы</p>
                <button
                  onClick={() => setShowNewModule(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Добавить модуль
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {course.modules.map((module, moduleIndex) => (
                  <div key={module.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {/* Module Header */}
                    <div 
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleModule(module.id)}
                    >
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      {expandedModules.has(module.id) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          Модуль {moduleIndex + 1}: {module.title}
                        </h3>
                        <p className="text-sm text-gray-500">{module.lessons.length} уроков</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); }}
                        className="p-2 text-gray-400 hover:text-red-500 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Module Lessons */}
                    {expandedModules.has(module.id) && (
                      <div className="border-t border-gray-200">
                        {module.lessons.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            Нет уроков. Добавьте первый урок.
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 pl-12 hover:bg-gray-50">
                                <GripVertical className="w-4 h-4 text-gray-300" />
                                <div className={`p-1.5 rounded ${
                                  lesson.type === 'practice' ? 'bg-blue-100 text-blue-600' :
                                  lesson.type === 'video' ? 'bg-purple-100 text-purple-600' :
                                  lesson.type === 'quiz' ? 'bg-orange-100 text-orange-600' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {getLessonIcon(lesson.type)}
                                </div>
                                <div className="flex-1">
                                  <span className="text-sm text-gray-900">
                                    {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                                  </span>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    {lesson.duration_minutes} мин
                                    {lesson.is_free && (
                                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Бесплатно</span>
                                    )}
                                    {lesson.exercise && (
                                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Упражнение</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {lesson.type === 'practice' && !lesson.exercise && (
                                    <button
                                      onClick={() => setEditingExercise({ lessonId: lesson.id, exercise: null })}
                                      className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded text-xs font-medium animate-pulse"
                                      title="⚠️ Добавить упражнение (обязательно!)"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Упражнение
                                    </button>
                                  )}
                                  {lesson.exercise && (
                                    <button
                                      onClick={() => setEditingExercise({ lessonId: lesson.id, exercise: lesson.exercise || null })}
                                      className="p-2 text-blue-500 hover:text-blue-600 rounded"
                                      title="Редактировать упражнение"
                                    >
                                      <Code className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setEditingLesson({ moduleId: module.id, lesson })}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLesson(module.id, lesson.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Lesson Button */}
                        <div className="p-3 border-t border-gray-100 bg-gray-50">
                          <button
                            onClick={() => setEditingLesson({ moduleId: module.id, lesson: null })}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Plus className="w-4 h-4" />
                            Добавить урок
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {editingLesson && (
        <LessonEditorModal
          lesson={editingLesson.lesson}
          onSave={handleSaveLesson}
          onClose={() => setEditingLesson(null)}
        />
      )}

      {editingExercise && (
        <ExerciseEditor
          exercise={editingExercise.exercise}
          onSave={handleSaveExercise}
          onClose={() => setEditingExercise(null)}
        />
      )}
    </div>
  )
}

export default CourseStructureEditorPage

