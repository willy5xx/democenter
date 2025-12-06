import OBSWebSocket from 'obs-websocket-js';

class OBSService {
  constructor() {
    this.obs = new OBSWebSocket();
    this.connected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    this.reconnectInterval = 5000; // 5 seconds
  }

  /**
   * Connect to OBS WebSocket
   * Default port is 4455, no password by default in our auto-setup
   */
  async connect() {
    if (this.connected) return true;

    try {
      // Try with password "vendvision" (we'll configure this) or empty
      await this.obs.connect('ws://localhost:4455', 'vendvision');
      this.connected = true;
      this.connectionAttempts = 0;
      console.log('✅ Connected to OBS WebSocket');
      
      this.obs.on('ConnectionClosed', () => {
        console.log('⚠️ OBS WebSocket connection closed');
        this.connected = false;
        // Try to reconnect if it wasn't an intentional close
        this.scheduleReconnect();
      });

      return true;
    } catch (error) {
      // Only log error if we haven't exceeded max retries to avoid spam
      if (this.connectionAttempts < this.maxRetries) {
        console.log(`⚠️ Failed to connect to OBS (Attempt ${this.connectionAttempts + 1}/${this.maxRetries}):`, error.message);
        this.connectionAttempts++;
      }
      return false;
    }
  }

  scheduleReconnect() {
    setTimeout(() => {
      if (!this.connected) {
        this.connect().catch(() => {});
      }
    }, this.reconnectInterval);
  }

  /**
   * Check if Virtual Camera is active
   */
  async getVirtualCamStatus() {
    if (!this.connected) {
      const success = await this.connect();
      if (!success) return { active: false, connected: false };
    }

    try {
      const { outputActive } = await this.obs.call('GetVirtualCamStatus');
      return { active: outputActive, connected: true };
    } catch (error) {
      console.error('Error checking virtual cam status:', error);
      this.connected = false;
      return { active: false, connected: false, error: error.message };
    }
  }

  /**
   * Start Virtual Camera
   */
  async startVirtualCam() {
    if (!this.connected) {
      const success = await this.connect();
      if (!success) throw new Error('Could not connect to OBS');
    }

    try {
      await this.obs.call('StartVirtualCam');
      return true;
    } catch (error) {
      console.error('Error starting virtual cam:', error);
      throw error;
    }
  }

  /**
   * Stop Virtual Camera
   */
  async stopVirtualCam() {
    if (!this.connected) {
      const success = await this.connect();
      if (!success) throw new Error('Could not connect to OBS');
    }

    try {
      await this.obs.call('StopVirtualCam');
      return true;
    } catch (error) {
      console.error('Error stopping virtual cam:', error);
      throw error;
    }
  }
}

export const obsService = new OBSService();

