/**
 * Tailscale API Routes
 * 
 * Endpoints for discovering and managing remote demo sites
 */

import express from 'express';
import { tailscaleService } from '../services/tailscale-service.js';

const router = express.Router();

/**
 * GET /api/tailscale/status
 * Check if Tailscale is installed and get connection status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await tailscaleService.isAvailable();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tailscale/ip
 * Get this machine's Tailscale IP
 */
router.get('/ip', async (req, res) => {
  try {
    const result = await tailscaleService.getLocalIP();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tailscale/network
 * Get all devices on the Tailscale network
 */
router.get('/network', async (req, res) => {
  try {
    const result = await tailscaleService.getLocalStatus();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tailscale/sites
 * Get all VendVision demo sites on the network
 * This is the main endpoint you'll use to see all connected salespeople
 */
router.get('/sites', async (req, res) => {
  try {
    const result = await tailscaleService.getDemoSites();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

