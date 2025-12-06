/**
 * OBS Setup API Route
 * Provides endpoints for checking OBS status and triggering auto-setup
 */

import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();
const execAsync = promisify(exec);

// Import the OBS setup utilities
import {
  getOBSConfigDir,
  isOBSInstalled,
  isOBSRunning,
  main as setupOBS
} from '../scripts/setup-obs.js';

import { obsService } from '../services/obs-service.js';

/**
 * GET /api/obs/status
 * Check OBS installation and running status
 */
router.get('/status', async (req, res) => {
  try {
    const installed = isOBSInstalled();
    const running = isOBSRunning();
    const configDir = installed ? getOBSConfigDir() : null;
    
    // Check connection and virtual camera status
    let virtualCam = { active: false, connected: false };
    if (running) {
      virtualCam = await obsService.getVirtualCamStatus();
    }
    
    let configured = false;
    if (configDir) {
      try {
        const scenePath = path.join(configDir, 'basic/scenes/vendVision.json');
        await fs.access(scenePath);
        configured = true;
      } catch (error) {
        configured = false;
      }
    }

    res.json({
      success: true,
      obs: {
        installed,
        running,
        configured,
        configDir,
        connected: virtualCam.connected,
        virtualCamActive: virtualCam.active
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/obs/virtual-cam
 * Control the virtual camera (start/stop)
 * Body: { action: 'start' | 'stop' }
 */
router.post('/virtual-cam', async (req, res) => {
  try {
    const { action } = req.body;
    
    if (!isOBSRunning()) {
       return res.status(400).json({ 
         success: false, 
         error: 'OBS is not running. Please launch OBS first.' 
       });
    }

    if (action === 'start') {
      await obsService.startVirtualCam();
    } else if (action === 'stop') {
      await obsService.stopVirtualCam();
    } else {
      return res.status(400).json({ success: false, error: 'Invalid action. Use "start" or "stop".' });
    }

    res.json({ success: true, action });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/obs/setup
 * Trigger OBS auto-configuration
 */
router.post('/setup', async (req, res) => {
  try {
    // Check if OBS is installed
    if (!isOBSInstalled()) {
      return res.status(400).json({
        success: false,
        error: 'OBS Studio is not installed. Please install it from https://obsproject.com'
      });
    }

    // Check if OBS is running
    if (isOBSRunning()) {
      return res.status(400).json({
        success: false,
        error: 'OBS is currently running. Please close OBS and try again.'
      });
    }

    // Run the setup
    await setupOBS();

    res.json({
      success: true,
      message: 'OBS has been configured successfully. You can now launch OBS Studio.',
      nextSteps: [
        'Launch OBS Studio',
        'Click "Start Virtual Camera"',
        'Open Zoom → Settings → Video',
        'Select "OBS Virtual Camera"'
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/obs/download-link
 * Get the appropriate download link for OBS based on the platform
 */
router.get('/download-link', (req, res) => {
  const platform = process.platform;
  
  let downloadUrl = 'https://obsproject.com/download';
  let instructions = [];

  if (platform === 'darwin') {
    downloadUrl = 'https://obsproject.com/download';
    instructions = [
      'Download OBS Studio for macOS',
      'Open the .dmg file',
      'Drag OBS to Applications',
      'Launch OBS once to complete setup',
      'Return here and click "Auto-Configure OBS"'
    ];
  } else if (platform === 'linux') {
    instructions = [
      'Ubuntu/Debian: sudo apt install obs-studio',
      'Fedora: sudo dnf install obs-studio',
      'Arch: sudo pacman -S obs-studio',
      'Or download from https://obsproject.com/download'
    ];
  } else if (platform === 'win32') {
    instructions = [
      'Download OBS Studio for Windows',
      'Run the installer',
      'Launch OBS once to complete setup',
      'Return here and click "Auto-Configure OBS"'
    ];
  }

  res.json({
    success: true,
    platform,
    downloadUrl,
    instructions
  });
});

export default router;

