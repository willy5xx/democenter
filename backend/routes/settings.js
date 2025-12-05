import express from 'express';
import { dbManager } from '../db/database.js';

const router = express.Router();

/**
 * GET /api/settings
 * Get all settings
 */
router.get('/', (req, res) => {
  try {
    const db = dbManager.getDatabase();
    const settings = db.prepare('SELECT * FROM settings').all();
    
    // Convert to key-value object
    const settingsObj = {};
    settings.forEach(row => {
      settingsObj[row.key] = row.value;
    });
    
    res.json({ success: true, data: settingsObj });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/settings/:key
 * Get a single setting by key
 */
router.get('/:key', (req, res) => {
  try {
    const db = dbManager.getDatabase();
    const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(req.params.key);
    
    if (!setting) {
      return res.status(404).json({ success: false, error: 'Setting not found' });
    }
    
    res.json({ success: true, data: { key: req.params.key, value: setting.value } });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/settings/:key
 * Update or create a setting
 */
router.put('/:key', (req, res) => {
  try {
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ success: false, error: 'value is required' });
    }
    
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      INSERT INTO settings (key, value) 
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    
    stmt.run(req.params.key, value);
    
    // Notify SSE clients
    if (req.app.locals.notifyConfigChange) {
      req.app.locals.notifyConfigChange({ 
        type: 'setting_updated', 
        key: req.params.key,
        value 
      });
    }
    
    res.json({ success: true, data: { key: req.params.key, value } });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/settings/:key
 * Delete a setting
 */
router.delete('/:key', (req, res) => {
  try {
    const db = dbManager.getDatabase();
    const result = db.prepare('DELETE FROM settings WHERE key = ?').run(req.params.key);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Setting not found' });
    }
    
    // Notify SSE clients
    if (req.app.locals.notifyConfigChange) {
      req.app.locals.notifyConfigChange({ 
        type: 'setting_deleted', 
        key: req.params.key 
      });
    }
    
    res.json({ success: true, message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

