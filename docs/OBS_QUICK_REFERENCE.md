# OBS Setup - Quick Reference

## 🎯 Goal
Automatically configure OBS Studio to capture vendVision and use it as a virtual camera in Zoom.

## ⚡ Quick Setup (2 Ways)

### 1. Shell Script (Fastest)
```bash
cd /path/to/demo-center
./setup-obs.sh
```

### 2. Dashboard UI (Easiest)
```
1. Start: ./start-dev.sh
2. Open: http://localhost:5173/admin
3. Click: "OBS Setup" tab
4. Click: "Auto-Configure OBS" button
```

## 📦 What Was Created

### Files Created:
```
demo-center/
├── setup-obs.sh                          # Bash automation script
├── backend/
│   ├── scripts/setup-obs.js              # Node.js automation script
│   └── routes/obs-setup.js               # REST API endpoints
├── dashboard/src/components/
│   └── obs-setup-panel.tsx               # React UI component
├── OBS_AUTO_SETUP.md                     # Full documentation
└── README.md                             # Updated with OBS references
```

### API Endpoints Added:
- `GET  /api/obs/status` - Check OBS installation/config status
- `POST /api/obs/setup` - Trigger auto-configuration
- `GET  /api/obs/download-link` - Get platform-specific download URL

### UI Component Added:
- New "OBS Setup" tab in Admin page (`/admin`)
- Shows installation status
- One-click auto-configuration
- Step-by-step instructions
- Links to OBS download and documentation

## 🎬 Using in Zoom

After running setup:
```
1. Launch OBS Studio
2. Click "Start Virtual Camera"
3. In Zoom: Settings → Video → Select "OBS Virtual Camera"
4. Your vendVision presentation now appears as your camera! 🎥
```

## 🔧 What Gets Configured

OBS Scene: "vendVision Demo"
- Browser source: http://localhost:5173
- Resolution: 1920x1080 @ 30 FPS
- Auto-refresh enabled
- Optimized CSS for clean display

## 📚 Documentation

- **Full Guide**: [OBS_AUTO_SETUP.md](./OBS_AUTO_SETUP.md)
- **Zoom Integration**: [ZOOM_VIRTUAL_CAMERA_GUIDE.md](./ZOOM_VIRTUAL_CAMERA_GUIDE.md)
- **Main README**: [README.md](./README.md)

## 🐛 Troubleshooting

**OBS not found?**
→ Install from https://obsproject.com

**Script fails?**
→ Make sure OBS is closed before running setup

**Black screen in OBS?**
→ Make sure vendVision is running (`npm run dev`)

**Not showing in Zoom?**
→ Restart Zoom after starting Virtual Camera

## 💡 Pro Tips

1. **Test before demos**: Always test OBS Virtual Camera in Zoom settings first
2. **Keep OBS running**: Don't close OBS during Zoom calls
3. **Wired connection**: Use ethernet for stable streaming
4. **Close apps**: Free up CPU for better performance

---

That's it! Your OBS is now ready for professional vendVision demos. 🚀

