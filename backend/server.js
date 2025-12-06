import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbManager } from './db/database.js';
import { runMigrations } from './db/migrate.js';
import { broadcastToClients } from './routes/sse.js';
import { configManager } from './services/config-manager.js';

// Import routes
import sitesRouter from './routes/sites.js';
import machineRegionsRouter from './routes/machine-regions.js';
import settingsRouter from './routes/settings.js';
import sseRouter from './routes/sse.js';
import configRouter from './routes/config.js';
import obsSetupRouter from './routes/obs-setup.js';
import ptzRouter from './routes/ptz.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
try {
  console.log('🔄 Initializing database...');
  
  // Run migrations first
  runMigrations();
  
  // Then initialize database connection
  dbManager.initialize();
  console.log('✅ Database ready');
} catch (error) {
  console.error('❌ Failed to initialize database:', error);
  process.exit(1);
}

// Make broadcast function available to routes via app.locals
app.locals.notifyConfigChange = (data) => {
  broadcastToClients(data);
};

// API Routes
app.use('/api/sites', sitesRouter);
app.use('/api/machine-regions', machineRegionsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/events', sseRouter);
app.use('/api/config', configRouter);
app.use('/api/obs', obsSetupRouter);
app.use('/api', ptzRouter); // Mount at /api so it matches /api/sites/:id/ptz

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'vendVision Virtual PTZ Backend',
    version: '2.0.0',
    endpoints: {
      health: '/api/health',
      sites: '/api/sites',
      machine_regions: '/api/machine-regions',
      settings: '/api/settings',
      events: '/api/events (SSE)',
      config: '/api/config',
      obs: '/api/obs'
    },
    documentation: 'See README.md for full API docs',
    frontend: 'http://localhost:5173',
    calibration: 'http://localhost:5173/admin/calibrate'
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const go2rtcHealth = await configManager.healthCheck();
    
    res.json({ 
      status: 'ok', 
      service: 'vendvision-backend',
      database: 'connected',
      version: '2.0.0-virtual-ptz',
      go2rtc: go2rtcHealth
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'vendvision-backend',
      database: 'connected',
      version: '2.0.0-virtual-ptz',
      go2rtc: { success: false, status: 'error', message: error.message }
    });
  }
});

// Legacy endpoint for backward compatibility (optional - can be removed later)
app.post('/api/save-machines', async (req, res) => {
  res.status(410).json({
    success: false,
    error: 'This endpoint has been deprecated. Use the new /api/machine-regions endpoints instead.',
    migration_guide: 'See documentation for the new virtual PTZ API'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  dbManager.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  dbManager.close();
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   🚀 vendVision Virtual PTZ Backend                   ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`🌐 Server:     http://localhost:${PORT}`);
  console.log(`📡 SSE Events: http://localhost:${PORT}/api/events`);
  console.log(`💾 Database:   ${path.join(__dirname, 'db/config.db')}`);
  console.log('');
  console.log('📚 API Endpoints:');
  console.log('   GET    /api/health');
  console.log('   GET    /api/sites');
  console.log('   POST   /api/sites');
  console.log('   GET    /api/machine-regions');
  console.log('   POST   /api/machine-regions');
  console.log('   GET    /api/settings');
  console.log('   GET    /api/events (SSE)');
  console.log('   GET    /api/obs/status');
  console.log('   POST   /api/obs/setup');
  console.log('');
});
