#!/bin/bash

# vendVision Setup Script for New Deployments
# Use this script to set up a fresh machine for a demo center.

set -e

echo "📦 vendVision Demo Center Setup"
echo "=============================="
echo ""

# 1. Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js (v18+) from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node -v)"

# 2. Install Dependencies
echo ""
echo "📥 Installing dependencies..."
echo "   - Backend..."
cd backend && npm install --silent && cd ..
echo "   - Frontend..."
cd dashboard && npm install --silent && cd ..

# 3. Setup Database
echo ""
echo "🗄️  Setting up database..."
cd backend
npm run db:migrate
# Only seed if no config exists? For now, we seed to ensure baseline.
# npm run db:seed 
cd ..

# 4. Check for go2rtc
echo ""
echo "📹 Checking streaming server..."
if [ ! -f "./go2rtc" ]; then
    echo "   - go2rtc binary not found. Downloading..."
    
    # Detect OS/Arch
    OS="$(uname -s)"
    ARCH="$(uname -m)"
    
    if [ "$OS" = "Darwin" ]; then
        if [ "$ARCH" = "arm64" ]; then
            URL="https://github.com/AlexxIT/go2rtc/releases/download/v1.9.8/go2rtc_mac_arm64.zip"
        else
            URL="https://github.com/AlexxIT/go2rtc/releases/download/v1.9.8/go2rtc_mac_amd64.zip"
        fi
    elif [ "$OS" = "Linux" ]; then
        if [ "$ARCH" = "aarch64" ]; then
             URL="https://github.com/AlexxIT/go2rtc/releases/download/v1.9.8/go2rtc_linux_arm64"
        else
             URL="https://github.com/AlexxIT/go2rtc/releases/download/v1.9.8/go2rtc_linux_amd64"
        fi
    else
        echo "⚠️  Unsupported OS for auto-download. Please download go2rtc manually."
    fi

    if [ ! -z "$URL" ]; then
        curl -L -o go2rtc.zip "$URL"
        if [[ "$URL" == *.zip ]]; then
            unzip -o go2rtc.zip
            rm go2rtc.zip
        else
            mv go2rtc.zip go2rtc # It wasn't a zip if we went to linux branch, logic slightly off here fixed below
        fi
        
        # Linux binaries are not zipped usually in recent releases, but let's stick to zip for mac
        # Fixing logic for direct binary download
        if [ "$OS" = "Linux" ]; then
             curl -L -o go2rtc "$URL"
        fi
        
        chmod +x go2rtc
        echo "✅ go2rtc installed"
    fi
else
    echo "✅ go2rtc already installed"
fi

# 5. Interactive Camera Setup
echo ""
node backend/scripts/setup-wizard.js

# 6. Tailscale Remote Access Setup
echo ""
echo "🌐 Remote Access Setup (Tailscale)"
echo "   Tailscale allows remote viewing of your demo streams."
echo ""

# Check if Tailscale is already installed and connected
if command -v tailscale &> /dev/null && tailscale status &> /dev/null 2>&1; then
    TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "")
    if [ ! -z "$TAILSCALE_IP" ]; then
        echo "✅ Tailscale is already connected"
        echo "   Your Tailscale IP: $TAILSCALE_IP"
        echo "   Remote users can access your streams at: http://$TAILSCALE_IP:5173"
    fi
else
    echo "   Tailscale enables remote camera viewing from anywhere."
    echo ""
    read -p "   Would you like to set up Tailscale for remote access? (y/N) " INSTALL_TAILSCALE
    
    if [[ "$INSTALL_TAILSCALE" =~ ^[Yy]$ ]]; then
        # Install if not present
        if ! command -v tailscale &> /dev/null; then
            echo ""
            echo "   📦 Installing Tailscale..."
            
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS - install CLI and try to start daemon
                if command -v brew &> /dev/null; then
                    brew install tailscale
                    # Start the daemon
                    sudo tailscaled 2>/dev/null &
                    sleep 2
                else
                    echo "   ⚠️  Homebrew not found. Please install Tailscale manually:"
                    echo "      https://tailscale.com/download/mac"
                fi
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                # Linux
                curl -fsSL https://tailscale.com/install.sh | sh
            fi
        fi
        
        if command -v tailscale &> /dev/null; then
            echo "   ✅ Tailscale installed!"
            echo ""
            echo "   🔑 To join the VendVision network, you need an auth key."
            echo "   (Get this from your admin via Slack/Teams)"
            echo ""
            read -p "   Enter Tailscale auth key (or press Enter to skip): " TAILSCALE_AUTHKEY
            
            if [ ! -z "$TAILSCALE_AUTHKEY" ]; then
                echo ""
                echo "   🔗 Connecting to Tailscale network..."
                
                # Use auth key for automatic authentication
                sudo tailscale up --authkey="$TAILSCALE_AUTHKEY"
                
                # Wait for connection
                sleep 3
                TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "")
                
                if [ ! -z "$TAILSCALE_IP" ]; then
                    echo ""
                    echo "   ✅ Connected to Tailscale!"
                    echo "   Your Tailscale IP: $TAILSCALE_IP"
                    echo "   Remote users can access your streams at: http://$TAILSCALE_IP:5173"
                else
                    echo "   ⚠️  Connection may still be pending. Check 'tailscale status'"
                fi
            else
                echo ""
                echo "   ℹ️  Skipped Tailscale authentication."
                echo "   You can connect later with: sudo tailscale up --authkey=YOUR_KEY"
            fi
        fi
    else
        echo "   Skipping Tailscale setup. You can install it later if needed."
    fi
fi

# 7. OBS Setup for Zoom Virtual Camera
echo ""
echo "🎥 OBS Virtual Camera Setup"
echo "   OBS is required to present vendVision demos in Zoom/Teams calls."
echo "   It creates a virtual camera that shows your dashboard professionally."
echo ""

# Check if OBS is already installed
OBS_INSTALLED=0
OBS_CONFIG_DIR=""

if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ -d "/Applications/OBS.app" ]; then
        OBS_INSTALLED=1
        OBS_CONFIG_DIR="$HOME/Library/Application Support/obs-studio"
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v obs &> /dev/null; then
        OBS_INSTALLED=1
        OBS_CONFIG_DIR="$HOME/.config/obs-studio"
    fi
fi

# Check if vendVision OBS profile already exists
OBS_CONFIGURED=0
if [ $OBS_INSTALLED -eq 1 ] && [ -d "$OBS_CONFIG_DIR/basic/profiles/vendVision" ]; then
    OBS_CONFIGURED=1
fi

if [ $OBS_INSTALLED -eq 1 ]; then
    echo "   ✅ OBS Studio is installed"
    
    if [ $OBS_CONFIGURED -eq 1 ]; then
        echo "   ✅ vendVision profile already configured"
    else
        read -p "   Configure OBS for vendVision demos? (Y/n) " SETUP_OBS
        SETUP_OBS=${SETUP_OBS:-Y}
        
        if [[ "$SETUP_OBS" =~ ^[Yy]$ ]]; then
            echo ""
            ./setup-obs.sh
        else
            echo "   Skipped. Run ./setup-obs.sh later if needed."
        fi
    fi
else
    echo "   ⚠️  OBS Studio is not installed"
    echo ""
    read -p "   Would you like instructions to install OBS? (Y/n) " SHOW_OBS_INSTALL
    SHOW_OBS_INSTALL=${SHOW_OBS_INSTALL:-Y}
    
    if [[ "$SHOW_OBS_INSTALL" =~ ^[Yy]$ ]]; then
        echo ""
        echo "   📥 Install OBS Studio:"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "      1. Download from: https://obsproject.com/download"
            echo "      2. Install the .dmg file"
            echo "      3. Launch OBS once to complete initial setup"
            echo ""
            read -p "   Open download page in browser? (Y/n) " OPEN_OBS_PAGE
            OPEN_OBS_PAGE=${OPEN_OBS_PAGE:-Y}
            if [[ "$OPEN_OBS_PAGE" =~ ^[Yy]$ ]]; then
                open "https://obsproject.com/download"
            fi
        else
            echo "      Ubuntu/Debian: sudo apt install obs-studio"
            echo "      Fedora: sudo dnf install obs-studio"
            echo "      Arch: sudo pacman -S obs-studio"
        fi
        echo ""
        echo "   After installing OBS, run: ./setup-obs.sh"
    else
        echo "   Skipped. Install OBS and run ./setup-obs.sh when ready."
    fi
fi

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Run ./start-vendvision.sh to launch the demo center."
echo ""

# Show Tailscale IP if available
if command -v tailscale &> /dev/null && tailscale status &> /dev/null 2>&1; then
    TAILSCALE_IP=$(tailscale ip -4 2>/dev/null)
    if [ ! -z "$TAILSCALE_IP" ]; then
        echo "🌐 Remote Access URL: http://$TAILSCALE_IP:5173"
        echo "   (Share this with colleagues on your Tailscale network)"
    fi
fi

