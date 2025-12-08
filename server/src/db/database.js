import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import schema from './schema.js'
import { runMigrations } from './migrations.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize database
const dbPath = join(__dirname, '../../data/school.db')
const db = new Database(dbPath)

// Enable foreign keys
db.pragma('foreign_keys = ON')

// Initialize schema
db.exec(schema)

// Run migrations for existing databases
runMigrations(db)

console.log('✅ Database initialized at:', dbPath)

export default db

