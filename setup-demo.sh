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

# 6. OBS Setup
echo ""
echo "🎥 Configuring OBS..."
./setup-obs.sh

echo ""
echo "✅ Setup Complete!"
echo "Run ./start-vendvision.sh to launch the demo center."

