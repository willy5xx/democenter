import express from 'express';
import { ptzService } from '../services/ptz-service.js';

const router = express.Router();

/**
 * POST /api/sites/:id/ptz
 * Control PTZ for a site
 * Body: { action: 'move'|'stop', direction: 'left'|'right'|'up'|'down'|'zoomIn'|'zoomOut', speed: number }
 */
router.post('/sites/:id/ptz', async (req, res) => {
  try {
    const siteId = parseInt(req.params.id);
    const { action, direction, speed } = req.body;

    if (action === 'stop') {
      await ptzService.move(siteId, 'stop');
    } else if (action === 'move') {
      if (!direction) {
        return res.status(400).json({ success: false, error: 'Direction is required for move action' });
      }
      await ptzService.move(siteId, direction, speed || 0.5);
    } else {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('PTZ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

