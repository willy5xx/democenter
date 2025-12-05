import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Run database migrations
 */
export function runMigrations() {
  const dbPath = path.join(__dirname, 'config.db');
  const migrationsPath = path.join(__dirname, 'migrations');
  
  console.log('🔄 Running database migrations...');
  
  try {
    const db = new Database(dbPath);
    
    // Get all migration files
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    for (const file of migrationFiles) {
      console.log(`  Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsPath, file), 'utf-8');
      
      try {
        db.exec(sql);
      } catch (error) {
        // Ignore "duplicate column" errors (migration already applied)
        if (error.code === 'SQLITE_ERROR' && error.message.includes('duplicate column')) {
          console.log(`  ℹ️  Migration ${file} already applied (column exists)`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ Migrations completed successfully');
    db.close();
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

// Run migrations if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations();
}

