# Camera Discovery & Auto-Configuration Feature

## Vision
Enable salespeople to discover and connect to IP cameras as easily as connecting to Bluetooth - no technical knowledge required.

## User Flow

```
1. Click "Add Camera" button
2. Software scans network for cameras
3. Shows list: 
   - "Tapo C200 - Office Front" 
   - "Hikvision - Warehouse"
   - "Axis Camera - Store Entry"
4. User selects camera → clicks "Connect"
5. Enter password if needed (username auto-detected)
6. Camera auto-configures with optimal settings
7. Dewarping applied automatically (or via interactive tuner)
8. ✅ Stream ready to use
```

---

## Technical Architecture

### Phase 1: Camera Discovery

**Discovery Methods (in order of priority):**

#### 1. ONVIF Discovery (Best - Industry Standard)
- Most modern IP cameras support ONVIF
- Provides: camera name, model, IP, capabilities, stream URLs
- Uses WS-Discovery protocol (UDP multicast)

```javascript
// Backend API endpoint
POST /api/cameras/discover
Response: [
  {
    name: "Tapo C200",
    model: "C200",
    manufacturer: "TP-Link",
    ip: "10.1.10.149",
    onvif_port: 2020,
    capabilities: ["PTZ", "Audio", "H264"]
  }
]
```

#### 2. UPnP/SSDP Discovery (Fallback)
- Some cameras broadcast via UPnP
- Less detailed info but still useful

#### 3. Network Scan (Last Resort)
- Scan local subnet for common RTSP ports (554, 8554)
- Slower, less reliable

---

### Phase 2: Connection & Configuration

#### Backend Service (Node.js/Python)

**What it needs to do:**
1. Connect to camera via ONVIF
2. Retrieve stream URLs (main stream, sub stream)
3. Test RTSP connection
4. Add to go2rtc configuration
5. Restart go2rtc service
6. Return stream ID to frontend

```javascript
// Backend API
POST /api/cameras/connect
Body: {
  ip: "10.1.10.149",
  username: "admin",
  password: "secretlab",
  name: "Office Camera"
}

Response: {
  success: true,
  streamId: "camera_office",
  streamUrl: "rtsp://admin:pass@10.1.10.149:554/stream1",
  needsDewarping: true,
  suggestedPreset: "tapo_c200"
}
```

---

### Phase 3: Auto-Dewarping

**Challenge:** Every camera model has different lens distortion.

#### Solution 1: Camera Model Presets (Recommended for MVP)

```javascript
// dewarp-presets.json
{
  "tapo_c200": {
    "lenscorrection": "cx=0.5:cy=0.5:k1=-0.23:k2=-0.02",
    "crop": "1700:956:110:62",
    "description": "TP-Link Tapo C200 fisheye correction"
  },
  "tapo_c210": {
    "lenscorrection": "cx=0.5:cy=0.5:k1=-0.25:k2=-0.03",
    "crop": "1700:956:110:62",
    "description": "TP-Link Tapo C210 fisheye correction"
  },
  "hikvision_dome": {
    "lenscorrection": "cx=0.5:cy=0.5:k1=-0.15:k2=-0.01",
    "crop": "1920:1080:0:0",
    "description": "Hikvision dome camera"
  },
  "axis_standard": {
    "lenscorrection": "cx=0.5:cy=0.5:k1=0:k2=0",
    "crop": "1920:1080:0:0",
    "description": "Axis cameras (typically no distortion)"
  }
}
```

**Auto-detection:**
```javascript
// Match camera model to preset
function getPresetForCamera(model, manufacturer) {
  if (manufacturer === "TP-Link" && model.includes("C200")) {
    return "tapo_c200";
  }
  if (manufacturer === "TP-Link" && model.includes("C210")) {
    return "tapo_c210";
  }
  // ... more mappings
  return "none"; // No distortion correction
}
```

#### Solution 2: Interactive Dewarping Tuner (Future Enhancement)

Live adjustment UI:
- Show camera feed side-by-side (before/after)
- Sliders for: k1, k2, cx, cy, crop
- "Save Preset" button
- Save to preset library

---

## Implementation Plan

### MVP (Minimum Viable Product)

**What to build first:**

#### 1. Backend: Camera Discovery Service

**Technology:** Node.js with ONVIF library

```bash
npm install node-onvif
npm install node-ssdp  # For UPnP fallback
```

**New API Endpoints:**
```
POST /api/cameras/discover       # Scan network
POST /api/cameras/connect        # Connect to camera
POST /api/cameras/test          # Test RTSP stream
GET  /api/cameras/presets       # Get dewarp presets
POST /api/cameras/apply-dewarp  # Apply dewarping config
```

#### 2. Frontend: Discovery UI

**Component Structure:**
```
src/components/camera-discovery/
  ├── camera-discovery-modal.tsx    # Main modal
  ├── camera-list.tsx               # List discovered cameras
  ├── camera-connection-form.tsx    # Credentials input
  ├── dewarp-preset-selector.tsx    # Choose preset
  └── connection-status.tsx         # Progress indicator
```

**UI Flow:**
```tsx
// 1. Button in header
<Button onClick={openDiscoveryModal}>
  <Plus /> Add Camera
</Button>

// 2. Discovery modal
<CameraDiscoveryModal>
  {/* Step 1: Scanning */}
  <div>Scanning network... 🔍</div>
  
  {/* Step 2: Show results */}
  <CameraList cameras={discovered}>
    {cameras.map(cam => (
      <CameraCard 
        name={cam.name}
        model={cam.model}
        ip={cam.ip}
        onSelect={selectCamera}
      />
    ))}
  </CameraList>
  
  {/* Step 3: Connection form */}
  <ConnectionForm 
    camera={selected}
    onConnect={handleConnect}
  />
  
  {/* Step 4: Dewarp preset */}
  <DewarpSelector 
    suggestedPreset={preset}
    onApply={applyDewarping}
  />
</CameraDiscoveryModal>
```

#### 3. Backend: go2rtc Configuration Manager

**Auto-generate go2rtc config:**
```javascript
// When user clicks "Connect"
async function addCameraToGo2rtc(cameraConfig) {
  // 1. Load current go2rtc.yaml
  const config = yaml.load(fs.readFileSync('go2rtc.yaml'));
  
  // 2. Generate stream name
  const streamName = generateStreamName(cameraConfig.name);
  
  // 3. Get dewarp preset
  const preset = getDewarpPreset(cameraConfig.model);
  
  // 4. Build FFmpeg command
  const ffmpegCmd = buildFFmpegCommand(
    cameraConfig.rtspUrl,
    preset.lenscorrection,
    preset.crop
  );
  
  // 5. Add to config
  config.streams[streamName] = [cameraConfig.rtspUrl];
  config.streams[`${streamName}_dewarped`] = [ffmpegCmd];
  
  // 6. Save and restart go2rtc
  fs.writeFileSync('go2rtc.yaml', yaml.dump(config));
  exec('docker-compose restart go2rtc');
  
  return { streamId: `${streamName}_dewarped` };
}
```

---

## Technical Details

### ONVIF Discovery Implementation

```javascript
// backend/services/camera-discovery.js
const onvif = require('node-onvif');

async function discoverCameras() {
  console.log('🔍 Scanning for ONVIF cameras...');
  
  // Discover devices (takes ~5 seconds)
  const devices = await onvif.startProbe();
  
  const cameras = await Promise.all(devices.map(async device => {
    try {
      // Connect to get detailed info
      const camera = new onvif.OnvifDevice({
        xaddr: device.xaddrs[0],
        user: null, // No auth needed for discovery
        pass: null
      });
      
      await camera.init();
      
      // Get device info
      const info = await camera.getDeviceInformation();
      const profiles = await camera.getProfiles();
      
      return {
        name: info.Model,
        manufacturer: info.Manufacturer,
        model: info.Model,
        serialNumber: info.SerialNumber,
        firmwareVersion: info.FirmwareVersion,
        ip: device.urn.split(':').pop(),
        onvifUrl: device.xaddrs[0],
        profiles: profiles,
        needsAuth: true
      };
    } catch (err) {
      console.warn('Failed to get details for', device.xaddrs[0]);
      return null;
    }
  }));
  
  return cameras.filter(c => c !== null);
}
```

### Stream URL Retrieval

```javascript
async function getStreamUrl(camera, username, password) {
  const device = new onvif.OnvifDevice({
    xaddr: camera.onvifUrl,
    user: username,
    pass: password
  });
  
  await device.init();
  
  // Get main stream profile
  const profiles = await device.getProfiles();
  const mainProfile = profiles.find(p => p.Name.includes('Main')) || profiles[0];
  
  // Get stream URI
  const streamUri = await device.getStreamUri({
    ProfileToken: mainProfile.token,
    Protocol: 'RTSP'
  });
  
  return {
    rtspUrl: streamUri.Uri,
    profile: mainProfile,
    resolution: `${mainProfile.VideoEncoderConfiguration.Resolution.Width}x${mainProfile.VideoEncoderConfiguration.Resolution.Height}`,
    codec: mainProfile.VideoEncoderConfiguration.Encoding
  };
}
```

---

## UI Components

### Camera Discovery Modal

```tsx
// src/components/camera-discovery/camera-discovery-modal.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Wifi, CheckCircle } from "lucide-react";

type DiscoveryStep = "scanning" | "selecting" | "connecting" | "configuring" | "complete";

export function CameraDiscoveryModal({ open, onClose }) {
  const [step, setStep] = useState<DiscoveryStep>("scanning");
  const [cameras, setCameras] = useState([]);
  const [selected, setSelected] = useState(null);
  
  const startDiscovery = async () => {
    setStep("scanning");
    
    const response = await fetch("/api/cameras/discover", {
      method: "POST"
    });
    
    const discovered = await response.json();
    setCameras(discovered);
    setStep("selecting");
  };
  
  const connectCamera = async (camera, credentials) => {
    setStep("connecting");
    
    const response = await fetch("/api/cameras/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...camera,
        ...credentials
      })
    });
    
    const result = await response.json();
    
    if (result.needsDewarping) {
      setStep("configuring");
      // Show dewarp options
    } else {
      setStep("complete");
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <Wifi className="inline mr-2" />
            Discover Cameras
          </DialogTitle>
        </DialogHeader>
        
        {step === "scanning" && <ScanningView />}
        {step === "selecting" && <CameraList cameras={cameras} onSelect={connectCamera} />}
        {step === "connecting" && <ConnectingView />}
        {step === "configuring" && <DewarpConfig camera={selected} />}
        {step === "complete" && <SuccessView />}
      </DialogContent>
    </Dialog>
  );
}
```

### Camera Card

```tsx
// src/components/camera-discovery/camera-card.tsx
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, Wifi } from "lucide-react";

export function CameraCard({ camera, onSelect }) {
  return (
    <Card className="hover:border-primary transition-colors cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <Camera className="h-10 w-10 text-muted-foreground" />
            <div>
              <CardTitle>{camera.name}</CardTitle>
              <CardDescription>
                {camera.manufacturer} • {camera.ip}
              </CardDescription>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{camera.model}</Badge>
                {camera.capabilities?.includes("PTZ") && (
                  <Badge variant="secondary">PTZ</Badge>
                )}
              </div>
            </div>
          </div>
          <Button onClick={() => onSelect(camera)}>
            Connect
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
```

---

## Files to Create

### Backend
```
web/vendvision-backend/
├── services/
│   ├── camera-discovery.js      # ONVIF discovery
│   ├── camera-connection.js     # Connection management
│   └── go2rtc-manager.js        # Config updates
├── config/
│   └── dewarp-presets.json      # Camera presets
└── routes/
    └── cameras.js               # API endpoints
```

### Frontend
```
web/vendvision-dashboard/src/
├── components/camera-discovery/
│   ├── camera-discovery-modal.tsx
│   ├── camera-card.tsx
│   ├── camera-list.tsx
│   ├── connection-form.tsx
│   ├── dewarp-preset-selector.tsx
│   └── dewarp-tuner.tsx         # Advanced feature
└── lib/
    └── camera-api.ts            # API client
```

---

## Development Phases

### Phase 1: Discovery (Week 1)
- ✅ Backend ONVIF discovery
- ✅ API endpoint: `/api/cameras/discover`
- ✅ Simple UI: list cameras
- ✅ Click to see camera details

### Phase 2: Connection (Week 2)
- ✅ Connection form (username/password)
- ✅ Test RTSP stream
- ✅ Add to go2rtc config
- ✅ Display stream in dashboard

### Phase 3: Auto-Dewarping (Week 3)
- ✅ Create preset database
- ✅ Auto-detect and apply preset
- ✅ Preset selector UI
- ✅ Save configuration

### Phase 4: Polish (Week 4)
- ✅ Error handling
- ✅ Connection status indicators
- ✅ Save/manage multiple cameras
- ✅ Interactive dewarp tuner (advanced)

---

## Salespeople User Experience

**Before (Current):**
1. Get camera IP from IT
2. Ask for username/password
3. Manually edit YAML file
4. Guess dewarping parameters
5. Restart Docker
6. Debug if it doesn't work
⏱️ **30-60 minutes per camera**

**After (With This Feature):**
1. Click "Add Camera"
2. Select from list
3. Enter password
4. Click "Connect"
⏱️ **30 seconds per camera**

---

## Next Steps

1. **Install dependencies:**
```bash
cd web/vendvision-backend
npm install node-onvif node-ssdp
```

2. **Create preset database:**
- Research common camera models
- Document dewarping parameters
- Build preset JSON

3. **Build discovery service:**
- Start with ONVIF implementation
- Test with your Tapo C200
- Add error handling

4. **Create UI components:**
- Modal with discovery flow
- Camera cards
- Connection form

5. **Test with multiple camera brands:**
- Tapo
- Hikvision
- Axis
- Dahua

Would you like me to start implementing any specific part of this?




