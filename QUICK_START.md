# Virtual PTZ - Quick Start Guide

## 🚀 Get Started in 3 Minutes

### 1. Start the Backend (Terminal 1)

```bash
cd backend
npm start
```

You should see:
```
✅ Database ready
🚀 vendVision Virtual PTZ Backend
🌐 Server: http://localhost:3001
```

### 2. Start the Frontend (Terminal 2)

```bash
cd dashboard
npm run dev
```

You should see:
```
VITE ready
Local: http://localhost:5173/
```

### 3. Open in Browser

- **Main Dashboard**: http://localhost:5173/
- **Calibration Tool**: http://localhost:5173/admin/calibrate

---

## 🎯 Key Features

### Instant Machine Switching
Click any machine button at the bottom of the camera view - switches instantly with smooth animations!

### Visual Calibration
1. Go to http://localhost:5173/admin/calibrate
2. Click and drag to draw boxes around machines
3. Name them and save
4. Changes appear instantly on all dashboards

### Dev Settings Panel
Press `Cmd+Shift+D` (or `Ctrl+Shift+D` on Windows) to access:
- Transition style selector
- Animation duration slider
- FPS overlay toggle
- Region boundaries toggle

---

## 📱 Try It Out

1. **Test the Virtual PTZ**:
   - Open http://localhost:5173/
   - Click different machine buttons
   - Watch the smooth zoom transitions

2. **Add a New Machine Region**:
   - Open http://localhost:5173/admin/calibrate
   - Draw a box around a new machine
   - Fill in the name (e.g., "Snack Machine") and icon (e.g., 🍫)
   - Click "Save Region"
   - Go back to dashboard - your new machine appears instantly!

3. **Change Transition Style**:
   - On the dashboard, press `Cmd+Shift+D`
   - Select "Bounce" from the transition style dropdown
   - Close the panel
   - Click machine buttons - enjoy the bouncy animation!

---

## 🔧 Useful Commands

```bash
# Backend
npm start                    # Start server
npm run db:migrate          # Run migrations
npm run db:seed             # Seed database
npm run go2rtc:generate     # Generate go2rtc.yaml

# Frontend
npm run dev                 # Start dev server
npm run build               # Build for production
```

---

## 📊 Check Everything Works

```bash
# Test backend
curl http://localhost:3001/api/health

# List sites
curl http://localhost:3001/api/sites

# List machine regions
curl 'http://localhost:3001/api/machine-regions?site_id=1'
```

---

## 🎨 What You Get

✅ **Zero-latency** machine switching (0ms)  
✅ **Smooth animations** with configurable styles  
✅ **Visual calibration** tool (no JSON editing)  
✅ **Live updates** across all viewers  
✅ **Multi-site** support  
✅ **Developer settings** for A/B testing  

---

## ⚡ Keyboard Shortcuts

- `Cmd/Ctrl + Shift + D` - Toggle dev settings panel

---

## 🎬 Demo Flow

1. **Sales Demo**:
   - Show full camera view
   - Click a machine → instant zoom with smooth animation
   - Click another machine → seamless transition
   - No lag, no buffering, professional!

2. **Configuration**:
   - Open calibration tool
   - Draw new regions as you add machines
   - Changes go live immediately
   - No server restart needed!

---

**Questions?** Check `README.md` for detailed docs!

