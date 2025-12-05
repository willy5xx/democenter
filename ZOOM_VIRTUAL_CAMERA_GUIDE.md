# Using vendVision as a Virtual Camera in Zoom

> Transform your browser-based demo into a virtual webcam for professional Zoom presentations.

---

## Why This Matters

Instead of awkwardly holding your laptop up to show vending machines on a webcam, you can:
- Share a crisp, professional camera feed directly in Zoom
- Switch between machine views with one click
- Look like you have a dedicated production setup

---

## Method 1: OBS Virtual Camera (Recommended)

### Step 1: Install OBS Studio
Download from https://obsproject.com (free, works on Mac/Windows/Linux)

### Step 2: Configure OBS

1. **Create a new Scene**
   - Click `+` under "Scenes" → Name it "vendVision Demo"

2. **Add Browser Source**
   - Click `+` under "Sources"
   - Select "Browser"
   - Name it "Demo Center"
   - Configure:
     ```
     URL: http://localhost:5173
     Width: 1920
     Height: 1080
     ```
   - Check "Refresh browser when scene becomes active"

3. **Set Output Resolution**
   - Settings → Video
   - Base Resolution: 1920x1080
   - Output Resolution: 1920x1080
   - FPS: 30

### Step 3: Start Virtual Camera
- Click **"Start Virtual Camera"** button in OBS (bottom right)
- OBS is now outputting your browser as a webcam

### Step 4: Select in Zoom
1. Open Zoom → Settings → Video
2. Camera dropdown → Select **"OBS Virtual Camera"**
3. You should see your vendVision presentation as your camera feed

### Pro Tips for OBS
- **Crop if needed**: Right-click source → Transform → Edit Transform
- **Add your face**: Add a second source (your webcam) as picture-in-picture
- **Hotkeys**: Set up hotkeys in OBS to switch scenes during demos

---

## Method 2: Browser Tab Share (Quick & Simple)

If you don't want to install OBS:

### In Zoom:
1. Click "Share Screen"
2. Select the "Advanced" tab
3. Choose "Portion of Screen" or specific Chrome tab
4. Share only the browser window with vendVision

### Limitations:
- Shows as screen share, not as your camera
- Other participants see "screen share" UI
- Less professional looking

---

## Method 3: Chrome Tab Capture Extension

### Setup:
1. Install a Chrome extension like "Tab Capture"
2. Capture the vendVision tab
3. It appears as a virtual camera in Zoom

### Note:
Extension quality varies. OBS is more reliable.

---

## Best Practices for Demo Calls

### Before the Call
- [ ] Start go2rtc: `./go2rtc -config go2rtc.yaml`
- [ ] Start dashboard: `cd dashboard && npm run dev`
- [ ] Open http://localhost:5173 (presentation mode)
- [ ] Start OBS Virtual Camera
- [ ] Test in Zoom settings that video looks good

### During the Call
- Start with "Full View" to show the whole setup
- Click machine buttons to zoom into specific products
- Use the hover controls sparingly (they're for you, not the audience)

### Technical Checklist
- [ ] Wired internet connection (more stable than WiFi)
- [ ] Close unnecessary apps (save CPU for video encoding)
- [ ] Good lighting on your vending machines
- [ ] Camera positioned to see all machines in "Full View"

---

## Troubleshooting

### OBS Virtual Camera not showing in Zoom
- Restart Zoom after starting OBS Virtual Camera
- On Mac: Grant OBS camera permissions in System Preferences
- Try "OBS Virtual Camera" vs "OBS-Camera" (naming varies by version)

### Video is laggy
- Lower OBS output resolution to 1280x720
- Reduce frame rate to 24 FPS
- Close other browser tabs
- Check go2rtc is using hardware acceleration

### Black screen in OBS Browser Source
- Make sure localhost:5173 is accessible
- Check that go2rtc is running (camera feed)
- Try refreshing the browser source in OBS

---

## Alternative: Dedicated Camera Hardware

For the ultimate setup, consider:
- **Elgato Cam Link**: Connect HDMI camera output directly to your computer
- **NDI**: Network-based video input (requires NDI-compatible camera)
- **Capture Card**: Professional video capture devices

These eliminate the browser→OBS pipeline but require hardware investment.

---

## Quick Reference

| Component | URL/Command |
|-----------|-------------|
| Presentation View | http://localhost:5173 |
| Dashboard | http://localhost:5173/dashboard |
| go2rtc Admin | http://localhost:1984 |
| Start Backend | `cd backend && npm start` |
| Start Frontend | `cd dashboard && npm run dev` |
| Start go2rtc | `./go2rtc -config go2rtc.yaml` |










