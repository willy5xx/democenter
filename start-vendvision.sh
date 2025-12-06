#!/bin/bash

# vendVision Startup Script
# Run this to start all services

echo "🚀 Starting vendVision..."

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# --- Prerequisite Checks ---
MISSING_DEPS=0

if [ ! -f "./go2rtc" ]; then
    echo "❌ Error: go2rtc binary not found."
    MISSING_DEPS=1
fi

if [ ! -d "backend/node_modules" ]; then
    echo "❌ Error: backend dependencies not found."
    MISSING_DEPS=1
fi

if [ ! -d "dashboard/node_modules" ]; then
    echo "❌ Error: dashboard dependencies not found."
    MISSING_DEPS=1
fi

if [ $MISSING_DEPS -eq 1 ]; then
    echo ""
    echo "⚠️  Some dependencies are missing."
    echo "Please run ./setup-demo.sh to install them first."
    echo ""
    exit 1
fi
# ---------------------------

# 1. Start go2rtc
echo "📹 Starting go2rtc streaming server..."
pkill go2rtc 2>/dev/null
# Ensure it's executable
chmod +x ./go2rtc
./go2rtc -config go2rtc.yaml &
sleep 2

# Check if go2rtc started
if pgrep go2rtc > /dev/null; then
    echo "✅ go2rtc started on http://localhost:1984"
else
    echo "❌ Failed to start go2rtc"
    exit 1
fi

# 2. Start backend
echo "🔧 Starting backend API server..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - open in new tab
    osascript -e 'tell application "Terminal" to do script "cd '"$DIR"'/backend && npm start"' > /dev/null 2>&1
else
    # Linux/Other - run in background
    (cd "$DIR/backend" && npm start) &
fi

# 3. Start frontend
echo "🎨 Starting frontend dashboard..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - open in new tab
    osascript -e 'tell application "Terminal" to do script "cd '"$DIR"'/dashboard && npm run dev"' > /dev/null 2>&1
else
    # Linux/Other - run in background
    (cd "$DIR/dashboard" && npm run dev) &
fi

echo ""
echo "✨ vendVision is starting up!"
echo ""
echo "📺 Presentation:  http://localhost:5173           (Full-screen camera view)"
echo "📊 Dashboard:     http://localhost:5173/dashboard (Charts, tables & camera)"
echo "⚙️  Admin:         http://localhost:5173/admin    (Settings & calibration)"
echo "🎛️  go2rtc Admin:  http://localhost:1984          (Stream management)"
echo "🔌 Backend API:   http://localhost:3001"
echo ""
echo "💡 Tip: Wait ~5 seconds for all services to fully start"
echo ""
