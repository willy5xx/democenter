import express from 'express';
import { dbManager } from '../db/database.js';

const router = express.Router();

/**
 * GET /api/machine-regions
 * List all machine regions, optionally filtered by site_id
 */
router.get('/', (req, res) => {
  try {
    const db = dbManager.getDatabase();
    const { site_id } = req.query;
    
    let query = 'SELECT * FROM machine_regions';
    let params = [];
    
    if (site_id) {
      query += ' WHERE site_id = ?';
      params.push(site_id);
    }
    
    query += ' ORDER BY site_id, display_order, id';
    
    const regions = db.prepare(query).all(...params);
    res.json({ success: true, data: regions });
  } catch (error) {
    console.error('Error fetching machine regions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/machine-regions/:id
 * Get single machine region by ID
 */
router.get('/:id', (req, res) => {
  try {
    const db = dbManager.getDatabase();
    const region = db.prepare('SELECT * FROM machine_regions WHERE id = ?').get(req.params.id);
    
    if (!region) {
      return res.status(404).json({ success: false, error: 'Machine region not found' });
    }
    
    res.json({ success: true, data: region });
  } catch (error) {
    console.error('Error fetching machine region:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/machine-regions
 * Create a new machine region
 */
router.post('/', (req, res) => {
  try {
    const { site_id, name, icon, x, y, width, height, is_default, order } = req.body;
    
    if (!site_id || !name || x === undefined || y === undefined || width === undefined || height === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'site_id, name, x, y, width, and height are required' 
      });
    }
    
    const db = dbManager.getDatabase();
    
    // Verify site exists
    const site = db.prepare('SELECT id FROM sites WHERE id = ?').get(site_id);
    if (!site) {
      return res.status(400).json({ success: false, error: 'Site not found' });
    }
    
    // If this is set as default, unset other defaults for this site
    if (is_default) {
      db.prepare('UPDATE machine_regions SET is_default = 0 WHERE site_id = ?').run(site_id);
    }
    
    const stmt = db.prepare(`
      INSERT INTO machine_regions 
        (site_id, name, icon, x, y, width, height, is_default, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      site_id,
      name,
      icon || '📦',
      x,
      y,
      width,
      height,
      is_default ? 1 : 0,
      order || 0
    );
    
    const newRegion = db.prepare('SELECT * FROM machine_regions WHERE id = ?').get(result.lastInsertRowid);
    
    // Notify SSE clients
    if (req.app.locals.notifyConfigChange) {
      req.app.locals.notifyConfigChange({ 
        type: 'region_created', 
        site_id: newRegion.site_id,
        region_id: newRegion.id 
      });
    }
    
    res.status(201).json({ success: true, data: newRegion });
  } catch (error) {
    console.error('Error creating machine region:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/machine-regions/:id
 * Update a machine region
 */
router.put('/:id', (req, res) => {
  try {
    const { name, icon, x, y, width, height, is_default, order } = req.body;
    const db = dbManager.getDatabase();
    
    // Check if region exists
    const existing = db.prepare('SELECT * FROM machine_regions WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Machine region not found' });
    }
    
    // If setting as default, unset other defaults for this site
    if (is_default) {
      db.prepare('UPDATE machine_regions SET is_default = 0 WHERE site_id = ?').run(existing.site_id);
    }
    
    const stmt = db.prepare(`
      UPDATE machine_regions 
      SET name = COALESCE(?, name),
          icon = COALESCE(?, icon),
          x = COALESCE(?, x),
          y = COALESCE(?, y),
          width = COALESCE(?, width),
          height = COALESCE(?, height),
          is_default = COALESCE(?, is_default),
          display_order = COALESCE(?, display_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      name || null,
      icon || null,
      x !== undefined ? x : null,
      y !== undefined ? y : null,
      width !== undefined ? width : null,
      height !== undefined ? height : null,
      is_default !== undefined ? (is_default ? 1 : 0) : null,
      order !== undefined ? order : null,
      req.params.id
    );
    
    const updatedRegion = db.prepare('SELECT * FROM machine_regions WHERE id = ?').get(req.params.id);
    
    // Notify SSE clients
    if (req.app.locals.notifyConfigChange) {
      req.app.locals.notifyConfigChange({ 
        type: 'region_updated', 
        site_id: updatedRegion.site_id,
        region_id: updatedRegion.id 
      });
    }
    
    res.json({ success: true, data: updatedRegion });
  } catch (error) {
    console.error('Error updating machine region:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/machine-regions/:id
 * Delete a machine region
 */
router.delete('/:id', (req, res) => {
  try {
    const db = dbManager.getDatabase();
    
    // Check if region exists
    const region = db.prepare('SELECT * FROM machine_regions WHERE id = ?').get(req.params.id);
    if (!region) {
      return res.status(404).json({ success: false, error: 'Machine region not found' });
    }
    
    db.prepare('DELETE FROM machine_regions WHERE id = ?').run(req.params.id);
    
    // Notify SSE clients
    if (req.app.locals.notifyConfigChange) {
      req.app.locals.notifyConfigChange({ 
        type: 'region_deleted', 
        site_id: region.site_id,
        region_id: parseInt(req.params.id)
      });
    }
    
    res.json({ success: true, message: 'Machine region deleted successfully' });
  } catch (error) {
    console.error('Error deleting machine region:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/machine-regions/reorder
 * Bulk update order of machine regions
 */
router.put('/bulk/reorder', (req, res) => {
  try {
    const { regions } = req.body; // Array of { id, order }
    
    if (!Array.isArray(regions)) {
      return res.status(400).json({ success: false, error: 'regions must be an array' });
    }
    
    const db = dbManager.getDatabase();
    const stmt = db.prepare('UPDATE machine_regions SET display_order = ? WHERE id = ?');
    
    const updateMany = db.transaction((items) => {
      for (const item of items) {
        stmt.run(item.order, item.id);
      }
    });
    
    updateMany(regions);
    
    // Notify SSE clients
    if (req.app.locals.notifyConfigChange) {
      req.app.locals.notifyConfigChange({ type: 'regions_reordered' });
    }
    
    res.json({ success: true, message: 'Machine regions reordered successfully' });
  } catch (error) {
    console.error('Error reordering machine regions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

