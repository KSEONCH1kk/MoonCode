import db from './database.js'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'

console.log('🌱 Seeding database...')

// Hash password
const hashPassword = (password) => bcrypt.hashSync(password, 10)

// Clear existing data
db.exec(`
  DELETE FROM user_achievements;
  DELETE FROM achievements;
  DELETE FROM activity_log;
  DELETE FROM transactions;
  DELETE FROM notifications;
  DELETE FROM chat_participants;
  DELETE FROM messages;
  DELETE FROM chats;
  DELETE FROM reviews;
  DELETE FROM submissions;
  DELETE FROM lesson_progress;
  DELETE FROM enrollments;
  DELETE FROM exercises;
  DELETE FROM lessons;
  DELETE FROM modules;
  DELETE FROM courses;
  DELETE FROM users;
`)

// Create users
const users = [
  {
    id: uuid(),
    email: 'admin@mooncode.io',
    password: hashPassword('admin123'),
    name: 'Администратор',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  },
  {
    id: uuid(),
    email: 'teacher@mooncode.io',
    password: hashPassword('teacher123'),
    name: 'Иван Петров',
    role: 'teacher',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher',
    bio: 'Senior Developer с 10-летним опытом. Специализация: Java, Python, архитектура.',
    github: 'ivanpetrov',
  },
  {
    id: uuid(),
    email: 'teacher2@hexlet.io',
    password: hashPassword('teacher123'),
    name: 'Мария Сидорова',
    role: 'teacher',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
    bio: 'Frontend Developer. React, TypeScript, UI/UX.',
    github: 'mariasidorova',
  },
  {
    id: uuid(),
    email: 'student@mooncode.io',
    password: hashPassword('student123'),
    name: 'Алексей Иванов',
    role: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student',
  },
  {
    id: uuid(),
    email: 'demo@mooncode.io',
    password: hashPassword('demo123'),
    name: 'Demo User',
    role: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
  },
]

const insertUser = db.prepare(`
  INSERT INTO users (id, email, password, name, role, avatar, bio, github)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

for (const user of users) {
  insertUser.run(user.id, user.email, user.password, user.name, user.role, user.avatar, user.bio || null, user.github || null)
}

const adminId = users[0].id
const teacherId = users[1].id
const teacher2Id = users[2].id
const studentId = users[3].id
const demoId = users[4].id

// Create courses
const courses = [
  {
    id: uuid(),
    title: 'Java для начинающих',
    slug: 'java-basics',
    description: 'Полный курс по основам Java. Вы изучите синтаксис, ООП, коллекции и многое другое.',
    short_description: 'Изучите основы Java с нуля',
    image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
    price: 0,
    duration_hours: 40,
    level: 'beginner',
    category: 'Программирование',
    tags: JSON.stringify(['java', 'ооп', 'backend']),
    is_published: 1,
    is_free: 1,
    teacher_id: teacherId,
  },
  {
    id: uuid(),
    title: 'Python с нуля',
    slug: 'python-basics',
    description: 'Курс по Python для начинающих программистов.',
    short_description: 'Освойте Python за 30 дней',
    image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    price: 4990,
    duration_hours: 30,
    level: 'beginner',
    category: 'Программирование',
    tags: JSON.stringify(['python', 'backend', 'data science']),
    is_published: 1,
    is_free: 0,
    teacher_id: teacherId,
  },
  {
    id: uuid(),
    title: 'React + TypeScript',
    slug: 'react-typescript',
    description: 'Современная frontend-разработка на React с TypeScript.',
    short_description: 'Станьте frontend-разработчиком',
    image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
    price: 7990,
    duration_hours: 50,
    level: 'intermediate',
    category: 'Frontend',
    tags: JSON.stringify(['react', 'typescript', 'frontend']),
    is_published: 1,
    is_free: 0,
    teacher_id: teacher2Id,
  },
  {
    id: uuid(),
    title: 'DevOps и CI/CD',
    slug: 'devops-cicd',
    description: 'Автоматизация развертывания, Docker, Kubernetes, GitHub Actions.',
    short_description: 'Освойте DevOps практики',
    image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
    price: 9990,
    duration_hours: 35,
    level: 'advanced',
    category: 'DevOps',
    tags: JSON.stringify(['devops', 'docker', 'kubernetes', 'ci/cd']),
    is_published: 1,
    is_free: 0,
    teacher_id: teacherId,
  },
]

const insertCourse = db.prepare(`
  INSERT INTO courses (id, title, slug, description, short_description, image, price, duration_hours, level, category, tags, is_published, is_free, teacher_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

for (const course of courses) {
  insertCourse.run(
    course.id, course.title, course.slug, course.description, course.short_description,
    course.image, course.price, course.duration_hours, course.level, course.category,
    course.tags, course.is_published, course.is_free, course.teacher_id
  )
}

const javaCourseId = courses[0].id

// Create modules for Java course
const modules = [
  { id: uuid(), course_id: javaCourseId, title: 'Введение в Java', description: 'Знакомство с языком Java', order_index: 0 },
  { id: uuid(), course_id: javaCourseId, title: 'Переменные и типы данных', description: 'Основы работы с данными', order_index: 1 },
  { id: uuid(), course_id: javaCourseId, title: 'Управляющие конструкции', description: 'Условия и циклы', order_index: 2 },
  { id: uuid(), course_id: javaCourseId, title: 'Методы и функции', description: 'Создание и использование методов', order_index: 3 },
  { id: uuid(), course_id: javaCourseId, title: 'ООП в Java', description: 'Объектно-ориентированное программирование', order_index: 4 },
]

const insertModule = db.prepare(`
  INSERT INTO modules (id, course_id, title, description, order_index)
  VALUES (?, ?, ?, ?, ?)
`)

for (const module of modules) {
  insertModule.run(module.id, module.course_id, module.title, module.description, module.order_index)
}

// Create lessons
const lessons = [
  // Module 1
  { id: uuid(), module_id: modules[0].id, title: 'Что такое Java?', type: 'theory', order_index: 0, content: '# Введение в Java\n\nJava — это объектно-ориентированный язык программирования...' },
  { id: uuid(), module_id: modules[0].id, title: 'Установка JDK', type: 'video', order_index: 1, video_url: 'https://youtube.com/watch?v=example', duration_minutes: 15 },
  { id: uuid(), module_id: modules[0].id, title: 'Первая программа', type: 'practice', order_index: 2 },
  { id: uuid(), module_id: modules[0].id, title: 'Тест: Основы', type: 'quiz', order_index: 3 },
  // Module 2
  { id: uuid(), module_id: modules[1].id, title: 'Типы данных в Java', type: 'theory', order_index: 0, content: '# Типы данных\n\nВ Java есть примитивные и ссылочные типы...' },
  { id: uuid(), module_id: modules[1].id, title: 'Переменные и константы', type: 'theory', order_index: 1 },
  { id: uuid(), module_id: modules[1].id, title: 'Практика: Переменные', type: 'practice', order_index: 2 },
  // Module 3
  { id: uuid(), module_id: modules[2].id, title: 'Условные операторы', type: 'theory', order_index: 0 },
  { id: uuid(), module_id: modules[2].id, title: 'Циклы for и while', type: 'theory', order_index: 1 },
  { id: uuid(), module_id: modules[2].id, title: 'Практика: Циклы', type: 'practice', order_index: 2 },
]

const insertLesson = db.prepare(`
  INSERT INTO lessons (id, module_id, title, type, order_index, content, video_url, duration_minutes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

for (const lesson of lessons) {
  insertLesson.run(
    lesson.id, lesson.module_id, lesson.title, lesson.type, lesson.order_index,
    lesson.content || null, lesson.video_url || null, lesson.duration_minutes || 0
  )
}

// Create exercises
const exercises = [
  {
    id: uuid(),
    lesson_id: lessons[2].id, // Первая программа
    title: 'Hello World',
    description: 'Напишите программу, которая выводит "Hello, World!"',
    initial_code: 'public class Solution {\n    public static void main(String[] args) {\n        // Ваш код здесь\n    }\n}',
    solution_code: 'public class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
    language: 'java',
    test_cases: JSON.stringify([
      { input: '', expected: 'Hello, World!' }
    ]),
    hints: JSON.stringify(['Используйте System.out.println()', 'Не забудьте кавычки вокруг текста']),
    difficulty: 'easy',
    points: 10,
  },
  {
    id: uuid(),
    lesson_id: lessons[6].id, // Практика: Переменные
    title: 'Сумма чисел',
    description: 'Реализуйте метод sum(int a, int b), который возвращает сумму двух чисел.',
    initial_code: 'public class Solution {\n    public static int sum(int a, int b) {\n        // Ваш код здесь\n        return 0;\n    }\n}',
    solution_code: 'public class Solution {\n    public static int sum(int a, int b) {\n        return a + b;\n    }\n}',
    language: 'java',
    test_cases: JSON.stringify([
      { input: '1 2', expected: '3' },
      { input: '-1 1', expected: '0' },
      { input: '100 200', expected: '300' },
    ]),
    hints: JSON.stringify(['Используйте оператор +', 'Не забудьте return']),
    difficulty: 'easy',
    points: 10,
  },
  {
    id: uuid(),
    lesson_id: lessons[9].id, // Практика: Циклы
    title: 'Сумма от 1 до N',
    description: 'Реализуйте метод sumToN(int n), который возвращает сумму чисел от 1 до n.',
    initial_code: 'public class Solution {\n    public static int sumToN(int n) {\n        // Ваш код здесь\n        return 0;\n    }\n}',
    solution_code: 'public class Solution {\n    public static int sumToN(int n) {\n        int sum = 0;\n        for (int i = 1; i <= n; i++) {\n            sum += i;\n        }\n        return sum;\n    }\n}',
    language: 'java',
    test_cases: JSON.stringify([
      { input: '5', expected: '15' },
      { input: '10', expected: '55' },
      { input: '1', expected: '1' },
    ]),
    hints: JSON.stringify(['Используйте цикл for', 'Накапливайте сумму в переменной']),
    difficulty: 'medium',
    points: 20,
  },
]

const insertExercise = db.prepare(`
  INSERT INTO exercises (id, lesson_id, title, description, initial_code, solution_code, language, test_cases, hints, difficulty, points)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

for (const ex of exercises) {
  insertExercise.run(
    ex.id, ex.lesson_id, ex.title, ex.description, ex.initial_code, ex.solution_code,
    ex.language, ex.test_cases, ex.hints, ex.difficulty, ex.points
  )
}

// Enroll demo user in Java course
const insertEnrollment = db.prepare(`
  INSERT INTO enrollments (id, user_id, course_id, progress, status)
  VALUES (?, ?, ?, ?, ?)
`)
insertEnrollment.run(uuid(), demoId, javaCourseId, 25, 'active')
insertEnrollment.run(uuid(), studentId, javaCourseId, 60, 'active')

// Create a chat between student and teacher
const chatId = uuid()
const insertChat = db.prepare(`INSERT INTO chats (id, type, name) VALUES (?, ?, ?)`)
insertChat.run(chatId, 'direct', null)

const insertParticipant = db.prepare(`INSERT INTO chat_participants (id, chat_id, user_id, role) VALUES (?, ?, ?, ?)`)
insertParticipant.run(uuid(), chatId, studentId, 'member')
insertParticipant.run(uuid(), chatId, teacherId, 'member')

// Add some messages
const insertMessage = db.prepare(`INSERT INTO messages (id, chat_id, sender_id, content, message_type) VALUES (?, ?, ?, ?, ?)`)
insertMessage.run(uuid(), chatId, studentId, 'Здравствуйте! У меня вопрос по домашнему заданию.', 'text')
insertMessage.run(uuid(), chatId, teacherId, 'Добрый день! Слушаю вас.', 'text')
insertMessage.run(uuid(), chatId, studentId, 'Не могу понять, как работает метод sum().', 'text')
insertMessage.run(uuid(), chatId, teacherId, 'Метод sum принимает два аргумента и возвращает их сумму. Вот пример:', 'text')
insertMessage.run(uuid(), chatId, teacherId, 'public static int sum(int a, int b) {\n    return a + b;\n}', 'code')

// Create achievements
const achievements = [
  { id: uuid(), name: 'Первые шаги', description: 'Завершите первый урок', icon: '🎯', points: 10, condition_type: 'lessons_completed', condition_value: 1 },
  { id: uuid(), name: 'Начинающий', description: 'Завершите 5 уроков', icon: '📚', points: 50, condition_type: 'lessons_completed', condition_value: 5 },
  { id: uuid(), name: 'Программист', description: 'Решите 10 задач', icon: '💻', points: 100, condition_type: 'exercises_solved', condition_value: 10 },
  { id: uuid(), name: 'Отличник', description: 'Получите 100 баллов', icon: '⭐', points: 200, condition_type: 'total_points', condition_value: 100 },
]

const insertAchievement = db.prepare(`
  INSERT INTO achievements (id, name, description, icon, points, condition_type, condition_value)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)

for (const ach of achievements) {
  insertAchievement.run(ach.id, ach.name, ach.description, ach.icon, ach.points, ach.condition_type, ach.condition_value)
}

console.log('✅ Database seeded successfully!')
console.log('')
console.log('📧 Test accounts:')
console.log('   Admin:   admin@mooncode.io / admin123')
console.log('   Teacher: teacher@mooncode.io / teacher123')
console.log('   Student: student@mooncode.io / student123')
console.log('   Demo:    demo@mooncode.io / demo123')

