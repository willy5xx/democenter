# Troubleshooting: Camera 404 Error

## Issue Description

When opening the dashboard, the camera stream fails to load with a **404 error** in the browser console:

```
Failed to load resource: the server responded with a status of 404 (Not Found)
Error starting stream: Error: HTTP error! status: 404
```

The site configuration appears correct in the admin panel, but no video stream appears.

---

## Root Cause

This error occurs when there's a **mismatch between stream names** in the go2rtc configuration and what the frontend expects.

**What the frontend expects:**
- Stream name: `site1_dewarped`

**What go2rtc had configured (incorrect):**
- Stream name: `dewarped` (missing the `site1_` prefix)

### Why This Happened

The original `generate-go2rtc-config.js` script had conditional logic:

```javascript
// OLD (BUGGY) CODE:
const sitePrefix = sites.length > 1 ? `site${site.id}_` : '';
```

This meant:
- **Multi-site setup:** Stream names include prefix → `site1_dewarped`, `site2_dewarped`
- **Single-site setup:** No prefix → `main`, `dewarped`

The frontend **always** expects the prefix, regardless of how many sites exist, causing the 404 error in single-site deployments.

---

## The Fix

### What Was Changed

**File:** `backend/scripts/generate-go2rtc-config.js`

**Before:**
```javascript
const sitePrefix = sites.length > 1 ? `site${site.id}_` : '';
```

**After:**
```javascript
// Always use site prefix for consistency with frontend expectations
const sitePrefix = `site${site.id}_`;
```

Now stream names **always** include the site prefix, ensuring consistency.

---

## How to Apply the Fix

If you encounter this issue, follow these steps:

### 1. Regenerate the go2rtc Configuration

```bash
cd backend
node scripts/generate-go2rtc-config.js
cd ..
```

You should see output like:
```
✅ Generated go2rtc.yaml
📡 Configured streams:
   - site1_main
   - site1_dewarped
```

### 2. Verify the Configuration

Check `go2rtc.yaml` - you should see:

```yaml
streams:
  site1_main:
    - rtsp://username:password@ip:554/stream1
  site1_dewarped:
    - ffmpeg:site1_main#video=h264#...
```

**Note:** The stream names should have the `site1_` prefix!

### 3. Restart go2rtc

```bash
# Kill existing go2rtc process
pkill go2rtc

# Start go2rtc with the updated config
./go2rtc -config go2rtc.yaml &
```

Or simply restart everything:
```bash
./start-vendvision.sh
```

### 4. Verify the Streams

1. Open http://localhost:1984 (go2rtc admin)
2. You should see:
   - `site1_main`
   - `site1_dewarped`
3. Click on `site1_dewarped` to test the stream
4. If video plays here, refresh your dashboard at http://localhost:5173

---

## Prevention

This fix has been applied to the codebase. Future deployments will automatically use the correct stream naming convention.

### Use the Verification Script

Before starting the demo, run:

```bash
./verify-setup.sh
```

This script checks for common configuration issues, including incorrect stream naming.

---

## Quick Checklist

If you encounter a 404 camera error:

- [ ] Check if go2rtc is running: http://localhost:1984
- [ ] Verify stream names in go2rtc admin (should be `site1_main` and `site1_dewarped`)
- [ ] If stream names are wrong, regenerate config: `cd backend && node scripts/generate-go2rtc-config.js`
- [ ] Restart go2rtc: `pkill go2rtc && ./go2rtc -config go2rtc.yaml &`
- [ ] Test stream directly in go2rtc admin
- [ ] Refresh dashboard

---

## Related Files

- `backend/scripts/generate-go2rtc-config.js` - Generates stream configuration
- `dashboard/src/components/camera-view-virtual-ptz.tsx:331` - Frontend stream connection
- `go2rtc.yaml` - go2rtc configuration file

---

## For Developers

The frontend expects streams to be named `site${site.id}_dewarped` as seen in:

```typescript
// dashboard/src/components/camera-view-virtual-ptz.tsx:331
const streamName = `site${site.id}_dewarped`
```

The backend must generate matching stream names in `go2rtc.yaml`. Always use the `site${id}_` prefix for consistency, even in single-site deployments.

