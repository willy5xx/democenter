import express from 'express';

const router = express.Router();

// Store active SSE connections
const clients = new Set();

/**
 * SSE endpoint for real-time config updates
 * GET /api/events
 */
router.get('/', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Send initial connection message
  res.write('data: {"type":"connected","message":"SSE connection established"}\n\n');
  
  // Add this client to the set
  clients.add(res);
  console.log(`📡 SSE client connected (${clients.size} active connections)`);
  
  // Remove client when connection closes
  req.on('close', () => {
    clients.delete(res);
    console.log(`📡 SSE client disconnected (${clients.size} active connections)`);
  });
});

/**
 * Broadcast a message to all connected SSE clients
 */
export function broadcastToClients(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  
  clients.forEach(client => {
    try {
      client.write(message);
    } catch (error) {
      console.error('Error sending SSE message:', error);
      clients.delete(client);
    }
  });
  
  console.log(`📡 Broadcasted to ${clients.size} clients:`, data.type);
}

/**
 * Get count of active SSE connections
 */
export function getActiveConnectionCount() {
  return clients.size;
}

export default router;

