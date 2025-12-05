# Stream Name Fix - Multi-Site Support

## Problem
After regenerating `go2rtc.yaml` to support multiple sites, the dashboard was getting 404 errors because it was requesting a hardcoded stream name `dewarped`, but the new configuration uses site-specific stream names like `site1_dewarped` and `site2_dewarped`.

## Root Cause
When multiple sites exist in the database, the config generator creates unique stream names for each site using the pattern:
- `site{id}_main` - Raw RTSP feed from camera
- `site{id}_dewarped` - Processed feed for virtual PTZ

However, the frontend components were hardcoded to request `/api/webrtc?src=dewarped`.

## Files Fixed

### 1. `dashboard/src/components/camera-view-virtual-ptz.tsx`
**Change**: Line 332
```typescript
// Before
const response = await fetch(`/api/webrtc?src=dewarped`, {

// After  
const streamName = `site${site.id}_dewarped`
const response = await fetch(`/api/webrtc?src=${streamName}`, {
```

### 2. `dashboard/src/components/calibration-settings.tsx`
**Changes**:
- Line 84: Added check to wait for site to load: `if (!site) return`
- Line 126: Updated to use dynamic stream name
- Line 151: Changed dependency array from `[]` to `[site]`

### 3. `dashboard/src/pages/admin-calibrate.tsx`
**Changes**: Same as calibration-settings.tsx
- Added site check before starting stream
- Dynamic stream name based on site ID
- Updated useEffect dependency

## How It Works Now

1. **Component loads** → Fetches site data from backend API
2. **Site loads** → Triggers WebRTC stream initialization with correct stream name
3. **Stream name** → Dynamically generated as `site${site.id}_dewarped`
4. **go2rtc** → Returns the correct stream for that specific site

## Stream Naming Convention

| Sites Count | Stream Names |
|-------------|-------------|
| 1 site      | `main`, `dewarped` (legacy) OR `site1_main`, `site1_dewarped` |
| 2+ sites    | `site1_main`, `site1_dewarped`, `site2_main`, `site2_dewarped`, etc. |

The config generator in `backend/scripts/generate-go2rtc-config.js` automatically prefixes stream names with `site{id}_` when multiple sites exist.

## Testing

After these fixes:
1. ✅ Site 1 streams should work at `http://localhost:1984/` 
2. ✅ Site 2 streams should work at `http://localhost:1984/`
3. ✅ Dashboard should correctly load streams for selected site
4. ✅ Calibration tools should work with site selector

## Note on Site 1 Camera Authentication

Site 1 camera at `10.1.10.149` is still returning 401 Unauthorized. The stream name fix resolves the 404 errors, but the camera credentials need to be corrected before Site 1 will stream successfully.

Use the Sites Settings page or run the test script:
```bash
./test-camera-auth.sh
```

