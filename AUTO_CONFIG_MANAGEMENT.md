# Automated Configuration Management System

## Overview

The demo center now includes an **automated configuration management system** that seamlessly updates go2rtc whenever camera settings change. Users no longer need to manually regenerate configs or restart processes - it all happens automatically! 🎉

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ User Action (via Dashboard)                                  │
│  - Add new camera site                                       │
│  - Update camera URL/credentials                             │
│  - Change dewarp settings                                    │
│  - Delete site                                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend API (sites.js)                                       │
│  - Validates and saves changes to database                   │
│  - Triggers configManager.updateConfiguration()              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Config Manager Service (config-manager.js)                   │
│  1. Debounce (2 second default)                              │
│  2. Read all sites from database                             │
│  3. Generate new go2rtc.yaml                                 │
│  4. Backup old config                                        │
│  5. Write new config                                         │
│  6. Stop go2rtc (graceful SIGTERM, then SIGKILL if needed)   │
│  7. Start go2rtc with new config                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ go2rtc Running with New Configuration                        │
│  - All streams available at http://localhost:1984            │
│  - WebRTC endpoints ready for dashboard                      │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### 🔄 Automatic Updates
- **Triggered on**: Site create, update, delete
- **Debounced**: Multiple rapid changes are batched (2 second window)
- **No user action required**: Everything happens in the background

### 🛡️ Safe Restarts
- **Graceful shutdown**: SIGTERM first, then SIGKILL if needed
- **Backup configs**: Old config saved as `.backup` before overwrite
- **Error handling**: Failed restarts logged, system continues running

### 📊 Health Monitoring
- **Process detection**: Finds running go2rtc by PID
- **API health checks**: Verifies go2rtc API is responding
- **Stream counting**: Reports number of active streams
- **Status endpoint**: `/api/health` includes go2rtc status

### 🎛️ Manual Control
For administrators who need manual control:
- `POST /api/config/regenerate` - Full config regeneration + restart
- `POST /api/config/restart-go2rtc` - Restart without regenerating
- `POST /api/config/start-go2rtc` - Start if not running
- `POST /api/config/stop-go2rtc` - Stop gracefully
- `GET /api/config/health` - Detailed health status

## Architecture

### Core Components

#### 1. **Config Manager Service** (`backend/services/config-manager.js`)
Singleton service that handles all configuration and process management.

**Key Methods**:
- `generateConfig()` - Create go2rtc.yaml from database
- `findGo2rtcProcess()` - Locate running go2rtc by PID
- `stopGo2rtc()` - Graceful shutdown with fallback to force kill
- `startGo2rtc()` - Launch go2rtc in background (detached process)
- `restartGo2rtc()` - Stop + start combo
- `updateConfiguration()` - Full update with debouncing
- `healthCheck()` - Verify go2rtc is running and healthy

#### 2. **Sites API Routes** (`backend/routes/sites.js`)
Integrated automatic config updates on all mutation endpoints:
- `POST /api/sites` → Create site → Trigger config update
- `PUT /api/sites/:id` → Update site → Trigger config update
- `DELETE /api/sites/:id` → Delete site → Trigger config update

#### 3. **Config API Routes** (`backend/routes/config.js`)
Manual control endpoints for administrators.

#### 4. **Enhanced Health Check** (`backend/server.js`)
`GET /api/health` now includes go2rtc status:
```json
{
  "status": "ok",
  "service": "vendvision-backend",
  "database": "connected",
  "version": "2.0.0-virtual-ptz",
  "go2rtc": {
    "success": true,
    "status": "healthy",
    "pid": 12345,
    "streamsCount": 4,
    "message": "go2rtc is running and responding"
  }
}
```

## Stream Naming Convention

The config manager automatically handles single vs. multi-site deployments:

| Sites in DB | Stream Names |
|-------------|--------------|
| 1 site      | `main`, `dewarped` (optional prefix) |
| 2+ sites    | `site1_main`, `site1_dewarped`, `site2_main`, `site2_dewarped` |

**Generated streams per site**:
- `site{id}_main` - Raw RTSP feed from camera
- `site{id}_dewarped` - FFmpeg-processed feed with dewarping/scaling for Virtual PTZ

## Usage Examples

### For End Users (via Dashboard)

1. **Add a new camera site**:
   - Go to Admin → Sites Settings
   - Click "Add Site"
   - Fill in camera details
   - Click Save
   - ✅ Config automatically regenerates and go2rtc restarts

2. **Update camera credentials**:
   - Select site in Sites Settings
   - Update camera URL with new credentials
   - Click Save
   - ✅ Streams reconnect with new credentials automatically

3. **Delete a site**:
   - Select site in Sites Settings
   - Click Delete
   - Confirm
   - ✅ Streams removed, go2rtc reconfigured automatically

### For Administrators (via API)

```bash
# Check system health
curl http://localhost:3001/api/health

# Manual config regeneration
curl -X POST http://localhost:3001/api/config/regenerate

# Restart go2rtc
curl -X POST http://localhost:3001/api/config/restart-go2rtc

# Check go2rtc health
curl http://localhost:3001/api/config/health
```

### For Developers

```javascript
import { configManager } from './services/config-manager.js';

// Trigger config update
await configManager.updateConfiguration();

// Check health
const health = await configManager.healthCheck();
console.log(health);

// Manual process control
await configManager.stopGo2rtc();
await configManager.startGo2rtc();
```

## Configuration

### Debounce Timing
Default: 2 seconds (prevents multiple rapid restarts)

```javascript
// Use default debounce
await configManager.updateConfiguration();

// Custom debounce
await configManager.updateConfiguration({ debounceMs: 5000 });

// No debounce (immediate)
await configManager.updateConfiguration({ debounceMs: 0 });
```

### File Paths
Paths are auto-detected but can be customized:

```javascript
const configManager = new ConfigManager({
  dbPath: '/path/to/config.db',
  go2rtcConfigPath: '/path/to/go2rtc.yaml',
  go2rtcBinaryPath: '/path/to/go2rtc'
});
```

## Error Handling

### Failed Config Generation
- Error logged to console
- Previous config remains intact
- go2rtc continues running with old config

### Failed Restart
- Error logged to console
- User notified via response
- Manual intervention may be required

### go2rtc Not Found
- Clear error message in logs
- Health check returns `status: 'not_running'`
- Admin can start via `/api/config/start-go2rtc`

## Monitoring

### Console Logs
The config manager provides detailed logging:
```
🔧 Generating go2rtc.yaml from database...
Found 2 site(s) in database
✅ Generated go2rtc.yaml with 4 streams
🛑 Stopping go2rtc (PID: 12345)...
✅ go2rtc stopped gracefully
🚀 Starting go2rtc...
✅ go2rtc started (PID: 12346)
```

### Health Endpoint
Monitor system health programmatically:
```bash
watch -n 5 'curl -s http://localhost:3001/api/health | jq .go2rtc'
```

## Benefits

### For Users 👥
- ✅ Zero manual configuration
- ✅ Changes take effect immediately
- ✅ No technical knowledge required
- ✅ Seamless experience

### For Administrators 🛠️
- ✅ Manual override capabilities
- ✅ Health monitoring
- ✅ Centralized control
- ✅ Detailed logging

### For Developers 💻
- ✅ Clean API
- ✅ Reusable service
- ✅ Type-safe (when converted to TS)
- ✅ Well-documented

## Migration Notes

### From Manual Config Management
If you were previously managing configs manually:

1. **Old workflow** (manual):
   ```bash
   # Edit database or config file
   vim config.db
   # Regenerate config
   node backend/scripts/generate-go2rtc-config.js
   # Restart go2rtc
   pkill go2rtc && ./go2rtc -config go2rtc.yaml &
   ```

2. **New workflow** (automatic):
   ```bash
   # Just update via dashboard or API
   curl -X PUT http://localhost:3001/api/sites/1 \
     -H 'Content-Type: application/json' \
     -d '{"camera_url": "rtsp://new-url"}'
   # Everything else happens automatically! ✨
   ```

### Backward Compatibility
- Manual script still works: `npm run go2rtc:generate`
- You can still manually restart go2rtc if needed
- Existing configs are backed up before overwriting

## Future Enhancements

Potential improvements:
- [ ] WebSocket notifications for config updates
- [ ] Stream health monitoring (detect failed cameras)
- [ ] Automatic camera credential testing before applying
- [ ] Config rollback on failed restart
- [ ] Stream analytics (bandwidth, FPS, errors)
- [ ] Multi-server support (orchestrate multiple go2rtc instances)

## Troubleshooting

### Config not updating?
```bash
# Check backend logs
tail -f backend/backend.log

# Manually trigger update
curl -X POST http://localhost:3001/api/config/regenerate
```

### go2rtc not restarting?
```bash
# Check if go2rtc is running
curl http://localhost:1984/api/streams

# Check health
curl http://localhost:3001/api/config/health

# Manual restart
curl -X POST http://localhost:3001/api/config/restart-go2rtc
```

### Streams not working after update?
1. Check camera credentials are correct
2. Verify stream names match in frontend (should be automatic)
3. Check go2rtc logs
4. Test camera RTSP URL manually with ffplay

## API Reference

### Config Manager API

#### POST `/api/config/regenerate`
Regenerate go2rtc.yaml and restart.

**Response**:
```json
{
  "success": true,
  "message": "Configuration regenerated and go2rtc restarted",
  "config": {
    "success": true,
    "streamsCount": 4,
    "sitesCount": 2
  },
  "restart": {
    "success": true,
    "pid": 12346,
    "message": "Restarted successfully"
  }
}
```

#### GET `/api/config/health`
Check go2rtc health.

**Response**:
```json
{
  "success": true,
  "status": "healthy",
  "pid": 12346,
  "streamsCount": 4,
  "message": "go2rtc is running and responding"
}
```

#### POST `/api/config/restart-go2rtc`
Restart go2rtc without regenerating config.

#### POST `/api/config/start-go2rtc`
Start go2rtc if not running.

#### POST `/api/config/stop-go2rtc`
Stop go2rtc gracefully.

---

## Summary

The automated configuration management system makes the demo center **truly plug-and-play**. Users can add, modify, and remove cameras through the dashboard, and everything "just works" behind the scenes. No more manual config files, no more process management, no more friction! 🚀

**The system is now production-ready and provides a professional, seamless experience for both users and administrators.**

