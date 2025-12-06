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
# Kill any existing backend process on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 1
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - open in new tab
    osascript -e 'tell application "Terminal" to do script "cd '"$DIR"'/backend && npm start"' > /dev/null 2>&1
else
    # Linux/Other - run in background
    (cd "$DIR/backend" && npm start) &
fi

# 3. Start frontend
echo "🎨 Starting frontend dashboard..."
# Kill any existing frontend process on port 5173/5174
lsof -ti:5173 | xargs kill -9 2>/dev/null
lsof -ti:5174 | xargs kill -9 2>/dev/null
sleep 1
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
echo "┌─────────────────────────────────────────────────────────────────┐"
echo "│ LOCAL ACCESS                                                    │"
echo "├─────────────────────────────────────────────────────────────────┤"
echo "│ 📺 Presentation:  http://localhost:5173                         │"
echo "│ 📊 Dashboard:     http://localhost:5173/dashboard               │"
echo "│ ⚙️  Admin:         http://localhost:5173/admin                   │"
echo "│ 🎛️  go2rtc:        http://localhost:1984                         │"
echo "│ 🔌 Backend API:   http://localhost:3001                         │"
echo "└─────────────────────────────────────────────────────────────────┘"

# Check for Tailscale remote access
if command -v tailscale &> /dev/null; then
    TAILSCALE_IP=$(tailscale ip -4 2>/dev/null)
    if [ ! -z "$TAILSCALE_IP" ] && [ "$TAILSCALE_IP" != "" ]; then
        echo ""
        echo "┌─────────────────────────────────────────────────────────────────┐"
        echo "│ 🌐 REMOTE ACCESS (Tailscale)                                    │"
        echo "├─────────────────────────────────────────────────────────────────┤"
        echo "│ 📺 Presentation:  http://$TAILSCALE_IP:5173                      │"
        echo "│ 📊 Dashboard:     http://$TAILSCALE_IP:5173/dashboard            │"
        echo "│ ⚙️  Admin:         http://$TAILSCALE_IP:5173/admin               │"
        echo "└─────────────────────────────────────────────────────────────────┘"
        echo ""
        echo "Share the remote URLs with colleagues on your Tailscale network!"
    fi
fi

echo ""
echo "💡 Tip: Wait ~5 seconds for all services to fully start"
echo ""
