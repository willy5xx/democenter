# vendVision Demo Center 🎪

Interactive camera dashboard for showcasing vendVision capabilities. Set up your camera streaming in minutes!

---

## 🎯 For Salespeople - Quick Reference

**First Time Setup (one time only):**
```bash
./setup-demo.sh          # Enter camera IP, username, password when prompted
./verify-setup.sh        # Check everything is configured
```

**Every Other Time - Choose Your Script:**

| Script | Use Case |
|--------|----------|
| `./start_vendvision_local.sh` | **Local demos** - Office presentations, no remote access needed |
| `./start_vendvision_ext.sh` | **External demos** - Includes Tailscale for remote access over VPN |

```bash
# For local office demos (faster startup):
./start_vendvision_local.sh

# For remote/external demos (includes Tailscale):
./start_vendvision_ext.sh
```

**Dashboard:** http://localhost:5173  
**If camera doesn't work:** See the [troubleshooting section](#-troubleshooting) below

---

## Prerequisites

Before you begin, make sure you have:

- **macOS or Linux** (Windows not currently supported)
- **Node.js v18+** - [Download here](https://nodejs.org/)
- **OBS Studio** (for Zoom/Teams demos) - [Download here](https://obsproject.com/) - The setup script will configure it automatically
- **Docker Desktop** (optional, for container-based streaming) - [Download here](https://www.docker.com/products/docker-desktop/)

## 🚀 Quick Start

### 1. Clone this repo

```bash
git clone https://github.com/YOUR_ORG/vendvision-demo-center.git
cd vendvision-demo-center
```

### 2. Run the Setup Wizard

```bash
./setup-demo.sh
```

This will:
- Install all dependencies (backend + frontend)
- Download the streaming server (go2rtc)
- **Ask for your Tapo Camera IP & credentials**
- Configure OBS for Zoom virtual camera (for demo presentations)

### 3. Verify Setup (Optional but Recommended)

```bash
./verify-setup.sh
```

This checks that everything is configured correctly before starting.

### 4. Start the Demo Center

```bash
# For local office demos (no Tailscale):
./start_vendvision_local.sh

# For external demos with remote access (includes Tailscale):
./start_vendvision_ext.sh
```

That's it! The dashboard will open at **http://localhost:5173**

### 5. Verify Camera Connection

After starting, check that the camera stream is working:

1. Open http://localhost:1984 (go2rtc admin)
2. You should see streams named `site1_main` and `site1_dewarped`
3. Click on `site1_dewarped` to verify the video feed
4. If you see video here but not in the dashboard, refresh the dashboard page

---

## 📍 What You'll See

| URL / App | Description |
|-----------|-------------|
| http://localhost:5173 | Main Dashboard |
| http://localhost:5173/presentation | Full-screen presentation mode |
| http://localhost:5173/admin/calibrate | Machine calibration tool |
| http://localhost:1984 | go2rtc admin (streaming) |
| http://localhost:3001 | Backend API |
| OBS Studio | Virtual camera for Zoom (launches automatically) |

---

## 🔧 Daily Usage

Just run one of these:
```bash
./start_vendvision_local.sh   # Local demos (faster, no Tailscale)
./start_vendvision_ext.sh     # External demos (with Tailscale remote access)
```

To stop everything, press `Ctrl+C` in the terminal.

---

## 🎥 OBS Virtual Camera (For Zoom/Teams Demos)

OBS Studio creates a virtual camera that lets you share your vendVision dashboard professionally in Zoom/Teams calls - appearing as your webcam feed instead of a screen share.

**The setup script configures OBS automatically.** If you skipped it or need to reconfigure:

```bash
./setup-obs.sh
```

When you run either startup script (`./start_vendvision_local.sh` or `./start_vendvision_ext.sh`), OBS will launch automatically. Just click **"Start Virtual Camera"** in OBS, then select "OBS Virtual Camera" in your Zoom video settings.

See `docs/ZOOM_VIRTUAL_CAMERA_GUIDE.md` for detailed instructions.

---

## 📹 Camera Support

### Tapo C510W (Recommended)
The setup wizard will ask for:
- Camera IP address (e.g., `192.168.1.100`)
- Username (usually `admin`)
- Password (your camera password)

### Other RTSP Cameras
Edit `go2rtc.yaml` manually:
```yaml
streams:
  camera1: rtsp://username:password@ip:554/stream1
```

---

## 🗂 Project Structure

```
vendvision-demo-center/
├── setup-demo.sh              # First-time setup
├── start_vendvision_local.sh  # Local demos (no Tailscale)
├── start_vendvision_ext.sh    # External demos (with Tailscale)
├── setup-obs.sh               # OBS configuration
├── go2rtc.yaml                # Stream configuration
├── backend/                   # Node.js API server
│   ├── db/                    # SQLite database
│   └── routes/                # API endpoints
└── dashboard/                 # React frontend
    └── src/
        ├── components/        # UI components
        └── pages/             # Page views
```

---

## 🛠 Manual Setup (Advanced)

If you prefer to run things manually:

### Backend
```bash
cd backend
npm install
npm start
# Runs on http://localhost:3001
```

### Frontend
```bash
cd dashboard
npm install
npm run dev
# Runs on http://localhost:5173
```

### Streaming (go2rtc)
```bash
# Option 1: Binary (recommended)
./go2rtc -config go2rtc.yaml

# Option 2: Docker
docker-compose -f docker-compose.demo.yml up -d
```

---

## 🎯 Key Features

- **Live Camera Feeds** - WebRTC streaming with low latency
- **Virtual PTZ** - Software pan/tilt/zoom to focus on specific machines
- **Machine Calibration** - Visual tool to define machine regions
- **OBS Integration** - Use as virtual camera in Zoom/Teams
- **Auto-Dewarping** - Correct fisheye distortion

---

## 📚 Documentation

- `QUICK_START.md` - Detailed quick start guide
- `docs/OBS_AUTO_SETUP.md` - Automated OBS configuration
- `docs/ZOOM_VIRTUAL_CAMERA_GUIDE.md` - Virtual camera for Zoom
- `docs/TAPO_C510W_DEWARPING_GUIDE.md` - Camera dewarping setup
- `dashboard/DEMO_USAGE.md` - How to run demos
- `dashboard/MULTI_TENANT_GUIDE.md` - Multi-tenant dashboard system

---

## ❓ Troubleshooting

### Camera not connecting (404 error)?

**This is the most common issue!** If you see "404" errors in the browser console:

1. **Check if go2rtc is running:**
   ```bash
   # Open http://localhost:1984 in your browser
   # You should see the go2rtc admin interface
   ```

2. **Verify stream names match:**
   ```bash
   # Look in go2rtc.yaml - you should see:
   #   site1_main:
   #   site1_dewarped:
   # 
   # If you see just "main:" and "dewarped:" (no site1_ prefix),
   # regenerate the config:
   cd backend
   node scripts/generate-go2rtc-config.js
   cd ..
   
   # Then restart go2rtc:
   pkill go2rtc
   ./go2rtc -config go2rtc.yaml &
   ```

3. **Test the stream directly:**
   - Go to http://localhost:1984
   - Click on `site1_dewarped` stream
   - If video shows here but not in dashboard, refresh the dashboard

### Camera credentials wrong?
1. Edit the database directly or re-run setup:
   ```bash
   cd backend
   node scripts/setup-wizard.js
   ```
2. This will update your camera credentials and regenerate go2rtc.yaml

### go2rtc won't start?
```bash
# Check if port 1984 is in use
lsof -i :1984

# Kill any existing go2rtc process
pkill go2rtc

# Start it again
./start_vendvision_ext.sh
```

### Backend errors?
```bash
cd backend
rm -rf node_modules
npm install
npm start
```

---

## 📄 License

Proprietary - For vendVision team only
