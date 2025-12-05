# Machine Configuration Persistence

## Overview

The machine configurator now saves and loads your drawn bounding boxes automatically!

## How It Works

### **1. On Page Load**
When you visit `/configure`, the app:
- ✅ Loads existing machines from `machine-config.json`
- ✅ Displays saved bounding boxes on the canvas
- ✅ Shows machine count: "✓ N machines loaded"

### **2. When You Draw New Boxes**
- Draw boxes as usual on the camera view
- Edit names and icons
- Click **Save**

### **3. After Saving**
The system automatically:
1. ✅ Updates `machine-config.json` with crop coordinates
2. ✅ Updates `go2rtc.yaml` with video stream configurations
3. ✅ Restarts go2rtc Docker container
4. ✅ Reloads the configurator page (shows updated boxes)
5. ✅ Your boxes are now persisted!

### **4. On Next Visit**
- Boxes appear automatically
- Edit existing boxes by deleting and redrawing
- Add more boxes
- Save again - updates are persisted

## Data Flow

```
User draws box → Click Save
    ↓
Frontend sends to backend API
    ↓
Backend updates:
  - machine-config.json (frontend config)
  - go2rtc.yaml (stream config)
    ↓
Backend restarts go2rtc
    ↓
Frontend reloads page
    ↓
Boxes appear from saved config ✓
```

## Files Modified

### **Frontend**
`/web/vendvision-dashboard/src/components/machine-configurator.tsx`
- Added `import machineConfig` to load saved config
- Added `useEffect` to load machines on mount
- Updated save function to reload page after success
- Updated UI to show "✓ N machines loaded"
- Updated instructions

### **Backend**
No changes needed - already saves to `machine-config.json`

## UI Indicators

**Machine List Header:**
```
Machines (2)                    [Save]
✓ 2 machines loaded
```

**Instructions:**
```
1. Click and drag on the camera view to draw a box
2. Each box defines a machine focus area
3. Edit the name and icon for each machine
4. Click Save to automatically update configs
5. Your boxes are saved and will reload on next visit

💡 Tip: Draw larger boxes (500-800px) for better quality
```

## Saved Data Structure

Each machine is saved in `machine-config.json`:
```json
{
  "id": "1",
  "name": "Vending",
  "icon": "🥤",
  "stream": "tapo_machine_1",
  "crop": {
    "x": 842,
    "y": 206,
    "width": 296,
    "height": 481
  }
}
```

## Testing

1. **First Visit**: Go to `/configure` - should see empty canvas
2. **Draw Box**: Draw a box around a machine
3. **Save**: Click Save button
4. **Wait**: Page auto-reloads after 3 seconds
5. **Verify**: Box appears on canvas (loaded from config)
6. **Add More**: Draw another box, save again
7. **Verify**: Both boxes persist
8. **Refresh Browser**: Press F5 - boxes still there!

## Cleanup

To reset and start fresh:
1. Delete machines using trash icons
2. Click Save
3. Page reloads with empty canvas

Or manually edit `machine-config.json` to remove machines.

## Benefits

✅ No more manual config editing
✅ No more copy/paste of coordinates
✅ Visual confirmation of saved regions
✅ Easy to iterate and adjust boxes
✅ Changes persist across sessions
✅ Automatic go2rtc configuration
✅ Instant dashboard updates















