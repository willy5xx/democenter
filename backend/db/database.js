import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Database singleton for vendVision virtual PTZ system
 */
class DatabaseManager {
  constructor() {
    this.db = null;
  }

  initialize() {
    if (this.db) return this.db;
    
    const dbPath = path.join(__dirname, 'config.db');
    this.db = new Database(dbPath);
    
    // Enable WAL mode for better concurrent access
    this.db.pragma('journal_mode = WAL');
    
    console.log('✅ Database connected:', dbPath);
    return this.db;
  }

  getDatabase() {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
export const dbManager = new DatabaseManager();
export default dbManager;

