#!/bin/bash

# vendVision Startup Script
# Run this to start all services

echo "🚀 Starting vendVision..."

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# 1. Start go2rtc
echo "📹 Starting go2rtc streaming server..."
pkill go2rtc 2>/dev/null
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
echo "📺 Presentation:  http://localhost:5173"
echo "📊 Dashboard:     http://localhost:5173/dashboard"
echo "🎛️  go2rtc Admin:  http://localhost:1984"
echo "🔌 Backend API:   http://localhost:3001"
echo ""
echo "💡 Tip: Wait ~5 seconds for all services to fully start"
echo ""

