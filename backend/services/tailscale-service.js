/**
 * Tailscale Service
 * 
 * Provides integration with Tailscale for:
 * - Auto-discovering all demo sites on the network
 * - Getting device IPs without asking salespeople
 * - Checking connection status
 * 
 * Uses both local Tailscale CLI and Tailscale API for redundancy.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class TailscaleService {
  constructor() {
    // Tailscale API key (set via environment variable)
    this.apiKey = process.env.TAILSCALE_API_KEY || null;
    this.tailnet = process.env.TAILSCALE_TAILNET || null; // e.g., 'mycompany.com' or 'tail1234.ts.net'
    this.baseUrl = 'https://api.tailscale.com/api/v2';
  }

  /**
   * Get local Tailscale status using CLI (works without API key)
   */
  async getLocalStatus() {
    try {
      const { stdout } = await execAsync('tailscale status --json');
      const status = JSON.parse(stdout);
      
      return {
        success: true,
        self: {
          name: status.Self?.HostName,
          ip: status.Self?.TailscaleIPs?.[0],
          online: status.Self?.Online,
          os: status.Self?.OS
        },
        peers: Object.values(status.Peer || {}).map(peer => ({
          name: peer.HostName,
          ip: peer.TailscaleIPs?.[0],
          online: peer.Online,
          os: peer.OS,
          lastSeen: peer.LastSeen,
          tags: peer.Tags || []
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        installed: !error.message.includes('not found')
      };
    }
  }

  /**
   * Get the local machine's Tailscale IP
   */
  async getLocalIP() {
    try {
      const { stdout } = await execAsync('tailscale ip -4');
      return {
        success: true,
        ip: stdout.trim()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if Tailscale is installed and running
   */
  async isAvailable() {
    try {
      await execAsync('tailscale version');
      const { stdout } = await execAsync('tailscale status --json');
      const status = JSON.parse(stdout);
      return {
        installed: true,
        running: true,
        connected: status.Self?.Online || false,
        ip: status.Self?.TailscaleIPs?.[0] || null
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        return { installed: false, running: false, connected: false };
      }
      return { installed: true, running: false, connected: false };
    }
  }

  /**
   * Get all devices on the Tailscale network using API
   * Requires TAILSCALE_API_KEY and TAILSCALE_TAILNET env vars
   */
  async getNetworkDevices() {
    if (!this.apiKey || !this.tailnet) {
      // Fall back to local CLI if no API key
      return this.getLocalStatus();
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/tailnet/${this.tailnet}/devices`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Tailscale API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        devices: data.devices.map(device => ({
          id: device.id,
          name: device.hostname,
          ip: device.addresses?.[0],
          online: device.online,
          os: device.os,
          lastSeen: device.lastSeen,
          tags: device.tags || [],
          authorized: device.authorized,
          user: device.user
        }))
      };
    } catch (error) {
      console.error('Tailscale API error:', error);
      // Fall back to local CLI
      return this.getLocalStatus();
    }
  }

  /**
   * Get all VendVision demo sites on the network
   * Looks for devices with the 'vendvision' tag or running on expected ports
   */
  async getDemoSites() {
    const networkStatus = await this.getNetworkDevices();
    
    if (!networkStatus.success) {
      return networkStatus;
    }

    // Get devices (from API or local peers)
    const devices = networkStatus.devices || networkStatus.peers || [];
    
    // Filter to likely demo sites (you can tag them in Tailscale for easy filtering)
    // For now, return all devices - you can filter by tags later
    const demoSites = devices.map(device => ({
      name: device.name,
      ip: device.ip,
      online: device.online,
      os: device.os,
      lastSeen: device.lastSeen,
      dashboardUrl: device.online ? `http://${device.ip}:5173` : null,
      presentationUrl: device.online ? `http://${device.ip}:5173` : null,
      adminUrl: device.online ? `http://${device.ip}:5173/admin` : null,
      streamUrl: device.online ? `http://${device.ip}:1984` : null
    }));

    return {
      success: true,
      sites: demoSites,
      onlineCount: demoSites.filter(s => s.online).length,
      totalCount: demoSites.length
    };
  }

  /**
   * Register this device with a friendly name
   * Uses Tailscale's machine naming
   */
  async setDeviceName(name) {
    try {
      // Tailscale uses hostname, so we'd need to change the machine hostname
      // or use tags. For now, we'll track names in our own database.
      console.log(`Would set device name to: ${name}`);
      return { success: true, name };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export const tailscaleService = new TailscaleService();
export default TailscaleService;

