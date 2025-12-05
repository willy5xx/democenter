import express from 'express';
import { dbManager } from '../db/database.js';
import { configManager } from '../services/config-manager.js';

const router = express.Router();

/**
 * GET /api/sites
 * List all sites
 */
router.get('/', (req, res) => {
  try {
    const db = dbManager.getDatabase();
    const sites = db.prepare('SELECT * FROM sites ORDER BY created_at DESC').all();
    
    // Parse dewarp_params JSON string
    const sitesWithParsedParams = sites.map(site => ({
      ...site,
      dewarp_params: JSON.parse(site.dewarp_params || '{}')
    }));
    
    res.json({ success: true, data: sitesWithParsedParams });
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sites/:id
 * Get single site by ID
 */
router.get('/:id', (req, res) => {
  try {
    const db = dbManager.getDatabase();
    const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id);
    
    if (!site) {
      return res.status(404).json({ success: false, error: 'Site not found' });
    }
    
    site.dewarp_params = JSON.parse(site.dewarp_params || '{}');
    res.json({ success: true, data: site });
  } catch (error) {
    console.error('Error fetching site:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/sites
 * Create a new site
 */
router.post('/', (req, res) => {
  try {
    const { name, camera_url, camera_type, dewarp_params, stream_resolution, transition_speed } = req.body;
    
    if (!name || !camera_url) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and camera_url are required' 
      });
    }
    
    const db = dbManager.getDatabase();
    const stmt = db.prepare(`
      INSERT INTO sites (name, camera_url, camera_type, dewarp_params, stream_resolution, transition_speed)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      name,
      camera_url,
      camera_type || 'generic',
      JSON.stringify(dewarp_params || {}),
      stream_resolution || '1920x1080',
      transition_speed || 300
    );
    
    const newSite = db.prepare('SELECT * FROM sites WHERE id = ?').get(result.lastInsertRowid);
    newSite.dewarp_params = JSON.parse(newSite.dewarp_params);
    
    // Trigger config update (regenerate go2rtc.yaml and restart)
    configManager.updateConfiguration().catch(err => {
      console.error('Failed to update go2rtc configuration:', err);
    });
    
    // Notify SSE clients about config change
    if (req.app.locals.notifyConfigChange) {
      req.app.locals.notifyConfigChange({ type: 'site_created', site_id: newSite.id });
    }
    
    res.status(201).json({ success: true, data: newSite });
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/sites/:id
 * Update a site
 */
router.put('/:id', (req, res) => {
  try {
    const { name, camera_url, camera_type, dewarp_params, stream_resolution, transition_speed } = req.body;
    
    console.log('📝 PUT /api/sites/:id - Request body:', {
      name,
      camera_url,
      camera_type,
      stream_resolution,
      transition_speed,
      dewarp_params
    });
    
    const db = dbManager.getDatabase();
    
    // Check if site exists
    const exists = db.prepare('SELECT id FROM sites WHERE id = ?').get(req.params.id);
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Site not found' });
    }
    
    const stmt = db.prepare(`
      UPDATE sites 
      SET name = COALESCE(?, name),
          camera_url = COALESCE(?, camera_url),
          camera_type = COALESCE(?, camera_type),
          dewarp_params = COALESCE(?, dewarp_params),
          stream_resolution = COALESCE(?, stream_resolution),
          transition_speed = COALESCE(?, transition_speed),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      name || null,
      camera_url || null,
      camera_type || null,
      dewarp_params ? JSON.stringify(dewarp_params) : null,
      stream_resolution || null,
      transition_speed !== undefined ? transition_speed : null,
      req.params.id
    );
    
    const updatedSite = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id);
    updatedSite.dewarp_params = JSON.parse(updatedSite.dewarp_params);
    
    console.log('✅ Updated site:', updatedSite);
    
    // Trigger config update (regenerate go2rtc.yaml and restart)
    configManager.updateConfiguration().catch(err => {
      console.error('Failed to update go2rtc configuration:', err);
    });
    
    // Notify SSE clients
    if (req.app.locals.notifyConfigChange) {
      req.app.locals.notifyConfigChange({ type: 'site_updated', site_id: updatedSite.id });
    }
    
    res.json({ success: true, data: updatedSite });
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/sites/:id
 * Delete a site (and cascade delete machine regions)
 */
router.delete('/:id', (req, res) => {
  try {
    const db = dbManager.getDatabase();
    
    // Check if site exists
    const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id);
    if (!site) {
      return res.status(404).json({ success: false, error: 'Site not found' });
    }
    
    // Delete associated machine regions (cascade)
    db.prepare('DELETE FROM machine_regions WHERE site_id = ?').run(req.params.id);
    
    // Delete site
    db.prepare('DELETE FROM sites WHERE id = ?').run(req.params.id);
    
    // Trigger config update (regenerate go2rtc.yaml and restart)
    configManager.updateConfiguration().catch(err => {
      console.error('Failed to update go2rtc configuration:', err);
    });
    
    // Notify SSE clients
    if (req.app.locals.notifyConfigChange) {
      req.app.locals.notifyConfigChange({ type: 'site_deleted', site_id: parseInt(req.params.id) });
    }
    
    res.json({ success: true, message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Error deleting site:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

