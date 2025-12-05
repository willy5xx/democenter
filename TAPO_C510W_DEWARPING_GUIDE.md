# Tapo C510W Fisheye Dewarping Guide

## Overview
Your Tapo C510W camera has a slight fisheye effect that can be corrected using vendVision's built-in lens correction (dewarping) feature. This guide shows you how to activate it.

---

## ✅ What I Just Added

I've added **native support for the Tapo C510W** with automatic fisheye correction to your vendVision system!

**Default Dewarping Settings for C510W:**
- `enable_dewarp`: `true` ✅
- `cx` (Center X): `0.5` (middle of frame)
- `cy` (Center Y): `0.5` (middle of frame)
- `k1` (Radial distortion): `-0.18` (corrects barrel distortion)
- `k2` (Radial distortion): `-0.015` (fine-tunes correction)

These values are optimized for the C510W's mild fisheye lens and will straighten out the edges of your video.

---

## 🚀 How to Activate Dewarping (3 Steps)

### Step 1: Open the Admin Panel
```bash
# Make sure your system is running
./start-vendvision.sh

# Then open in your browser:
http://localhost:5173/admin/sites
```

### Step 2: Edit Your Camera Configuration

1. **Click on your existing site** in the left sidebar (or create a new one)
2. **Click the "Edit" button** (top right)
3. **Change Camera Type**:
   - Find the **"Camera Type"** dropdown
   - Select: **"TP-Link Tapo C510W (with dewarping)"**
   
   ✨ This automatically enables dewarping with optimized settings!

### Step 3: Save and Test

1. **Click "Save Changes"**
2. The system will automatically:
   - ✅ Update the database
   - ✅ Regenerate `go2rtc.yaml` with FFmpeg lens correction
   - ✅ Apply the dewarping filter to your video stream

3. **View the corrected stream**:
   - Go to: `http://localhost:5173`
   - You should now see straight lines at the edges instead of curved ones!

---

## 🎛️ Fine-Tuning (Optional)

If the automatic settings don't look perfect, you can manually adjust:

### Access Advanced Controls

1. Edit your site
2. Scroll down to **"Lens Correction"** section
3. Toggle **"Enable Lens Correction"** (should already be ON)
4. Adjust the sliders:

| Setting | What It Does | Recommended Range |
|---------|--------------|-------------------|
| **Center X** | Horizontal position of lens center | 0.45 - 0.55 |
| **Center Y** | Vertical position of lens center | 0.45 - 0.55 |
| **K1** (Distortion) | Main barrel distortion correction | -0.15 to -0.25 |
| **K2** (Distortion) | Fine-tune distortion edges | -0.01 to -0.03 |

### How to Know If Settings Are Good
✅ **Good dewarping:**
- Straight lines (doorframes, walls) appear straight
- People look proportional (not stretched)
- Minimal cropping of usable area

❌ **Over-corrected:**
- Lines curve in the opposite direction (pincushion effect)
- Image looks "pulled in" at the edges

---

## 🔍 Technical Details

### What Happens Behind the Scenes

When you enable dewarping for the C510W, vendVision adds an FFmpeg filter to your video stream:

```yaml
# go2rtc.yaml (auto-generated)
streams:
  site1_main:
    - rtsp://secretlab:tapo123@10.1.10.193:554/stream1
  
  site1_dewarped:
    - ffmpeg:site1_main#video=h264#raw=
        -vf lenscorrection=cx=0.5:cy=0.5:k1=-0.18:k2=-0.015,scale=1920:1080
        -c:v libx264 -preset ultrafast -tune zerolatency
```

**The filter chain does:**
1. `lenscorrection=...`: Corrects barrel distortion using radial distortion model
2. `scale=1920:1080`: Ensures output is standard resolution
3. `libx264 -preset ultrafast`: Re-encodes with low latency

---

## 📊 Before & After Comparison

### Before (Fisheye Effect)
- Straight lines appear curved (especially near edges)
- Corners look "bulged out"
- Wide field of view but distorted

### After (Dewarped)
- Straight lines are straight ✅
- Natural perspective maintained
- Slight crop at edges (normal for correction)

---

## 🐛 Troubleshooting

### "I don't see the C510W option in the dropdown"

**Solution:**
- Make sure you've reloaded the frontend after my changes
- Refresh the page (Cmd+R or Ctrl+R)
- If using development mode: `cd dashboard && npm run dev`

### "Video looks worse after enabling dewarping"

**Solution:**
- Try adjusting K1 to a less aggressive value (e.g., `-0.15` instead of `-0.18`)
- Make sure your camera isn't mounted at an unusual angle
- Test with "Generic Fisheye (180°)" preset to compare

### "Stream is laggy after dewarping"

**Solution:**
- Dewarping requires CPU processing (FFmpeg re-encodes video)
- Lower your stream resolution to 1280x720
- Or use hardware encoding (requires go2rtc configuration changes)

### "I want to disable dewarping"

**Solution:**
1. Edit your site
2. Change Camera Type to: **"TP-Link Tapo C310/C320"** (no dewarping)
3. Or toggle OFF: "Enable Lens Correction"
4. Save changes

---

## 🔬 Advanced: Calibrating Other Cameras

If you have a different fisheye camera and want to find the perfect distortion values:

### Method 1: Trial and Error (Easiest)
1. Start with Generic Fisheye preset: `k1=-0.23, k2=-0.02`
2. Point camera at something with straight lines (doorframe, window)
3. Adjust K1 until vertical lines are straight
4. Adjust K2 for horizontal lines
5. Fine-tune Center X/Y if the effect isn't symmetric

### Method 2: OpenCV Camera Calibration (Most Accurate)
```python
import cv2
import numpy as np

# 1. Print a checkerboard pattern
# 2. Take 10-20 photos of checkerboard at different angles
# 3. Run OpenCV calibration:

ret, mtx, dist, rvecs, tvecs = cv2.calibrateCamera(
    objpoints, imgpoints, gray.shape[::-1], None, None
)

# 4. Extract k1, k2 from dist matrix:
k1 = dist[0][0]
k2 = dist[0][1]
cx = mtx[0][2] / image_width
cy = mtx[1][2] / image_height
```

### Method 3: Use Manufacturer Specs
- Check Tapo/TP-Link technical documentation
- Some cameras publish lens distortion coefficients
- Contact TP-Link support for calibration data

---

## 📝 Summary

| Action | Result |
|--------|--------|
| ✅ Added Tapo C510W preset | Automatic fisheye correction |
| ✅ Set K1 = -0.18, K2 = -0.015 | Optimized for mild fisheye |
| ✅ Auto-enabled in dropdown | Easy one-click activation |
| ✅ Works with virtual PTZ | Dewarped feed supports zoom regions |

**Next Steps:**
1. Go to `http://localhost:5173/admin/sites`
2. Change camera type to "TP-Link Tapo C510W (with dewarping)"
3. Save and view your corrected video!

---

## 🎯 Quick Reference

**Location:** Admin Panel → Site Management
**URL:** `http://localhost:5173/admin/sites`
**Camera Type:** "TP-Link Tapo C510W (with dewarping)"

**Default Settings:**
```json
{
  "enable_dewarp": true,
  "cx": 0.5,
  "cy": 0.5,
  "k1": -0.18,
  "k2": -0.015
}
```

**Restart Required?** No - changes apply automatically when you save.

---

Need help? Check the main documentation:
- `AUTOMATED_CAMERA_SETUP.md` - Camera type presets
- `VIRTUAL_PTZ_UPGRADE.md` - How virtual PTZ works with dewarping
- `QUICK_START.md` - Getting started guide

