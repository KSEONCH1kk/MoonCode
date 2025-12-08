// Database migrations
// Run this to update existing databases with new schema changes

export function runMigrations(db) {
  try {
    db.pragma('foreign_keys = OFF') // Temporarily disable foreign key checks

    // Check if oauth_provider column exists
    const tableInfo = db.prepare("PRAGMA table_info(users)").all()
    const hasOauthProvider = tableInfo.some(col => col.name === 'oauth_provider')
    const hasOauthId = tableInfo.some(col => col.name === 'oauth_id')
    const passwordColumn = tableInfo.find(col => col.name === 'password')
    const passwordIsNullable = passwordColumn && !passwordColumn.notnull

    let needsMigration = false

    // Check if we need to make password nullable
    if (passwordColumn && passwordColumn.notnull) {
      console.log('🔄 Running migration: Making password column nullable for OAuth users...')
      needsMigration = true
      
      // Check if migration was partially completed
      const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND (name='users' OR name='users_new')
      `).all()
      const tableNames = tables.map(t => t.name)
      
      // If users_new exists but users doesn't, migration was interrupted during rename
      if (tableNames.includes('users_new') && !tableNames.includes('users')) {
        console.log('🔄 Resuming interrupted migration...')
        db.prepare('ALTER TABLE users_new RENAME TO users').run()
        console.log('✅ Restored users table from interrupted migration')
      } else {
        // Clean up any leftover temporary table from previous failed migration
        if (tableNames.includes('users_new')) {
          try {
            db.prepare('DROP TABLE users_new').run()
            console.log('🧹 Cleaned up leftover temporary table')
          } catch (e) {
            console.warn('Warning cleaning up users_new:', e.message)
          }
        }
        
        // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
        db.exec(`
        -- Create temporary table with new schema
        CREATE TABLE users_new (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT,
          name TEXT NOT NULL,
          avatar TEXT,
          role TEXT DEFAULT 'student' CHECK(role IN ('student', 'teacher', 'admin')),
          bio TEXT,
          github TEXT,
          telegram TEXT,
          oauth_provider TEXT,
          oauth_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME,
          is_active INTEGER DEFAULT 1
        );

        -- Copy data from old table
        INSERT INTO users_new 
        SELECT id, email, password, name, avatar, role, bio, github, telegram, 
               NULL as oauth_provider, NULL as oauth_id, 
               created_at, updated_at, last_login, is_active
        FROM users;

        -- Drop old table
        DROP TABLE users;

        -- Rename new table
        ALTER TABLE users_new RENAME TO users;

        -- Recreate indexes
        CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
        CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
        CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
        CREATE INDEX IF NOT EXISTS idx_submissions_exercise ON submissions(exercise_id);
        CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);
        CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);
        CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_discussions_course ON discussions(course_id);
      `)
      
        console.log('✅ Made password column nullable')
      }
    }

    // Add OAuth columns if they don't exist
    if (!hasOauthProvider || !hasOauthId) {
      if (!needsMigration) {
        console.log('🔄 Running migration: Adding OAuth columns to users table...')
      }
      
      // Add oauth_provider column if it doesn't exist
      if (!hasOauthProvider) {
        try {
          db.prepare('ALTER TABLE users ADD COLUMN oauth_provider TEXT').run()
          console.log('✅ Added oauth_provider column')
        } catch (e) {
          if (!e.message.includes('duplicate column') && !e.message.includes('no such column')) {
            throw e
          }
        }
      }

      // Add oauth_id column if it doesn't exist
      if (!hasOauthId) {
        try {
          db.prepare('ALTER TABLE users ADD COLUMN oauth_id TEXT').run()
          console.log('✅ Added oauth_id column')
        } catch (e) {
          if (!e.message.includes('duplicate column') && !e.message.includes('no such column')) {
            throw e
          }
        }
      }
    }
      
    // Create unique index on oauth_provider + oauth_id
    try {
      db.prepare(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth 
        ON users(oauth_provider, oauth_id) 
        WHERE oauth_provider IS NOT NULL AND oauth_id IS NOT NULL
      `).run()
      if (needsMigration || !hasOauthProvider || !hasOauthId) {
        console.log('✅ Created OAuth unique index')
      }
    } catch (e) {
      // Index might already exist
      if (!e.message.includes('already exists') && !e.message.includes('duplicate')) {
        console.warn('Warning creating OAuth index:', e.message)
      }
    }

    // Check and add new message fields for E2EE and file support
    const messagesTableInfo = db.prepare("PRAGMA table_info(messages)").all()
    const hasEncryptedContent = messagesTableInfo.some(col => col.name === 'encrypted_content')
    const hasIsEncrypted = messagesTableInfo.some(col => col.name === 'is_encrypted')
    const hasFileName = messagesTableInfo.some(col => col.name === 'file_name')
    const hasFileSize = messagesTableInfo.some(col => col.name === 'file_size')
    const hasFileMimetype = messagesTableInfo.some(col => col.name === 'file_mimetype')

    if (!hasEncryptedContent || !hasIsEncrypted || !hasFileName || !hasFileSize || !hasFileMimetype) {
      console.log('🔄 Running migration: Adding E2EE and file fields to messages table...')
      
      if (!hasEncryptedContent) {
        try {
          db.prepare('ALTER TABLE messages ADD COLUMN encrypted_content TEXT').run()
          console.log('✅ Added encrypted_content column')
        } catch (e) {
          if (!e.message.includes('duplicate column')) {
            console.warn('Warning adding encrypted_content:', e.message)
          }
        }
      }

      if (!hasIsEncrypted) {
        try {
          db.prepare('ALTER TABLE messages ADD COLUMN is_encrypted INTEGER DEFAULT 0').run()
          console.log('✅ Added is_encrypted column')
        } catch (e) {
          if (!e.message.includes('duplicate column')) {
            console.warn('Warning adding is_encrypted:', e.message)
          }
        }
      }

      if (!hasFileName) {
        try {
          db.prepare('ALTER TABLE messages ADD COLUMN file_name TEXT').run()
          console.log('✅ Added file_name column')
        } catch (e) {
          if (!e.message.includes('duplicate column')) {
            console.warn('Warning adding file_name:', e.message)
          }
        }
      }

      if (!hasFileSize) {
        try {
          db.prepare('ALTER TABLE messages ADD COLUMN file_size INTEGER').run()
          console.log('✅ Added file_size column')
        } catch (e) {
          if (!e.message.includes('duplicate column')) {
            console.warn('Warning adding file_size:', e.message)
          }
        }
      }

      if (!hasFileMimetype) {
        try {
          db.prepare('ALTER TABLE messages ADD COLUMN file_mimetype TEXT').run()
          console.log('✅ Added file_mimetype column')
        } catch (e) {
          if (!e.message.includes('duplicate column')) {
            console.warn('Warning adding file_mimetype:', e.message)
          }
        }
      }

      console.log('✅ Messages table migration completed')
    }

    // Check and create user_public_keys table for E2EE
    const tables = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='user_public_keys'
    `).all()

    if (tables.length === 0) {
      console.log('🔄 Running migration: Creating user_public_keys table...')
      db.prepare(`
        CREATE TABLE IF NOT EXISTS user_public_keys (
          id TEXT PRIMARY KEY,
          user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          public_key TEXT NOT NULL,
          private_key_encrypted TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        )
      `).run()
      console.log('✅ Created user_public_keys table')
    } else {
      // Check if private_key_encrypted and master_key_salt columns exist
      const tableInfo = db.prepare("PRAGMA table_info(user_public_keys)").all()
      const hasPrivateKey = tableInfo.some(col => col.name === 'private_key_encrypted')
      const hasSalt = tableInfo.some(col => col.name === 'master_key_salt')
      const hasIv = tableInfo.some(col => col.name === 'encryption_iv')
      
      if (!hasPrivateKey) {
        try {
          db.prepare('ALTER TABLE user_public_keys ADD COLUMN private_key_encrypted TEXT').run()
          console.log('✅ Added private_key_encrypted column to user_public_keys table')
        } catch (e) {
          if (!e.message.includes('duplicate column')) {
            console.warn('Warning adding private_key_encrypted:', e.message)
          }
        }
      }
      
      if (!hasSalt) {
        try {
          db.prepare('ALTER TABLE user_public_keys ADD COLUMN master_key_salt TEXT').run()
          console.log('✅ Added master_key_salt column to user_public_keys table')
        } catch (e) {
          if (!e.message.includes('duplicate column')) {
            console.warn('Warning adding master_key_salt:', e.message)
          }
        }
      }
      
      if (!hasIv) {
        try {
          db.prepare('ALTER TABLE user_public_keys ADD COLUMN encryption_iv TEXT').run()
          console.log('✅ Added encryption_iv column to user_public_keys table')
        } catch (e) {
          if (!e.message.includes('duplicate column')) {
            console.warn('Warning adding encryption_iv:', e.message)
          }
        }
      }
    }

    // Add two_factor_enabled column to users table
    const userTableInfo = db.prepare("PRAGMA table_info(users)").all()
    const hasTwoFactor = userTableInfo.some(col => col.name === 'two_factor_enabled')
    const hasTheme = userTableInfo.some(col => col.name === 'theme_preference')
    const hasTwoFactorSecret = userTableInfo.some(col => col.name === 'two_factor_secret')
    
    if (!hasTwoFactor) {
      try {
        db.prepare('ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0').run()
        console.log('✅ Added two_factor_enabled column to users table')
      } catch (e) {
        if (!e.message.includes('duplicate column')) {
          console.warn('Warning adding two_factor_enabled:', e.message)
        }
      }
    }
    
    if (!hasTheme) {
      try {
        db.prepare('ALTER TABLE users ADD COLUMN theme_preference TEXT DEFAULT \'light\'').run()
        console.log('✅ Added theme_preference column to users table')
      } catch (e) {
        if (!e.message.includes('duplicate column')) {
          console.warn('Warning adding theme_preference:', e.message)
        }
      }
    }
    
    if (!hasTwoFactorSecret) {
      try {
        db.prepare('ALTER TABLE users ADD COLUMN two_factor_secret TEXT').run()
        console.log('✅ Added two_factor_secret column to users table')
      } catch (e) {
        if (!e.message.includes('duplicate column')) {
          console.warn('Warning adding two_factor_secret:', e.message)
        }
      }
    }

    // Create notifications table
    console.log('🔄 Checking notifications table...')
    const notificationTables = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'
    `).all()

    if (notificationTables.length === 0) {
      console.log('🔄 Creating notifications table...')
      try {
        db.exec(`
          CREATE TABLE notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `)
        console.log('✅ Created notifications table')
      } catch (e) {
        console.error('❌ Error creating notifications table:', e.message)
      }
    } else {
      console.log('✓ Notifications table exists')
      // Verify it has all columns
      const columns = db.prepare('PRAGMA table_info(notifications)').all()
      const hasMessage = columns.some(col => col.name === 'message')
      
      if (!hasMessage) {
        console.log('🔄 Recreating notifications table with correct schema...')
        try {
          // Drop old table
          db.exec('DROP TABLE IF EXISTS notifications')
          // Create new table with correct schema
          db.exec(`
            CREATE TABLE notifications (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              type TEXT NOT NULL,
              title TEXT NOT NULL,
              message TEXT NOT NULL,
              read INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `)
          console.log('✅ Recreated notifications table with correct schema')
        } catch (e) {
          console.error('❌ Error recreating notifications table:', e.message)
        }
      } else {
        console.log('✓ Notifications table has correct schema')
      }
    }

    // Add streak and gems columns
    console.log('🔄 Checking streak and gems columns...')
    const hasStreakCount = tableInfo.some(col => col.name === 'streak_count')
    const hasStreakFreezeCount = tableInfo.some(col => col.name === 'streak_freeze_count')
    const hasGems = tableInfo.some(col => col.name === 'gems')
    const hasLastActivityDate = tableInfo.some(col => col.name === 'last_activity_date')
    const hasAchievements = tableInfo.some(col => col.name === 'achievements')

    if (!hasStreakCount) {
      console.log('🔄 Adding streak_count column...')
      try {
        db.exec('ALTER TABLE users ADD COLUMN streak_count INTEGER DEFAULT 0')
        console.log('✅ Added streak_count column')
      } catch (e) {
        console.error('❌ Error adding streak_count:', e.message)
      }
    }

    if (!hasStreakFreezeCount) {
      console.log('🔄 Adding streak_freeze_count column...')
      try {
        db.exec('ALTER TABLE users ADD COLUMN streak_freeze_count INTEGER DEFAULT 0')
        console.log('✅ Added streak_freeze_count column')
      } catch (e) {
        console.error('❌ Error adding streak_freeze_count:', e.message)
      }
    }

    if (!hasGems) {
      console.log('🔄 Adding gems column...')
      try {
        db.exec('ALTER TABLE users ADD COLUMN gems INTEGER DEFAULT 0')
        console.log('✅ Added gems column')
      } catch (e) {
        console.error('❌ Error adding gems:', e.message)
      }
    }

    if (!hasLastActivityDate) {
      console.log('🔄 Adding last_activity_date column...')
      try {
        db.exec('ALTER TABLE users ADD COLUMN last_activity_date DATE')
        console.log('✅ Added last_activity_date column')
      } catch (e) {
        console.error('❌ Error adding last_activity_date:', e.message)
      }
    }

    if (!hasAchievements) {
      console.log('🔄 Adding achievements column...')
      try {
        db.exec('ALTER TABLE users ADD COLUMN achievements TEXT DEFAULT \'[]\'')
        console.log('✅ Added achievements column')
      } catch (e) {
        console.error('❌ Error adding achievements:', e.message)
      }
    }

    if (needsMigration || !hasOauthProvider || !hasOauthId || !hasTwoFactor || !hasTheme || !hasTwoFactorSecret || !hasStreakCount || !hasGems) {
      console.log('✅ Migration completed successfully')
    } else {
      console.log('✅ Database schema is up to date')
    }
  } catch (error) {
    console.error('❌ Migration error:', error)
    throw error
  } finally {
    db.pragma('foreign_keys = ON') // Re-enable foreign key checks
  }
}

