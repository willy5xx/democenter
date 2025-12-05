# Webcam Setup for Virtual PTZ Testing

## Quick Setup (Without go2rtc)

Since you don't have a wifi camera right now, here are the best options for testing:

### Option 1: Install go2rtc via Homebrew (Recommended)

```bash
# Install go2rtc
brew install go2rtc

# Start go2rtc with your config
cd /Users/willleifker/src/vendVision/packages/demo-center
go2rtc -config go2rtc.yaml
```

Then access:
- go2rtc web UI: http://localhost:1984/
- Virtual PTZ dashboard: http://localhost:5173/

### Option 2: Use Docker (If you have Docker Desktop)

1. Start Docker Desktop
2. Create a docker-compose.yml:

```bash
cd /Users/willleifker/src/vendVision/packages/demo-center
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  go2rtc:
    image: alexxit/go2rtc:latest
    ports:
      - "1984:1984"  # API
      - "8555:8555"  # WebRTC
    volumes:
      - ./go2rtc.yaml:/config/go2rtc.yaml
    devices:
      - /dev/video0:/dev/video0  # Webcam access
    restart: unless-stopped
EOF

docker-compose up -d
```

### Option 3: Use a Test Video URL (Easiest - No Camera Needed!)

Use a public test stream for now:

```bash
cd backend
sqlite3 db/config.db "UPDATE sites SET camera_url = 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8' WHERE id = 1;"
npm run go2rtc:generate
```

### Option 4: Browser Webcam (For UI Testing Only)

The Virtual PTZ UI works, but you won't see a live camera feed until go2rtc is running. You can still:
- Test the calibration tool interface
- Test machine region drawing
- Test transition animations (won't zoom on actual video though)

## Current Database Config

Your camera is currently set to:
```
camera_url: avfoundation:0
camera_type: webcam
```

This will work once go2rtc is running!

## Recommended Next Steps

1. **Install go2rtc**: `brew install go2rtc` (fastest option)
2. **Start go2rtc**: `go2rtc -config go2rtc.yaml`
3. **Verify stream**: Visit http://localhost:1984/ and click on "dewarped" stream
4. **Open dashboard**: http://localhost:5173/
5. **Calibrate regions**: http://localhost:5173/admin/calibrate

## Troubleshooting

### Camera Permission Error
If go2rtc can't access your camera:
1. System Settings → Privacy & Security → Camera
2. Add Terminal (or your terminal app) to allowed apps

### Stream Not Showing
- Check go2rtc is running: `curl http://localhost:1984/api`
- Check camera URL in database: `sqlite3 backend/db/config.db "SELECT camera_url FROM sites;"`
- View go2rtc logs for errors

## Test Without Camera

You can test the entire Virtual PTZ system using any RTSP stream or video file:

```bash
# Example: Use Big Buck Bunny test video
cd backend
sqlite3 db/config.db "UPDATE sites SET camera_url = 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4' WHERE id = 1;"
npm run go2rtc:generate
```

Then restart go2rtc and it will work!

