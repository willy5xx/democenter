# Virtual PTZ Architecture Upgrade

## Overview

This document describes the new virtual PTZ (Pan-Tilt-Zoom) architecture that replaces the old multi-stream system with a single-stream, client-side transform approach.

## Architecture Changes

### Before (Old System)
- **Multi-stream approach**: Server-side FFmpeg crops generated separate streams for each machine
- **Stream switching**: Switching between machines required WebRTC reconnection
- **High latency**: 2-5 second switching lag, black frames during transitions
- **High server load**: Multiple FFmpeg processes for each cropped region
- **Configuration**: Manual JSON editing required

### After (New System)
- **Single stream**: One dewarped 1920x1080 stream
- **Virtual PTZ**: CSS transforms (scale + translate) applied client-side
- **Instant switching**: 0ms latency, smooth transitions with configurable easing
- **Low server load**: Single FFmpeg process for dewarping
- **Configuration**: Visual calibration tool with click-and-drag region drawing

## Key Components

### Backend (Node.js + Express + SQLite)

Located in `/backend/`:

1. **Database** (`db/config.db`)
   - `sites`: Camera configurations
   - `machine_regions`: Virtual PTZ regions with coordinates
   - `settings`: Global settings (transition styles, etc.)

2. **REST API** (`routes/`)
   - `GET/POST/PUT/DELETE /api/sites`
   - `GET/POST/PUT/DELETE /api/machine-regions`
   - `GET/PUT /api/settings`

3. **SSE (Server-Sent Events)** (`routes/sse.js`)
   - Real-time config updates pushed to all connected clients
   - `/api/events` endpoint

4. **Scripts**
   - `npm run db:migrate` - Run database migrations
   - `npm run db:seed` - Seed with initial data from old config

### Frontend (React + TypeScript)

Located in `/dashboard/src/`:

1. **Virtual PTZ Component** (`components/camera-view-virtual-ptz.tsx`)
   - Connects to single WebRTC stream
   - Calculates CSS transforms for each region
   - Supports multiple transition styles (smooth, instant, bounce, slow)
   - Shows FPS and latency stats

2. **Calibration Tool** (`pages/admin-calibrate.tsx`)
   - Visual region editor with click-and-drag
   - Live camera preview
   - Real-time region management (create, edit, delete)
   - Auto-saves to database

3. **Routes**
   - `/` - Main dashboard with virtual PTZ
   - `/admin/calibrate` - Region calibration tool
   - `/demo` - Demo landing page (unchanged)

## Installation & Setup

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (if needed)
cd ../dashboard
npm install
```

### 2. Initialize Database

```bash
cd backend
npm run db:migrate
npm run db:seed
```

This will:
- Create SQLite database at `backend/db/config.db`
- Run migrations to create tables
- Import existing machine regions from `machine-config.json`

### 3. Start Backend

```bash
cd backend
npm start
```

Backend runs on `http://localhost:3001`

### 4. Start Frontend

```bash
cd dashboard
npm run dev
```

Frontend runs on `http://localhost:5173`

## Usage

### Calibrating Machine Regions

1. Navigate to `http://localhost:5173/admin/calibrate`
2. Wait for camera stream to load
3. Click and drag on the video to draw a rectangle around each machine
4. Fill in the machine name and icon (emoji)
5. Click "Save Region"
6. Repeat for each machine

### Using Virtual PTZ

1. Navigate to main dashboard at `http://localhost:5173/`
2. Camera view will show the full dewarped stream
3. Click any machine button at the bottom to instantly zoom into that region
4. Click "Full View" to zoom back out
5. Transitions are smooth (300ms by default)

### Configuring Transition Styles

Transition styles can be configured via the backend API:

```bash
# Smooth transition (default)
curl -X PUT http://localhost:3001/api/settings/transition_style \
  -H "Content-Type: application/json" \
  -d '{"value": "smooth"}'

# Instant snap
curl -X PUT http://localhost:3001/api/settings/transition_style \
  -H "Content-Type: application/json" \
  -d '{"value": "instant"}'

# Slow smooth
curl -X PUT http://localhost:3001/api/settings/transition_style \
  -H "Content-Type: application/json" \
  -d '{"value": "slow"}'

# Bouncy
curl -X PUT http://localhost:3001/api/settings/transition_style \
  -H "Content-Type: application/json" \
  -d '{"value": "bounce"}'
```

## API Reference

### Sites

```bash
# List all sites
GET /api/sites

# Get single site
GET /api/sites/:id

# Create site
POST /api/sites
{
  "name": "Demo Center Site 1",
  "camera_url": "rtsp://camera.local/stream",
  "camera_type": "generic",
  "dewarp_params": { "cx": 0.5, "cy": 0.5, "k1": -0.23, "k2": -0.02 },
  "stream_resolution": "1920x1080"
}

# Update site
PUT /api/sites/:id

# Delete site
DELETE /api/sites/:id
```

### Machine Regions

```bash
# List all regions for a site
GET /api/machine-regions?site_id=1

# Get single region
GET /api/machine-regions/:id

# Create region
POST /api/machine-regions
{
  "site_id": 1,
  "name": "Machine 1",
  "icon": "📦",
  "x": 612,
  "y": 176,
  "width": 346,
  "height": 586,
  "is_default": false,
  "display_order": 0
}

# Update region
PUT /api/machine-regions/:id

# Delete region
DELETE /api/machine-regions/:id

# Bulk reorder
PUT /api/machine-regions/bulk/reorder
{
  "regions": [
    { "id": 1, "order": 0 },
    { "id": 2, "order": 1 },
    { "id": 3, "order": 2 }
  ]
}
```

### Settings

```bash
# Get all settings
GET /api/settings

# Get single setting
GET /api/settings/:key

# Update setting
PUT /api/settings/:key
{
  "value": "smooth"
}

# Delete setting
DELETE /api/settings/:key
```

### Server-Sent Events (SSE)

```javascript
// Connect to SSE endpoint
const eventSource = new EventSource('http://localhost:3001/api/events')

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Config update:', data)
  
  // Event types:
  // - connected
  // - site_created, site_updated, site_deleted
  // - region_created, region_updated, region_deleted
  // - regions_reordered
  // - setting_updated, setting_deleted
}
```

## Technical Details

### Virtual PTZ Transform Calculation

For a given machine region:

```typescript
// Source video is 1920x1080
const sourceWidth = 1920
const sourceHeight = 1080

// Calculate scale to fill container with the region
const scaleX = sourceWidth / region.width
const scaleY = sourceHeight / region.height
const scale = Math.min(scaleX, scaleY)

// Calculate translation to center the region
const regionCenterX = region.x + region.width / 2
const regionCenterY = region.y + region.height / 2

const translateX = ((sourceWidth / 2 - regionCenterX) / sourceWidth) * 100
const translateY = ((sourceHeight / 2 - regionCenterY) / sourceHeight) * 100

// Apply transform
element.style.transform = `scale(${scale}) translate(${translateX}%, ${translateY}%)`
element.style.transition = `transform 300ms ease-out`
```

### Database Schema

```sql
-- Sites table
CREATE TABLE sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  camera_url TEXT NOT NULL,
  camera_type TEXT DEFAULT 'generic',
  dewarp_params TEXT DEFAULT '{}',
  stream_resolution TEXT DEFAULT '1920x1080',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Machine regions table
CREATE TABLE machine_regions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📦',
  x REAL NOT NULL,
  y REAL NOT NULL,
  width REAL NOT NULL,
  height REAL NOT NULL,
  is_default INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Settings table
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

## Benefits

1. **Zero latency switching**: No more 2-5 second delays
2. **Smooth transitions**: Configurable easing curves for professional appearance
3. **Lower server load**: Single FFmpeg process instead of multiple
4. **Better UX**: Visual calibration tool instead of manual JSON editing
5. **Hot-reload**: Changes propagate instantly to all viewers via SSE
6. **Scalable**: Supports multiple sites with isolated configurations
7. **Production-ready**: SQLite database with migrations and proper API

## Limitations & Future Work

1. **Single camera per site**: Currently supports one camera stream per site
2. **Manual calibration**: Regions must be drawn manually (no auto-detection yet)
3. **Fixed stream**: Hardcoded to `tapo_dewarped` stream name
4. **Dev settings UI**: Transition style selector not yet in dashboard UI

## Migration from Old System

The old system data is automatically migrated when you run `npm run db:seed`. The seed script reads the existing `machine-config.json` and imports all machine regions into the database.

To revert to the old system:
1. Checkout the previous git commit before this upgrade
2. The old `machine-config.json` is preserved
3. go2rtc.yaml will need to be regenerated for multi-stream approach

## Testing

### Test Backend API

```bash
# Health check
curl http://localhost:3001/api/health

# List sites
curl http://localhost:3001/api/sites

# List regions
curl 'http://localhost:3001/api/machine-regions?site_id=1'
```

### Test SSE

```bash
# Listen to SSE events (requires curl with SSE support or browser)
curl -N http://localhost:3001/api/events
```

## Support

For issues or questions, contact the development team or refer to the PRD at `PRD_virtual_ptz_upgrade.md`.

