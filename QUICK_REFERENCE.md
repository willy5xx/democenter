# Quick Reference - Multi-Site Demo Center

## 🚀 Starting the System

```bash
# Easiest way - use the startup script:
./start-vendvision.sh

# Or manually:
# 1. Start go2rtc
./go2rtc -config go2rtc.yaml &

# 2. Start backend
cd backend && npm start

# 3. Start frontend (new terminal)
cd dashboard && npm run dev
```

## 🎯 Common Tasks

### Add a New Camera Site
1. Open http://localhost:5173
2. Admin → Sites Settings
3. Click "Add Site"
4. Fill in details:
   - Name: "My New Camera"
   - Camera URL: `rtsp://user:pass@ip:port/stream1`
   - Type: RTSP
5. Save
✅ Config auto-regenerates, go2rtc restarts, stream ready!

### Update Camera Credentials
1. Admin → Sites Settings
2. Select site
3. Update Camera URL
4. Save
✅ Automatic reconnection with new credentials

### Switch Between Sites
1. Use site selector dropdown in any view
2. Stream automatically switches

## 🔧 Troubleshooting

### Streams Not Working?
```bash
# Check health
curl http://localhost:3001/api/health

# Check go2rtc streams
curl http://localhost:1984/api/streams

# Check which sites are configured
curl http://localhost:3001/api/sites
```

### Manual Config Regeneration
```bash
# Via API
curl -X POST http://localhost:3001/api/config/regenerate

# Via script
cd backend
npm run go2rtc:generate
```

### Camera Authentication Failed (401)?
```bash
# Test credentials manually with ffplay
ffplay rtsp://username:password@camera-ip:554/stream1

# Or re-run the setup wizard to update credentials
cd backend && node scripts/setup-wizard.js
```

### go2rtc Not Running?
```bash
# Check process
ps aux | grep go2rtc

# Start via API
curl -X POST http://localhost:3001/api/config/start-go2rtc

# Or start manually
./go2rtc -config go2rtc.yaml &
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3001/api/health | jq
```

### Watch go2rtc Status
```bash
watch -n 5 'curl -s http://localhost:3001/api/config/health | jq'
```

### View Backend Logs
```bash
tail -f backend/backend.log
```

## 🗄️ Database Queries

```bash
cd backend

# List all sites
sqlite3 db/config.db "SELECT * FROM sites;"

# List machine regions
sqlite3 db/config.db "SELECT * FROM machine_regions;"

# Update site camera URL
sqlite3 db/config.db "UPDATE sites SET camera_url = 'rtsp://...' WHERE id = 1;"

# After manual DB changes, trigger config update
curl -X POST http://localhost:3001/api/config/regenerate
```

## 📡 Stream URLs

| Site | Main Stream | Dewarped Stream | WebRTC |
|------|------------|-----------------|--------|
| Site 1 | http://localhost:1984/stream.html?src=site1_main | http://localhost:1984/stream.html?src=site1_dewarped | Used by dashboard |
| Site 2 | http://localhost:1984/stream.html?src=site2_main | http://localhost:1984/stream.html?src=site2_dewarped | Used by dashboard |

## 🎪 Demo Scenarios

### Scenario 1: Single Site Demo
- Use Site 2 (capella tower) - working credentials
- Show Full View + machine regions
- Demonstrate Virtual PTZ smooth transitions

### Scenario 2: Multi-Site Demo
- Switch between Site 1 and Site 2
- Show different machine configurations per site
- Demonstrate site selector in action

### Scenario 3: Configuration Demo
- Open Sites Settings
- Add a new site live
- Show automatic stream creation
- Delete site, show automatic cleanup

## 🔑 Configuration

### Ports
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- go2rtc WebRTC: ws://localhost:8555
- go2rtc API: http://localhost:1984

## ⚡ Quick Fixes

### Reset Everything
```bash
# Stop all processes
pkill go2rtc
pkill -f "node.*server.js"

# Regenerate config
cd backend
npm run go2rtc:generate

# Restart
cd ..
./go2rtc -config go2rtc.yaml &
cd backend && npm start &
cd ../dashboard && npm run dev
```

### Start Fresh Database
```bash
cd backend
rm db/config.db*
npm run db:migrate
npm run db:seed
npm run go2rtc:generate
```

## 📝 API Endpoints

### Sites
- `GET /api/sites` - List all sites
- `POST /api/sites` - Create site (auto-regenerates config)
- `PUT /api/sites/:id` - Update site (auto-regenerates config)
- `DELETE /api/sites/:id` - Delete site (auto-regenerates config)

### Configuration
- `POST /api/config/regenerate` - Regenerate and restart
- `GET /api/config/health` - go2rtc health status
- `POST /api/config/restart-go2rtc` - Restart go2rtc
- `POST /api/config/start-go2rtc` - Start if stopped
- `POST /api/config/stop-go2rtc` - Stop gracefully

### Health
- `GET /api/health` - Full system health (includes go2rtc)

### Machine Regions
- `GET /api/machine-regions?site_id=1` - List regions for site
- `POST /api/machine-regions` - Create region
- `PUT /api/machine-regions/:id` - Update region
- `DELETE /api/machine-regions/:id` - Delete region

## 🎨 Dashboard Routes

- `/` - Demo landing page
- `/admin` - Admin dashboard
- `/admin/sites` - Sites configuration
- `/admin/calibrate` - Machine region calibration
- `/clients/huel` - Huel branded dashboard
- `/clients/redbull` - Red Bull branded dashboard
- `/presentation` - Presentation mode

---

**Pro Tip**: Bookmark this page and the health check endpoint for quick reference during demos!

