# vendVision Demo Center 🎪

Interactive camera dashboard for showcasing vendVision capabilities. Set up your camera streaming in minutes!

## Prerequisites

Before you begin, make sure you have:

- **macOS or Linux** (Windows not currently supported)
- **Node.js v18+** - [Download here](https://nodejs.org/)
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
- Configure OBS for Zoom virtual camera (optional)

### 3. Start the Demo Center

```bash
./start-vendvision.sh
```

That's it! The dashboard will open at **http://localhost:5173**

---

## 📍 What You'll See

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Main Dashboard |
| http://localhost:5173/presentation | Full-screen presentation mode |
| http://localhost:5173/admin/calibrate | Machine calibration tool |
| http://localhost:1984 | go2rtc admin (streaming) |
| http://localhost:3001 | Backend API |

---

## 🔧 Daily Usage

Just run:
```bash
./start-vendvision.sh
```

To stop everything, press `Ctrl+C` in the terminal.

---

## 🎥 OBS Virtual Camera (For Zoom)

Want to use the camera feed in Zoom calls?

The setup wizard handles this automatically, but you can re-run it with:
```bash
./setup-obs.sh
```

See `ZOOM_VIRTUAL_CAMERA_GUIDE.md` for detailed instructions.

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
├── setup-demo.sh           # First-time setup
├── start-vendvision.sh     # Daily launcher
├── setup-obs.sh            # OBS configuration
├── go2rtc.yaml             # Stream configuration
├── backend/                # Node.js API server
│   ├── db/                 # SQLite database
│   └── routes/             # API endpoints
└── dashboard/              # React frontend
    └── src/
        ├── components/     # UI components
        └── pages/          # Page views
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
- `OBS_AUTO_SETUP.md` - Automated OBS configuration
- `ZOOM_VIRTUAL_CAMERA_GUIDE.md` - Virtual camera for Zoom
- `dashboard/DEMO_USAGE.md` - How to run demos
- `dashboard/CAMERA_DISCOVERY.md` - Camera setup details

---

## ❓ Troubleshooting

### Camera not connecting?
1. Check the camera IP is correct
2. Verify credentials in `go2rtc.yaml`
3. Make sure camera is on the same network

### go2rtc won't start?
```bash
# Check if port 1984 is in use
lsof -i :1984

# Re-download go2rtc
rm go2rtc
./setup-demo.sh
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
