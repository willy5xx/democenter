#!/bin/bash

# OBS Auto-Configuration Script for vendVision Demo Center
# This script automatically configures OBS Studio with the perfect settings for Zoom demos

set -e

echo "🎥 vendVision OBS Auto-Setup Script"
echo "===================================="
echo ""

# Detect OS
OS="unknown"
OBS_CONFIG_DIR=""

if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
    OBS_CONFIG_DIR="$HOME/Library/Application Support/obs-studio"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    OBS_CONFIG_DIR="$HOME/.config/obs-studio"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    OS="windows"
    OBS_CONFIG_DIR="$APPDATA/obs-studio"
fi

echo "📍 Detected OS: $OS"
echo "📁 OBS Config Directory: $OBS_CONFIG_DIR"
echo ""

# Check if OBS is installed
if [ "$OS" = "mac" ]; then
    if [ ! -d "/Applications/OBS.app" ]; then
        echo "❌ OBS Studio not found!"
        echo ""
        echo "Please install OBS Studio first:"
        echo "  1. Visit: https://obsproject.com"
        echo "  2. Download OBS Studio for macOS"
        echo "  3. Install and run it once"
        echo "  4. Then run this script again"
        exit 1
    fi
elif [ "$OS" = "linux" ]; then
    if ! command -v obs &> /dev/null; then
        echo "❌ OBS Studio not found!"
        echo ""
        echo "Install OBS Studio:"
        echo "  Ubuntu/Debian: sudo apt install obs-studio"
        echo "  Fedora: sudo dnf install obs-studio"
        echo "  Arch: sudo pacman -S obs-studio"
        exit 1
    fi
fi

# Check if OBS is currently running
if pgrep -x "obs" > /dev/null; then
    echo "⚠️  OBS is currently running!"
    echo "Please close OBS before running this setup script."
    exit 1
fi

# Create OBS config directory if it doesn't exist
mkdir -p "$OBS_CONFIG_DIR/basic/scenes"
mkdir -p "$OBS_CONFIG_DIR/basic/profiles/vendVision"

echo "✅ OBS directories ready"
echo ""

# Create vendVision profile config
cat > "$OBS_CONFIG_DIR/basic/profiles/vendVision/basic.ini" << 'EOF'
[General]
Name=vendVision

[Output]
Mode=Simple
FilePath=
RecFormat=mkv
RecEncoder=x264

[Video]
BaseCX=1920
BaseCY=1080
OutputCX=1920
OutputCY=1080
FPSType=0
FPSCommon=30 FPS

[Audio]
SampleRate=44100
ChannelSetup=Stereo

[AdvOut]
RecEncoder=obs_x264
FFOutputToFile=true
FFFormat=
FFFormatMimeType=
EOF

echo "✅ Created vendVision profile"

# Create scene collection with browser source
SCENE_COLLECTION_FILE="$OBS_CONFIG_DIR/basic/scenes/vendVision.json"

cat > "$SCENE_COLLECTION_FILE" << 'EOF'
{
    "current_scene": "vendVision Demo",
    "current_program_scene": "vendVision Demo",
    "scene_order": [
        {
            "name": "vendVision Demo"
        }
    ],
    "name": "vendVision",
    "sources": [
        {
            "versioned_id": "browser_source",
            "name": "Demo Center Browser",
            "uuid": "vendvision-browser-source-001",
            "id": "browser_source",
            "settings": {
                "url": "http://localhost:5173",
                "width": 1920,
                "height": 1080,
                "fps": 30,
                "shutdown": false,
                "restart_when_active": true,
                "css": "body { margin: 0px auto; overflow: hidden; }",
                "webpage_control_level": 1
            },
            "sync": 0,
            "flags": 0,
            "volume": 1.0,
            "balance": 0.5,
            "mixers": 255,
            "private_settings": {}
        },
        {
            "versioned_id": "scene",
            "name": "vendVision Demo",
            "uuid": "vendvision-scene-001",
            "id": "scene",
            "settings": {},
            "sync": 0,
            "flags": 0,
            "volume": 1.0,
            "balance": 0.5,
            "mixers": 0,
            "private_settings": {}
        }
    ],
    "scene_items": [
        {
            "name": "Demo Center Browser",
            "source_uuid": "vendvision-browser-source-001",
            "visible": true,
            "locked": false,
            "pos": {
                "x": 0.0,
                "y": 0.0
            },
            "scale": {
                "x": 1.0,
                "y": 1.0
            },
            "rot": 0.0,
            "crop_left": 0,
            "crop_top": 0,
            "crop_right": 0,
            "crop_bottom": 0,
            "crop_to_bounds": false,
            "bounds_type": 0,
            "bounds_align": 0,
            "bounds": {
                "x": 0.0,
                "y": 0.0
            },
            "blend_method": "default",
            "blend_mode": "normal"
        }
    ],
    "groups": []
}
EOF

echo "✅ Created vendVision scene with browser source"
echo ""

# Update global config to use vendVision profile and scene
GLOBAL_CONFIG="$OBS_CONFIG_DIR/global.ini"

if [ -f "$GLOBAL_CONFIG" ]; then
    # Backup existing config
    cp "$GLOBAL_CONFIG" "$GLOBAL_CONFIG.backup"
    echo "✅ Backed up existing OBS config"
fi

# Update or create global.ini
cat > "$GLOBAL_CONFIG" << EOF
[General]
Name=vendVision
EOF

echo "✅ Updated OBS global settings"
echo ""

# Create a quick reference card
cat > "$OBS_CONFIG_DIR/VENDVISION_SETUP.txt" << 'EOF'
vendVision OBS Setup - Quick Reference
======================================

✅ OBS has been automatically configured!

Next Steps:
-----------
1. Launch OBS Studio
2. You should see "vendVision Demo" scene with a browser source
3. Click "Start Virtual Camera" (bottom right corner)
4. Open Zoom → Settings → Video
5. Select "OBS Virtual Camera" from the camera dropdown

Manual Adjustments (Optional):
-------------------------------
- Crop the browser source if needed:
  Right-click source → Transform → Edit Transform

- Add your webcam as picture-in-picture:
  Sources → Add → Video Capture Device

- Adjust resolution if laggy:
  Settings → Video → Output Resolution → 1280x720

URLs:
-----
Presentation Mode: http://localhost:5173
Dashboard: http://localhost:5173/dashboard
go2rtc Admin: http://localhost:1984

Troubleshooting:
----------------
- Black screen? Make sure vendVision is running (npm run dev)
- Laggy video? Lower resolution or FPS in Settings → Video
- Camera not showing in Zoom? Restart Zoom after starting Virtual Camera

Need Help?
----------
See ZOOM_VIRTUAL_CAMERA_GUIDE.md for full documentation
EOF

echo "✅ Created reference guide"
echo ""
echo "════════════════════════════════════════"
echo "🎉 OBS Configuration Complete!"
echo "════════════════════════════════════════"
echo ""
echo "Next steps:"
echo ""
echo "1. Start your vendVision services:"
echo "   ./start-dev.sh"
echo ""
echo "2. Launch OBS Studio"
echo "   - You'll see the 'vendVision Demo' scene ready to go"
echo ""
echo "3. Click 'Start Virtual Camera' in OBS"
echo ""
echo "4. In Zoom:"
echo "   Settings → Video → Select 'OBS Virtual Camera'"
echo ""
echo "📖 Quick reference saved to:"
echo "   $OBS_CONFIG_DIR/VENDVISION_SETUP.txt"
echo ""
echo "💡 Tip: Keep OBS running in the background during Zoom calls!"
echo ""

