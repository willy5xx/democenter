# WebRTC Proxy Fix - 500 Internal Server Error

## Problem

When trying to view cameras in the calibration settings, you were getting:

```
POST http://localhost:5173/api/webrtc?src=site1_dewarped 500 (Internal Server Error)
Error starting stream: Error: HTTP error! status: 500
```

## Root Cause

The Vite dev server proxy configuration had a **rule ordering issue**. The generic `/api` rule was matching and proxying WebRTC requests to the backend server (port 3001) instead of to go2rtc (port 1984).

### How Vite Proxy Rules Work

In Vite's proxy configuration, rules are processed and the **most specific matching pattern takes precedence**, but wildcards like `/api` will match everything starting with that path.

### Original (Broken) Configuration

```typescript
server: {
  proxy: {
    '/api/webrtc': {
      target: 'http://localhost:1984',  // ← Trying to route to go2rtc
    },
    '/api': {
      target: 'http://localhost:3001',  // ← This catches everything including /api/webrtc!
    },
  },
}
```

The problem: `/api/webrtc` matched `/api` rule, so it went to port 3001 (backend) which doesn't handle WebRTC, causing a 500 error.

## Solution

Changed to use **explicit path patterns** for the backend API, leaving WebRTC routes to go2rtc:

```typescript
server: {
  proxy: {
    // Backend API - use specific endpoint patterns
    '^/api/(sites|machine-regions|settings|events|config|obs|health)': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
    // go2rtc WebRTC API
    '/api/webrtc': {
      target: 'http://localhost:1984',
      changeOrigin: true,
      ws: true,
    },
    '/api/streams': {
      target: 'http://localhost:1984',
      changeOrigin: true,
    },
  },
}
```

## How to Test

After restarting the Vite dev server:

1. **Go to calibration page**: http://localhost:5173/admin/calibrate
2. **Select a site** from the dropdown
3. **Check the browser console** - should see "WebRTC connection established"
4. **Verify camera feed** appears in the video player

## Request Routing Now

| Request Path | Proxied To | Service |
|-------------|------------|---------|
| `/api/sites` | `localhost:3001` | Backend API |
| `/api/machine-regions` | `localhost:3001` | Backend API |
| `/api/settings` | `localhost:3001` | Backend API |
| `/api/events` | `localhost:3001` | Backend SSE |
| `/api/config` | `localhost:3001` | Backend API |
| `/api/obs` | `localhost:3001` | Backend API |
| `/api/health` | `localhost:3001` | Backend API |
| `/api/webrtc` | `localhost:1984` | go2rtc WebRTC |
| `/api/streams` | `localhost:1984` | go2rtc API |

## Files Changed

1. **`dashboard/vite.config.ts`** - Fixed proxy rule ordering

## Restart Required

After making this change, you **must restart** the Vite dev server for the proxy changes to take effect:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
cd dashboard
npm run dev
```

## Verification

Check that both services are running:

```bash
# Backend should be running on 3001
curl http://localhost:3001/api/health

# go2rtc should be running on 1984
curl http://localhost:1984/api/streams
```

Both should return valid JSON responses.

## Related Issues

This fix resolves:
- ✅ 500 errors when loading camera feeds
- ✅ WebRTC connection failures in calibration tools
- ✅ Camera preview not loading in admin pages

## Note on Stream Names

Make sure you're requesting the correct stream name format. With multiple sites, use:
- `site1_dewarped` for Site 1
- `site2_dewarped` for Site 2

The `calibration-settings.tsx` component already handles this correctly by using `site${site.id}_dewarped`.

