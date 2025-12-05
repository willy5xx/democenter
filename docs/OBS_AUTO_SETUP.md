# OBS Auto-Setup for vendVision

> **One-click OBS configuration** for professional Zoom demos using vendVision as a virtual camera.

---

## 🎯 What This Does

This automation system configures OBS Studio to capture your vendVision browser window and output it as a virtual webcam. This allows you to use vendVision directly in Zoom calls, appearing as if you're using a dedicated camera setup.

### Benefits
- ✅ **Professional presentation** - No awkward screen sharing
- ✅ **One-click setup** - Automated configuration in seconds
- ✅ **Perfect settings** - Optimized for 1080p@30fps demos
- ✅ **Zoom integration** - Appears as a regular camera in Zoom

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install OBS Studio
1. Download from [obsproject.com](https://obsproject.com)
2. Install and launch it once (to create config directories)
3. Close OBS

### Step 2: Run Auto-Setup

Choose one of three methods:

#### **Option A: Dashboard UI (Easiest)**
1. Start vendVision: `../start-vendvision.sh`
2. Open dashboard: `http://localhost:5173/admin`
3. Click the "OBS Setup" tab
4. Click "Auto-Configure OBS"

#### **Option B: Shell Script**
```bash
cd /path/to/demo-center
./setup-obs.sh
```

#### **Option C: Node.js Script**
```bash
cd backend
node scripts/setup-obs.js
```

### Step 3: Use in Zoom
1. Launch OBS Studio
2. Click **"Start Virtual Camera"** (bottom-right)
3. Open Zoom → Settings → Video
4. Select **"OBS Virtual Camera"** from camera dropdown

---

## 📋 What Gets Configured

The automation creates:

### 1. **OBS Profile: "vendVision"**
- Base resolution: 1920x1080
- Output resolution: 1920x1080
- Frame rate: 30 FPS
- Audio: Stereo @ 44.1kHz

### 2. **Scene: "vendVision Demo"**
- Browser source pointing to `http://localhost:5173`
- Optimized refresh settings
- Full-screen layout

### 3. **Browser Source Settings**
```
URL: http://localhost:5173
Width: 1920
Height: 1080
FPS: 30
CSS: body { margin: 0px auto; overflow: hidden; }
Refresh: Enabled on scene activation
```

---

## 🎬 Usage During Demos

### Pre-Call Checklist
```bash
# 1. Start backend services
cd backend && npm start

# 2. Start frontend
cd dashboard && npm run dev

# 3. Start go2rtc (camera streams)
./go2rtc -config go2rtc.yaml

# 4. Start OBS Virtual Camera
# (Launch OBS and click "Start Virtual Camera")

# 5. Test in Zoom settings
# Settings → Video → OBS Virtual Camera should show vendVision
```

### During the Call
1. **Start with overview**: Full machine view
2. **Zoom into machines**: Click machine buttons for close-ups
3. **Switch between views**: Use navigation to show different angles
4. **Keep it smooth**: Let animations complete before switching

---

## 🛠 Advanced Configuration

### Add Your Webcam as Picture-in-Picture
1. In OBS, click **+ (Add Source)** → **Video Capture Device**
2. Select your webcam
3. Right-click → Transform → Edit Transform
4. Resize and position in corner

### Adjust Performance Settings
If video is laggy:

**Lower Resolution:**
- OBS → Settings → Video
- Output Resolution: `1280x720`

**Lower Frame Rate:**
- Settings → Video
- FPS: `24`

**Close Background Apps:**
- Free up CPU for video encoding

### Custom Scenes
Add multiple scenes for different demo styles:

1. **Full Screen**: Entire vendVision window
2. **Product Focus**: Zoomed into one machine
3. **Split Screen**: Multiple camera feeds side-by-side

---

## 🔧 API Endpoints

The backend provides REST endpoints for programmatic control:

### Check OBS Status
```bash
curl http://localhost:3001/api/obs/status
```

**Response:**
```json
{
  "success": true,
  "obs": {
    "installed": true,
    "running": false,
    "configured": true,
    "configDir": "/Users/you/Library/Application Support/obs-studio"
  }
}
```

### Trigger Auto-Setup
```bash
curl -X POST http://localhost:3001/api/obs/setup
```

**Response:**
```json
{
  "success": true,
  "message": "OBS has been configured successfully",
  "nextSteps": [
    "Launch OBS Studio",
    "Click 'Start Virtual Camera'",
    "Open Zoom → Settings → Video",
    "Select 'OBS Virtual Camera'"
  ]
}
```

### Get Download Link
```bash
curl http://localhost:3001/api/obs/download-link
```

---

## 🐛 Troubleshooting

### "OBS Virtual Camera not showing in Zoom"
**Solution:**
1. Make sure Virtual Camera is started in OBS
2. Restart Zoom after starting Virtual Camera
3. On Mac: Check System Preferences → Security & Privacy → Camera
4. Grant OBS camera permissions

### "Black screen in OBS Browser Source"
**Causes & Fixes:**
- ❌ vendVision not running → Start: `npm run dev`
- ❌ Wrong URL → Should be `http://localhost:5173`
- ❌ Port conflict → Check Vite is using port 5173
- ✅ Right-click source → Refresh

### "Video is choppy/laggy"
**Performance Optimization:**
1. Close unused browser tabs
2. Lower OBS output resolution (Settings → Video → 1280x720)
3. Reduce FPS (Settings → Video → 24 FPS)
4. Check `go2rtc` hardware acceleration is enabled
5. Use wired ethernet instead of WiFi

### "Setup script fails"
**Common Issues:**

**OBS Not Installed:**
```
❌ OBS Studio not found!
```
→ Install from https://obsproject.com

**OBS Running:**
```
⚠️  OBS is currently running!
```
→ Close OBS and run setup again

**Permission Denied:**
```bash
chmod +x setup-obs.sh
./setup-obs.sh
```

### "Can't find vendVision scene in OBS"
**Manual Fix:**
1. The scene is in the scene collection called "vendVision"
2. In OBS: Scene Collection → vendVision
3. Or re-run the setup script

---

## 📱 Platform-Specific Notes

### macOS
- Default config location: `~/Library/Application Support/obs-studio`
- May need to grant camera permissions in System Preferences
- Virtual Camera plugin is built-in (OBS 26.1+)

### Linux
- Default config location: `~/.config/obs-studio`
- Install via package manager: `sudo apt install obs-studio`
- Ensure v4l2loopback is installed for virtual camera

### Windows
- Config location: `%APPDATA%\obs-studio`
- Virtual Camera built-in (OBS 26.0+)
- Run PowerShell scripts as Administrator if needed

---

## 🔗 Integration with vendVision

The OBS setup is designed to work seamlessly with vendVision's presentation mode:

### Presentation Mode Features
- **Full-screen layout**: No distracting UI elements
- **Smooth transitions**: Professional zoom animations
- **Machine focus**: One-click to zoom individual machines
- **Virtual PTZ**: Software-based pan/tilt/zoom controls

### Calibration Integration
The setup uses machine regions from your calibration:
1. Configure machines in: `http://localhost:5173/admin/calibrate`
2. OBS captures the entire window
3. vendVision handles zooming/cropping via Virtual PTZ
4. Result: Professional, stable camera movements

---

## 🎓 Best Practices

### Before Important Demos
1. ✅ Test OBS Virtual Camera in Zoom settings
2. ✅ Verify all camera streams are working
3. ✅ Check lighting on physical machines
4. ✅ Close unnecessary applications
5. ✅ Use wired internet connection
6. ✅ Have backup: Traditional screen share ready

### During Demos
- 🎯 Start with full overview to establish context
- 🎯 Use machine buttons for deliberate zooms
- 🎯 Let animations complete before switching
- 🎯 Narrate what you're showing ("Now let's zoom into...")
- 🎯 Keep OBS running in background (don't close it!)

### After Demos
- 💾 Stop Virtual Camera in OBS (saves CPU)
- 💾 Save OBS scenes if you customized them
- 💾 Review recording if you used OBS recording feature

---

## 📚 Additional Resources

### Documentation
- [OBS Studio Documentation](https://obsproject.com/kb)
- [Zoom Virtual Camera Guide](./ZOOM_VIRTUAL_CAMERA_GUIDE.md)

### Scripts Included
- `setup-obs.sh` - Bash script for Mac/Linux
- `backend/scripts/setup-obs.js` - Node.js script
- `backend/routes/obs-setup.js` - REST API endpoints
- Dashboard component: `obs-setup-panel.tsx`

### Support
If you encounter issues not covered here:
1. Check OBS logs: Help → Log Files → View Current Log
2. Check backend logs: `backend/backend.log`
3. Test browser source manually in OBS
4. Verify vendVision is accessible at `localhost:5173`

---

## 🚢 Deployment Notes

### Production Considerations
- Change browser source URL to production URL
- Adjust resolution for available bandwidth
- Consider hardware encoding for better performance
- Set up OBS profiles for different demo scenarios

### Multi-Presenter Setup
Each presenter needs:
- OBS installed and configured
- vendVision running locally
- Virtual Camera enabled
- Zoom using OBS Virtual Camera

### Remote Demos
For remote machine viewing:
- Configure camera streams with authentication
- Use VPN if accessing internal cameras
- Test bandwidth before live demos
- Have local recording as backup

---

## 🎉 Quick Reference

| Task | Command/Action |
|------|----------------|
| **Auto-setup OBS** | `./setup-obs.sh` or Dashboard UI |
| **Check OBS status** | `curl localhost:3001/api/obs/status` |
| **Start Virtual Camera** | Click button in OBS |
| **Select in Zoom** | Settings → Video → OBS Virtual Camera |
| **Test setup** | Open Zoom settings before call |
| **Troubleshoot** | Check backend logs & OBS logs |

**That's it!** You're ready for professional vendVision demos in Zoom. 🎥✨

