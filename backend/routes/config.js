import express from 'express';
import { configManager } from '../services/config-manager.js';

const router = express.Router();

/**
 * POST /api/config/regenerate
 * Manually trigger configuration regeneration and go2rtc restart
 */
router.post('/regenerate', async (req, res) => {
  try {
    console.log('📡 Manual config regeneration requested');
    
    const result = await configManager.updateConfiguration({ debounceMs: 0 });
    
    res.json({
      success: true,
      message: 'Configuration regenerated and go2rtc restarted',
      ...result
    });
  } catch (error) {
    console.error('Error regenerating config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/config/health
 * Check go2rtc health status
 */
router.get('/health', async (req, res) => {
  try {
    const health = await configManager.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/config/restart-go2rtc
 * Manually restart go2rtc without regenerating config
 */
router.post('/restart-go2rtc', async (req, res) => {
  try {
    console.log('📡 Manual go2rtc restart requested');
    
    const result = await configManager.restartGo2rtc();
    
    res.json({
      success: true,
      message: 'go2rtc restarted',
      ...result
    });
  } catch (error) {
    console.error('Error restarting go2rtc:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/config/start-go2rtc
 * Start go2rtc if it's not running
 */
router.post('/start-go2rtc', async (req, res) => {
  try {
    console.log('📡 Manual go2rtc start requested');
    
    const result = await configManager.startGo2rtc();
    
    res.json({
      success: true,
      message: 'go2rtc started',
      ...result
    });
  } catch (error) {
    console.error('Error starting go2rtc:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/config/stop-go2rtc
 * Stop go2rtc gracefully
 */
router.post('/stop-go2rtc', async (req, res) => {
  try {
    console.log('📡 Manual go2rtc stop requested');
    
    const result = await configManager.stopGo2rtc();
    
    res.json({
      success: true,
      message: 'go2rtc stopped',
      ...result
    });
  } catch (error) {
    console.error('Error stopping go2rtc:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

