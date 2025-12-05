# Automated Camera Configuration

> **User-Friendly Approach**: Camera settings are now automatically configured based on camera type - no technical knowledge required!

---

## What Changed?

### ❌ Before (Too Technical)
Users had to:
1. Know what "dewarping" means
2. Manually enable/disable lens correction
3. Input cryptic distortion coefficients (K1, K2, cx, cy)
4. Understand fisheye vs. normal lenses

### ✅ After (User-Friendly)
Users simply:
1. **Select camera brand/model from dropdown**
2. **Enter camera URL**
3. **Done!** Lens correction is automatically applied

---

## Camera Type Presets

When you select a camera type, vendVision automatically applies the optimal lens correction settings:

| Camera Type | Dewarp Enabled | Best For |
|------------|----------------|----------|
| Generic IP Camera | ❌ No | Standard security cameras |
| RTSP Stream (Generic) | ❌ No | Generic RTSP cameras |
| USB Webcam | ❌ No | Logitech, laptop webcams |
| TP-Link Tapo C200/C210 | ❌ No | Popular budget smart cameras |
| TP-Link Tapo C310/C320 | ❌ No | Outdoor Tapo models |
| Wyze Cam v3/v4 | ❌ No | Wyze smart cameras |
| Generic Fisheye (180°) | ✅ Yes | Wide-angle fisheye lenses |
| Reolink Fisheye | ✅ Yes | Reolink 180° cameras |

---

## How to Use (Simple Workflow)

### For Your Tapo C200 Camera:

1. **Go to**: `http://localhost:5173/admin/sites`
2. **Click**: "Add New Site"
3. **Fill in**:
   - **Site Name**: `My Demo Center`
   - **Camera Type**: Select **"TP-Link Tapo C200/C210"** from dropdown
   - **Camera URL**: `rtsp://secretlab:tapo123@10.1.10.193:554/stream1`
   - **Resolution**: `1920x1080`
4. **Save** - Done! ✅

The system automatically knows:
- ✓ This is a normal camera (not fisheye)
- ✓ No lens correction needed
- ✓ Standard streaming settings

---

## Advanced: Fine-Tuning (Optional)

### When You Might Need This
99% of users won't need to touch this, but if:
- You have a custom/rare fisheye camera
- The preset doesn't look quite right
- You're testing different distortion values

### How to Access
1. Select a fisheye camera type
2. While editing, expand **"Advanced: Fine-tune dewarp parameters"** 
3. Adjust:
   - **Center X/Y** (cx, cy): Where the lens center is (default: 0.5 = center)
   - **Distortion K1/K2**: Lens curvature coefficients

These are hidden by default to avoid overwhelming users.

---

## For Developers: Adding New Camera Presets

Want to add support for more camera models? Edit the presets in `admin-sites.tsx`:

```typescript
const dewarpPresets: Record<string, any> = {
  // Standard cameras (no dewarping)
  'your-camera-brand': { 
    enable_dewarp: false 
  },
  
  // Fisheye cameras (with dewarping)
  'your-fisheye-brand': { 
    enable_dewarp: true, 
    cx: 0.5,      // Center X (0.5 = middle)
    cy: 0.5,      // Center Y (0.5 = middle)
    k1: -0.23,    // Radial distortion coefficient
    k2: -0.02     // Radial distortion coefficient
  },
}
```

### Finding Distortion Coefficients

If you need to calibrate a new fisheye camera:

1. **OpenCV Calibration Tool**:
   ```python
   import cv2
   # Use checkerboard pattern
   # Run camera calibration
   # Extract k1, k2 from distortion matrix
   ```

2. **Trial and Error**:
   - Start with generic fisheye preset (`k1=-0.23, k2=-0.02`)
   - View live stream
   - Adjust until straight lines look straight

3. **Manufacturer Specs**:
   - Some camera manufacturers publish lens coefficients
   - Check technical documentation

---

## Benefits of This Approach

### For End Users
- ✅ **No training needed**: Just pick your camera from a list
- ✅ **Faster setup**: 3 fields instead of 8
- ✅ **Less errors**: Can't misconfigure lens correction
- ✅ **Professional results**: Presets are pre-tested

### For Support Teams
- ✅ **Fewer support tickets**: "How do I configure dewarping?"
- ✅ **Easier troubleshooting**: "What camera type did you select?"
- ✅ **Scalable**: Add new presets as you support more cameras

### For Developers
- ✅ **Maintainable**: Camera configs in one place
- ✅ **Extensible**: Easy to add new camera models
- ✅ **Testable**: Can validate presets work correctly

---

## Future Enhancements

### Auto-Detection (Next Level)
Automatically detect camera type from:
- RTSP URL patterns (e.g., `tapo` in URL → Tapo camera)
- ONVIF device info
- RTSP metadata

```typescript
// Example future feature
function detectCameraType(url: string): string {
  if (url.includes('tapo')) return 'tapo-c200'
  if (url.includes('wyze')) return 'wyze-cam'
  if (url.includes('reolink')) return 'reolink-fisheye'
  return 'generic'
}
```

### AI-Based Calibration
Use computer vision to auto-detect if lens correction is needed:
- Analyze first frame
- Detect if straight lines are curved
- Automatically estimate K1/K2 coefficients

### Cloud Preset Database
- Community-contributed camera presets
- Automatic updates when new cameras are added
- "Works with 500+ camera models" out of the box

---

## Migration Guide

### Existing Installations
If you already have sites configured with manual dewarp settings:
1. **No action needed** - existing configs continue to work
2. **Optional**: Edit each site and select the matching camera type preset
3. The old manual settings will be replaced with the preset values

### Backup Before Migration
```bash
# Backup your database
cp backend/config.db backend/config.db.backup
```

---

## Testing Checklist

After implementing automated camera setup:

- [ ] Select "TP-Link Tapo C200" → Verify dewarp is **disabled**
- [ ] Select "Generic Fisheye" → Verify dewarp is **enabled** with default values
- [ ] Switch between camera types → Verify settings update automatically
- [ ] Expand "Advanced" section → Verify manual override works
- [ ] Save and test stream → Verify video looks correct
- [ ] Create new site with Tapo preset → Works without touching dewarp settings

---

## Quick Reference

| Task | Action |
|------|--------|
| Add normal camera | Select matching camera type from dropdown |
| Add fisheye camera | Select fisheye type, auto-configured |
| Fine-tune settings | Expand "Advanced" while editing |
| Add new preset | Edit `dewarpPresets` object in `admin-sites.tsx` |

---

**Bottom Line**: Users no longer need to understand lens distortion mathematics. They just pick their camera model and go! 🎯



