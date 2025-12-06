import onvif from 'node-onvif';
import { dbManager } from '../db/database.js';

class PtzService {
  constructor() {
    this.devices = new Map(); // Cache connected devices: siteId -> onvif.OnvifDevice
  }

  /**
   * Parse RTSP URL to extract credentials and IP
   * Format: rtsp://user:pass@ip:port/path or rtsp://ip:port/path
   */
  parseCameraUrl(url) {
    try {
      // Remove rtsp:// prefix
      const cleanUrl = url.replace('rtsp://', '');
      
      let user = '';
      let pass = '';
      let host = '';
      let port = 80; // Default ONVIF port is usually 80, but can be 2020 for Tapo?
                     // Tapo often uses port 2020 for ONVIF service discovery/connection
                     
      if (cleanUrl.includes('@')) {
        const [creds, address] = cleanUrl.split('@');
        const [u, p] = creds.split(':');
        user = u;
        pass = p;
        
        const [h, portStr] = address.split('/')[0].split(':');
        host = h;
      } else {
        const [h, portStr] = cleanUrl.split('/')[0].split(':');
        host = h;
      }

      return { user, pass, host };
    } catch (e) {
      console.error('Error parsing camera URL:', e);
      return null;
    }
  }

  async getDevice(siteId) {
    if (this.devices.has(siteId)) {
      return this.devices.get(siteId);
    }

    const db = dbManager.getDatabase();
    const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(siteId);

    if (!site || !site.camera_url) {
      throw new Error('Site or camera URL not found');
    }

    const { user, pass, host } = this.parseCameraUrl(site.camera_url);
    
    // Tapo cameras usually use port 2020 for ONVIF
    // We might need to try multiple ports or make it configurable?
    // For now, let's try 2020 as it's standard for Tapo.
    // If user didn't specify port in RTSP URL (which is 554), we use 2020 for ONVIF.
    
    console.log(`Connecting to ONVIF device at ${host}:2020`);

    const device = new onvif.OnvifDevice({
      xaddr: `http://${host}:2020/onvif/device_service`,
      user,
      pass
    });

    try {
      await device.init();
      this.devices.set(siteId, device);
      return device;
    } catch (error) {
      console.error('Failed to initialize ONVIF device:', error);
      throw new Error(`Failed to connect to camera: ${error.message}`);
    }
  }

  /**
   * Move the camera
   * direction: 'left', 'right', 'up', 'down', 'stop'
   * speed: 0.0 to 1.0
   */
  async move(siteId, direction, speed = 0.5) {
    try {
      const device = await this.getDevice(siteId);
      
      let x = 0;
      let y = 0;
      let z = 0;

      switch (direction) {
        case 'left': x = -speed; break;
        case 'right': x = speed; break;
        case 'up': y = speed; break;
        case 'down': y = -speed; break;
        case 'zoomIn': z = speed; break;
        case 'zoomOut': z = -speed; break;
        case 'stop': 
          await device.ptzStop();
          return { success: true };
      }

      // Continuous move
      await device.ptzMove({
        speed: { x, y, z },
        timeout: 30 // Stop after 30 seconds if no stop command received (safety)
      });

      return { success: true };
    } catch (error) {
      console.error(`Error moving camera for site ${siteId}:`, error);
      // If auth failed, maybe clear cache and retry once?
      this.devices.delete(siteId);
      throw error;
    }
  }
}

export const ptzService = new PtzService();

